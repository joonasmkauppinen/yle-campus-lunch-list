import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { BOX_URL } from '../../constants/restaurantUrls';

export const scrapeBox = async () => {
  try {
    const response = await fetch(BOX_URL);
    const body = await response.text();
    const $ = cheerio.load(body);
    const menuListItems = $('#lounaslista')
      .find('.lunch-container')
      .last()
      .map((_, element) => $(element).text())
      .toArray()
      .flatMap((item) => item.split('\n'))
      .filter((item) => /\S/.test(item))
      .map((item) => item.trim());

    return menuListItems;
  } catch (err) {
    console.error(err);
    return [];
  }
};
