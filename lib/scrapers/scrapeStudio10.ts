import chromium from 'chrome-aws-lambda';
import playwright from 'playwright-core';

import { STUDIO_10_URL } from '../constants/restaurantUrls';

export const scrapeStudio10CurrentWeekMenu = async () => {
  let result: string[];

  const browser = await playwright.chromium.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath,
    headless: chromium.headless,
  });
  const context = await browser.newContext();

  const page = await context.newPage();
  await page.goto(STUDIO_10_URL);

  result = await page.locator('.mm-lounaslista').evaluate((element) => {
    const items: string[] = [];

    for (let i = 0; i < element.children.length; i++) {
      const childInnerHTML = element.children[i].innerHTML;
      items.push(childInnerHTML);
    }

    return items;
  });

  // ---------------------
  await context.close();
  await browser.close();

  return result;
};
