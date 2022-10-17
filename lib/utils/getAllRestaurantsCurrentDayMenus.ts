import { utcToZonedTime } from 'date-fns-tz';

import { RestaurantMenus } from '../types/restaurantMenus';
import { TIME_ZONE } from '../constants/timeZone';
import { WeekDay } from '../types/weekdays';
import { scrapeBox } from '../scrapers/cheerio/scrapeBox';
import { scrapeIsoPaja } from '../scrapers/cheerio/scrapeIsoPaja';
import { scrapeStudio10 } from '../scrapers/cheerio/scrapeStudio10';

import { WeekDayEnum } from './regexUtils';
import { fetchDylanCurrentDayMenuFromApi } from './fetchDylanCurrentDayMenuFromApi';
import { fetchIntraCurrentDayMenuFromApi } from './fetchHuoltamoCurrentDayMenuFromApi';
import { getBoxCurrentDayMenu } from './getBoxCurrentDayMenu';
import { getIsoPajaCurrentDayMenu } from './getIsoPajaCurrentDayMenu';
import { getStudio10CurrentDayMenu } from './getStudio10CurrentDayMenu';

export const getAllRestaurantsCurrentDayMenus = async () => {
  const currentDay = new Date().toLocaleDateString('default', {
    weekday: 'long',
  }) as WeekDay;
  const isoDate = new Date().toISOString();
  const weekDayIndex = WeekDayEnum[currentDay];
  const zonedIsoDate = utcToZonedTime(isoDate, TIME_ZONE);

  const { huoltamo, piccolo } = await fetchIntraCurrentDayMenuFromApi(zonedIsoDate);

  const restaurant: RestaurantMenus = {
    box: await getBoxCurrentDayMenu(weekDayIndex, scrapeBox),
    dylan: await fetchDylanCurrentDayMenuFromApi(weekDayIndex),
    huoltamo,
    isoPaja: await getIsoPajaCurrentDayMenu(weekDayIndex, scrapeIsoPaja),
    piccolo,
    studio10: await getStudio10CurrentDayMenu(weekDayIndex, scrapeStudio10),
  };

  return {
    restaurant,
    zonedIsoDate,
    isoDate,
  };
};
