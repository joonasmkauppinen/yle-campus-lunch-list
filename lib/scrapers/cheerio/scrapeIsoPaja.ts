import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { ISO_PAJA_URL } from '../../constants/restaurantUrls';

export const scrapeIsoPaja = async () => {
  try {
    const response = await fetch(ISO_PAJA_URL);
    const body = await response.text();
    const $ = cheerio.load(body);
    const menuItems = $('[data-mesh-id="comp-kyrlvrhqinlineContent-gridContainer"] .font_8')
      .map((_, element) => $(element).text())
      .toArray();

    return menuItems;
  } catch (err) {
    console.error(err);
    return [];
  }
};
