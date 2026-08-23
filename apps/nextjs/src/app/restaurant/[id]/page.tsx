import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Footer } from "~/components/footer";
import { RestaurantMenuItem } from "~/components/restaurant-menu-item";
import {
  getSortedRestaurantsWithMetadata,
  RESTAURANT_CONFIGS,
} from "~/config/restaurants";
import {
  formatDisplayDate,
  getTodayFormattedString,
  isCurrentDate,
} from "~/lib/dates";
import { fetchRestaurantsFromGoogleSheets } from "~/lib/sheets";

// Configure Next.js ISR revalidation interval (5 minutes)
export const revalidate = 300;

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

  if (!restaurant) {
    const config = RESTAURANT_CONFIGS.find(
      (c) => c.id.toLowerCase() === id.toLowerCase(),
    );
    const name = config?.name ?? id;
    return {
      title: `${name} - Lounaslista`,
      description: `Päivän lounaslista ravintolalle ${name}.`,
    };
  }

  return {
    title: `${restaurant.name} - Lounaslista`,
    description: `Päivän lounaslista ravintolalle ${restaurant.name}.`,
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

  const todayStr = getTodayFormattedString();
  const currentMenu = restaurant?.menus[0];
  const hasItems = (currentMenu?.items.length ?? 0) > 0;
  const isOutdated = currentMenu?.date
    ? !isCurrentDate(currentMenu.date)
    : false;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back button */}
      <div className="mb-6">
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground group inline-flex items-center gap-2 text-sm font-medium transition-colors"
        >
          <svg
            className="h-4 w-4 transition-transform group-hover:-translate-x-0.5"
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
              d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
            />
          </svg>
          <span>Kaikki lounaslistat</span>
        </Link>
      </div>

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
                Unable to load lunch menu
              </h2>
              <p className="text-sm opacity-90">{error}</p>
            </div>
          </div>
        </div>
      ) : restaurant ? (
        <div className="space-y-6">
          <header className="text-left">
            <p className="text-muted-foreground font-bold">{todayStr}</p>
            <div className="mt-1 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
              <h1 className="text-foreground text-3xl font-extrabold tracking-tight sm:text-4xl">
                {restaurant.name}
              </h1>
              {isDev && source && (
                <span className="text-muted-foreground self-start rounded-full border border-dashed px-2.5 py-0.5 text-xs font-medium sm:self-auto">
                  Dev Mode ({source})
                </span>
              )}
            </div>
          </header>

          <div className="border-border bg-card flex flex-col rounded-md border p-6 shadow-sm">
            {hasItems && currentMenu ? (
              <>
                {isOutdated && currentMenu.date && (
                  <div className="mb-4">
                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 py-0.5 pr-2 pl-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                      <svg
                        className="h-3.5 w-3.5 shrink-0"
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
                          d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                        />
                      </svg>
                      <span>
                        Vanha lista ({formatDisplayDate(currentMenu.date)})
                      </span>
                    </span>
                  </div>
                )}
                <ul className="space-y-2">
                  {currentMenu.items.map((item, idx) => (
                    <RestaurantMenuItem
                      key={idx}
                      item={item}
                      disabled={isOutdated}
                    />
                  ))}
                </ul>
                {restaurant.websiteUrl && (
                  <div className="border-border/60 mt-6 border-t pt-4">
                    <a
                      href={restaurant.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                    >
                      <span>Avaa ravintolan kotisivut</span>
                      <svg
                        className="h-3.5 w-3.5 shrink-0"
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
                          d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                        />
                      </svg>
                    </a>
                  </div>
                )}
              </>
            ) : (
              <div className="py-4">
                <p className="text-muted-foreground text-sm">
                  Listaa ei löytynyt tälle päivälle.
                </p>
                {restaurant.websiteUrl && (
                  <a
                    href={restaurant.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                  >
                    <span>Avaa ravintolan kotisivut</span>
                    <svg
                      className="h-3.5 w-3.5 shrink-0"
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
                        d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                      />
                    </svg>
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      ) : null}

      <Footer />
    </main>
  );
}
