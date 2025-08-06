import { getAllRestaurantsCurrentDayMenus } from "@/utils/getAllRestaurantsCurrentDayMenus";

export type MenuItem = {
  text: string;
  markdown?: string;
};

export type MenuItems = MenuItem[];

export type RestaurantMenus = {
  akseli?: MenuItems;
  box?: MenuItems;
  dylanBole?: MenuItems;
  dylanLuft?: MenuItems;
  huoltamo?: MenuItems;
  isoPaja?: MenuItems;
  piccolo?: MenuItems;
  studio10?: MenuItems;
  visioPasila?: MenuItems;
};

export type GetRestaurantMenusResponse = {
  restaurant: RestaurantMenus;
  dataScrapedIsoDate?: Date;
  error?: unknown;
};

export async function GET() {
  try {
    const result = await getAllRestaurantsCurrentDayMenus();

    const responseBody: GetRestaurantMenusResponse = {
      restaurant: result.restaurant as RestaurantMenus,
    };

    return new Response(JSON.stringify(responseBody), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "s-maxage=21600",
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
