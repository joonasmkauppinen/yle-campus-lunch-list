"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";

import type { DishTagId, Restaurant } from "@acme/shared-types";

import type { DishTagsVisibility } from "~/lib/preferences";
import { RestaurantMenuItem } from "~/components/restaurant-menu-item";
import { Button } from "~/components/ui/button";
import { getAvailableDishTags, getDishesForTag } from "~/lib/dish-tags";
import {
  getStoredDishTagsVisibility,
  setStoredDishTagsVisibility,
  subscribeToPreferences,
} from "~/lib/preferences";
import { cn } from "~/lib/utils";

export interface DishTagSectionProps {
  /** Every restaurant, in main-list order. Hidden-restaurant preferences are
   * deliberately ignored so the shortcut can still surface something the user
   * would otherwise have missed. */
  restaurants: Restaurant[];
}

export function DishTagSection({ restaurants }: DishTagSectionProps) {
  const [activeTag, setActiveTag] = useState<DishTagId | null>(null);
  const visibility = useSyncExternalStore<DishTagsVisibility>(
    subscribeToPreferences,
    getStoredDishTagsVisibility,
    () => "visible",
  );

  const availableTags = getAvailableDishTags(restaurants);

  // No tags today (an older sheet, or a tagging outage) means no section at
  // all, and the page looks exactly as it did before the feature existed.
  if (availableTags.length === 0 || visibility === "dismissed") {
    return null;
  }

  if (visibility === "hidden") {
    return <DishTagsHiddenNotice />;
  }

  const groups = activeTag ? getDishesForTag(restaurants, activeTag) : [];

  return (
    <section
      aria-labelledby="dish-tags-heading"
      className="border-border animate-fade-in mb-8 border-b pb-8"
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2
            id="dish-tags-heading"
            className="text-foreground text-xl font-bold tracking-tight sm:text-2xl"
          >
            Valitse ruokalajin mukaan
          </h2>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Luokitukset on tehty tekoälyn avulla, joten niissä voi olla
            virheitä.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setStoredDishTagsVisibility("hidden")}
          className="text-muted-foreground hover:text-foreground shrink-0 gap-1.5"
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
              d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
            />
          </svg>
          <span>Piilota osio</span>
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7">
        {availableTags.map(({ config, count }) => {
          const isActive = config.id === activeTag;
          return (
            <button
              key={config.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => setActiveTag(isActive ? null : config.id)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-xl border px-2 py-3 transition-colors",
                "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                isActive
                  ? "border-foreground/20 bg-foreground/10 text-foreground dark:bg-foreground/15"
                  : "border-border bg-card text-foreground",
              )}
            >
              <span aria-hidden="true" className="text-xl leading-none">
                {config.emoji}
              </span>
              <span className="text-xs leading-tight font-medium">
                {config.label}
              </span>
              <span className="text-muted-foreground text-[10px] leading-none font-semibold">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {activeTag && (
        <div className="border-border bg-card divide-border mt-4 divide-y rounded-xl border p-4 shadow-sm sm:p-6">
          {groups.map((group) => (
            <div key={group.restaurantId} className="py-3 first:pt-0 last:pb-0">
              <h3 className="text-foreground mb-1 text-sm font-bold tracking-tight">
                <Link
                  href={`/restaurant/${group.restaurantId}`}
                  className="focus-visible:ring-ring rounded-sm transition-colors hover:underline focus-visible:ring-2 focus-visible:outline-none"
                >
                  {group.restaurantName}
                </Link>
              </h3>
              <ul>
                {group.items.map((item, index) => (
                  <RestaurantMenuItem
                    key={`${group.restaurantId}-${index}`}
                    item={item}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/** Shown in place of the section after the user hides it, pointing them to
 * where it can be switched back on. */
function DishTagsHiddenNotice() {
  return (
    <div
      role="status"
      className="border-border bg-card text-muted-foreground animate-fade-in mb-8 flex items-start gap-3 rounded-xl border p-4 shadow-sm"
    >
      <svg
        className="mt-0.5 h-5 w-5 shrink-0"
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
          d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
        />
      </svg>
      <div className="min-w-0 flex-1 text-sm">
        <p className="text-foreground font-medium">
          Ruokalajiosio on piilotettu
        </p>
        <p className="mt-0.5">
          Voit ottaa sen takaisin käyttöön sivun asetuksista yläkulman
          Asetukset-painikkeesta.
        </p>
      </div>
      <button
        type="button"
        onClick={() => setStoredDishTagsVisibility("dismissed")}
        className="text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:ring-ring -m-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none"
        aria-label="Sulje ilmoitus"
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
            d="M6 18 18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}
