import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { STUDIO_10_URL } from '../../constants/restaurantUrls';

export const scrapeStudio10 = async () => {
  try {
    const response = await fetch(STUDIO_10_URL);
    const body = await response.text();
    const $ = cheerio.load(body);
    const menuListItems = $('.mm-lounaslista')
      .map((_, element) => $(element).html())
      .toArray()
      .flatMap((item) => item.split('\n'))
      .filter((item) => /\s/.test(item));

    return menuListItems;
  } catch (err) {
    console.error(err);
    return [];
  }
};
