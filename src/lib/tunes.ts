import Papa from 'papaparse';

export type SpeedGroup = 'Slow' | 'Medium' | 'Fast' | 'Other';

export type TuneRow = {
  tune_id?: string;
  tune_name?: string;
  identified_speed?: string;
  video_url?: string;
  youtube_id?: string;
  source_page?: string;
  source_link_label?: string;
  extraction_status?: string;
  notes?: string;
  pdf_url?: string;
  rowIndex: number;
};

export type TuneVideo = {
  key: string;
  originalSpeed: string;
  displayLabel: string;
  speedGroup: SpeedGroup;
  videoUrl: string;
  youtubeId: string;
  sourceLabel: string;
  notes: string;
  rowIndex: number;
};

export type Tune = {
  id: string;
  name: string;
  videos: TuneVideo[];
  notes: string[];
  pdfUrl: string;
};

const speedOrder: Record<SpeedGroup, number> = {
  Slow: 0,
  Medium: 1,
  Fast: 2,
  Other: 3,
};

export function parseCsv(csv: string): TuneRow[] {
  const parsed = Papa.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });

  if (parsed.errors.some((error) => error.type === 'Delimiter')) {
    throw new Error('The CSV could not be parsed.');
  }

  return parsed.data
    .filter((row) => Object.values(row).some((value) => String(value ?? '').trim()))
    .map((row, index) => ({
      tune_id: clean(row.tune_id),
      tune_name: clean(row.tune_name),
      identified_speed: clean(row.identified_speed),
      video_url: clean(row.video_url),
      youtube_id: clean(row.youtube_id),
      source_page: clean(row.source_page),
      source_link_label: clean(row.source_link_label),
      extraction_status: clean(row.extraction_status),
      notes: clean(row.notes),
      pdf_url: clean(row.pdf_url),
      rowIndex: index,
    }));
}

export function groupTunes(rows: TuneRow[]): Tune[] {
  const grouped = new Map<string, Tune>();
  const seenVideoIdsByTune = new Map<string, Set<string>>();

  rows.forEach((row) => {
    const name = clean(row.tune_name) || 'Untitled tune';
    const id = clean(row.tune_id) || slugify(name);

    if (!grouped.has(id)) {
      grouped.set(id, { id, name, videos: [], notes: [], pdfUrl: '' });
      seenVideoIdsByTune.set(id, new Set());
    }

    const tune = grouped.get(id)!;
    const youtubeId = clean(row.youtube_id) || extractYouTubeId(row.video_url);
    const seenVideoIds = seenVideoIdsByTune.get(id)!;

    if (youtubeId && seenVideoIds.has(youtubeId)) {
      return;
    }

    if (youtubeId) {
      seenVideoIds.add(youtubeId);
    }

    const notes = usefulNotes(row.notes);

    if (notes && !tune.notes.includes(notes)) {
      tune.notes.push(notes);
    }

    if (!tune.pdfUrl && isUsableUrl(row.pdf_url)) {
      tune.pdfUrl = clean(row.pdf_url);
    }

    tune.videos.push({
      key: `${id}-${row.rowIndex}`,
      originalSpeed: clean(row.identified_speed),
      displayLabel: '',
      speedGroup: normalizeSpeed(row.identified_speed),
      videoUrl: clean(row.video_url),
      youtubeId,
      sourceLabel: clean(row.source_link_label),
      notes,
      rowIndex: row.rowIndex,
    });
  });

  return Array.from(grouped.values())
    .map((tune) => ({
      ...tune,
      videos: labelVideos(
        tune.videos.sort((a, b) => {
          const speedDifference = speedOrder[a.speedGroup] - speedOrder[b.speedGroup];
          if (speedDifference !== 0) return speedDifference;
          return (a.sourceLabel || String(a.rowIndex)).localeCompare(
            b.sourceLabel || String(b.rowIndex),
            undefined,
            { numeric: true },
          );
        }),
      ),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
}

export function normalizeSpeed(speed?: string): SpeedGroup {
  const normalized = clean(speed).toLowerCase();
  if (normalized.includes('slow')) return 'Slow';
  if (normalized.includes('medium')) return 'Medium';
  if (normalized.includes('fast')) return 'Fast';
  return 'Other';
}

export function extractYouTubeId(url?: string): string {
  const value = clean(url);
  if (!value) return '';

  try {
    const parsed = new URL(value);
    const host = parsed.hostname.replace(/^www\./, '');

    if (host === 'youtu.be') {
      return parsed.pathname.split('/').filter(Boolean)[0] ?? '';
    }

    if (host.endsWith('youtube.com')) {
      if (parsed.pathname === '/watch') {
        return parsed.searchParams.get('v') ?? '';
      }

      const embedMatch = parsed.pathname.match(/\/(?:embed|shorts|live)\/([^/?#]+)/);
      return embedMatch?.[1] ?? '';
    }
  } catch {
    const match = value.match(/(?:v=|youtu\.be\/|embed\/|shorts\/|live\/)([A-Za-z0-9_-]{6,})/);
    return match?.[1] ?? '';
  }

  return '';
}

export function slugify(value: string): string {
  return clean(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function labelVideos(videos: TuneVideo[]): TuneVideo[] {
  const groupCounts = new Map<string, number>();

  return videos.map((video) => {
    const baseLabel = video.originalSpeed || video.speedGroup;
    const normalizedBase = normalizeLabel(baseLabel);
    const count = (groupCounts.get(normalizedBase) ?? 0) + 1;
    groupCounts.set(normalizedBase, count);

    const displayLabel =
      count === 1
        ? baseLabel
        : video.originalSpeed.toLowerCase().includes('piano')
          ? `${video.speedGroup} with piano`
          : `${baseLabel} ${count}`;

    return { ...video, displayLabel };
  });
}

function clean(value?: string | null): string {
  return String(value ?? '').trim();
}

function normalizeLabel(label: string): string {
  return clean(label).toLowerCase().replace(/\s+/g, ' ');
}

function usefulNotes(notes?: string): string {
  const value = clean(notes);
  if (!value) return '';

  const lower = value.toLowerCase();
  const technicalPatterns = ['youtube_id', 'source_page', 'extraction_status', 'http://', 'https://'];

  if (technicalPatterns.some((pattern) => lower.includes(pattern))) {
    return '';
  }

  return value;
}

function isUsableUrl(url?: string): boolean {
  const value = clean(url);
  if (!value) return false;

  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
