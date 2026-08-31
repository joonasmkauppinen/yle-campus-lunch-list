"use client";

import { useEffect, useRef, useState } from "react";

import type { Restaurant } from "@acme/shared-types";

import { RestaurantMenuItem } from "~/components/restaurant-menu-item";
import {
  formatDisplayDate,
  getOpeningHoursForCurrentDay,
  isCurrentDate,
} from "~/lib/dates";
import { cn } from "~/lib/utils";

export interface RadiatorRestaurantCardProps {
  restaurant: Restaurant;
  className?: string;
}

const COLUMN_WIDTH = 320;
const COLUMN_GAP = 24;
const CARD_PADDING = 40; // p-5 (20px each side)
const ITEM_GAP = 8;

export function RadiatorRestaurantCard({
  restaurant,
  className,
}: RadiatorRestaurantCardProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dynamicWidth, setDynamicWidth] = useState<number | undefined>(
    undefined,
  );
  const lastHeightRef = useRef<number>(0);

  const currentMenu = restaurant.menus[0];
  const items = currentMenu?.items ?? [];
  const itemsCount = items.length;
  const hasItems = itemsCount > 0;
  const isOutdated = currentMenu?.date
    ? !isCurrentDate(currentMenu.date)
    : false;

  const openingHours = restaurant.openingHours;
  const todayLunch = openingHours
    ? getOpeningHoursForCurrentDay(openingHours.lunchHours)
    : null;
  const todayOpen = openingHours
    ? getOpeningHoursForCurrentDay(openingHours.openHours)
    : null;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const measure = () => {
      const availableHeight = container.clientHeight;
      if (availableHeight < 50) return;

      if (Math.abs(availableHeight - lastHeightRef.current) < 5) return;
      lastHeightRef.current = availableHeight;

      const itemEls = Array.from(container.querySelectorAll<HTMLElement>("li"));
      if (itemEls.length === 0) {
        setDynamicWidth(undefined);
        return;
      }

      let colH = 0;
      let cols = 1;
      for (const el of itemEls) {
        const itemH = el.offsetHeight || 36;
        if (colH > 0 && colH + itemH > availableHeight) {
          cols += 1;
          colH = itemH + ITEM_GAP;
        } else {
          colH += itemH + ITEM_GAP;
        }
      }

      const requiredWidth =
        cols > 1
          ? cols * COLUMN_WIDTH + (cols - 1) * COLUMN_GAP + CARD_PADDING
          : undefined;

      setDynamicWidth((prev) =>
        prev !== requiredWidth ? requiredWidth : prev,
      );
    };

    measure();

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (Math.abs(entry.contentRect.height - lastHeightRef.current) >= 5) {
          measure();
        }
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [itemsCount]);

  return (
    <article
      className={cn(
        "border-border bg-card text-card-foreground flex h-full shrink-0 flex-col rounded-xl border p-5 shadow-sm",
        className,
      )}
      style={dynamicWidth ? { width: `${dynamicWidth}px` } : undefined}
    >
      {/* Card Header */}
      <header className="border-border shrink-0 border-b pb-3">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
            {restaurant.name}
          </h2>
          {isOutdated && currentMenu?.date && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
              Vanha ({formatDisplayDate(currentMenu.date)})
            </span>
          )}
        </div>

        {restaurant.address && (
          <p className="text-muted-foreground mt-0.5 text-xs">
            {restaurant.address.street}
          </p>
        )}

        {(todayLunch || todayOpen) && (
          <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            {todayLunch && todayLunch !== "Suljettu" && (
              <span>
                <strong className="text-foreground font-semibold">
                  Lounas:
                </strong>{" "}
                {todayLunch}
              </span>
            )}
            {todayOpen &&
              todayOpen !== "Suljettu" &&
              todayOpen !== todayLunch && (
                <span>
                  <strong className="text-foreground font-semibold">
                    Avoinna:
                  </strong>{" "}
                  {todayOpen}
                </span>
              )}
            {((!todayLunch && !todayOpen) ||
              (todayLunch === "Suljettu" && todayOpen === "Suljettu")) && (
              <span className="text-muted-foreground/80">Suljettu tänään</span>
            )}
          </div>
        )}
      </header>

      {/* Menu items content: wraps onto multiple columns on the right if taller than vertical space */}
      <div ref={containerRef} className="mt-3.5 min-h-0 flex-1">
        {hasItems ? (
          <ul className="flex h-full max-h-full flex-col flex-wrap content-start gap-x-6 gap-y-2">
            {items.map((item, idx) => (
              <RestaurantMenuItem
                key={idx}
                item={item}
                disabled={isOutdated}
                className="w-80 max-w-sm shrink-0"
              />
            ))}
          </ul>
        ) : (
          <div className="flex h-full items-center justify-center p-4 text-center">
            <p className="text-muted-foreground text-sm">
              Listaa ei löytynyt tälle päivälle.
            </p>
          </div>
        )}
      </div>
    </article>
  );
}
