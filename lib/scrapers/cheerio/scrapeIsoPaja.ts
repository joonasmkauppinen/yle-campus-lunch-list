import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

import { ISO_PAJA_URL } from '../../constants/restaurantUrls';
import { MenuItems } from '../../types/restaurantMenus';

export const scrapeIsoPaja = async (): Promise<MenuItems> => {
  try {
    const response = await fetch(ISO_PAJA_URL);
    const body = await response.text();
    const $ = cheerio.load(body);
    const menuItemsArr = $('.font_8')
      .map((_, element) => $(element).text())
      .toArray();

    const sliceStart = menuItemsArr.findIndex((item) => item === 'MAANANTAI');
    const menuItems: MenuItems = menuItemsArr
      // Remove items from start that are not menu items. Remove 3 items from end that are not menu items.
      .slice(sliceStart, menuItemsArr.length - 3)

      // Sometimes items can contain a zero width space, replace those.
      .map((item) => item.replace(/\u200B/g, '').trim())

      // Filter out falsy values - "", 0, NaN, null, undefined, false
      .filter(Boolean)
      .map((item) => ({ text: item }));

    return menuItems;
  } catch (err) {
    console.error(err);
    return [];
  }
};
