"use client";

import type { ReactNode } from "react";
import { useState, useSyncExternalStore } from "react";

import type { Restaurant } from "@acme/shared-types";

import type { RestaurantPreferences } from "~/lib/preferences";
import { RestaurantListItem } from "~/components/restaurant-list-item";
import { SettingsModal } from "~/components/settings-modal";
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
  /** Rendered between the heading and the restaurant lists. Passed in rather
   * than composed here so it stays outside this component's preference state. */
  dishTagSection?: ReactNode;
}

export function RestaurantView({
  restaurants,
  todayStr,
  isDev,
  source,
  dishTagSection,
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
            aria-label="Avaa sivun asetukset"
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
                d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
              />
            </svg>
            <span>Asetukset</span>
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

      {dishTagSection}

      {/* Visible restaurants */}
      {visibleRestaurants.length === 0 && hiddenRestaurants.length > 0 ? (
        <div className="border-border bg-card text-muted-foreground rounded-xl border p-8 text-center shadow-sm">
          <p className="text-base font-medium">
            Kaikki ravintolat on piilotettu
          </p>
          <p className="mt-1 text-sm">
            Voit ottaa ravintoloita takaisin käyttöön päänäkymään yläkulman
            Asetukset-painikkeesta.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="mt-4"
          >
            Avaa asetukset
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
                näkyviin asetuksista.
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
        <SettingsModal
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
