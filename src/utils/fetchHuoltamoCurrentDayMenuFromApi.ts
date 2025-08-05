import { isSameDay } from "date-fns";
import type { MenuItems } from "./getAllRestaurantsCurrentDayMenus";
import { INTRA_API_URL } from "@/constants/restaurantUrls";
import { toZonedTime } from "date-fns-tz";
import { TIME_ZONE } from "./timeZone";

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

    if (response.status !== 200) {
      throw new Error(`Failed to fetch intra API: ${response.status}`);
    }

    const data = (await response.json()) as IntraApiResponse;

    const huoltamoItems = data.items
      .filter((item) => item.restaurant.match(/Ravintola Huoltamo Palmia/g))
      .map(
        (item) =>
          ({
            ...item,
            menu: JSON.parse(item.menu) as MenuItem[],
          }) as IntraRestaurantItem,
      );

    const piccoloItems = data.items
      .filter((item) => item.restaurant === "Piccolo")
      .map(
        (item) =>
          ({
            ...item,
            menu: JSON.parse(item.menu) as MenuItem[],
          }) as IntraRestaurantItem,
      );

    const huoltamoCurrentDayMenuArr = huoltamoItems
      .find((item) =>
        isSameDay(toZonedTime(item.date, TIME_ZONE), zonedIsoDate),
      )
      ?.menu.map(
        (item) => `${item.value} ${item.diet ? `(${item.diet})` : ""}`,
      );

    const piccoloCurrentDayMenuArr = piccoloItems
      .find((item) =>
        isSameDay(toZonedTime(item.date, TIME_ZONE), zonedIsoDate),
      )
      ?.menu.map(
        (item) => `${item.value} ${item.diet ? `(${item.diet})` : ""}`,
      );

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

    return {
      huoltamo: huoltamoCurrentDayMenuItems,
      piccolo: piccoloCurrentDayMenuItems,
    };
  } catch (err) {
    console.error(err);
    return {
      huoltamo: [],
      piccolo: [],
    };
  }
};
