import * as cheerio from "cheerio";

import { BOX_URL } from "@/constants/restaurantUrls";
import type { MenuItems } from "./getAllRestaurantsCurrentDayMenus";

export const scrapeBox = async (): Promise<MenuItems> => {
  try {
    const response = await fetch(BOX_URL);
    const body = await response.text();
    const $ = cheerio.load(body);
    const menuListContainer = $("#lounas");
    const allText = menuListContainer.text();
    const allTextArray = allText
      .split("\n")
      .map((item) => item.trim())
      .filter(
        (item) => item.length > 0 && !/^\d{1,2},\d{2}€$/.test(item), // filters out prices like "13,60€"
      );

    const menuItems: MenuItems = allTextArray.map((item: string) => ({
      text: item,
    }));

    return menuItems;
  } catch (err) {
    console.error(err);
    return [];
  }
};
