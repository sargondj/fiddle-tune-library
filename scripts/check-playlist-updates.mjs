import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import Papa from 'papaparse';

const headers = [
  'tune_id',
  'tune_name',
  'identified_speed',
  'video_url',
  'youtube_id',
  'source_page',
  'source_link_label',
  'extraction_status',
  'notes',
  'pdf_url',
];

const playlistJsonPath = process.argv[2];
const existingCsvPath = resolve(process.argv[3] || 'public/data/tunes.csv');
const outputCsvPath = resolve(process.argv[4] || 'playlist-review/new-playlist-rows.csv');
const outputReportPath = resolve(process.argv[5] || 'playlist-review/playlist-report.md');
const playlistUrl =
  process.env.LADORE_PLAYLIST_URL ||
  'https://www.youtube.com/watch?v=YdekZGR-qLA&list=PLcV6BAqX_YFflBxey-VwMv2tEPKjIDFK_';
const playlistLabel = process.env.LADORE_PLAYLIST_LABEL || "L'Adore Studio playlist";
const channelLabel = process.env.LADORE_CHANNEL_LABEL || "L'Adore Studio";

if (!playlistJsonPath) {
  console.error('Usage: node scripts/check-playlist-updates.mjs <playlist.json> [existing.csv]');
  process.exit(1);
}

const [playlistJson, existingCsv] = await Promise.all([
  readFile(playlistJsonPath, 'utf8'),
  readFile(existingCsvPath, 'utf8'),
]);

const playlist = JSON.parse(playlistJson);
const playlistEntries = Array.isArray(playlist.entries) ? playlist.entries : [];
const existingRows = Papa.parse(existingCsv, {
  header: true,
  skipEmptyLines: true,
  transformHeader: (header) => header.trim(),
}).data;

const existingVideoIds = new Set(
  existingRows.map((row) => clean(row.youtube_id)).filter(Boolean),
);

const proposedRows = playlistEntries
  .filter((entry) => entry && clean(entry.id) && clean(entry.title))
  .filter((entry) => !existingVideoIds.has(clean(entry.id)))
  .flatMap((entry, index) => {
    const parsed = parseTitle(entry.title);
    const tuneNames = splitTuneNames(parsed.tuneName);
    const videoUrl = entry.url || `https://www.youtube.com/watch?v=${entry.id}`;
    const notes = buildNotes({
      sourceTitle: entry.title,
      playlistTitle: playlist.title || playlistLabel,
      channel: channelLabel,
      duration: entry.duration,
    });

    return tuneNames.map((tuneName) => ({
      tune_id: slugify(tuneName),
      tune_name: tuneName,
      identified_speed: parsed.speed,
      video_url: videoUrl,
      youtube_id: entry.id,
      source_page: playlistUrl,
      source_link_label: `${playlistLabel} #${index + 1}`,
      extraction_status: 'needs_review',
      notes,
      pdf_url: '',
    }));
  });

proposedRows.sort(compareRows);

await mkdir(dirname(outputCsvPath), { recursive: true });
await mkdir(dirname(outputReportPath), { recursive: true });
await writeFile(outputCsvPath, `${Papa.unparse(proposedRows, { columns: headers })}\n`, 'utf8');
await writeFile(outputReportPath, buildReport(proposedRows), 'utf8');

console.log(
  JSON.stringify(
    {
      playlist_entries_checked: playlistEntries.length,
      existing_video_ids: existingVideoIds.size,
      proposed_rows: proposedRows.length,
      output_csv: outputCsvPath,
      output_report: outputReportPath,
    },
    null,
    2,
  ),
);

function parseTitle(rawTitle) {
  let title = normalizeWhitespace(rawTitle);
  let speed = '';

  const parentheticals = [...title.matchAll(/\(([^)]+)\)/g)].map((match) => match[1]);
  const speedParts = parentheticals.filter(isSpeedText);

  if (speedParts.length > 0) {
    speed = normalizeSpeedLabel(speedParts.join(' '));
    title = title.replace(/\s*\(([^)]*(?:slow|medium|fast|quarter|piano|ornament|note names)[^)]*)\)/gi, '');
  }

  const dashMatch = title.match(/(?:\s[-–—]\s*|[-–—]\s+)(.+)$/);
  if (dashMatch && isSpeedText(dashMatch[1])) {
    speed = normalizeSpeedLabel(speed || dashMatch[1]);
    title = title.slice(0, dashMatch.index).trim();
  }

  const trailingMatch = title.match(
    /[, ]+(very\s+slow|medium\s+slow|medium|slow|fast|dance\s+tempo|slow\s+speed|medium\s+speed|fast\s+speed|with\s+piano|slow\s+with\s+note\s+names|slow\s+without\s+ornaments)(?:\s*[-–—]\s*(?:half|quarter)\s+note\s*=\s*\d+)?$/i,
  );

  if (trailingMatch) {
    speed = normalizeSpeedLabel(speed || trailingMatch[0]);
    title = title.slice(0, trailingMatch.index).trim();
  }

  const beatMatch = rawTitle.match(/(?:half|quarter)\s+note\s*=\s*\d+/i);
  if (beatMatch && !speed.toLowerCase().includes(beatMatch[0].toLowerCase())) {
    speed = normalizeWhitespace(`${speed} - ${beatMatch[0]}`);
  }

  return {
    tuneName: normalizeTuneName(title),
    speed: speed || 'Other',
  };
}

function splitTuneNames(tuneName) {
  return tuneName
    .split(/\s+\/\s+/)
    .map(normalizeTuneName)
    .filter(Boolean);
}

function isSpeedText(value) {
  return /\b(slow|medium|fast|dance\s+tempo|half\s+note|quarter\s+note|quarter|piano|ornament|note names)\b/i.test(
    value,
  );
}

function normalizeSpeedLabel(value) {
  return normalizeWhitespace(value)
    .replace(/^[,\s–—-]+/, '')
    .replace(/\bspeed\b/gi, '')
    .replace(/\bdance tempo\b/gi, 'Dance Tempo')
    .replace(/\bmedium slow\b/gi, 'Medium Slow')
    .replace(/\bvery slow\b/gi, 'Very Slow')
    .replace(/\bslow\b/gi, 'Slow')
    .replace(/\bmedium\b/gi, 'Medium')
    .replace(/\bfast\b/gi, 'Fast')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^([a-z])/, (letter) => letter.toUpperCase());
}

function normalizeTuneName(value) {
  return normalizeWhitespace(value)
    .replace(/\bDip Pickle Rag\b/i, 'Dill Pickle Rag')
    .replace(/\bSliver Spear\b/i, 'Silver Spear')
    .replace(/\bSt[.]?\s+Antoine['’]s\b/i, "St. Antoine's")
    .replace(/\bJosie-o\b/i, 'Josie-O')
    .replace(/^Josie$/i, 'Josie-O')
    .replace(/\bCon Thadhgo['’]s\b/i, "Con Thadhgo's")
    .replace(/\bSoldier[’']s Joy\b/i, "Soldier's Joy")
    .replace(/\bJohn Ryan[’']s\b/i, "John Ryan's")
    .replace(/\bPeg Ryan[’']s\b/i, "Peg Ryan's")
    .replace(/\bFrank[’']s\b/i, "Frank's")
    .replace(/\bRyan[’']s\b/i, "Ryan's")
    .replace(/\b([A-Za-z]+)[’']s\b/g, "$1's")
    .replace(/^Peg Ryan's$/i, "Peg Ryan's Polka")
    .replace(/^St[.] Antoine's$/i, "St. Antoine's Reel")
    .trim();
}

function buildNotes({ sourceTitle, playlistTitle, channel, duration }) {
  const parts = [`Source title: ${sourceTitle}`, `Playlist: ${playlistTitle}`];
  if (channel) parts.push(`Channel: ${channel}`);
  if (duration) parts.push(`Duration: ${formatDuration(duration)}`);
  return parts.join(' | ');
}

function buildReport(rows) {
  if (rows.length === 0) {
    return [
      '# Playlist Check',
      '',
      "No new L'Adore Studio playlist videos were found.",
      '',
    ].join('\n');
  }

  return [
    '# Playlist Check',
    '',
    `${rows.length} proposed row${rows.length === 1 ? '' : 's'} found.`,
    '',
    '| Tune | Speed | Video |',
    '| --- | --- | --- |',
    ...rows.map((row) => `| ${escapeMarkdown(row.tune_name)} | ${escapeMarkdown(row.identified_speed)} | ${row.video_url} |`),
    '',
    'Review these rows before adding them to the Google Sheet.',
    '',
  ].join('\n');
}

function compareRows(a, b) {
  return (
    a.tune_name.localeCompare(b.tune_name, undefined, { sensitivity: 'base' }) ||
    speedRank(a.identified_speed) - speedRank(b.identified_speed) ||
    a.identified_speed.localeCompare(b.identified_speed, undefined, { sensitivity: 'base' }) ||
    a.source_link_label.localeCompare(b.source_link_label, undefined, { numeric: true })
  );
}

function speedRank(value) {
  const normalized = value.toLowerCase();
  if (normalized.includes('slow')) return 0;
  if (normalized.includes('medium')) return 1;
  if (normalized.includes('fast')) return 2;
  return 3;
}

function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}

function slugify(value) {
  return normalizeWhitespace(value)
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeWhitespace(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function clean(value) {
  return String(value ?? '').trim();
}

function escapeMarkdown(value) {
  return String(value ?? '').replace(/\|/g, '\\|');
}
