"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useSyncExternalStore,
} from "react";
import type { ReactNode, KeyboardEvent, TouchEvent } from "react";
import { getWeekDates } from "@acme/shared-types";
import { getTodayIsoString } from "~/lib/dates";
import { useRouter } from "next/navigation";
import { cn } from "~/lib/utils";

import { getSwipeDay } from "~/lib/menu-swipe";
import { resolveMenuDate } from "~/lib/menu-selection";

const MenuDateContext = createContext<string | null>(null);
const DATE_EVENT = "menu-date-change";

function subscribe(callback: () => void) {
  window.addEventListener("popstate", callback);
  window.addEventListener(DATE_EVENT, callback);
  const timer = window.setInterval(callback, 30_000);
  return () => {
    window.removeEventListener("popstate", callback);
    window.removeEventListener(DATE_EVENT, callback);
    window.clearInterval(timer);
  };
}

function getSelectedDate() {
  const today = getTodayIsoString();
  const requested = new URLSearchParams(window.location.search).get("date");
  return resolveMenuDate(requested, today);
}

export function MenuDateProvider({
  today,
  children,
}: {
  today: string;
  children: ReactNode;
}) {
  const date = useSyncExternalStore(subscribe, getSelectedDate, () => today);
  const router = useRouter();
  const loadedWeek = useRef(getWeekDates(today)[0]);
  const week = getWeekDates(date)[0];
  useEffect(() => {
    if (loadedWeek.current !== week) {
      loadedWeek.current = week;
      router.refresh();
    }
  }, [week, router]);
  return (
    <MenuDateContext.Provider value={date}>{children}</MenuDateContext.Provider>
  );
}

export function useMenuDate() {
  return useContext(MenuDateContext) ?? getTodayIsoString();
}

function select(day: string) {
  const url = new URL(window.location.href);
  url.searchParams.set("date", day);
  window.history.replaceState(null, "", url);
  window.dispatchEvent(new Event(DATE_EVENT));
}

export function DateTabs() {
  const date = useMenuDate();
  const selectedRef = useRef<HTMLButtonElement>(null);
  const dates = getWeekDates(date);
  const today = getTodayIsoString();
  useEffect(() => {
    const tab = selectedRef.current;
    const row = tab?.parentElement;
    if (!tab || !row) return;
    const bounds = row.getBoundingClientRect();
    const selected = tab.getBoundingClientRect();
    if (selected.left < bounds.left)
      row.scrollLeft += selected.left - bounds.left;
    else if (selected.right > bounds.right)
      row.scrollLeft += selected.right - bounds.right;
  }, [date]);

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const next =
      event.key === "ArrowRight"
        ? (index + 1) % 7
        : event.key === "ArrowLeft"
          ? (index + 6) % 7
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? 6
              : null;
    if (next === null) return;
    event.preventDefault();
    const day = dates[next];
    if (day) select(day);
    (
      event.currentTarget.parentElement?.children[next] as
        | HTMLElement
        | undefined
    )?.focus();
  }

  return (
    <div
      role="tablist"
      aria-label="Lounaslistan päivä"
      className="mt-5 flex gap-1 overflow-x-auto border-b pb-1"
    >
      {dates.map((day, index) => {
        const d = new Date(`${day}T12:00:00Z`);
        const label = `${["Ma", "Ti", "Ke", "To", "Pe", "La", "Su"][index]} ${d.getUTCDate()}.${d.getUTCMonth() + 1}.`;
        return (
          <button
            key={day}
            ref={day === date ? selectedRef : undefined}
            type="button"
            role="tab"
            id={`menu-tab-${day}`}
            aria-selected={day === date}
            aria-controls="menu-day-panel"
            tabIndex={day === date ? 0 : -1}
            aria-label={`${label}${day === today ? ", tänään" : ""}`}
            onClick={() => select(day)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={cn(
              "focus-visible:ring-ring shrink-0 rounded-t-md border-b-2 px-3 py-2 text-sm font-medium whitespace-nowrap focus-visible:ring-2 focus-visible:outline-none",
              day === date
                ? "border-primary bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground border-transparent",
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function MenuDayPanel({ children }: { children: ReactNode }) {
  const date = useMenuDate();
  const gesture = useRef<{
    x: number;
    y: number;
    time: number;
    date: string;
  } | null>(null);

  function onTouchStart(event: TouchEvent<HTMLDivElement>) {
    gesture.current = null;
    if (
      !window.matchMedia("(max-width: 767px) and (pointer: coarse)").matches ||
      event.touches.length !== 1
    )
      return;
    const target = event.target;
    if (
      !(target instanceof HTMLElement) ||
      target.closest(
        "a, button, label, input, textarea, select, [role=button], [role=slider], [contenteditable], [data-no-day-swipe]",
      )
    )
      return;
    for (
      let node: HTMLElement | null = target;
      node && node !== event.currentTarget;
      node = node.parentElement
    ) {
      if (
        node.scrollWidth > node.clientWidth &&
        /auto|scroll/.test(window.getComputedStyle(node).overflowX)
      )
        return;
    }
    const touch = event.touches[0];
    if (!touch || touch.clientX < 24 || touch.clientX > window.innerWidth - 24)
      return;
    gesture.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: performance.now(),
      date,
    };
  }

  function onTouchMove(event: TouchEvent<HTMLDivElement>) {
    const start = gesture.current;
    const touch = event.touches[0];
    if (!start) return;
    if (
      event.touches.length !== 1 ||
      !touch ||
      (Math.abs(touch.clientY - start.y) > 12 &&
        Math.abs(touch.clientY - start.y) > Math.abs(touch.clientX - start.x))
    )
      gesture.current = null;
  }

  function onTouchEnd(event: TouchEvent<HTMLDivElement>) {
    const start = gesture.current;
    gesture.current = null;
    const touch = event.changedTouches[0];
    if (!start || !touch || event.touches.length || start.date !== date) return;
    const next = getSwipeDay(
      date,
      touch.clientX - start.x,
      touch.clientY - start.y,
      performance.now() - start.time,
    );
    if (next) select(next);
  }

  return (
    <div
      id="menu-day-panel"
      role="tabpanel"
      aria-labelledby={`menu-tab-${date}`}
      tabIndex={0}
      className="max-md:[touch-action:pan-y_pinch-zoom]"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={() => {
        gesture.current = null;
      }}
    >
      {children}
    </div>
  );
}
