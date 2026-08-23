import type { MenuItem } from "@acme/shared-types";

import { cn } from "~/lib/utils";

export interface RestaurantMenuItemProps {
  item: MenuItem;
  className?: string;
  disabled?: boolean;
}

export function RestaurantMenuItem({
  item,
  className,
  disabled = false,
}: RestaurantMenuItemProps) {
  return (
    <li
      className={cn("flex items-start justify-between gap-4 py-1", className)}
    >
      <div
        className={cn(
          "flex-1 text-sm font-medium",
          disabled ? "text-muted-foreground" : "text-foreground",
        )}
      >
        <span>{item.name}</span>
        {item.dietaryFlags && item.dietaryFlags.length > 0 && (
          <span className="ml-2 inline-flex flex-wrap gap-1 align-middle">
            {item.dietaryFlags.map((flag) => (
              <span
                key={flag}
                className={cn(
                  "inline-block rounded-full px-1.5 py-0.5 text-[10px] leading-none font-semibold",
                  disabled
                    ? "bg-muted text-muted-foreground"
                    : "bg-secondary text-secondary-foreground",
                )}
              >
                {flag}
              </span>
            ))}
          </span>
        )}
      </div>
      {item.price && (
        <span
          className={cn(
            "text-sm font-bold whitespace-nowrap",
            disabled ? "text-muted-foreground" : "text-primary",
          )}
        >
          {item.price}
        </span>
      )}
    </li>
  );
}
