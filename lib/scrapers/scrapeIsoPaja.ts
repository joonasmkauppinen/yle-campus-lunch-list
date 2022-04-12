import { ISO_PAJA_URL } from '../constants/restaurantUrls';
import { getBrowserByEnvironment } from '../utils/getBrowserByEnvironment';

export const scrapeIsoPaja = async () => {
  let result: string[];

  const browser = await getBrowserByEnvironment();
  const context = await browser.newContext();

  const page = await context.newPage();
  await page.goto(ISO_PAJA_URL);

  result = await page
    .locator('[data-mesh-id="comp-kyrlvrhqinlineContent-gridContainer"] .font_8')
    .evaluateAll((elements) => {
      const items: string[] = [];

      elements.forEach((element) => items.push(element.textContent || 'null'));

      return items;
    });

  // ---------------------
  await context.close();
  await browser.close();

  return result;
};
