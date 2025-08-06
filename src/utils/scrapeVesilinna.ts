import { VESILINNA_URL } from '@/constants/restaurantUrls';
import * as cheerio from 'cheerio';

export const scrapeVesilinna = async (): Promise<string[]> => {
  try {
    const response = await fetch(VESILINNA_URL);
    const body = await response.text();
    const $ = cheerio.load(body);
    const menuListContainer = $('#lounaslista');
    const allText = menuListContainer.text();
    const allTextArray = allText
      .split('\n')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    return allTextArray;
  } catch (err) {
    console.error(err);
    return [];
  }
};
