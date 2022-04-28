import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

import { BOX_URL } from '../../constants/restaurantUrls';
import { MenuItems } from '../../types/restaurantMenus';

export const scrapeBox = async (): Promise<MenuItems> => {
  try {
    const response = await fetch(BOX_URL);
    const body = await response.text();
    const $ = cheerio.load(body);
    const menuListItemsArr = $('#lounaslista')
      .find('.lunch-container')
      .last()
      .map((_, element) => $(element).text())
      .toArray()
      .flatMap((item) => item.split('\n'))
      .filter((item) => /\S/.test(item))
      .map((item) => item.trim());

    const menuItems: MenuItems = menuListItemsArr.map((item) => ({ text: item }));

    return menuItems;
  } catch (err) {
    console.error(err);
    return [];
  }
};
