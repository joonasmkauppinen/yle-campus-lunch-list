"use client";

import { useState } from "react";

import type { DishTagId, Restaurant } from "@acme/shared-types";

import { RestaurantMenuItem } from "~/components/restaurant-menu-item";
import { getAvailableDishTags, getDishesForTag } from "~/lib/dish-tags";
import { cn } from "~/lib/utils";

export interface DishTagSectionProps {
  /** Every restaurant, in main-list order. Hidden-restaurant preferences are
   * deliberately ignored so the shortcut can still surface something the user
   * would otherwise have missed. */
  restaurants: Restaurant[];
}

export function DishTagSection({ restaurants }: DishTagSectionProps) {
  const [activeTag, setActiveTag] = useState<DishTagId | null>(null);

  const availableTags = getAvailableDishTags(restaurants);

  // No tags today (an older sheet, or a tagging outage) means no section at
  // all, and the page looks exactly as it did before the feature existed.
  if (availableTags.length === 0) {
    return null;
  }

  const groups = activeTag ? getDishesForTag(restaurants, activeTag) : [];

  return (
    <section aria-labelledby="dish-tags-heading" className="mb-8">
      <h2
        id="dish-tags-heading"
        className="text-foreground mb-3 text-sm font-semibold tracking-tight"
      >
        Mitä tekisi mieli?
      </h2>

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
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:bg-accent text-foreground",
              )}
            >
              <span aria-hidden="true" className="text-xl leading-none">
                {config.emoji}
              </span>
              <span className="text-xs leading-tight font-medium">
                {config.label}
              </span>
              <span
                className={cn(
                  "text-[10px] leading-none font-semibold",
                  isActive ? "opacity-80" : "text-muted-foreground",
                )}
              >
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
                {group.restaurantName}
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
