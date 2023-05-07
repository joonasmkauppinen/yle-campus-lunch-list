import fetch from 'node-fetch';

import { DYLAN_BOLE_API_URL } from '../constants/restaurantUrls';
import { MenuItems } from '../types/restaurantMenus';

interface LunchItems {
  title: {
    fi: string;
  };
}

interface Days {
  dayNumber: number;
  lunches: LunchItems[];
}

interface DylanData {
  week: {
    days: Days[];
  };
}

interface DylanApiResponse {
  data: DylanData;
}

export const fetchDylanBoleCurrentDayMenuFromApi = async (
  currentDayIndex: number,
): Promise<MenuItems> => {
  try {
    const response = await fetch(DYLAN_BOLE_API_URL);
    const json = (await response.json()) as DylanApiResponse;

    const currentDayMenuArr = json.data.week.days
      .find((day) => day.dayNumber === currentDayIndex + 1)
      ?.lunches.map((item) => item.title.fi);

    if (!currentDayMenuArr) {
      return [];
    }

    const currentDayMenuItems: MenuItems = currentDayMenuArr.map((item) => ({ text: item }));
    return currentDayMenuItems;
  } catch (err) {
    console.error(err);
    return [];
  }
};
