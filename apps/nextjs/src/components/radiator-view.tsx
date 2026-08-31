"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Link from "next/link";

import type { Restaurant } from "@acme/shared-types";

import type { RestaurantPreferences } from "~/lib/preferences";
import { RadiatorRestaurantCard } from "~/components/radiator-restaurant-card";
import { RadiatorSpeedControl } from "~/components/radiator-speed-control";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  applyPreferencesToRestaurants,
  getStoredPreferences,
  subscribeToPreferences,
} from "~/lib/preferences";

export interface RadiatorViewProps {
  restaurants: Restaurant[];
  todayStr: string;
  isDev?: boolean;
  source?: string | null;
  error?: string | null;
}

const STORAGE_SPEED_KEY = "restaurant-radiator-speed";
const SPEED_CHANGE_EVENT = "restaurant-radiator-speed-changed";
const BASE_SPEED_PX_PER_SEC = 50;
const TRACK_GAP_PX = 24; // gap-6 is 24px
const ARROW_BOOST_MULTIPLIER = 30;

function subscribeToSpeed(callback: () => void): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }
  window.addEventListener("storage", callback);
  window.addEventListener(SPEED_CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(SPEED_CHANGE_EVENT, callback);
  };
}

function getStoredSpeed(): number {
  if (typeof window === "undefined") return 1.0;
  try {
    const saved = localStorage.getItem(STORAGE_SPEED_KEY);
    const parsed = saved ? parseFloat(saved) : 1.0;
    return isNaN(parsed) || parsed <= 0 ? 1.0 : parsed;
  } catch {
    return 1.0;
  }
}

function setStoredSpeed(speed: number): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_SPEED_KEY, String(speed));
    window.dispatchEvent(new Event(SPEED_CHANGE_EVENT));
  } catch {
    // Ignore storage errors
  }
}

export function RadiatorView({
  restaurants,
  todayStr,
  isDev,
  source,
  error,
}: RadiatorViewProps) {
  const speed = useSyncExternalStore(
    subscribeToSpeed,
    getStoredSpeed,
    () => 1.0,
  );
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [contentWidth, setContentWidth] = useState<number>(0);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const singleTrackRef = useRef<HTMLDivElement | null>(null);
  const marqueeTrackRef = useRef<HTMLDivElement | null>(null);

  const offsetRef = useRef<number>(0);
  const lastTimeRef = useRef<number | null>(null);
  const isHoveredRef = useRef<boolean>(false);
  const speedRef = useRef<number>(speed);
  const isPausedRef = useRef<boolean>(isPaused);
  const arrowDirectionRef = useRef<number>(0); // -1 = backward, 1 = forward, 0 = none

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  const handleSpeedChange = useCallback((newSpeed: number) => {
    setStoredSpeed(newSpeed);
  }, []);

  const handleTogglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  // Read stored preferences with useSyncExternalStore
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

  // Filter visible restaurants; hidden restaurants are not displayed anywhere in radiator mode
  const { visible: visibleRestaurants } = applyPreferencesToRestaurants(
    restaurants,
    parsedPreferences,
  );

  // Measure container and content widths to determine if marquee is needed
  useEffect(() => {
    const container = containerRef.current;
    const singleTrack = singleTrackRef.current;
    if (!container || !singleTrack) return;

    const measure = () => {
      setContainerWidth(container.clientWidth);
      setContentWidth(singleTrack.scrollWidth);
    };

    measure();

    const resizeObserver = new ResizeObserver(() => {
      measure();
    });

    resizeObserver.observe(container);
    resizeObserver.observe(singleTrack);
    Array.from(singleTrack.children).forEach((child) => {
      resizeObserver.observe(child);
    });

    return () => {
      resizeObserver.disconnect();
    };
  }, [visibleRestaurants]);

  // Scrolling is enabled only when content exceeds container width
  const isScrollable = contentWidth > 0 && contentWidth > containerWidth;

  // Keyboard navigation: hold ArrowRight / ArrowLeft for 8x speed browsing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === "ArrowRight") {
        e.preventDefault();
        arrowDirectionRef.current = 1;
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        arrowDirectionRef.current = -1;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" && arrowDirectionRef.current === 1) {
        arrowDirectionRef.current = 0;
      } else if (e.key === "ArrowLeft" && arrowDirectionRef.current === -1) {
        arrowDirectionRef.current = 0;
      }
    };

    const handleBlur = () => {
      arrowDirectionRef.current = 0;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);

  // Mouse wheel / trackpad horizontal scrolling while hovering
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isScrollable || contentWidth <= 0) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const loopLength = contentWidth + TRACK_GAP_PX;
      const delta =
        Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;

      let nextOffset = (offsetRef.current + delta) % loopLength;
      if (nextOffset < 0) {
        nextOffset += loopLength;
      }
      offsetRef.current = nextOffset;

      if (marqueeTrackRef.current) {
        marqueeTrackRef.current.style.transform = `translate3d(-${nextOffset}px, 0, 0)`;
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, [isScrollable, contentWidth]);

  // Continuous animation frame loop to advance scroll without position jumping on speed change
  useEffect(() => {
    if (!isScrollable || contentWidth <= 0) {
      if (marqueeTrackRef.current) {
        marqueeTrackRef.current.style.transform = "";
      }
      return;
    }

    let animationFrameId: number;

    const animate = (time: number) => {
      if (lastTimeRef.current !== null) {
        const deltaSec = (time - lastTimeRef.current) / 1000;
        const loopLength = contentWidth + TRACK_GAP_PX;

        // If arrow keys are held, browse at a constant 30x speed in that direction (independent of manual speed setting)
        if (arrowDirectionRef.current !== 0) {
          let nextOffset =
            (offsetRef.current +
              arrowDirectionRef.current *
                BASE_SPEED_PX_PER_SEC *
                ARROW_BOOST_MULTIPLIER *
                deltaSec) %
            loopLength;

          if (nextOffset < 0) {
            nextOffset += loopLength;
          }
          offsetRef.current = nextOffset;

          if (marqueeTrackRef.current) {
            marqueeTrackRef.current.style.transform = `translate3d(-${offsetRef.current}px, 0, 0)`;
          }
        } else if (
          !isPausedRef.current &&
          !isHoveredRef.current &&
          speedRef.current > 0
        ) {
          let nextOffset =
            (offsetRef.current +
              BASE_SPEED_PX_PER_SEC * speedRef.current * deltaSec) %
            loopLength;

          if (nextOffset < 0) {
            nextOffset += loopLength;
          }
          offsetRef.current = nextOffset;

          if (marqueeTrackRef.current) {
            marqueeTrackRef.current.style.transform = `translate3d(-${offsetRef.current}px, 0, 0)`;
          }
        }
      }
      lastTimeRef.current = time;
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
      lastTimeRef.current = null;
    };
  }, [isScrollable, contentWidth]);

  return (
    <div className="bg-background text-foreground flex h-screen w-screen flex-col overflow-hidden">
      {/* Radiator Header */}
      <header className="border-border bg-card/60 shrink-0 border-b px-4 py-3 backdrop-blur-xs sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-xs font-medium transition-colors"
              title="Palaa päänäkymään"
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
                  d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
                />
              </svg>
              <span className="hidden sm:inline">Päänäkymä</span>
            </Link>

            <div className="bg-border hidden h-4 w-px sm:block" />

            <div>
              <div className="flex items-baseline gap-2">
                <h1 className="text-foreground text-lg font-extrabold tracking-tight sm:text-xl">
                  Lounaslistat
                </h1>
                {isDev && source && (
                  <span className="text-muted-foreground py-0.2 hidden rounded-full border border-dashed px-2 text-[10px] font-medium md:inline">
                    Dev ({source})
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <span className="text-muted-foreground hidden text-xs font-semibold sm:inline">
              {todayStr}
            </span>

            {isScrollable && (
              <div className="flex items-center gap-2">
                {/* Scrolling Shortcuts Instructions Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-foreground h-8 gap-1 px-2 text-xs font-medium"
                      title="Selausohjeet ja pikanäppäimet"
                      aria-label="Selausohjeet ja pikanäppäimet"
                    >
                      <svg
                        className="h-3.5 w-3.5"
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
                          d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z"
                        />
                      </svg>
                      <span className="hidden sm:inline">Ohjeet</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-80 space-y-2.5 p-3 text-xs"
                  >
                    <DropdownMenuLabel className="text-foreground px-0 pt-0 pb-1 font-bold">
                      Selausohjeet ja pikanäppäimet
                    </DropdownMenuLabel>
                    <div className="text-muted-foreground space-y-2.5">
                      <div className="flex items-start gap-2.5">
                        <div className="bg-muted text-foreground mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded">
                          <svg
                            className="h-3.5 w-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                            />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-foreground font-semibold">
                            Hiiri & kosketuslevy
                          </p>
                          <p className="text-[11px] leading-tight">
                            Vie osoitin karusellin päälle ja selaa hiiren
                            rullalla tai kosketuslevyllä.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <div className="bg-muted text-foreground mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded">
                          <svg
                            className="h-4 w-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <rect
                              x="3"
                              y="3"
                              width="18"
                              height="18"
                              rx="3.5"
                              ry="3.5"
                              strokeWidth="1.75"
                            />
                            <path d="M10 8.5l3.5 3.5-3.5 3.5" strokeWidth="2" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-foreground font-semibold">
                            Nuolinäppäimet
                          </p>
                          <p className="text-[11px] leading-tight">
                            Pidä vasenta tai oikeaa nuolinäppäintä pohjassa
                            selataksesi 30x-pikanopeudella.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <div className="bg-muted text-foreground mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded">
                          <svg
                            className="h-3.5 w-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-foreground font-semibold">
                            Pysäytys & nopeus
                          </p>
                          <p className="text-[11px] leading-tight">
                            Pysäytä vieritys tai säädä perusnopeutta 0.1x
                            -askelin yläpalkin säätimistä.
                          </p>
                        </div>
                      </div>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>

                <RadiatorSpeedControl
                  speed={speed}
                  isPaused={isPaused}
                  onSpeedChange={handleSpeedChange}
                  onTogglePause={handleTogglePause}
                />
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main
        ref={containerRef}
        className="relative min-h-0 flex-1 overflow-hidden py-4 sm:py-6"
      >
        {error ? (
          <div className="flex h-full items-center justify-center">
            <div
              role="alert"
              className="border-destructive/50 bg-destructive/10 text-destructive max-w-md rounded-xl border p-6 shadow-sm"
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
                    Lounaslistojen lataus epäonnistui
                  </h2>
                  <p className="text-sm opacity-90">{error}</p>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button asChild variant="outline" size="sm">
                  <Link href="/">Avaa päänäkymä</Link>
                </Button>
              </div>
            </div>
          </div>
        ) : visibleRestaurants.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="border-border bg-card text-muted-foreground max-w-md rounded-xl border p-8 text-center shadow-sm">
              <h2 className="text-foreground text-base font-semibold">
                Ei näytettäviä lounaslistoja
              </h2>
              <p className="mt-1.5 text-sm">
                Kaikki ravintolat on piilotettu tai listoja ei ole saatavilla.
                Voit muokata näkyvyyttä päänäkymässä.
              </p>
              <Button asChild variant="outline" size="sm" className="mt-4">
                <Link href="/">Avaa päänäkymä</Link>
              </Button>
            </div>
          </div>
        ) : !isScrollable ? (
          /* Static presentation when all restaurants fit horizontally */
          <div
            ref={singleTrackRef}
            className="flex h-full items-stretch gap-6 overflow-x-auto"
          >
            {visibleRestaurants.map((restaurant) => (
              <RadiatorRestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
              />
            ))}
          </div>
        ) : (
          /* Continuous smooth marquee carousel */
          <div
            className="relative flex h-full items-stretch overflow-hidden"
            onMouseEnter={() => {
              isHoveredRef.current = true;
            }}
            onMouseLeave={() => {
              isHoveredRef.current = false;
            }}
          >
            <div
              ref={marqueeTrackRef}
              className="flex h-full shrink-0 items-stretch gap-6 will-change-transform"
            >
              <div
                ref={singleTrackRef}
                className="flex h-full shrink-0 items-stretch gap-6"
              >
                {visibleRestaurants.map((restaurant) => (
                  <RadiatorRestaurantCard
                    key={`primary-${restaurant.id}`}
                    restaurant={restaurant}
                  />
                ))}
              </div>

              {/* Duplicate track for seamless infinite loop */}
              <div
                aria-hidden="true"
                className="flex h-full shrink-0 items-stretch gap-6"
              >
                {visibleRestaurants.map((restaurant) => (
                  <RadiatorRestaurantCard
                    key={`duplicate-${restaurant.id}`}
                    restaurant={restaurant}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
