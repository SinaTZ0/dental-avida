import { cn } from "#/lib/utils";

/*===== Avida Brand Marks =====*/
// Avida carries two distinct marks:
// 1. `AvidaBrandEmblem`: the official clinic logo — a fine architectural tooth outline inside an emerald-and-gold
//    medallion, used in the header and footer brand lockups.
// 2. `AvidaSmile`: the clinic's signature calligraphic smile mascot (tapered crescent + silver star), used as
//    the hero focal mark, carved arrival reveal, and subtle editorial flourish.

export const AVIDA_SMILE_VIEWBOX = { width: 180, height: 48 } as const;

export const AVIDA_SMILE_ARC_PATH =
  "M168 9.5C146 31.5 111 40 74 36.5C47 34 27 25 18 16.5C30 28.5 52 41 82 43.2C119 45.8 153 34.2 170 11.2C171.2 9.6 169.3 8.2 168 9.5Z";

export const AVIDA_SMILE_STAR_PATH =
  "M9.5 10.1Q9.5 17.5 16.9 17.5Q9.5 17.5 9.5 24.9Q9.5 17.5 2.1 17.5Q9.5 17.5 9.5 10.1Z";

type AvidaSmileProps = {
  className?: string;
  /** Render the star in metallic silver (default) or inherit the arc's fill color. */
  accentDot?: boolean;
};

/** Signature smile mascot: tapered calligraphic arc with silver accent star. */
export function AvidaSmile({ className, accentDot = true }: AvidaSmileProps) {
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${AVIDA_SMILE_VIEWBOX.width} ${AVIDA_SMILE_VIEWBOX.height}`}
      fill="none"
      className={cn("block overflow-visible ltr:-scale-x-100", className)}
    >
      {/* Tapered organic crescent: fuller through the center of the smile, tapering cleanly to fine calligraphic tips. */}
      <path data-smile-arc d={AVIDA_SMILE_ARC_PATH} fill="currentColor" />
      <path data-smile-star d={AVIDA_SMILE_STAR_PATH} className={accentDot ? "fill-brand-silver" : "fill-current"} />
    </svg>
  );
}

/** Official Avida Dental logo: refined tooth silhouette inside the clinic's emerald-and-gold medallion. */
export function AvidaBrandEmblem({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl border border-brand-gold/50 bg-brand-surface text-brand-surface-foreground shadow-sm sm:size-12",
        className,
      )}
    >
      <svg
        viewBox="0 0 28 32"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-6 stroke-2 sm:size-7"
      >
        <path d="M14 5C11 5 8.5 1.5 5 3.5 0 6.2 2.5 14 4.5 18.5 7 24.3 6 29 9.3 29c3.3 0 1.5-9.3 4.7-9.3s1.4 9.3 4.7 9.3c3.3 0 2.3-4.7 4.8-10.5 2-4.5 4.5-12.3-.5-15C19.5 1.5 17 5 14 5Z" />
        <path d="M14 5l3.4-.9" className="stroke-brand-surface-gold" />
      </svg>
    </span>
  );
}
