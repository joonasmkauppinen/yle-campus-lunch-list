import * as cheerio from "cheerio";
import type { MenuItems } from "./getAllRestaurantsCurrentDayMenus";
import { ISO_PAJA_URL } from "@/constants/restaurantUrls";

const normalizeWeekdayString = (weekday: string): string => {
  if (/ma/i.exec(weekday)) {
    return "maanantai";
  }
  if (/ti/i.exec(weekday)) {
    return "tiistai";
  }
  if (/ke/i.exec(weekday)) {
    return "keskiviikko";
  }
  if (/to/i.exec(weekday)) {
    return "torstai";
  }
  if (/pe/i.exec(weekday)) {
    return "perjantai";
  }
  if (/la/i.exec(weekday)) {
    return "lauantai";
  }
  if (/su/i.exec(weekday)) {
    return "sunnuntai";
  }
  return "";
};

export const scrapeIsoPaja = async (): Promise<MenuItems> => {
  try {
    const response = await fetch(ISO_PAJA_URL);
    const body = await response.text();
    const $ = cheerio.load(body);

    const dayMenuTest = $(".elementor-element-33b1840")
      .children()
      .toArray()
      .slice(4)
      .flatMap((element) => {
        const weekdayTitle = $(element).find(".elementor-heading-title").text();
        const normalizedWeekdayTitle = normalizeWeekdayString(weekdayTitle);

        const menuItems = $(element)
          .find(":nth-child(1) div div div div")
          .children()
          .toArray()
          .filter((_, index) => index !== 0)
          .map((item) => $(item).text())
          .filter((item) => item.trim() !== "")
          .map((item) => ({ text: item }));

        return [{ text: normalizedWeekdayTitle }, ...menuItems];
      });

    return dayMenuTest;
  } catch (err) {
    console.error(err);
    return [];
  }
};
