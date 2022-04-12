import { STUDIO_10_URL } from '../constants/restaurantUrls';
import { getBrowserByEnvironment } from '../utils/getBrowserByEnvironment';

export const scrapeStudio10CurrentWeekMenu = async () => {
  let result: string[];

  const browser = await getBrowserByEnvironment();
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
