import type { ReactNode } from "react";

import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

export interface NoticeProps {
  title: string;
  children: ReactNode;
  onDismiss: () => void;
  /**
   * - `default`: a quiet card for incidental information
   * - `highlight`: primary-coloured border, tint and icon, for something the
   *   user should notice, like an announcement
   */
  variant?: "default" | "highlight";
  /** When set, a button with this label is shown below the text as well, as a
   * larger and more obvious way to dismiss the notice. */
  dismissLabel?: string;
  /** Heading id, for a parent that labels a region with the notice title */
  titleId?: string;
  className?: string;
}

const INFO_ICON_PATH =
  "m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z";

/** Reads as "new" rather than "information", for the highlight variant */
const SPARKLES_ICON_PATH =
  "M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z";

/**
 * A dismissable info box: a header row with an icon (info, or sparkles when
 * highlighted), the title and a close button, with the body text below it.
 */
export function Notice({
  title,
  children,
  onDismiss,
  variant = "default",
  dismissLabel,
  titleId,
  className,
}: NoticeProps) {
  const isHighlight = variant === "highlight";

  return (
    <div
      className={cn(
        "text-muted-foreground animate-fade-in rounded-xl border p-4 text-sm shadow-sm",
        isHighlight
          ? "border-primary bg-primary/5 dark:bg-primary/10 border-2"
          : "border-border bg-card",
        className,
      )}
    >
      {/* Header: icon, title and close button on one row */}
      <div className="flex items-center gap-2">
        <svg
          className={cn("h-5 w-5 shrink-0", isHighlight && "text-primary")}
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
            d={isHighlight ? SPARKLES_ICON_PATH : INFO_ICON_PATH}
          />
        </svg>
        <p
          id={titleId}
          className={cn(
            "text-foreground min-w-0 flex-1",
            isHighlight ? "text-base font-semibold" : "font-medium",
          )}
        >
          {title}
        </p>
        <button
          type="button"
          onClick={onDismiss}
          className="text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:ring-ring -my-1 -mr-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none"
          aria-label="Sulje ilmoitus"
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
        </button>
      </div>

      {/* Body: full width, aligned with the box padding */}
      <div className={cn("mt-2", isHighlight && "text-foreground/80")}>
        {children}
      </div>
      {dismissLabel && (
        <Button type="button" size="sm" onClick={onDismiss} className="mt-3">
          {dismissLabel}
        </Button>
      )}
    </div>
  );
}
