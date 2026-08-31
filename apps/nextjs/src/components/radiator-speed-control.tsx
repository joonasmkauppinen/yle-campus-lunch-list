"use client";

import { Button } from "~/components/ui/button";

export interface RadiatorSpeedControlProps {
  speed: number;
  isPaused: boolean;
  onSpeedChange: (speed: number) => void;
  onTogglePause: () => void;
}

const MIN_SPEED = 0.1;
const MAX_SPEED = 5.0;
const STEP = 0.1;

export function RadiatorSpeedControl({
  speed,
  isPaused,
  onSpeedChange,
  onTogglePause,
}: RadiatorSpeedControlProps) {
  const handleDecrease = () => {
    const newSpeed = Math.max(MIN_SPEED, Math.round((speed - STEP) * 10) / 10);
    onSpeedChange(newSpeed);
  };

  const handleIncrease = () => {
    const newSpeed = Math.min(MAX_SPEED, Math.round((speed + STEP) * 10) / 10);
    onSpeedChange(newSpeed);
  };

  return (
    <div
      role="group"
      aria-label="Vieritysnopeuden säätimet"
      className="border-border bg-card/80 flex items-center gap-1.5 rounded-lg border p-1 backdrop-blur-xs"
    >
      <Button
        type="button"
        variant={isPaused ? "default" : "ghost"}
        size="sm"
        onClick={onTogglePause}
        className="h-8 px-2.5 text-xs font-semibold"
        aria-label={isPaused ? "Jatka vieritystä" : "Pysäytä vieritys"}
        title={isPaused ? "Jatka vieritystä" : "Pysäytä vieritys"}
      >
        {isPaused ? (
          <>
            <svg
              className="h-3.5 w-3.5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z"
                clipRule="evenodd"
              />
            </svg>
            <span className="hidden sm:inline">Jatka</span>
          </>
        ) : (
          <>
            <svg
              className="h-3.5 w-3.5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M6.75 5.25a.75.75 0 0 1 .75.75v12a.75.75 0 0 1-1.5 0v-12a.75.75 0 0 1 .75-.75Zm9 0a.75.75 0 0 1 .75.75v12a.75.75 0 0 1-1.5 0v-12a.75.75 0 0 1 .75-.75Z"
                clipRule="evenodd"
              />
            </svg>
            <span className="hidden sm:inline">Pysäytä</span>
          </>
        )}
      </Button>

      <div className="bg-border h-4 w-px" aria-hidden="true" />

      <div className="flex items-center gap-1">
        {/* Decrease Speed Button */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleDecrease}
          disabled={speed <= MIN_SPEED}
          className="h-8 w-8 p-0 text-xs font-bold"
          aria-label="Vähennä nopeutta 0.1x"
          title="Vähennä nopeutta (0.1x)"
        >
          <svg
            className="h-3.5 w-3.5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </Button>

        {/* Current Speed Display */}
        <span
          className="text-foreground min-w-[3rem] text-center text-xs font-bold tabular-nums"
          aria-label={`Nykyinen nopeus: ${speed.toFixed(1)}x`}
        >
          {speed.toFixed(1)}x
        </span>

        {/* Increase Speed Button */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleIncrease}
          disabled={speed >= MAX_SPEED}
          className="h-8 w-8 p-0 text-xs font-bold"
          aria-label="Kasvata nopeutta 0.1x"
          title="Kasvata nopeutta (0.1x)"
        >
          <svg
            className="h-3.5 w-3.5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </Button>
      </div>
    </div>
  );
}
