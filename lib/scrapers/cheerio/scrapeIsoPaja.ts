import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

import { ISO_PAJA_URL } from '../../constants/restaurantUrls';
import { MenuItems } from '../../types/restaurantMenus';

export const scrapeIsoPaja = async (): Promise<MenuItems> => {
  try {
    const response = await fetch(ISO_PAJA_URL);
    const body = await response.text();
    const $ = cheerio.load(body);
    const menuItemsArr = $('[data-mesh-id="comp-kyrlvrhqinlineContent-gridContainer"] .font_8')
      .map((_, element) => $(element).text())
      .toArray()
      .filter((item) => /\s/.test(item));

    const menuItems: MenuItems = menuItemsArr.map((item) => ({ text: item }));

    return menuItems;
  } catch (err) {
    console.error(err);
    return [];
  }
};
