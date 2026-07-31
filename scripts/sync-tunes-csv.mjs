import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import Papa from 'papaparse';

const requiredColumns = [
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

const optionalColumns = ['pdf_url'];
const optionalEventColumns = ['event_filters'];
const outputColumns = [...requiredColumns, ...optionalColumns, ...optionalEventColumns];
const csvUrl = process.argv[2] || process.env.TUNES_CSV_URL;
const outputPath = resolve('public/data/tunes.csv');

if (!csvUrl) {
  console.error('Missing CSV URL. Set TUNES_CSV_URL or pass a URL as the first argument.');
  process.exit(1);
}

const response = await fetch(csvUrl);

if (!response.ok) {
  console.error(`Could not download CSV: ${response.status} ${response.statusText}`);
  process.exit(1);
}

const csv = (await response.text()).replace(/^\uFEFF/, '');

if (/^\s*</.test(csv)) {
  console.error('The URL returned HTML instead of CSV. Check that the sheet is published as CSV.');
  process.exit(1);
}

const parsed = Papa.parse(csv, {
  header: true,
  skipEmptyLines: true,
  transformHeader: (header) => header.trim(),
});

if (parsed.errors.length > 0) {
  console.error('CSV parsing failed:');
  parsed.errors.slice(0, 5).forEach((error) => {
    console.error(`- Row ${error.row ?? 'unknown'}: ${error.message}`);
  });
  process.exit(1);
}

const fields = parsed.meta.fields ?? [];
const missingColumns = requiredColumns.filter((column) => !fields.includes(column));

if (missingColumns.length > 0) {
  console.error(`CSV is missing required columns: ${missingColumns.join(', ')}`);
  process.exit(1);
}

const rows = parsed.data.map((row) =>
  Object.fromEntries(outputColumns.map((column) => [column, String(row[column] ?? '').trim()])),
);

const normalizedCsv = `${Papa.unparse(rows, { columns: outputColumns })}\n`;

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, normalizedCsv, 'utf8');

console.log(`Synced ${rows.length} tune video rows to ${outputPath}`);
