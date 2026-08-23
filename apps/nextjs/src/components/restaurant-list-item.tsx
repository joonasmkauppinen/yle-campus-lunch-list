"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";

import type { Restaurant } from "@acme/shared-types";

import { RestaurantMenuItem } from "~/components/restaurant-menu-item";
import {
  formatDisplayDate,
  getOpeningHoursForCurrentDay,
  isCurrentDate,
} from "~/lib/dates";
import { cn } from "~/lib/utils";

export interface RestaurantListItemProps {
  restaurant: Restaurant;
  className?: string;
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("accordion-toggle", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("accordion-toggle", callback);
  };
}

function getStoredAccordionState(restaurantId: string): boolean {
  if (typeof window === "undefined") return true;
  try {
    const stored = localStorage.getItem(`restaurant-accordion-${restaurantId}`);
    return stored !== null ? stored === "true" : true;
  } catch {
    return true;
  }
}

export function setStoredAccordionState(restaurantId: string, value: boolean) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`restaurant-accordion-${restaurantId}`, String(value));
    window.dispatchEvent(new Event("accordion-toggle"));
  } catch {
    // Silently fail if localStorage is unavailable
  }
}

export function RestaurantListItem({
  restaurant,
  className,
}: RestaurantListItemProps) {
  const isOpen = useSyncExternalStore(
    subscribe,
    () => getStoredAccordionState(restaurant.id),
    () => true,
  );

  const toggleOpen = () => {
    setStoredAccordionState(restaurant.id, !isOpen);
  };

  const currentMenu = restaurant.menus[0];
  const hasItems = (currentMenu?.items.length ?? 0) > 0;
  const isOutdated = currentMenu?.date
    ? !isCurrentDate(currentMenu.date)
    : false;

  return (
    <div
      id={`restaurant-${restaurant.id}`}
      className={cn(
        "border-border bg-card animate-fade-in flex scroll-mt-6 flex-col rounded-md border p-6 shadow-sm transition-shadow hover:shadow-md",
        className,
      )}
    >
      <div>
        <div
          className={cn(
            "border-border flex items-start justify-between gap-3",
            isOpen && "border-b pb-4",
          )}
        >
          <div className="flex flex-col gap-1.5">
            <h2 className="text-card-foreground text-xl font-bold">
              <Link
                href={`/restaurant/${restaurant.id}`}
                className="focus-visible:ring-ring rounded-sm transition-colors hover:underline focus-visible:ring-2 focus-visible:outline-none"
              >
                {restaurant.name}
              </Link>
            </h2>
            {(() => {
              if (!restaurant.openingHours) return null;

              const todayLunch = getOpeningHoursForCurrentDay(
                restaurant.openingHours.lunchHours,
              );
              const todayOpen = getOpeningHoursForCurrentDay(
                restaurant.openingHours.openHours,
              );

              if (!todayLunch && !todayOpen) return null;

              let line1: { label?: string; value: string } | null = null;
              let line2: { label?: string; value: string } | null = null;

              if (todayLunch && todayLunch !== "Suljettu") {
                line1 = { label: "Lounas", value: todayLunch };
                if (
                  todayOpen &&
                  todayOpen !== "Suljettu" &&
                  todayOpen !== todayLunch
                ) {
                  line2 = { label: "Avoinna", value: todayOpen };
                }
              } else if (todayOpen && todayOpen !== "Suljettu") {
                line1 = { label: "Avoinna", value: todayOpen };
                if (todayLunch === "Suljettu") {
                  line2 = { label: "Lounas", value: "Suljettu" };
                }
              } else {
                return (
                  <div className="text-muted-foreground/80 text-xs sm:text-sm">
                    <span>Suljettu tänään</span>
                  </div>
                );
              }

              return (
                <div className="text-muted-foreground flex flex-col gap-1 text-xs sm:text-sm">
                  <div className="font-medium">
                    <span>
                      {line1.label && (
                        <span className="text-foreground font-medium">
                          {line1.label}:{" "}
                        </span>
                      )}
                      {line1.value}
                    </span>
                  </div>
                  {line2 && (
                    <div className="opacity-90">
                      <span>
                        {line2.label && (
                          <span className="text-foreground font-medium">
                            {line2.label}:{" "}
                          </span>
                        )}
                        {line2.value}
                      </span>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
          <button
            type="button"
            onClick={toggleOpen}
            className="text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:ring-ring inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md p-1.5 transition-colors focus-visible:ring-2 focus-visible:outline-none"
            aria-expanded={isOpen}
            aria-label={
              isOpen
                ? `Piilota ${restaurant.name} menu`
                : `Näytä ${restaurant.name} menu`
            }
            title={isOpen ? "Piilota menu" : "Näytä menu"}
          >
            <svg
              className={cn(
                "h-5 w-5 shrink-0 transition-transform duration-200",
                isOpen && "rotate-180",
              )}
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
                d="m19.5 8.25-7.5 7.5-7.5-7.5"
              />
            </svg>
          </button>
        </div>

        {isOpen &&
          (hasItems && currentMenu ? (
            <>
              {isOutdated && currentMenu.date && (
                <div className="mt-4">
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
              <ul
                className={cn(
                  "space-y-2",
                  isOutdated && currentMenu.date ? "mt-3" : "mt-4",
                )}
              >
                {currentMenu.items.map((item, idx) => (
                  <RestaurantMenuItem
                    key={idx}
                    item={item}
                    disabled={isOutdated}
                  />
                ))}
              </ul>
              {restaurant.websiteUrl && (
                <div className="border-border/60 mt-4 border-t pt-3">
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
                  className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
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
          ))}
      </div>
    </div>
  );
}
