import { readFileSync, writeFileSync } from 'node:fs';
import { basename } from 'node:path';

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
];

const inputFiles = process.argv.slice(2);

if (inputFiles.length === 0) {
  console.error('Usage: node scripts/import-playlists.mjs <playlist.json> [...]');
  process.exit(1);
}

const sourceRows = inputFiles.flatMap((filePath) => {
  const playlist = JSON.parse(readFileSync(filePath, 'utf8'));
  const entries = Array.isArray(playlist.entries) ? playlist.entries : [];
  const sourcePage = playlist.webpage_url || playlist.original_url || '';
  const playlistTitle = playlist.title || basename(filePath);

  return entries
    .filter((entry) => entry && entry.id && entry.title)
    .flatMap((entry, index) => {
      const parsed = parseTitle(entry.title);
      const tunes = splitTuneNames(parsed.tuneName);
      const videoUrl = entry.url || `https://www.youtube.com/watch?v=${entry.id}`;
      const notes = buildNotes({
        sourceTitle: entry.title,
        playlistTitle,
        channel: entry.channel || playlist.channel || playlist.uploader || '',
        duration: entry.duration,
      });

      return tunes.map((tuneName) => ({
        tune_id: slugify(tuneName),
        tune_name: tuneName,
        identified_speed: parsed.speed,
        video_url: videoUrl,
        youtube_id: entry.id,
        source_page: sourcePage,
        source_link_label: `${playlistTitle} #${index + 1}`,
        extraction_status: 'extracted',
        notes,
      }));
    });
});

const dedupedRows = dedupeRows(sourceRows);
dedupedRows.sort(compareRows);

writeFileSync('public/data/tunes.csv', toCsv(dedupedRows), 'utf8');

const tuneCount = new Set(dedupedRows.map((row) => row.tune_id)).size;
const videoCount = new Set(dedupedRows.map((row) => row.youtube_id)).size;
const duplicateCount = sourceRows.length - dedupedRows.length;

console.log(
  JSON.stringify(
    {
      source_rows: sourceRows.length,
      rows_written: dedupedRows.length,
      unique_tunes: tuneCount,
      unique_videos: videoCount,
      duplicates_removed: duplicateCount,
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
    .replace(/\s+Polka$/i, (match, offset, full) => (/\bRyan/i.test(full) ? match : match))
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

function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}

function dedupeRows(rows) {
  const byKey = new Map();

  for (const row of rows) {
    const key = [
      row.tune_id,
      normalizeComparableSpeed(row.identified_speed),
      row.youtube_id,
    ].join('|');

    if (!byKey.has(key)) {
      byKey.set(key, row);
    }
  }

  return Array.from(byKey.values());
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

function normalizeComparableSpeed(value) {
  return normalizeWhitespace(value).toLowerCase();
}

function normalizeWhitespace(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function slugify(value) {
  return normalizeWhitespace(value)
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toCsv(rows) {
  return [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(',')),
    '',
  ].join('\n');
}

function csvEscape(value) {
  const text = String(value ?? '');
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}
