import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MenuDateProvider } from "~/components/menu-date";
import { RestaurantDetail } from "~/components/restaurant-detail";
import {
  getSortedRestaurantsWithMetadata,
  RESTAURANT_CONFIGS,
} from "~/config/restaurants";
import { getTodayIsoString } from "~/lib/dates";
import { generateRestaurantJsonLd } from "~/lib/seo";
import { fetchRestaurantsFromGoogleSheets } from "~/lib/sheets";

// Configure Next.js ISR revalidation interval (1 hour)
export const revalidate = 3600;

interface RestaurantPageProps {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return RESTAURANT_CONFIGS.map((cfg) => ({
    id: cfg.id,
  }));
}

export async function generateMetadata(
  props: RestaurantPageProps,
): Promise<Metadata> {
  const { id } = await props.params;
  const { restaurants: rawRestaurants } =
    await fetchRestaurantsFromGoogleSheets();
  const restaurants = getSortedRestaurantsWithMetadata(rawRestaurants);
  const restaurant = restaurants.find(
    (r) => r.id.toLowerCase() === id.toLowerCase(),
  );

  const config = RESTAURANT_CONFIGS.find(
    (c) => c.id.toLowerCase() === id.toLowerCase(),
  );
  const name = restaurant?.name ?? config?.name ?? id;
  const address = restaurant?.address ?? config?.address;
  const locationSuffix = address
    ? `${address.street}, Pasila`
    : "Pasila, Helsinki";

  const title = `${name} – Lounaslista`;
  const description = `Viikon lounaslistat ja aukioloajat ravintolalle ${name} (${locationSuffix}). Katso lounasvaihtoehdot ja ruokalista.`;
  const canonicalUrl = `/restaurant/${id}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${name} – Lounaslista`,
      description,
      url: canonicalUrl,
      type: "website",
      locale: "fi_FI",
    },
    twitter: {
      card: "summary",
      title: `${name} – Lounaslista`,
      description,
    },
  };
}

export default async function RestaurantPage(props: RestaurantPageProps) {
  const { id } = await props.params;
  const {
    restaurants: rawRestaurants,
    error,
    isDev,
    source,
  } = await fetchRestaurantsFromGoogleSheets();

  const restaurants = getSortedRestaurantsWithMetadata(rawRestaurants);
  const restaurant = restaurants.find(
    (r) => r.id.toLowerCase() === id.toLowerCase(),
  );

  if (!restaurant && !error) {
    notFound();
  }

  const today = getTodayIsoString();
  const currentMenu = restaurant?.menus.find((menu) => menu.date === today);
  const jsonLd = restaurant
    ? generateRestaurantJsonLd(restaurant, currentMenu)
    : null;
  return (
    <MenuDateProvider today={today}>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <RestaurantDetail
        restaurant={restaurant}
        error={error}
        isDev={isDev}
        source={source}
      />
    </MenuDateProvider>
  );
}
