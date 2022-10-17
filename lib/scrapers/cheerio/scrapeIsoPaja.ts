import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

import { ISO_PAJA_URL } from '../../constants/restaurantUrls';
import { MenuItems } from '../../types/restaurantMenus';

export const scrapeIsoPaja = async (): Promise<MenuItems> => {
  try {
    const response = await fetch(ISO_PAJA_URL);
    const body = await response.text();
    const $ = cheerio.load(body);
    const menuItemsArr = $('#comp-kyrlvrhq .font_8')
      .map((_, element) => $(element).text())
      .toArray()
      .map((item) => item.replace(/\u200B/g, '').trim()) // Sometimes items can contain a zero width space, replace those.
      .filter(Boolean); // Filter out falsy values - "", 0, NaN, null, undefined, false

    const menuItems: MenuItems = menuItemsArr.map((item) => ({ text: item }));

    return menuItems;
  } catch (err) {
    console.error(err);
    return [];
  }
};
