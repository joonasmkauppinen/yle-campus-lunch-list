import { toZonedTime } from 'date-fns-tz';

import { WeekDayEnum } from './regexUtils';
import { fetchDylanBoleCurrentDayMenuFromApi } from './fetchDylanBoleCurrentDayMenuFromApi';
import { fetchIntraCurrentDayMenuFromApi } from './fetchHuoltamoCurrentDayMenuFromApi';
import { getBoxCurrentDayMenu } from './getBoxCurrentDayMenu';
import { getIsoPajaCurrentDayMenu } from './getIsoPajaCurrentDayMenu';
import { getStudio10CurrentDayMenu } from './getStudio10CurrentDayMenu';
import { fetchDylanLuftCurrentDayMenuFromApi } from './fetchDylanLuftCurrentDayMenuFromApi';
import { fetchVisioPasilaCurrentDayMenuFromApi } from './fetchVisioPasilaCurrentDayMenuFromApi';
import { TIME_ZONE } from './timeZone';
import { scrapeBox } from './scrapeBox';
import { scrapeIsoPaja } from './scrapeIsoPaja';
import { scrapeStudio10 } from './scrapeStudio10';
import { scrapeAkseli } from './scrapeAkseli';
import { getAkseliCurrentDayMenu } from './getAkseliCurrentDayMenu';
import { getVesilinnaCurrentDayMenu } from './getVesilinnaCurrentDayMenu';
import { scrapeVesilinna } from './scrapeVesilinna';

export type WeekDay =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday';

export interface MenuItem {
  text: string;
  markdown?: string;
}

export type MenuItems = MenuItem[];

export interface RestaurantMenus {
  akseli: MenuItems;
  box: MenuItems;
  dylanBole: MenuItems;
  dylanLuft: MenuItems;
  huoltamo: MenuItems;
  isoPaja: MenuItems;
  piccolo: MenuItems;
  studio10: MenuItems;
  vesilinna: MenuItems;
  visioPasila: MenuItems;
}

export const getAllRestaurantsCurrentDayMenus = async () => {
  const rawDay = new Date().toLocaleDateString('default', {
    weekday: 'long',
  });
  const validWeekDays: WeekDay[] = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];
  const currentDay = validWeekDays.includes(rawDay as WeekDay) ? (rawDay as WeekDay) : 'Monday'; // fallback to Monday or handle error as needed
  const isoDate = new Date().toISOString();
  const weekDayIndex = WeekDayEnum[currentDay];
  const zonedIsoDate = toZonedTime(isoDate, TIME_ZONE);

  const intraMenusResponse = await fetchIntraCurrentDayMenuFromApi(zonedIsoDate);

  const restaurant: RestaurantMenus = {
    akseli: await getAkseliCurrentDayMenu(weekDayIndex, scrapeAkseli),
    box: await getBoxCurrentDayMenu(weekDayIndex, scrapeBox),
    dylanBole: await fetchDylanBoleCurrentDayMenuFromApi(weekDayIndex),
    dylanLuft: await fetchDylanLuftCurrentDayMenuFromApi(weekDayIndex),
    huoltamo: Array.isArray(intraMenusResponse.huoltamo) ? intraMenusResponse.huoltamo : [],
    isoPaja: await getIsoPajaCurrentDayMenu(weekDayIndex, scrapeIsoPaja),
    piccolo: intraMenusResponse.piccolo,
    studio10: await getStudio10CurrentDayMenu(weekDayIndex, scrapeStudio10),
    vesilinna: await getVesilinnaCurrentDayMenu(weekDayIndex, scrapeVesilinna),
    visioPasila: await fetchVisioPasilaCurrentDayMenuFromApi(),
  };

  return {
    restaurant,
    zonedIsoDate,
    isoDate,
  };
};
