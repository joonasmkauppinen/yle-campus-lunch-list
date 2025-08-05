import { getAllRestaurantsCurrentDayMenus } from "@/utils/getAllRestaurantsCurrentDayMenus";
import type {
  GetRestaurantMenusResponse,
  RestaurantMenus,
} from "../current-day-menus/route";

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
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
