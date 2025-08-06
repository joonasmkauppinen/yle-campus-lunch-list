import { VISIO_PASILA_API_URL } from "@/constants/restaurantUrls";
import type { MenuItems } from "./getAllRestaurantsCurrentDayMenus";

type PasilanVisioApiResponse = {
  dayOfWeek: string;
  date: string;
  menuPackages: unknown[];
  html: string;
  isManualMenu: boolean;
};

export const fetchVisioPasilaCurrentDayMenuFromApi =
  async (): Promise<MenuItems> => {
    try {
      const url =
        VISIO_PASILA_API_URL + `&date=${new Date().toISOString().slice(0, 10)}`;
      const response = await fetch(url);
      const json = (await response.json()) as PasilanVisioApiResponse;
      const menuItems = json.html
        .replace("<p>", "")
        .replace("</p>", "")
        .split("<br />")
        .map((item) => ({ markdown: item, text: item }));
      return menuItems;
    } catch (err) {
      console.error(err);
      return [];
    }
  };
