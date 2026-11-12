"use client";
import { MenuFreshness, MenuUnavailable } from "~/components/menu-availability";
import Link from "next/link";
import type { Restaurant } from "@acme/shared-types";
import { Footer } from "~/components/footer";
import { RestaurantMenuItem } from "~/components/restaurant-menu-item";
import { DateTabs, MenuDayPanel, useMenuDate } from "~/components/menu-date";
import {
  getOpeningHoursForCurrentDay,
  getTodayFormattedString,
} from "~/lib/dates";

export function RestaurantDetail({
  restaurant,
  error,
  isDev,
  source,
}: {
  restaurant?: Restaurant;
  error?: string;
  isDev: boolean;
  source?: string;
}) {
  const date = useMenuDate();
  const todayStr = getTodayFormattedString(new Date(`${date}T12:00:00Z`));
  const currentMenu = restaurant?.menus.find((menu) => menu.date === date);
  const hasItems = (currentMenu?.items.length ?? 0) > 0;
  return (
    <>
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back button */}
        <div className="mb-6">
          <Link
            href={`/?date=${date}`}
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
                  Lounaslistan lataaminen epäonnistui
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
              {restaurant.address && (
                <div className="text-muted-foreground mt-1.5 flex items-center gap-1.5 text-sm">
                  <svg
                    className="text-muted-foreground/80 h-4 w-4 shrink-0"
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
                      d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
                    />
                  </svg>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${restaurant.name}, ${restaurant.address.street}, ${restaurant.address.postalCode} ${restaurant.address.city}`,
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground focus-visible:ring-ring rounded-sm transition-colors hover:underline focus-visible:ring-2 focus-visible:outline-none"
                    title="Avaa osoite Google Mapsissa"
                  >
                    {restaurant.address.street}, {restaurant.address.postalCode}{" "}
                    {restaurant.address.city}
                  </a>
                </div>
              )}
              {(() => {
                if (!restaurant.openingHours) return null;

                const todayLunch = getOpeningHoursForCurrentDay(
                  restaurant.openingHours.lunchHours,
                  new Date(`${date}T12:00:00Z`),
                );
                const todayOpen = getOpeningHoursForCurrentDay(
                  restaurant.openingHours.openHours,
                  new Date(`${date}T12:00:00Z`),
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
                    <div className="text-muted-foreground/80 mt-2.5 text-sm">
                      <span>Suljettu valittuna päivänä</span>
                    </div>
                  );
                }

                return (
                  <div className="text-muted-foreground mt-2.5 flex flex-col gap-1.5 text-sm">
                    <div className="font-medium">
                      <span>
                        {line1.label && (
                          <span className="text-foreground font-semibold">
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
                            <span className="text-foreground font-semibold">
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
              <DateTabs />
            </header>
            <MenuDayPanel>
              <div className="border-border bg-card flex flex-col rounded-md border p-6 shadow-sm">
                {hasItems && currentMenu ? (
                  <>
                    <MenuFreshness menu={currentMenu} />
                    <ul className="space-y-2">
                      {currentMenu.items.map((item, idx) => (
                        <RestaurantMenuItem key={idx} item={item} />
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
                    <MenuUnavailable menu={currentMenu} />
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
            </MenuDayPanel>
          </div>
        ) : null}

        <Footer />
      </main>
    </>
  );
}
