import { PageTitleWithDate } from "@/components/PageTitleWithDate";
import {
  RestaurantMenuListItem,
  type RestaurantMenuListItemProps,
} from "@/components/RestaurantMenuListItem";
import {
  AKSELI_URL,
  BOX_URL,
  DYLAN_BOLE_URL,
  DYLAN_LUFT_URL,
  INTRA_SITE_URL,
  ISO_PAJA_URL,
  STUDIO_10_URL,
  VISIO_PASILA_URL,
} from "@/constants/restaurantUrls";
import { getAllRestaurantsCurrentDayMenus } from "@/utils/getAllRestaurantsCurrentDayMenus";

export const revalidate = false; // Disable revalidation for this page

export default async function HomePage() {
  const data = await getAllRestaurantsCurrentDayMenus();

  const orderedRestaurants: RestaurantMenuListItemProps[] = [
    {
      restaurantName: "Huoltamo",
      restaurantUrl: INTRA_SITE_URL,
      menuItems: data.restaurant?.huoltamo?.map((item) => item.text),
    },
    {
      restaurantName: "Piccolo",
      restaurantUrl: INTRA_SITE_URL,
      menuItems: data.restaurant?.piccolo?.map((item) => item.text),
    },
    {
      restaurantName: "Iso Paja",
      restaurantUrl: ISO_PAJA_URL,
      menuItems: data.restaurant?.isoPaja?.map((item) => item.text),
    },
    {
      restaurantName: "Studio 10",
      restaurantUrl: STUDIO_10_URL,
      menuItems: data.restaurant?.studio10?.map((item) => item.text),
    },
    {
      restaurantName: "Visio Pasila",
      restaurantUrl: VISIO_PASILA_URL,
      menuItems: data.restaurant?.visioPasila?.map((item) => item.text),
    },
    {
      restaurantName: "Akseli",
      restaurantUrl: AKSELI_URL,
      menuItems: data.restaurant?.akseli?.map((item) => item.text),
    },
    {
      restaurantName: "Båx",
      restaurantUrl: BOX_URL,
      menuItems: data.restaurant.box?.map((item) => item.text) ?? [],
    },
    {
      restaurantName: "Dylan Luft",
      restaurantUrl: DYLAN_LUFT_URL,
      menuItems: data.restaurant?.dylanLuft?.map((item) => item.text),
    },
    {
      restaurantName: "Dylan Bole",
      restaurantUrl: DYLAN_BOLE_URL,
      menuItems: data.restaurant?.dylanBole?.map((item) => item.text),
    },
  ];

  return (
    <main className="mb-20 flex min-h-screen flex-col items-center px-4 text-black dark:text-white">
      <div className="flex w-full max-w-2xl flex-col">
        <PageTitleWithDate title="Lounaslistat" />

        {orderedRestaurants.map((restaurant, index) => (
          <RestaurantMenuListItem
            key={index}
            restaurantName={restaurant.restaurantName}
            menuItems={restaurant.menuItems}
            restaurantUrl={restaurant.restaurantUrl}
          />
        ))}
      </div>
    </main>
  );
}
