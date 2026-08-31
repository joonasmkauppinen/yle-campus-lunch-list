import type { Metadata } from "next";

import { RadiatorView } from "~/components/radiator-view";
import { getSortedRestaurantsWithMetadata } from "~/config/restaurants";
import { getTodayFormattedString } from "~/lib/dates";
import { fetchRestaurantsFromGoogleSheets } from "~/lib/sheets";

// Configure Next.js ISR revalidation interval (1 hour)
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Radiaattori – Lounaslistat",
  description: "Automaattisesti rullaava lounaslistanäkymä infonäytöille.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function RadiatorPage() {
  const {
    restaurants: rawRestaurants,
    error,
    isDev,
    source,
  } = await fetchRestaurantsFromGoogleSheets();

  const restaurants = getSortedRestaurantsWithMetadata(rawRestaurants);
  const todayStr = getTodayFormattedString();

  return (
    <RadiatorView
      restaurants={restaurants}
      todayStr={todayStr}
      isDev={isDev}
      source={source}
      error={error}
    />
  );
}
