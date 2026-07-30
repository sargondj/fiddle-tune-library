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

The app loads and parses this file in the browser. There is no backend, database, login, payment system, or server API.

`pdf_url` is optional. When a row includes a valid `http` or `https` PDF link, the tune detail page shows a `PDF of this tune` button. Tunes without a PDF link simply skip that section.

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
