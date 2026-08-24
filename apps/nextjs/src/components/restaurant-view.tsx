"use client";

import { useState, useSyncExternalStore } from "react";

import type { Restaurant } from "@acme/shared-types";

import type { RestaurantPreferences } from "~/lib/preferences";
import { EditRestaurantsModal } from "~/components/edit-restaurants-modal";
import { RestaurantListItem } from "~/components/restaurant-list-item";
import { Button } from "~/components/ui/button";
import {
  applyPreferencesToRestaurants,
  getStoredPreferences,
  subscribeToPreferences,
} from "~/lib/preferences";

export interface RestaurantViewProps {
  restaurants: Restaurant[];
  todayStr: string;
  isDev?: boolean;
  source?: string | null;
}

export function RestaurantView({
  restaurants,
  todayStr,
  isDev,
  source,
}: RestaurantViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Read stored preferences with useSyncExternalStore for safe SSR / client hydration
  const preferencesString = useSyncExternalStore<string | null>(
    subscribeToPreferences,
    () => {
      const prefs = getStoredPreferences();
      return prefs ? JSON.stringify(prefs) : null;
    },
    () => null,
  );

  const parsedPreferences: RestaurantPreferences | null = preferencesString
    ? (JSON.parse(preferencesString) as RestaurantPreferences)
    : null;

  const { visible: visibleRestaurants, hidden: hiddenRestaurants } =
    applyPreferencesToRestaurants(restaurants, parsedPreferences);

  return (
    <>
      <header className="mb-8 text-left">
        <div className="flex items-center justify-between gap-4">
          <p className="text-muted-foreground mt-2 font-bold">{todayStr}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="shrink-0 gap-1.5"
            aria-label="Muokkaa ravintoloiden järjestystä ja näkyvyyttä"
          >
            <svg
              className="h-4 w-4"
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
                d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
              />
            </svg>
            <span>Muokkaa</span>
          </Button>
        </div>

        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
          <h1 className="text-foreground text-3xl font-extrabold tracking-tight sm:text-4xl">
            Lounaslistat
          </h1>
          {isDev && source && (
            <span className="text-muted-foreground self-start rounded-full border border-dashed px-2.5 py-0.5 text-xs font-medium sm:self-auto">
              Dev Mode ({source})
            </span>
          )}
        </div>
      </header>

      {/* Visible restaurants */}
      {visibleRestaurants.length === 0 && hiddenRestaurants.length > 0 ? (
        <div className="border-border bg-card text-muted-foreground rounded-xl border p-8 text-center shadow-sm">
          <p className="text-base font-medium">
            Kaikki ravintolat on piilotettu
          </p>
          <p className="mt-1 text-sm">
            Voit ottaa ravintoloita takaisin käyttöön päänäkymään yläkulman
            Muokkaa-painikkeesta.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="mt-4"
          >
            Avaa muokkausvalikko
          </Button>
        </div>
      ) : (
        <RestaurantListMasonry restaurants={visibleRestaurants} />
      )}

      {/* Hidden restaurants section */}
      {hiddenRestaurants.length > 0 && (
        <section className="mt-12 border-t pt-8">
          <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
            <div>
              <h2 className="text-foreground text-xl font-bold tracking-tight sm:text-2xl">
                Piilotetut ravintolat
              </h2>
              <p className="text-muted-foreground mt-0.5 text-sm">
                Nämä ravintolat on piilotettu päänäkymästä. Voit palauttaa ne
                näkyviin Muokkaa-valikosta.
              </p>
            </div>
            <span className="text-muted-foreground self-start rounded-full border px-2.5 py-0.5 text-xs font-medium sm:self-auto">
              {hiddenRestaurants.length}{" "}
              {hiddenRestaurants.length === 1 ? "ravintola" : "ravintolaa"}
            </span>
          </div>

          <RestaurantListMasonry restaurants={hiddenRestaurants} />
        </section>
      )}

      {isModalOpen && (
        <EditRestaurantsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          restaurants={restaurants}
        />
      )}
    </>
  );
}

interface RestaurantListMasonryProps {
  restaurants: Restaurant[];
}

function RestaurantListMasonry({ restaurants }: RestaurantListMasonryProps) {
  return (
    <>
      {/* Mobile view: single column */}
      <div className="flex flex-col gap-6 md:hidden">
        {restaurants.map((restaurant) => (
          <RestaurantListItem key={restaurant.id} restaurant={restaurant} />
        ))}
      </div>

      {/* Tablet / Medium view: two-column masonry with alternating items */}
      <div className="hidden gap-6 md:flex md:flex-row md:items-start lg:hidden">
        <div className="flex flex-1 flex-col gap-6">
          {restaurants
            .filter((_, idx) => idx % 2 === 0)
            .map((restaurant) => (
              <RestaurantListItem key={restaurant.id} restaurant={restaurant} />
            ))}
        </div>
        <div className="flex flex-1 flex-col gap-6">
          {restaurants
            .filter((_, idx) => idx % 2 === 1)
            .map((restaurant) => (
              <RestaurantListItem key={restaurant.id} restaurant={restaurant} />
            ))}
        </div>
      </div>

      {/* Large desktop view: three-column masonry with alternating items */}
      <div className="hidden gap-6 lg:flex lg:flex-row lg:items-start">
        <div className="flex flex-1 flex-col gap-6">
          {restaurants
            .filter((_, idx) => idx % 3 === 0)
            .map((restaurant) => (
              <RestaurantListItem key={restaurant.id} restaurant={restaurant} />
            ))}
        </div>
        <div className="flex flex-1 flex-col gap-6">
          {restaurants
            .filter((_, idx) => idx % 3 === 1)
            .map((restaurant) => (
              <RestaurantListItem key={restaurant.id} restaurant={restaurant} />
            ))}
        </div>
        <div className="flex flex-1 flex-col gap-6">
          {restaurants
            .filter((_, idx) => idx % 3 === 2)
            .map((restaurant) => (
              <RestaurantListItem key={restaurant.id} restaurant={restaurant} />
            ))}
        </div>
      </div>
    </>
  );
}
