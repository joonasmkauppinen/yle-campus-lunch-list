import fetch from 'node-fetch';
import { isSameDay } from 'date-fns';

import { INTRA_API_URL } from '../constants/restaurantUrls';
import { utcToZonedTime } from 'date-fns-tz';
import { TIME_ZONE } from '../constants/timeZone';
import { MenuItems } from '../types/restaurantMenus';

interface IntraRestaurantItemRaw {
  id: string;
  date: string;
  restaurant: string;
  restaurantId: string;
  menu: string;
}

interface MenuItem {
  diet: string;
  value: string;
}

interface IntraRestaurantItem {
  id: string;
  date: string;
  restaurant: string;
  restaurantId: string;
  menu: MenuItem[];
}

interface IntraApiResponse {
  status: number;
  items: IntraRestaurantItemRaw[];
}

/**
 * Intra API includes Huoltamo and Piccolo lunch items
 */
export const fetchIntraCurrentDayMenuFromApi = async (
  zonedIsoDate: Date,
): Promise<{ huoltamo: MenuItems; piccolo: MenuItems }> => {
  try {
    const response = await fetch(INTRA_API_URL);
    const data = (await response.json()) as IntraApiResponse;

    const huoltamoItems = data.items
      .filter((item) => item.restaurant.match(/Sara`s|Ravintola Huoltamo Palmia/g))
      .map((item) => ({ ...item, menu: JSON.parse(item.menu) } as IntraRestaurantItem));

    const piccoloItems = data.items
      .filter((item) => item.restaurant === 'Piccolo')
      .map((item) => ({ ...item, menu: JSON.parse(item.menu) } as IntraRestaurantItem));

    const huoltamoCurrentDayMenuArr = huoltamoItems
      .find((item) => isSameDay(utcToZonedTime(item.date, TIME_ZONE), zonedIsoDate))
      ?.menu.map((item) => `${item.value} ${item.diet ? `(${item.diet})` : ''}`);

    const piccoloCurrentDayMenuArr = piccoloItems
      .find((item) => isSameDay(utcToZonedTime(item.date, TIME_ZONE), zonedIsoDate))
      ?.menu.map((item) => `${item.value} ${item.diet ? `(${item.diet})` : ''}`);

    const huoltamoCurrentDayMenuItems: MenuItems = huoltamoCurrentDayMenuArr
      ? huoltamoCurrentDayMenuArr.map((item) => ({
          text: item,
        }))
      : [];

    const piccoloCurrentDayMenuItems: MenuItems = piccoloCurrentDayMenuArr
      ? piccoloCurrentDayMenuArr.map((item) => ({
          text: item,
        }))
      : [];

    return { huoltamo: huoltamoCurrentDayMenuItems, piccolo: piccoloCurrentDayMenuItems };
  } catch (err) {
    console.error(err);
    return {
      huoltamo: [],
      piccolo: [],
    };
  }
};
