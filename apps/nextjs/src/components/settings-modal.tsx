"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { DesktopIcon, MoonIcon, SunIcon } from "@radix-ui/react-icons";

import type { AreaId, Restaurant } from "@acme/shared-types";

import type { ThemeMode } from "~/components/ui/theme";
import type { RestaurantPreferences } from "~/lib/preferences";
import { setStoredAccordionState } from "~/components/restaurant-list-item";
import { Button } from "~/components/ui/button";
import { useTheme } from "~/components/ui/theme";
import { RESTAURANT_AREAS } from "~/config/restaurants";
import {
  getOrderedAreas,
  getStoredDishTagsVisibility,
  getStoredPreferences,
  OTHER_AREA_LABEL,
  resolveDishTagsVisibility,
  setStoredDishTagsVisibility,
  setStoredPreferences,
  sortBySavedOrder,
} from "~/lib/preferences";
import { cn } from "~/lib/utils";

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurants: Restaurant[];
}

interface EditableRestaurantItem {
  id: string;
  name: string;
  /** `null` for a restaurant without an Area, listed under "Muut" */
  area: AreaId | null;
  isHidden: boolean;
}

interface EditableArea {
  id: AreaId;
  label: string;
  isHidden: boolean;
}

/** Key for the group of restaurants without an Area */
const OTHER_GROUP_KEY = "other";

function toEditableItems(
  restaurants: Restaurant[],
  hiddenIds: ReadonlySet<string>,
): EditableRestaurantItem[] {
  return restaurants.map((r) => ({
    id: r.id,
    name: r.name,
    area: r.area ?? null,
    isHidden: hiddenIds.has(r.id),
  }));
}

function getInitialItems(restaurants: Restaurant[]): EditableRestaurantItem[] {
  const storedPrefs = getStoredPreferences();
  return toEditableItems(
    sortBySavedOrder(restaurants, storedPrefs?.order ?? []),
    new Set(storedPrefs?.hidden ?? []),
  );
}

function getInitialAreas(): EditableArea[] {
  const storedPrefs = getStoredPreferences();
  const hiddenAreas = new Set(storedPrefs?.hiddenAreas ?? []);
  return getOrderedAreas(storedPrefs).map((area) => ({
    ...area,
    isHidden: hiddenAreas.has(area.id),
  }));
}

/**
 * Moves `fromId` to the position of `toId` in the flat list. Both are in the
 * same Area, so the order within that Area changes and every other Area is
 * left as it was.
 */
function moveItemTo(
  items: EditableRestaurantItem[],
  fromId: string,
  toId: string,
): EditableRestaurantItem[] {
  const fromIndex = items.findIndex((item) => item.id === fromId);
  const toIndex = items.findIndex((item) => item.id === toId);
  const itemToMove = items[fromIndex];
  if (!itemToMove || toIndex === -1 || fromIndex === toIndex) return items;

  const newItems = [...items];
  newItems.splice(fromIndex, 1);
  newItems.splice(toIndex, 0, itemToMove);
  return newItems;
}

export function SettingsModal({
  isOpen,
  onClose,
  restaurants,
}: SettingsModalProps) {
  const [items, setItems] = useState<EditableRestaurantItem[]>(() =>
    getInitialItems(restaurants),
  );
  const [areas, setAreas] = useState<EditableArea[]>(getInitialAreas);
  const [collapsedGroups, setCollapsedGroups] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [showDishTags, setShowDishTags] = useState<boolean>(
    () => getStoredDishTagsVisibility() === "visible",
  );
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [dragOffsetY, setDragOffsetY] = useState<number>(0);
  const [isTouchDragging, setIsTouchDragging] = useState<boolean>(false);
  const touchStartYRef = useRef<number>(0);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background scrolling while modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const areaOf = (id: string | null) =>
    items.find((item) => item.id === id)?.area;

  const itemsInArea = (area: AreaId | null) =>
    items.filter((item) => item.area === area);

  const moveItem = (id: string, direction: "up" | "down") => {
    const siblings = itemsInArea(areaOf(id) ?? null);
    const index = siblings.findIndex((item) => item.id === id);
    const target = siblings[direction === "up" ? index - 1 : index + 1];
    if (!target) return;
    setItems((prev) => moveItemTo(prev, id, target.id));
  };

  const moveArea = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const current = areas[index];
    const target = areas[targetIndex];
    if (!current || !target) return;

    const newAreas = [...areas];
    newAreas[index] = target;
    newAreas[targetIndex] = current;
    setAreas(newAreas);
  };

  const toggleAreaHidden = (id: AreaId) => {
    setAreas((prev) =>
      prev.map((area) =>
        area.id === id ? { ...area, isHidden: !area.isHidden } : area,
      ),
    );
  };

  const toggleCollapsed = (key: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const clearDrag = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  // HTML5 Desktop Drag Handlers. Dropping is only allowed within the dragged
  // restaurant's own Area.
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    if (draggedId === null || areaOf(draggedId) !== areaOf(id)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverId !== id) {
      setDragOverId(id);
    }
  };

  const handleDragLeave = (id: string) => {
    if (dragOverId === id) {
      setDragOverId(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetId: string) => {
    e.preventDefault();
    if (draggedId !== null && areaOf(draggedId) === areaOf(targetId)) {
      setItems((prev) => moveItemTo(prev, draggedId, targetId));
    }
    clearDrag();
  };

  // Mobile Touch Drag Handlers (constrained to Y-axis and to the dragged
  // restaurant's own Area)
  const handleTouchStart = (
    e: React.TouchEvent<HTMLDivElement>,
    id: string,
  ) => {
    const touch = e.touches[0];
    if (!touch) return;
    touchStartYRef.current = touch.clientY;
    setDragOffsetY(0);
    setIsTouchDragging(true);
    setDraggedId(id);
    setDragOverId(id);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    if (!touch || draggedId === null) return;

    // Track vertical translation distance (Y-axis only)
    setDragOffsetY(touch.clientY - touchStartYRef.current);

    // Find the item under the touch coordinates
    const targetElement = document.elementFromPoint(
      touch.clientX,
      touch.clientY,
    );
    const row = targetElement?.closest<HTMLElement>("[data-item-id]");
    const targetId = row?.dataset.itemId;
    if (
      targetId &&
      targetId !== dragOverId &&
      areaOf(targetId) === areaOf(draggedId)
    ) {
      setDragOverId(targetId);
    }
  };

  const handleTouchEnd = () => {
    if (draggedId !== null && dragOverId !== null) {
      setItems((prev) => moveItemTo(prev, draggedId, dragOverId));
    }
    clearDrag();
    setDragOffsetY(0);
    setIsTouchDragging(false);
  };

  const toggleHidden = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isHidden: !item.isHidden } : item,
      ),
    );
  };

  const handleResetDefaults = () => {
    // Reset to default restaurant and Area order and unhide all. The theme is
    // left alone: it applies instantly and is not part of this form.
    setItems(toEditableItems(restaurants, new Set()));
    setAreas(RESTAURANT_AREAS.map((area) => ({ ...area, isHidden: false })));
    setShowDishTags(true);
  };

  const handleSave = () => {
    const hiddenAreaIds = areas
      .filter((area) => area.isHidden)
      .map((area) => area.id);
    const hiddenIds = items
      .filter((item) => item.isHidden)
      .map((item) => item.id);

    const preferences: RestaurantPreferences = {
      order: items.map((item) => item.id),
      hidden: hiddenIds,
      areaOrder: areas.map((area) => area.id),
      hiddenAreas: hiddenAreaIds,
    };

    // Close accordion for all hidden restaurants, including whole hidden Areas
    for (const item of items) {
      if (item.isHidden || (item.area && hiddenAreaIds.includes(item.area))) {
        setStoredAccordionState(item.id, false);
      }
    }

    setStoredPreferences(preferences);
    setStoredDishTagsVisibility(
      resolveDishTagsVisibility(getStoredDishTagsVisibility(), showDishTags),
    );
    onClose();
  };

  const renderRestaurantRows = (groupItems: EditableRestaurantItem[]) => (
    <div className="space-y-2">
      {groupItems.map((item, index) => {
        const isBeingDragged = draggedId === item.id;
        const isDragOver = dragOverId === item.id && draggedId !== item.id;

        return (
          <div
            key={item.id}
            data-item-id={item.id}
            draggable
            onDragStart={(e) => handleDragStart(e, item.id)}
            onDragOver={(e) => handleDragOver(e, item.id)}
            onDragLeave={() => handleDragLeave(item.id)}
            onDrop={(e) => handleDrop(e, item.id)}
            onDragEnd={clearDrag}
            style={
              isBeingDragged && isTouchDragging
                ? {
                    transform: `translateY(${dragOffsetY}px)`,
                  }
                : undefined
            }
            className={cn(
              "border-border bg-background flex items-center justify-between gap-3 rounded-lg border p-3 transition-all",
              item.isHidden && "bg-muted/40 border-dashed opacity-70",
              isBeingDragged &&
                !isTouchDragging &&
                "border-primary scale-[0.98] border-dashed opacity-30",
              isBeingDragged &&
                isTouchDragging &&
                "border-primary bg-card ring-primary/50 pointer-events-none relative z-30 shadow-xl ring-2 transition-none",
              isDragOver &&
                "border-primary ring-primary/20 bg-primary/5 ring-2",
            )}
          >
            <div className="flex min-w-0 items-center gap-2">
              {/* Drag handle */}
              <div
                role="button"
                tabIndex={0}
                onTouchStart={(e) => handleTouchStart(e, item.id)}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchEnd}
                style={{ touchAction: "none" }}
                className="text-muted-foreground/60 hover:text-foreground active:text-foreground -my-1 -ml-1 flex h-8 w-6 shrink-0 cursor-grab items-center justify-center rounded transition-colors select-none active:cursor-grabbing"
                title="Raahaa järjestääksesi"
                aria-label="Raahaa järjestääksesi"
              >
                <svg
                  className="h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="9" cy="5" r="1" fill="currentColor" />
                  <circle cx="9" cy="12" r="1" fill="currentColor" />
                  <circle cx="9" cy="19" r="1" fill="currentColor" />
                  <circle cx="15" cy="5" r="1" fill="currentColor" />
                  <circle cx="15" cy="12" r="1" fill="currentColor" />
                  <circle cx="15" cy="19" r="1" fill="currentColor" />
                </svg>
              </div>

              <span className="text-muted-foreground w-5 text-center font-mono text-xs font-medium">
                {index + 1}.
              </span>
              <div className="min-w-0">
                <p
                  className={cn(
                    "truncate text-sm font-semibold",
                    item.isHidden
                      ? "text-muted-foreground line-through"
                      : "text-foreground",
                  )}
                >
                  {item.name}
                </p>
                {item.isHidden && (
                  <span className="text-muted-foreground text-[11px] font-medium">
                    Piilotettu listalta
                  </span>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              {/* Visibility toggle */}
              <Button
                type="button"
                variant={item.isHidden ? "secondary" : "outline"}
                size="sm"
                onClick={() => toggleHidden(item.id)}
                title={
                  item.isHidden
                    ? "Näytä ravintola listalla"
                    : "Piilota ravintola listalta"
                }
                aria-label={
                  item.isHidden ? `Näytä ${item.name}` : `Piilota ${item.name}`
                }
                className="h-8 px-2 text-xs"
              >
                {item.isHidden ? (
                  <>
                    <EyeOffIcon />
                    <span className="hidden sm:inline">Piilotettu</span>
                  </>
                ) : (
                  <>
                    <EyeIcon />
                    <span className="hidden sm:inline">Näkyvissä</span>
                  </>
                )}
              </Button>

              <MoveButtons
                name={item.name}
                isFirst={index === 0}
                isLast={index === groupItems.length - 1}
                onMove={(direction) => moveItem(item.id, direction)}
              />
            </div>
          </div>
        );
      })}
    </div>
  );

  const otherItems = itemsInArea(null);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      {/* Backdrop */}
      <div
        className="bg-background/80 fixed inset-0 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal dialog */}
      <div className="border-border bg-card text-card-foreground relative flex max-h-[90vh] w-full max-w-xl flex-col rounded-xl border shadow-xl">
        {/* Header */}
        <div className="border-border flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2
              id="settings-title"
              className="text-foreground text-lg font-bold tracking-tight sm:text-xl"
            >
              Asetukset
            </h2>
            <p className="text-muted-foreground mt-0.5 text-xs sm:text-sm">
              Muokkaa sivun ulkoasua ja ravintolalistaa.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:ring-ring inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none"
            aria-label="Sulje"
          >
            <svg
              className="h-5 w-5"
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

        {/* Content */}
        <div className="divide-border flex-1 divide-y overflow-y-auto px-6">
          <SettingsSection
            title="Teema"
            description="Muutos tulee voimaan heti."
          >
            <ThemeSetting />
          </SettingsSection>

          <SettingsSection
            title="Ruokalajit"
            description="Valitse ruokalajin mukaan -osio listaa päivän ruoat ruokalajeittain."
          >
            <DishTagsSetting
              checked={showDishTags}
              onChange={setShowDishTags}
            />
          </SettingsSection>

          <SettingsSection
            title="Ravintolat"
            description="Järjestä alueet ja niiden ravintolat tai piilota niitä päänäkymästä."
          >
            <div className="space-y-4">
              {areas.map((area, areaIndex) => {
                const isCollapsed = collapsedGroups.has(area.id);
                const groupItems = itemsInArea(area.id);
                const contentId = `settings-area-${area.id}`;

                return (
                  <div
                    key={area.id}
                    className={cn(
                      "border-border rounded-xl border p-3",
                      area.isHidden && "bg-muted/40 border-dashed",
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <CollapseToggle
                        label={area.label}
                        detail={
                          area.isHidden
                            ? "Alue piilotettu"
                            : `${groupItems.length} ${groupItems.length === 1 ? "ravintola" : "ravintolaa"}`
                        }
                        isCollapsed={isCollapsed}
                        controls={contentId}
                        isMuted={area.isHidden}
                        onToggle={() => toggleCollapsed(area.id)}
                      />
                      <div className="flex shrink-0 items-center gap-1.5">
                        <Switch
                          checked={!area.isHidden}
                          onChange={() => toggleAreaHidden(area.id)}
                          label={`Näytä alue ${area.label}`}
                        />
                        <MoveButtons
                          name={`alue ${area.label}`}
                          isFirst={areaIndex === 0}
                          isLast={areaIndex === areas.length - 1}
                          onMove={(direction) => moveArea(areaIndex, direction)}
                        />
                      </div>
                    </div>

                    {!isCollapsed && groupItems.length > 0 && (
                      <div
                        id={contentId}
                        className={cn("mt-3", area.isHidden && "opacity-60")}
                      >
                        {renderRestaurantRows(groupItems)}
                      </div>
                    )}
                  </div>
                );
              })}

              {otherItems.length > 0 && (
                <div className="border-border rounded-xl border p-3">
                  <CollapseToggle
                    label={OTHER_AREA_LABEL}
                    detail={`${otherItems.length} ${otherItems.length === 1 ? "ravintola" : "ravintolaa"}`}
                    isCollapsed={collapsedGroups.has(OTHER_GROUP_KEY)}
                    controls="settings-area-other"
                    onToggle={() => toggleCollapsed(OTHER_GROUP_KEY)}
                  />
                  {!collapsedGroups.has(OTHER_GROUP_KEY) && (
                    <div id="settings-area-other" className="mt-3">
                      {renderRestaurantRows(otherItems)}
                    </div>
                  )}
                </div>
              )}
            </div>
          </SettingsSection>
        </div>

        {/* Footer */}
        <div className="border-border flex items-center justify-between gap-2 border-t px-4 py-4 sm:px-6">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleResetDefaults}
            className="text-muted-foreground hover:text-foreground px-2 text-xs sm:px-3"
          >
            Palauta oletukset
          </Button>

          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs sm:text-sm"
            >
              Peruuta
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              className="text-xs sm:text-sm"
            >
              Tallenna
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface SettingsSectionProps {
  title: string;
  description: string;
  children: ReactNode;
}

function SettingsSection({
  title,
  description,
  children,
}: SettingsSectionProps) {
  return (
    <section className="py-5">
      <h3 className="text-foreground text-sm font-semibold">{title}</h3>
      <p className="text-muted-foreground mt-0.5 mb-3 text-xs sm:text-sm">
        {description}
      </p>
      {children}
    </section>
  );
}

interface CollapseToggleProps {
  label: string;
  detail: string;
  isCollapsed: boolean;
  /** Id of the element the toggle shows and hides */
  controls: string;
  isMuted?: boolean;
  onToggle: () => void;
}

/** Area heading in the settings list that collapses its restaurant rows. */
function CollapseToggle({
  label,
  detail,
  isCollapsed,
  controls,
  isMuted,
  onToggle,
}: CollapseToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={!isCollapsed}
      aria-controls={controls}
      aria-label={`${label}, ${detail}`}
      className="focus-visible:ring-ring -m-1 flex min-w-0 items-center gap-2 rounded-md p-1 text-left focus-visible:ring-2 focus-visible:outline-none"
    >
      <svg
        className={cn(
          "text-muted-foreground h-4 w-4 shrink-0 transition-transform",
          isCollapsed && "-rotate-90",
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
      <span className="min-w-0">
        <span
          className={cn(
            "block truncate text-sm font-bold",
            isMuted ? "text-muted-foreground line-through" : "text-foreground",
          )}
        >
          {label}
        </span>
        <span className="text-muted-foreground block text-[11px] font-medium">
          {detail}
        </span>
      </span>
    </button>
  );
}

interface MoveButtonsProps {
  /** Name used in the accessible labels, e.g. "Iso Paja" */
  name: string;
  isFirst: boolean;
  isLast: boolean;
  onMove: (direction: "up" | "down") => void;
}

function MoveButtons({ name, isFirst, isLast, onMove }: MoveButtonsProps) {
  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled={isFirst}
        onClick={() => onMove("up")}
        aria-label={`Siirrä ${name} ylemmäs`}
        title="Siirrä ylemmäs"
        className="h-8 w-8"
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
            d="m4.5 15.75 7.5-7.5 7.5 7.5"
          />
        </svg>
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled={isLast}
        onClick={() => onMove("down")}
        aria-label={`Siirrä ${name} alemmas`}
        title="Siirrä alemmas"
        className="h-8 w-8"
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
            d="m19.5 8.25-7.5 7.5-7.5-7.5"
          />
        </svg>
      </Button>
    </>
  );
}

function EyeIcon() {
  return (
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
        d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
      />
    </svg>
  );
}

function EyeOffIcon() {
  return (
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
        d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
      />
    </svg>
  );
}

const THEME_OPTIONS: { mode: ThemeMode; label: string; icon: ReactNode }[] = [
  { mode: "light", label: "Vaalea", icon: <SunIcon className="h-4 w-4" /> },
  { mode: "dark", label: "Tumma", icon: <MoonIcon className="h-4 w-4" /> },
  {
    mode: "auto",
    label: "Järjestelmä",
    icon: <DesktopIcon className="h-4 w-4" />,
  },
];

/** Applies the theme instantly, independent of the modal's save/cancel. */
function ThemeSetting() {
  const { themeMode, setTheme } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Teema"
      className="grid grid-cols-3 gap-2"
    >
      {THEME_OPTIONS.map(({ mode, label, icon }) => {
        const isSelected = themeMode === mode;
        return (
          <button
            key={mode}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => setTheme(mode)}
            className={cn(
              "text-foreground flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
              "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
              isSelected
                ? "border-foreground/20 bg-foreground/10 dark:bg-foreground/15"
                : "border-border bg-background",
            )}
          >
            <span aria-hidden="true">{icon}</span>
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Accessible name of the switch */
  label: string;
}

function Switch({ checked, onChange, label }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "focus-visible:ring-ring relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
        checked ? "bg-primary" : "bg-muted-foreground/30",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "bg-background inline-block h-5 w-5 rounded-full shadow-sm transition-transform",
          checked ? "translate-x-5.5" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

interface DishTagsSettingProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function DishTagsSetting({ checked, onChange }: DishTagsSettingProps) {
  return (
    <div className="border-border bg-background flex items-center justify-between gap-3 rounded-lg border p-3">
      <span
        aria-hidden="true"
        className="text-foreground text-sm font-semibold"
      >
        Näytä ruokalajiosio
      </span>
      <Switch
        checked={checked}
        onChange={onChange}
        label="Näytä ruokalajiosio"
      />
    </div>
  );
}
