# Fiddle Tune Library

A static Vite + React app for browsing fiddle tune YouTube practice videos from a CSV file.

## Data

Put the tune data at:

```text
public/data/tunes.csv
```

The CSV should use these columns:

```text
tune_id,tune_name,identified_speed,video_url,youtube_id,source_page,source_link_label,extraction_status,notes,pdf_url
```

The app loads and parses this file in the browser. There is no backend, database, login system, payment system, or server API.

`pdf_url` is optional. When a row includes a valid `http` or `https` PDF link, the tune detail page shows a `Sheet music for this tune` button. Tunes without a PDF link simply skip that section.

## Cloud CSV Updates

The easiest editing workflow is to keep the tune list in Google Sheets, then let GitHub copy that sheet into `public/data/tunes.csv`.

1. Create or open the Google Sheet with the CSV columns above.
2. In Google Sheets, choose **File > Share > Publish to web**.
3. Pick the sheet tab that contains the tune list.
4. Choose **Comma-separated values (.csv)**.
5. Publish it and copy the generated CSV URL.
6. In GitHub, open this repository and go to **Settings > Secrets and variables > Actions**.
7. Create a repository secret named `TUNES_CSV_URL` and paste the Google Sheets CSV URL as the value.

After that, the workflow at `.github/workflows/sync-tunes-csv.yml` can update the app data from the cloud sheet. It runs hourly, and it can also be run manually from **Actions > Sync tunes CSV from cloud > Run workflow**. If the CSV changes, GitHub commits the new `public/data/tunes.csv`, which then triggers the normal GitHub Pages deployment.

You can test the same sync locally with:

```bash
TUNES_CSV_URL="https://example.com/tunes.csv" npm run sync:csv
```

## Run Locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

The production files are written to `dist/`.

## Deploy

### GitHub Pages

This repository includes a GitHub Actions workflow at `.github/workflows/deploy-pages.yml`.

1. Push the project to GitHub.
2. In the repository settings, go to Pages.
3. Set the Pages source to GitHub Actions.
4. Push to `main`.

The workflow will install dependencies, build the static app, and publish `dist/`.

### Netlify or Cloudflare Pages

Use these settings:

```text
Build command: npm run build
Publish directory: dist
```

No environment variables are required.
