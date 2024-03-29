<p align="center">
  <img width="200" src="https://user-images.githubusercontent.com/28673805/178212367-e90d5c62-eeed-4c31-a39a-740a9ef3a287.png">
</p>
<h1 align="center">Yle campus lunch lists</h1>

<p align="center">Find all Yleisradio campus lunch lists in one place.</p>

<p align="center">Huoltamo  ·  Studio 10  ·  Iso Paja  ·  Båx  ·  Dylan Böle · Dylan Luft</p>

### Goals

- Create a page that collects all Yle campus lunch lists into one page.
- Learn Next.js and SSR
- Learn web scraping
- Learn better semantic HTML
- Learn SEO

### Future plans

If there is a point in time when I don't have anything better to do, then these are the features to I'd like to implement at some point.

- Create dedicated pages for each restaurant that includes to whole week menus.
- Create pages for each restaurant menu for each day of the week. Goal here being, that those pages would index into google. And finally people would be able to find Huoltamo's menus straight from Google!
- Add PWA config to the page and implement some kind of a notification system to notify people about the menus on lunch time.

### Technologies

- TypeScript
- React/Next.js for frontend/backend.
- Vercel for deployment, hosting.
- Cheerio for web scraping.

### Endpoints

Pages:

- Root page: https://yle-campus-lunch-list.vercel.app/

API:

- [`/api/current-day-menus`](https://yle-campus-lunch-list.vercel.app/api/current-day-menus) - Get the current day menus in JSON format. First request takes a while, because the data is scraped. Subsequent requests are served from cache.

- [`/api/current-day-menus-nocache`](https://yle-campus-lunch-list.vercel.app/api/current-day-menus-nocache) - Returns the same response as `/api/current-day-menus`, but the response is never cached.

- `/api/revalidate/current-day-menus` - Revalidation endpoint for the root page. This is using [Next's On-demand Revalidation feature](https://nextjs.org/docs/basic-features/data-fetching/incremental-static-regeneration#on-demand-revalidation).

## Resources

- App production url: [`https://yle-campus-lunch-list.vercel.app/`](https://yle-campus-lunch-list.vercel.app/)
- [Vercel dashboard](https://vercel.com/joonasmkauppinen/yle-campus-lunch-list) (hobby account, only @joonasmkauppinen can access)
- [Figma design layouts (view access)](https://www.figma.com/file/ckeATTSGr5adcHYNqHPORC/Yle-campus-lunch-menu?node-id=0%3A1)
- [GH Actions](https://github.com/joonasmkauppinen/yle-campus-lunch-list/actions)

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
yarn install
```

Start demo:

```bash
yarn dev
```

### Production build

Usually there is no need to build the project locally. But if you want to test the revalidate api endpoint, then the project needs to be built.

Other than that, Vercel takes care of building the project during deployment.

Create optimized production build:

```bash
yarn build
```

Run production build locally:

```bash
yarn start
```

### Project structure

The project is mainly following the structure that Next generates when creating a new project, but there are the following additions:

- `./components` - All the components live here.
- `./lib` - All non component files are placed here. Meaning plain TypeScript files.

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

## History

### Plan 1 ❌

Use Cheerio to scrape data from restaurant pages. But then realized you cannot scrape SPA pages with Cheerio. Huoltamo intra site and Dylan are SPAs.

### Plan 2 ❌

Use Playwright to scrape all sites, since Playwright by default waits for SPA pages to finish loading. It can also scrape data from inside iframes.

> 💡 FUN FACT: [Huoltamo intra site](https://script.google.com/a/macros/yle.fi/s/AKfycbyIvxaGDwOSS-oZzVNb3AEGHzbBBoFS4-JSe5TjTPuJVwtS9AE/exec) loads the actual content inside 2 nested iframes for some reason.

This approach was working fine during local development. The problem is that Playwright needs chromium in order to do its magic. While you can run `npx playwright install chromium` as a part of Vercel build step, it only exists during the build. When the Next.js app's revalidate endpoint is called, Vercel runs that inside an AWS Lambda serverless function and chromium doesn't exist there.

There is a library called [`chrome-aws-lambda`](https://github.com/alixaxel/chrome-aws-lambda) that aims to solve this problem, but the problem with this is that the chromium binary itself is already bigger than the AWS Lambda size limit of 50MB. You could just use AWS Lambda layers, but since we are using Vercel, we can't configure the deployment to use that.

One option to get around the Lambda size limit is to use an older version of `chrome-aws-lambda` that also ships an older version of chrome that is smaller than the size limit and also has room for the actual Next.js code bundle. This does fix the size limit issue, but turns out there is some kind of a bug in Node 14 that prevents Playwright/chromium to work inside an AWS Lambda. Vercel runs Node 14 LTS by default.

Using Node 12 was suggested as a fix to allow Playwright/chromium to run in AWS Lambda. You can also change Vercel to use Node 12 LTS. But the Lambda was still always failing and logging errors about some missing binaries that chromium needs in order to run.

At this point figured that Next.js + Playwright + Vercel is a dead end and need to find an other way to handle scraping the data.

### Plan 3 ✅

Discover that there are public JSON api endpoints for Huoltamo and Dylan lunch lists. This means that Playwright is not needed at all, because Huoltamo and Dylan were the only SPA sites.

Use Cheerio to scrape data from Studio 10, Iso Paja and Båx sites. Fetch the JSON data for Huoltamo and Dylan directly from their api endpoints.

This approach works perfectly in Vercel! 🚀
