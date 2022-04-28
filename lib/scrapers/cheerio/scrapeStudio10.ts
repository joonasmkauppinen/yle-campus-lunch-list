import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { STUDIO_10_URL } from '../../constants/restaurantUrls';
import { MenuItems } from '../../types/restaurantMenus';

export const scrapeStudio10 = async (): Promise<MenuItems> => {
  try {
    const response = await fetch(STUDIO_10_URL);
    const body = await response.text();
    const $ = cheerio.load(body);
    const menuListHtmlElements = $('.mm-lounaslista')
      .map((_, element) => $(element).html())
      .toArray()
      .flatMap((item) => item.split('\n'))
      .filter((item) => /\s/.test(item));

    const menuListItems: MenuItems = menuListHtmlElements.map((html) => {
      const $ = cheerio.load(html);
      return {
        markdown: html,
        text: $.text(),
      };
    });

    return menuListItems;
  } catch (err) {
    console.error(err);
    return [];
  }
};
