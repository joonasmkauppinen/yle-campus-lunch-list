# Project Specifications: Campus Lunch List Scraper & Viewer

## 1. Project Overview

A monorepo web application and automated scraper that aggregates daily lunch menus from various campus restaurants. The scraper primarily fetches menu data directly from public restaurant APIs, falling back to web scraping (using Cheerio or Playwright) or screenshot-to-VLM where no direct API exists.

## 2. Architecture & Tech Stack

- **Monorepo:** Turborepo (`create-t3-turbo` base without Prisma/Drizzle).
- **Shared Packages:** TypeScript interfaces shared between frontend and scraper.
- **Frontend (`apps/nextjs`):** Next.js App Router, Tailwind CSS, deployed on Vercel.
- **Scraper (`apps/scraper`):** Dockerized Node.js app utilizing public APIs and scraping fallbacks (Cheerio / Playwright), scheduled via Cron on an Unraid server.
- **AI / VLM Pipeline (Fallback):** Optional local Ollama instance (e.g., LLaVA) running on Unraid for vision-based extraction if a restaurant site cannot be cleanly parsed via API or HTML.
- **Database:** Google Sheets API accessed via a Google Cloud Service Account.

## 3. Directory Structure (Proposed)

```text
├── apps
│   ├── nextjs        # Vercel-hosted frontend app
│   └── scraper       # Unraid-hosted Node.js / Playwright / Cheerio scraper app
├── packages
│   ├── shared-types  # Shared TS interfaces (e.g., Restaurant, MenuItem)
│   ├── ui            # Shared UI components (Tailwind)
│   └── config        # ESLint, TSConfig, Prettier
```

## 4. Shared Data Models (`packages/shared-types`)

```typescript
export interface MenuItem {
  name: string;
  price?: string;
  dietaryFlags?: string[]; // e.g., ["GF", "V"]
}

export interface DailyMenu {
  date: string; // ISO format YYYY-MM-DD
  items: MenuItem[];
}

export interface Restaurant {
  id: string;
  name: string;
  menus: DailyMenu[];
  lastUpdated: string; // ISO format
}
```

## 5. Sub-Project Details

### A. Scraper App (`apps/scraper`)

- **Environment:** Must run in a Docker container suitable for Unraid (e.g., Node.js base or Playwright container `mcr.microsoft.com/playwright:v1.48.0-jammy` if browser automation is needed).
- **Data Fetching Strategy:**
  1. **Public APIs (Primary):** Fetch menu data directly via public REST/JSON endpoints for supported restaurants.
  2. **Scraping Fallback (Secondary):**
     - Use **Cheerio** for fast, lightweight static HTML fetching and parsing.
     - Use **Playwright** for dynamic/SPA-heavy pages requiring headless browser execution or screenshot capture.
  3. **VLM Fallback (Tertiary):** Send captured screenshots to local Ollama API if structural parsing is not feasible.
- **Execution Flow:**
  1. Iterate over configured campus restaurants.
  2. Execute the appropriate fetcher (API -> Cheerio -> Playwright/Ollama).
  3. Normalize all parsed data into the standard `DailyMenu` / `Restaurant` schema.
  4. Authenticate with Google Sheets API via Service Account.
  5. Clear the old sheet data for the target restaurants and append the newly aggregated menus.
- **Requirements:**
  - Robust error handling: A failure in one restaurant scraper must not block others.
  - Clear console logging for Unraid execution logs.
  - Run once and exit cleanly (designed for Cron execution).

### Specific restaurant implementations:

- Huoltamo
  - Website URL: https://script.google.com/macros/s/AKfycbwiEKW1OV5EPb6cI8mm0f07wByo9B9xqIPdEcjZ2zgKRifhoE7hrnnASo4WsEVk5bSm/exec?hl
  - JSON API URL:
    ```
    https://script.googleusercontent.com/a/macros/yle.fi/echo?user_content_key=AUkAhnT31DSF89GRyUPebcLX_oJz-Rkt0nXafVj3zNmfFHp8lvswkQTsNaHMrCG-lqxGmFaZIVDoRxEMxxamGgv-BmUXRUG-6Pd8NEdojaaKbu0Rj7vhaA698QYzWqv3O8pdDP06mxy_G235MxmF39xKmNWdzmgmOcZ0imeygA3tFSiXtstBnbwuoq8r9vZ4D8hAlz3EPBRtRAb323qQTqS2uphOR9KG5r63DY012Uq4p-9JQrGmOZ7O7PSZkGqdkXVzFp107HeJuz6jK11ikPvf8AppO0-Df8D_GAsh75a0NnMfXiVa8FV1-bf8YSN-Ww&lib=Mj9QMBIRZJsNk6tjp-CZc2vk6ee82Q7eC
    ```
  - See sample response data in ./huoltamo-api-sample-response-data.json

- Studio 10
  - Website URL: https://nordrest.fi/restaurang/yle-studio10/#ruokalista
  - JSON API URL:
    ```
    https://script.googleusercontent.com/a/macros/yle.fi/echo?user_content_key=AUkAhnT31DSF89GRyUPebcLX_oJz-Rkt0nXafVj3zNmfFHp8lvswkQTsNaHMrCG-lqxGmFaZIVDoRxEMxxamGgv-BmUXRUG-6Pd8NEdojaaKbu0Rj7vhaA698QYzWqv3O8pdDP06mxy_G235MxmF39xKmNWdzmgmOcZ0imeygA3tFSiXtstBnbwuoq8r9vZ4D8hAlz3EPBRtRAb323qQTqS2uphOR9KG5r63DY012Uq4p-9JQrGmOZ7O7PSZkGqdkXVzFp107HeJuz6jK11ikPvf8AppO0-Df8D_GAsh75a0NnMfXiVa8FV1-bf8YSN-Ww&lib=Mj9QMBIRZJsNk6tjp-CZc2vk6ee82Q7eC
    ```
  - See sample response data in ./huoltamo-api-sample-response-data.json

- Piccolo
  - Website URL: https://script.google.com/macros/s/AKfycbwiEKW1OV5EPb6cI8mm0f07wByo9B9xqIPdEcjZ2zgKRifhoE7hrnnASo4WsEVk5bSm/exec?hl
  - JSON API URL:
    ```
    https://script.googleusercontent.com/a/macros/yle.fi/echo?user_content_key=AUkAhnT31DSF89GRyUPebcLX_oJz-Rkt0nXafVj3zNmfFHp8lvswkQTsNaHMrCG-lqxGmFaZIVDoRxEMxxamGgv-BmUXRUG-6Pd8NEdojaaKbu0Rj7vhaA698QYzWqv3O8pdDP06mxy_G235MxmF39xKmNWdzmgmOcZ0imeygA3tFSiXtstBnbwuoq8r9vZ4D8hAlz3EPBRtRAb323qQTqS2uphOR9KG5r63DY012Uq4p-9JQrGmOZ7O7PSZkGqdkXVzFp107HeJuz6jK11ikPvf8AppO0-Df8D_GAsh75a0NnMfXiVa8FV1-bf8YSN-Ww&lib=Mj9QMBIRZJsNk6tjp-CZc2vk6ee82Q7eC
    ```
  - See sample response data in ./huoltamo-api-sample-response-data.json

- Iso Paja
  - Restaurant Website URL: https://www.hhravintolat.fi/iso-paja/
  - Parsed using Cheerio from website HTML. See sample data in ./iso-paja-sample-response-data.html

- Pasilan Linkki
  - Website URL: https://www.compass-group.fi/ravintolat-ja-ruokalistat/foodco/kaupungit/helsinki/linkki/
  - RSS feed for current day URL: https://www.compass-group.fi/menuapi/feed/rss/current-day?costNumber=3642&language=fi

- Akseli
  - Restaurant Website URL: https://www.ninankeittio.fi/helsinki-ilmala-akseli/#lounaslista
  - Parsed using Cheerio from website HTML. See sample data in ./akseli-sample-response-data.html

- Päättäri
  - Restaurant Website URL: https://nordrest.fi/restaurang/ravintola-paattari/#ruokalista
  - Parsed using Cheerio from website HTML. See sample data in ./paattari-sample-response-data.html

- Dyan Luft
  - Website URL: https://www.dylan.fi/luft
  - RSS feed for current day URL: https://lounastaja.app/api/v1/rss/week/5843f3ec-6a2c-49ba-ba3e-b384f6c996f1/current?days=current&language=fi

- Dyan Böle
  - Website URL: https://www.dylan.fi/bole
  - RSS feed for current day URL: https://lounastaja.app/api/v1/rss/week/3aba0b64-0d43-41ea-b665-1d2d6c0f2d5e/current?days=current&language=fi

### B. Frontend App (`apps/nextjs`)

- **Environment:** Next.js App Router deployed on Vercel.
- **Execution Flow:**
  1. Fetch data directly from Google Sheets API (or public CSV export URL) during page render.
  2. Utilize Next.js Incremental Static Regeneration (ISR) (e.g., `revalidate: 3600`) to ensure fast page loads and prevent rate-limiting on the Sheets API.
  3. Render a responsive, mobile-first UI displaying available restaurants and today's menus.
- **Requirements:** Ensure timeout issues are completely mitigated by relying solely on the Google Sheets data, not live scraping.

## 6. Implementation Steps for AI Agent

1. Scaffold the monorepo structure using a minimal `create-t3-turbo` template.
2. Define `packages/shared-types` and ensure both apps can import them.
3. Build the Next.js UI reading mock data first, then wire it to Google Sheets.
4. Implement scraper fetchers for restaurants with available public APIs.
5. Implement scraping fallbacks with Cheerio and/or Playwright for restaurants without public APIs.
6. Write the Google Sheets update and data synchronization logic.
7. Generate the Dockerfile tailored for Unraid deployment.
