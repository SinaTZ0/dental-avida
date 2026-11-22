import { useId } from "react";

import { cn } from "#/lib/utils";

/*===== Avida Smile Brand Mark =====*/
// Signature tapered smile crescent with a luminous accent dot — shared across the header emblem, hero focal mark,
// appointment concierge card, and footer lockup so Avida carries one unmistakable visual signature.

type AvidaSmileProps = {
  className?: string;
  /** Render the dot in champagne gold (default) or inherit the arc's stroke color. */
  accentDot?: boolean;
};

/** Tapered calligraphic smile arc with accent dot. Points upward toward the trailing edge in RTL and mirrors in LTR. */
export function AvidaSmile({ className, accentDot = true }: AvidaSmileProps) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 180 48"
      fill="none"
      className={cn("block overflow-visible ltr:-scale-x-100", className)}
    >
      {/* Tapered organic crescent: fuller through the center of the smile, tapering cleanly to fine calligraphic tips. */}
      <path
        data-smile-arc
        d="M168 9.5C146 31.5 111 40 74 36.5C47 34 27 25 18 16.5C30 28.5 52 41 82 43.2C119 45.8 153 34.2 170 11.2C171.2 9.6 169.3 8.2 168 9.5Z"
        fill="currentColor"
      />
      <circle
        data-smile-dot
        cx="9.5"
        cy="17.5"
        r="5.2"
        className={accentDot ? "fill-brand-gold dark:fill-brand-surface-gold" : "fill-current"}
      />
    </svg>
  );
}

/** Compact emblem pairing the Avida smile arc + radiant gold dot inside the brand's emerald-and-gold medallion. */
export function AvidaBrandEmblem({ className }: { className?: string }) {
  const gradientId = useId();

  return (
    <span
      aria-hidden
      className={cn(
        "relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl border border-brand-gold/45 bg-brand-surface text-brand-surface-foreground shadow-sm sm:size-12",
        className,
      )}
    >
      <svg viewBox="0 0 48 48" fill="none" className="size-8 ltr:-scale-x-100">
        <defs>
          <linearGradient id={gradientId} x1="42" y1="15" x2="10" y2="33" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="var(--brand-surface-gold)" />
            <stop offset="55%" stopColor="var(--consultation-mint)" />
            <stop offset="100%" stopColor="var(--brand-surface-foreground)" />
          </linearGradient>
        </defs>
        <path
          d="M41.5 17.2C35.8 27.6 26.2 32.4 16.6 30.8C12 30 8.5 28 6.4 25.6C9.3 30.8 15.6 35.6 23.6 36.2C32.8 36.9 40.2 30.4 43.2 18.6C43.5 17.3 42.1 16.2 41.5 17.2Z"
          fill={`url(#${gradientId})`}
        />
        <circle cx="8.2" cy="19.8" r="3.1" fill="var(--brand-surface-gold)" />
      </svg>
    </span>
  );
}
