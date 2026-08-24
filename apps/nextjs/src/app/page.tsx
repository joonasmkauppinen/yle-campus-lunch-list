import { Footer } from "~/components/footer";
import { RestaurantView } from "~/components/restaurant-view";
import { getSortedRestaurantsWithMetadata } from "~/config/restaurants";
import { getTodayFormattedString } from "~/lib/dates";
import { fetchRestaurantsFromGoogleSheets } from "~/lib/sheets";

// Configure Next.js ISR revalidation interval (1 hour)
export const revalidate = 3600;

export default async function HomePage() {
  const {
    restaurants: rawRestaurants,
    error,
    isDev,
    source,
  } = await fetchRestaurantsFromGoogleSheets();

  const restaurants = getSortedRestaurantsWithMetadata(rawRestaurants);
  const todayStr = getTodayFormattedString();

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:max-w-7xl lg:px-8">
      {error ? (
        <div
          role="alert"
          className="border-destructive/50 bg-destructive/10 text-destructive rounded-xl border p-6 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <svg
              className="text-destructive mt-0.5 h-5 w-5 shrink-0"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 8.25h.008v.008H12v-.008Z"
              />
            </svg>
            <div className="space-y-1">
              <h2 className="text-base font-semibold">
                Unable to load lunch menus
              </h2>
              <p className="text-sm opacity-90">{error}</p>
            </div>
          </div>
        </div>
      ) : restaurants.length === 0 ? (
        <div className="border-border bg-card text-muted-foreground rounded-xl border p-12 text-center shadow-sm">
          <p className="text-base font-medium">No restaurants found</p>
          <p className="mt-1 text-sm">
            There are currently no active restaurant tabs in the connected
            Google Sheet.
          </p>
        </div>
      ) : (
        <RestaurantView
          restaurants={restaurants}
          todayStr={todayStr}
          isDev={isDev}
          source={source}
        />
      )}

      <Footer />
    </main>
  );
}
