"use client";

import { useEffect, useRef, useState } from "react";

import type { Restaurant } from "@acme/shared-types";

import type { RestaurantPreferences } from "~/lib/preferences";
import { setStoredAccordionState } from "~/components/restaurant-list-item";
import { Button } from "~/components/ui/button";
import { getStoredPreferences, setStoredPreferences } from "~/lib/preferences";
import { cn } from "~/lib/utils";

export interface EditRestaurantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurants: Restaurant[];
}

interface EditableRestaurantItem {
  id: string;
  name: string;
  isHidden: boolean;
}

function getInitialItems(restaurants: Restaurant[]): EditableRestaurantItem[] {
  const storedPrefs = getStoredPreferences();
  const orderMap = new Map<string, number>();
  if (storedPrefs?.order) {
    storedPrefs.order.forEach((id, idx) => orderMap.set(id, idx));
  }
  const hiddenSet = new Set(storedPrefs?.hidden ?? []);

  const initialSorted = [...restaurants].sort((a, b) => {
    const orderA = orderMap.get(a.id) ?? 9999;
    const orderB = orderMap.get(b.id) ?? 9999;
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    return 0;
  });

  return initialSorted.map((r) => ({
    id: r.id,
    name: r.name,
    isHidden: hiddenSet.has(r.id),
  }));
}

export function EditRestaurantsModal({
  isOpen,
  onClose,
  restaurants,
}: EditRestaurantsModalProps) {
  const [items, setItems] = useState<EditableRestaurantItem[]>(() =>
    getInitialItems(restaurants),
  );
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
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

  const moveItem = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const newItems = [...items];
    const temp = newItems[index];
    const target = newItems[targetIndex];
    if (!temp || !target) return;

    newItems[index] = target;
    newItems[targetIndex] = temp;
    setItems(newItems);
  };

  // HTML5 Desktop Drag Handlers
  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    index: number,
  ) => {
    e.dataTransfer.setData("text/plain", String(index));
    e.dataTransfer.effectAllowed = "move";
    setDraggedIndex(index);
  };

  const handleDragOver = (
    e: React.DragEvent<HTMLDivElement>,
    index: number,
  ) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = (index: number) => {
    if (dragOverIndex === index) {
      setDragOverIndex(null);
    }
  };

  const handleDrop = (
    e: React.DragEvent<HTMLDivElement>,
    targetIndex: number,
  ) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newItems = [...items];
    const itemToMove = newItems[draggedIndex];
    if (!itemToMove) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, itemToMove);
    setItems(newItems);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Mobile Touch Drag Handlers (constrained to Y-axis)
  const handleTouchStart = (
    e: React.TouchEvent<HTMLDivElement>,
    index: number,
  ) => {
    const touch = e.touches[0];
    if (!touch) return;
    touchStartYRef.current = touch.clientY;
    setDragOffsetY(0);
    setIsTouchDragging(true);
    setDraggedIndex(index);
    setDragOverIndex(index);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    if (!touch || draggedIndex === null) return;

    // Track vertical translation distance (Y-axis only)
    const deltaY = touch.clientY - touchStartYRef.current;
    setDragOffsetY(deltaY);

    // Find the item under the touch coordinates
    const targetElement = document.elementFromPoint(
      touch.clientX,
      touch.clientY,
    );
    const row = targetElement?.closest<HTMLElement>("[data-item-index]");
    if (row?.dataset.itemIndex !== undefined) {
      const targetIdx = parseInt(row.dataset.itemIndex, 10);
      if (!isNaN(targetIdx) && targetIdx !== dragOverIndex) {
        setDragOverIndex(targetIdx);
      }
    }
  };

  const handleTouchEnd = () => {
    if (
      draggedIndex !== null &&
      dragOverIndex !== null &&
      draggedIndex !== dragOverIndex
    ) {
      const newItems = [...items];
      const itemToMove = newItems[draggedIndex];
      if (itemToMove) {
        newItems.splice(draggedIndex, 1);
        newItems.splice(dragOverIndex, 0, itemToMove);
        setItems(newItems);
      }
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
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
    // Reset to default restaurant config order and unhide all
    setItems(
      restaurants.map((r) => ({
        id: r.id,
        name: r.name,
        isHidden: false,
      })),
    );
  };

  const handleSave = () => {
    const hiddenIds = items
      .filter((item) => item.isHidden)
      .map((item) => item.id);

    const preferences: RestaurantPreferences = {
      order: items.map((item) => item.id),
      hidden: hiddenIds,
    };

    // Close accordion for all hidden restaurants
    for (const hiddenId of hiddenIds) {
      setStoredAccordionState(hiddenId, false);
    }

    setStoredPreferences(preferences);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-restaurants-title"
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
              id="edit-restaurants-title"
              className="text-foreground text-lg font-bold tracking-tight sm:text-xl"
            >
              Muokkaa ravintoloita
            </h2>
            <p className="text-muted-foreground mt-0.5 text-xs sm:text-sm">
              Järjestä ravintolat raahaamalla tai piilota ne päänäkymästä.
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

        {/* Content list */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-2">
            {items.map((item, index) => {
              const isBeingDragged = draggedIndex === index;
              const isDragOver =
                dragOverIndex === index && draggedIndex !== index;

              return (
                <div
                  key={item.id}
                  data-item-index={index}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={() => handleDragLeave(index)}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
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
                      onTouchStart={(e) => handleTouchStart(e, index)}
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
                        item.isHidden
                          ? `Näytä ${item.name}`
                          : `Piilota ${item.name}`
                      }
                      className="h-8 px-2 text-xs"
                    >
                      {item.isHidden ? (
                        <>
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
                          <span className="hidden sm:inline">Piilotettu</span>
                        </>
                      ) : (
                        <>
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
                          <span className="hidden sm:inline">Näkyvissä</span>
                        </>
                      )}
                    </Button>

                    {/* Move Up */}
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={index === 0}
                      onClick={() => moveItem(index, "up")}
                      aria-label={`Siirrä ${item.name} ylemmäs`}
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

                    {/* Move Down */}
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={index === items.length - 1}
                      onClick={() => moveItem(index, "down")}
                      aria-label={`Siirrä ${item.name} alemmas`}
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
                  </div>
                </div>
              );
            })}
          </div>
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
