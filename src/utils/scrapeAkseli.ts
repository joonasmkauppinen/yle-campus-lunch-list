import * as cheerio from "cheerio";
import { AKSELI_URL } from "@/constants/restaurantUrls";

export const scrapeAkseli = async (): Promise<string[]> => {
  try {
    const response = await fetch(AKSELI_URL);
    const body = await response.text();
    const $ = cheerio.load(body);
    const menuListContainer = $("#lounaslista");
    const allText = menuListContainer.text();
    const allTextArray = allText
      .split("\n")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    return allTextArray;
  } catch (err) {
    console.error(err);
    return [];
  }
};
