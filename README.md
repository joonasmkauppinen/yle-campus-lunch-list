<p align="center">
  <img width="200" src="https://user-images.githubusercontent.com/28673805/178212367-e90d5c62-eeed-4c31-a39a-740a9ef3a287.png">
</p>
<h1 align="center">Yle campus lunch lists</h1>

<p align="center">Find all Yleisradio campus lunch lists in one place.</p>

<p align="center">Huoltamo · Piccolo · Iso Paja · Studio 10 · Pasilan Linkki · Päättäri · Akseli · Dylan Luft · Dylan Böle · Dylan La Ilma</p>

## Getting started

Clone repo:

```bash
git clone git@github.com:joonasmkauppinen/yle-campus-lunch-list.git
```

Open repo:

```bash
cd yle-campus-lunch-list
```

Install dependencies:

```bash
pnpm install
```

Configure environment variables:

```bash
cp .env.example .env
```

> Fill in the Google Sheets API Service Account credentials and Spreadsheet ID in `.env`.

Start local development server:

```bash
# Run both Next.js frontend and Scraper in watch mode
pnpm dev

# Or run only the Next.js app
pnpm dev:next

# Or run the Scraper in dry-run mode (safe for testing — skips Google Sheets writes)
pnpm dev:scraper:dry-run
pnpm --filter @acme/scraper dev -- --dry-run --date 2026-08-23

# Or run the Scraper pipeline against Google Sheets
pnpm dev:scraper
pnpm --filter @acme/scraper dev -- --date 2026-08-23
```

## Technologies

- **Turborepo & pnpm**: High-performance monorepo workspace management.
- **Oxlint & Oxfmt**: Ultra-fast Rust-based linting and code formatting.
- **TypeScript**: End-to-end static typing across all packages.
- **Next.js & React 19**: Modern App Router web application with ISR and server components.
- **Tailwind CSS**: Modern, utility-first styling.
- **Google Sheets API**: Cloud spreadsheet acting as the headless CMS and menu data store.
- **Cheerio & RSS Parsers**: Automated web scraping and RSS feed ingestion.
- **Vercel**: Production deployment, hosting, and edge network.

## Project Structure

```text
apps
  ├─ nextjs         # Next.js App Router frontend & API routes
  └─ scraper        # CLI & scraper pipeline to fetch menus and sync with Google Sheets
packages
  └─ shared-types   # Shared TypeScript types and interfaces (Restaurant, MenuItem, etc.)
tooling
  ├─ eslint         # Shared ESLint configurations
  ├─ prettier       # Shared Prettier configurations
  ├─ tailwind       # Shared Tailwind CSS theme presets
  └─ typescript     # Shared tsconfig bases
```

## Resources

- App production url: [`https://yle-campus-lunch-list.vercel.app/`](https://yle-campus-lunch-list.vercel.app/)
- [Vercel dashboard](https://vercel.com/joonasmkauppinen/yle-campus-lunch-list) (hobby account, only @joonasmkauppinen can access)
- [Figma design layouts (view access)](https://www.figma.com/file/ckeATTSGr5adcHYNqHPORC/Yle-campus-lunch-menu?node-id=0%3A1)
- [GH Actions](https://github.com/joonasmkauppinen/yle-campus-lunch-list/actions)

## Scraper App

The ingestion pipeline in [`apps/scraper`](./apps/scraper) is a standalone Node.js CLI tool responsible for fetching, parsing, and syncing daily restaurant menus to Google Sheets:

- **Data Ingestion**: Scrapes HTML web pages with Cheerio, parses RSS XML feeds, and fetches JSON APIs.
- **Date Handling**: Defaults to the current date in `Europe/Helsinki` timezone, or accepts a target date via CLI flag (`--date YYYY-MM-DD` / `-d YYYY-MM-DD`) or `TARGET_DATE` environment variable.
- **Dry Run Mode**: Accepts `--dry-run` (or `-n` / `DRY_RUN=true`) to parse all menus and output payloads to console without updating Google Sheets or consuming Google Cloud quota.
- **Google Sheets Sync**: Authenticates via Google Service Account JWT and batch-writes dishes, dietary flags, and metadata into restaurant-specific tabs.
- **Docker Support**: Includes a [`Dockerfile`](./apps/scraper/Dockerfile) for scheduled execution on servers.

## Production build

Usually there is no need to build the project locally, as Vercel handles builds on deployment. To build and test locally:

Create optimized production build:

```bash
pnpm build
```

Run production build locally:

```bash
pnpm --filter @acme/nextjs start
```

Run test suite:

```bash
pnpm test
```

## Page revalidation & Data flow

1. **Scraping & Storage**: The scraper fetches menu data daily (or manually) from diverse sources and writes the formatted dishes to individual restaurant sheets in Google Sheets.
2. **Next.js Caching**: The Next.js frontend reads menu data from Google Sheets using the Google Sheets API, cached with time-based ISR (`export const revalidate = 3600`, revalidating every 1 hour).

## Lunch list data sources

### Huoltamo, Piccolo & Studio 10 (Intra)

Data is fetched from the Yle Intra Google Apps Script JSON API endpoint configured via `HUOLTAMO_API_URL`.

### Iso Paja

Data is scraped with Cheerio from: [`https://www.hhravintolat.fi/iso-paja/`](https://www.hhravintolat.fi/iso-paja/)

### Studio 10 (Website fallback)

Direct website: [`https://nordrest.fi/restaurang/yle-studio10/#ruokalista`](https://nordrest.fi/restaurang/yle-studio10/#ruokalista)

### Akseli

Data is scraped with Cheerio from: [`https://www.ninankeittio.fi/helsinki-ilmala-akseli/#lounaslista`](https://www.ninankeittio.fi/helsinki-ilmala-akseli/#lounaslista)

### Päättäri (formerly Båx)

Data is scraped with Cheerio from: [`https://nordrest.fi/restaurang/ravintola-paattari/#ruokalista`](https://nordrest.fi/restaurang/ravintola-paattari/#ruokalista)

### Dylan Luft

Data is fetched from the Lounastaja RSS feed:
`https://lounastaja.app/api/v1/rss/week/5843f3ec-6a2c-49ba-ba3e-b384f6c996f1/current?days=current&language=fi`

### Dylan Böle

Data is fetched from the Lounastaja RSS feed:
`https://lounastaja.app/api/v1/rss/week/3aba0b64-0d43-41ea-b665-1d2d6c0f2d5e/current?days=current&language=fi`

### Dylan La Ilma

Data is fetched from the Lounastaja RSS feed:
`https://lounastaja.app/api/v1/rss/week/70835b81-ec1f-443f-92bb-9832d21fb3af/current?days=current&language=fi`

### Pasilan Linkki

Data is fetched from the Compass Group RSS feed:
`https://www.compass-group.fi/menuapi/feed/rss/current-day?costNumber=3642&language=fi`

