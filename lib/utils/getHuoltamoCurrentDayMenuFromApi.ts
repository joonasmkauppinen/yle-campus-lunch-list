import fetch from 'node-fetch';
import { isSameDay } from 'date-fns';

import { INTRA_HUOLTAMO_API_URL } from '../constants/restaurantUrls';

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

export const getHuoltamoCurrentDayMenuFromApi = async (zonedIsoDate: Date) => {
  try {
    const response = await fetch(INTRA_HUOLTAMO_API_URL);
    const data = (await response.json()) as IntraApiResponse;

    const huoltamoItems = data.items
      .filter((item) => item.restaurant === 'Ravintola Huoltamo Palmia')
      .map((item) => ({ ...item, menu: JSON.parse(item.menu) } as IntraRestaurantItem));

    const currentDayMenu = huoltamoItems
      .find((item) => isSameDay(new Date(item.date), zonedIsoDate))
      ?.menu.map((item) => `${item.value} ${item.diet ? `(${item.diet})` : ''}`);

    return currentDayMenu || [];
  } catch (err) {
    console.error(err);
    return [];
  }
};
