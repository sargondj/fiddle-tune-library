# Fiddle Tune Library

A static Vite + React app for browsing fiddle tune YouTube practice videos from a CSV file.

## Data

Put the tune data at:

```text
public/data/tunes.csv
```

The CSV should use these columns:

```text
tune_id,tune_name,identified_speed,video_url,youtube_id,source_page,source_link_label,extraction_status,notes,pdf_url,event_filters
```

The app loads and parses this file in the browser. There is no backend, database, login system, payment system, or server API.

`pdf_url` is optional. When a row includes a valid `http` or `https` PDF link, the tune detail page shows a `Sheet music for this tune` button. Tunes without a PDF link simply skip that section.

`event_filters` is optional. Use it to place a tune in one or more practice-list buttons near the top of the app. Leave it blank for ordinary tunes. For multiple buttons, separate labels with semicolons:

```text
Winter Concert; Advanced Group
```

If any row for a tune has `event_filters`, the whole tune appears when that button is selected.

In the Google Sheet, add `event_filters` as the header in column K. Most rows can stay blank.

## Cloud CSV Updates

The easiest editing workflow is to keep the tune list in Google Sheets, then let GitHub copy that sheet into `public/data/tunes.csv`.

1. Create or open the Google Sheet with the CSV columns above.
2. In Google Sheets, choose **File > Share > Publish to web**.
3. Pick the sheet tab that contains the tune list.
4. Choose **Comma-separated values (.csv)**.
5. Publish it and copy the generated CSV URL.
6. In GitHub, open this repository and go to **Settings > Secrets and variables > Actions**.
7. Create a repository secret named `TUNES_CSV_URL` and paste the Google Sheets CSV URL as the value.

For the current tune sheet, use this URL:

```text
https://docs.google.com/spreadsheets/d/1t_dUenBfRTj_GyuefRiuSiowpt4i3DcdObk2UF-QTwU/gviz/tq?tqx=out:csv&gid=0
```

After that, the workflow at `.github/workflows/sync-tunes-csv.yml` can update the app data from the cloud sheet. It checks for updates once daily, and it can also be run manually from **Actions > Sync tunes CSV from cloud > Run workflow**. The workflow downloads the cloud CSV, commits any changes to `public/data/tunes.csv`, builds the app, and deploys it to GitHub Pages.

You can test the same sync locally with:

```bash
TUNES_CSV_URL="https://example.com/tunes.csv" npm run sync:csv
```

## Playlist Checks

The workflow at `.github/workflows/check-ladore-playlist.yml` checks the L'Adore Studio playlist for YouTube videos that are not already listed in `public/data/tunes.csv`.

Current playlist:

```text
https://www.youtube.com/watch?v=YdekZGR-qLA&list=PLcV6BAqX_YFflBxey-VwMv2tEPKjIDFK_
```

It runs every three days, and it can also be run manually from **Actions > Check L'Adore playlist for new tunes > Run workflow**. When it finds new videos, it appends new rows to the Google Sheet, syncs `public/data/tunes.csv`, builds the app, and deploys it to GitHub Pages.

This workflow needs a Google service account that can edit the sheet. Create a repository secret named `GOOGLE_SERVICE_ACCOUNT_JSON` containing the service account JSON, then share the Google Sheet with the service account's `client_email` address as an editor.

It also uploads review files:

- `playlist-report.md`
- `new-playlist-rows.csv`

If any title parsing looks wrong, edit the new row in the Google Sheet. The `notes` and `pdf_url` columns can be edited there too.

When new rows are added, the workflow also creates a GitHub issue. To get a phone notification, install GitHub Mobile, sign in, and make sure notifications are enabled for this repository's issues.

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
