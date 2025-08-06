import * as cheerio from "cheerio";
import type { MenuItems } from "./getAllRestaurantsCurrentDayMenus";
import { STUDIO_10_URL } from "@/constants/restaurantUrls";

export const scrapeStudio10 = async (): Promise<MenuItems> => {
  try {
    const response = await fetch(STUDIO_10_URL);
    const body = await response.text();
    const $ = cheerio.load(body);
    const menuListContainer = $('[data-id="6be21e7"]');
    const allText = menuListContainer.text();
    const allTextArray = allText
      .split("\n")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    const menuItems: MenuItems = allTextArray.map((item: string) => ({
      text: item,
    }));

    return menuItems;
  } catch (err) {
    console.error(err);
    return [];
  }
};
