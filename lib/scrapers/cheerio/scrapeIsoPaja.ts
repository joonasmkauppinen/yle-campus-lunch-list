import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

import { ISO_PAJA_URL } from '../../constants/restaurantUrls';
import { MenuItems } from '../../types/restaurantMenus';

const normalizeWeekdayString = (weekday: string): string => {
  if (weekday.match(/ma/i)) {
    return 'maanantai';
  }
  if (weekday.match(/ti/i)) {
    return 'tiistai';
  }
  if (weekday.match(/ke/i)) {
    return 'keskiviikko';
  }
  if (weekday.match(/to/i)) {
    return 'torstai';
  }
  if (weekday.match(/pe/i)) {
    return 'perjantai';
  }
  if (weekday.match(/la/i)) {
    return 'lauantai';
  }
  if (weekday.match(/su/i)) {
    return 'sunnuntai';
  }
  return '';
};

export const scrapeIsoPaja = async (): Promise<MenuItems> => {
  try {
    const response = await fetch(ISO_PAJA_URL);
    const body = await response.text();
    const $ = cheerio.load(body);

    const dayMenuTest = $('.elementor-element-33b1840')
      .children()
      .toArray()
      .slice(4)
      .flatMap((element) => {
        const weekdayTitle = $(element).find('.elementor-heading-title').text();
        const normalizedWeekdayTitle = normalizeWeekdayString(weekdayTitle);

        const menuItems = $(element)
          .find(':nth-child(1) div div div div')
          .children()
          .toArray()
          .filter((_, index) => index !== 0)
          .map((item) => $(item).text())
          .filter((item) => item.trim() !== '')
          .map((item) => ({ text: item }));

        return [{ text: normalizedWeekdayTitle }, ...menuItems];
      });

    return dayMenuTest;
  } catch (err) {
    console.error(err);
    return [];
  }
};
