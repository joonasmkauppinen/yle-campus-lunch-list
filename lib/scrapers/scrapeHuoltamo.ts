import playwright from 'playwright-aws-lambda';

import { HUOLTAMO_URL } from '../constants/restaurantUrls';

const weekDayNamesArray = ['MAANANTAI', 'TIISTAI', 'KESKIVIIKKO', 'TORSTAI', 'PERJANTAI'];

export const scrapeHuoltamo = async (weekdayIndex: number) => {
  let result: string[];

  const browser = await playwright.launchChromium();
  const context = await browser.newContext();

  const page = await context.newPage();
  await page.goto(HUOLTAMO_URL);

  // Click current day label
  await page
    .frameLocator('#sandboxFrame')
    .frameLocator('#userHtmlFrame')
    .locator(`#DayPicker >> text=${weekDayNamesArray[weekdayIndex]}`)
    .click();

  result = await page
    .frameLocator('#sandboxFrame')
    .frameLocator('#userHtmlFrame')
    .locator('.restaurantItem2')
    .evaluateAll((elements) => {
      const items: string[] = [];

      elements.forEach((element) => {
        if (element.textContent?.includes('Huoltamo')) {
          const liElements = element.querySelectorAll('.restaurantMenu ul li');
          liElements.forEach((li) => {
            const menuItemParts: string[] = [];
            li.querySelectorAll('span').forEach((span) =>
              menuItemParts.push(span.textContent || ''),
            );
            items.push(menuItemParts.join(' '));
          });
        }
      });

      return items;
    });

  // ---------------------
  await context.close();
  await browser.close();

  return result;
};
