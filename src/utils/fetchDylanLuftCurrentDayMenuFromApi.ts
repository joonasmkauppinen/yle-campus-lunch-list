import { DYLAN_LUFT_API_URL } from "@/constants/restaurantUrls";
import type { MenuItems } from "./getAllRestaurantsCurrentDayMenus";

type LunchItems = {
  title: {
    fi: string;
  };
};

type Days = {
  dayNumber: number;
  lunches: LunchItems[];
};

type DylanData = {
  week: {
    days: Days[];
  };
};

type DylanApiResponse = {
  data: DylanData;
};

export const fetchDylanLuftCurrentDayMenuFromApi = async (
  currentDayIndex: number,
): Promise<MenuItems> => {
  try {
    const response = await fetch(DYLAN_LUFT_API_URL);
    const json = (await response.json()) as DylanApiResponse;

    const currentDayMenuArr = json.data.week.days
      .find((day) => day.dayNumber === currentDayIndex + 1)
      ?.lunches.map((item) => item.title.fi);

    if (!currentDayMenuArr) {
      return [];
    }

    const currentDayMenuItems: MenuItems = currentDayMenuArr.map((item) => ({
      text: item,
    }));
    return currentDayMenuItems;
  } catch (err) {
    console.error(err);
    return [];
  }
};
