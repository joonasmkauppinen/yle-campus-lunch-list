"use client";

import { useState } from "react";

import type { DailyCategories, LunchCategory } from "@acme/shared-types";

import { CategoryIcon } from "~/components/category-icons";
import { setStoredAccordionState } from "~/components/restaurant-list-item";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

export interface CategorySuggestionsProps {
  dailyCategories: DailyCategories;
  className?: string;
}

export function CategorySuggestions({
  dailyCategories,
  className,
}: CategorySuggestionsProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );

  const categories = dailyCategories.categories;
  if (categories.length === 0) {
    return null;
  }

  const selectedCategory: LunchCategory | undefined = selectedCategoryId
    ? categories.find((c) => c.id === selectedCategoryId)
    : undefined;

  const handleRestaurantClick = (restaurantId: string) => {
    // 1. Expand accordion if collapsed
    setStoredAccordionState(restaurantId, true);

    // 2. Scroll to the restaurant item card
    const targetElement = document.getElementById(`restaurant-${restaurantId}`);
    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      // Brief visual focus ring effect
      targetElement.classList.add("ring-2", "ring-primary", "ring-offset-2");
      setTimeout(() => {
        targetElement.classList.remove(
          "ring-2",
          "ring-primary",
          "ring-offset-2",
        );
      }, 2000);
    }
  };

  return (
    <section
      aria-label="Lounaskategoriat"
      className={cn(
        "bg-card/60 border-border/80 relative mb-8 rounded-xl border p-4 shadow-sm backdrop-blur-xs transition-all sm:p-5",
        className,
      )}
    >
      {selectedCategory ? (
        /* Selected Category Info View (Rendered in place of the grid) */
        <div className="animate-fade-in space-y-4">
          <div className="flex items-center justify-between gap-3 border-b pb-3.5">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                <CategoryIcon
                  icon={selectedCategory.icon}
                  className="h-5 w-5"
                />
              </div>
              <div>
                <h2 className="text-foreground text-lg font-bold tracking-tight sm:text-xl">
                  {selectedCategory.label}
                </h2>
                <p className="text-muted-foreground text-xs">
                  {selectedCategory.items.length}{" "}
                  {selectedCategory.items.length === 1
                    ? "lounasvaihtoehto saatavilla"
                    : "lounasvaihtoehtoa saatavilla"}
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSelectedCategoryId(null)}
              className="hover:bg-muted shrink-0 gap-1.5 text-xs font-medium"
              aria-label={`Sulje ${selectedCategory.label}-kategoria`}
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
              <span>Kaikki kategoriat</span>
            </Button>
          </div>

          {/* Grouped by restaurant */}
          <div className="grid gap-3 sm:grid-cols-2">
            {/* Group matching items by restaurant */}
            {Array.from(
              selectedCategory.items
                .reduce((acc, item) => {
                  const list = acc.get(item.restaurantId) ?? {
                    restaurantId: item.restaurantId,
                    restaurantName: item.restaurantName,
                    dishes: [],
                  };
                  list.dishes.push(item);
                  acc.set(item.restaurantId, list);
                  return acc;
                }, new Map<string, { restaurantId: string; restaurantName: string; dishes: typeof selectedCategory.items }>())
                .values(),
            ).map((group) => (
              <div
                key={group.restaurantId}
                className="bg-card border-border hover:border-primary/40 flex flex-col justify-between rounded-lg border p-3.5 shadow-xs transition-colors"
              >
                <div>
                  <button
                    type="button"
                    onClick={() => handleRestaurantClick(group.restaurantId)}
                    className="text-primary group inline-flex items-center gap-1.5 text-left text-sm font-semibold hover:underline focus-visible:outline-none"
                    title={`Siirry ravintolaan ${group.restaurantName}`}
                  >
                    <span>{group.restaurantName}</span>
                    <svg
                      className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
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
                        d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                      />
                    </svg>
                  </button>

                  <ul className="mt-2 space-y-1.5">
                    {group.dishes.map((dish, idx) => (
                      <li
                        key={idx}
                        className="text-muted-foreground flex items-baseline justify-between gap-2 text-xs leading-relaxed"
                      >
                        <span className="text-foreground/90 font-medium">
                          {dish.item}
                        </span>
                        {dish.dietaryFlags && dish.dietaryFlags.length > 0 && (
                          <span className="bg-muted text-muted-foreground shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold">
                            {dish.dietaryFlags.join(", ")}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Categories Grid View */
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-foreground/90 text-sm font-semibold tracking-wide uppercase">
              Mitä tänään lounaaksi?
            </h2>
            <span className="text-muted-foreground text-xs">
              {categories.length}{" "}
              {categories.length === 1 ? "kategoria" : "kategoriaa"}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-9">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategoryId(cat.id)}
                className="group border-border bg-card/90 hover:border-primary hover:bg-card focus-visible:ring-ring flex flex-col items-center justify-center gap-1.5 rounded-lg border p-2.5 text-center shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-sm focus-visible:ring-2 focus-visible:outline-none active:translate-y-0"
                aria-label={`Näytä ${cat.label} (${cat.items.length} vaihtoehtoa)`}
              >
                <div className="bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary flex h-9 w-9 items-center justify-center rounded-md transition-colors">
                  <CategoryIcon icon={cat.icon} className="h-5 w-5" />
                </div>
                <span className="text-foreground line-clamp-1 text-xs font-medium">
                  {cat.label}
                </span>
                <span className="text-muted-foreground font-mono text-[10px]">
                  {cat.items.length}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
