import fetch from 'node-fetch';

import { DYLAN_API_URL } from '../constants/restaurantUrls';

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

export const fetchDylanCurrentDayMenuFromApi = async (currentDayIndex: number) => {
  try {
    const response = await fetch(DYLAN_API_URL);
    const json = (await response.json()) as DylanApiResponse;

    const currentDayMenu = json.data.week.days
      .find((day) => day.dayNumber === currentDayIndex + 1)
      ?.lunches.map((item) => item.title.fi);

    return currentDayMenu || [];
  } catch (err) {
    console.error(err);
    return [];
  }
};
