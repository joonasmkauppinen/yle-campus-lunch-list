<p align="center">
  <img width="200" src="https://user-images.githubusercontent.com/28673805/178212367-e90d5c62-eeed-4c31-a39a-740a9ef3a287.png">
</p>
<h1 align="center">Yle campus lunch lists</h1>

<p align="center">Find all Yleisradio campus lunch lists in one place.</p>

<p align="center">Huoltamo · Studio 10 · Iso Paja · Akseli · Båx · Dylan Böle · Dylan Luft</p>

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
npm install
```

Start local development server:

```bash
npm run dev
```

## Technologies

- TypeScript
- React/Next.js for frontend/backend.
- Tailwind CSS for styling.
- Vercel for deployment, hosting.
- Cheerio for web scraping.

## Resources

- App production url: [`https://yle-campus-lunch-list.vercel.app/`](https://yle-campus-lunch-list.vercel.app/)
- [Vercel dashboard](https://vercel.com/joonasmkauppinen/yle-campus-lunch-list) (hobby account, only @joonasmkauppinen can access)
- [Figma design layouts (view access)](https://www.figma.com/file/ckeATTSGr5adcHYNqHPORC/Yle-campus-lunch-menu?node-id=0%3A1)
- [GH Actions](https://github.com/joonasmkauppinen/yle-campus-lunch-list/actions)

## Production build

Usually there is no need to build the project locally. But if you want to test the revalidate api endpoint, then the project needs to be built.

Other than that, Vercel takes care of building the project during deployment.

Create optimized production build:

```bash
npm run build
```

Run production build locally:

```bash
npm run start
```

## Page revalidation

Revalidation is using [Next's on demand ISR feature](https://nextjs.org/docs/basic-features/data-fetching/incremental-static-regeneration#on-demand-revalidation-beta). The revalidation function is called in a custom api route. These are placed in the directory [`pages/api/revalidate/*`](./pages/api/revalidate).

Pages are revalidated every morning using a GitHub Action workflow, that is running a cron job. More details in the workflow file [`.github/workflows/revalidate-current-day-menus-cron.yml`](https://github.com/joonasmkauppinen/yle-campus-lunch-list/blob/main/.github/workflows/cron-revalidate-current-day-menus.yml).

There's also a manual workflow that can be triggered by hand at any time. You'll find this workflow from the [actions tab in the repo](https://github.com/joonasmkauppinen/yle-campus-lunch-list/actions/workflows/manual-revalidate-current-day-menus.yml).

## Lunch list data sources

### Huoltamo

Data is fetched from a JSON api.

Here's the url:

```
https://script.googleusercontent.com/macros/echo?user_content_key=8_Hojcv_I_BlGjGda06PvU1KWuFi5qvjrSq-1bE7C871wg8R4fqOtT-bMW8OqwVTibBa--fpMCKhH0SpEkZzjKah5tV0LkAJOJmA1Yb3SEsKFZqtv3DaNYcMrmhZHmUMWojr9NvTBuBLhyHCd5hHa8bu5fFVouus5Uusevvd9ue_m99P9CRISwy5nwbG5arkJ72HagjQ2wtGw79pGckaDWOicyxNfte4jYDWplrerSAjPcvHkHgo4eLtr_JoMfb1e4HF6ZFtBovZOhVmZqbpbw&lib=Mj9QMBIRZJsNk6tjp-CZc2vk6ee82Q7eC
```

### Studio 10

Data is scraped with Cheerio from url: https://gvcravintolat.fi/yle-studio10/

### Iso Paja

Data is scraped with Cheerio from url: https://www.hhravintolat.fi/iso-paja-lounaslista

### Båx

Data is scraped with Cheerio from url: https://www.kanresta.fi/ravintola/ravintola-bax/

### Dylan

Data is fetched from a JSON api.

Here's the url:

```
https://europe-west1-luncher-7cf76.cloudfunctions.net/api/v1/widget/3aba0b64-0d43-41ea-b665-1d2d6c0f2d5e/t14n3kFql5hOkmcEsTVt
```
