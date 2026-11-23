import { cva } from "class-variance-authority";
import { composeStyles, defineStyles, joinStyles } from "../styles";

/*===== Overlay =====*/

const twOverlayStyles = defineStyles({
  layout: "fixed inset-0 z-50",
  appearance: "bg-overlay backdrop-blur-xs",
  interaction: "transition-opacity duration-150",
  state: "data-ending-style:opacity-0 data-starting-style:opacity-0",
  motion: "motion-reduce:transition-none",
});

/*===== Content =====*/

const twContentShared = defineStyles({
  layout:
    "fixed start-1/2 top-1/2 z-50 grid max-h-dvh w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rtl:translate-x-1/2",
  appearance: "bg-popover text-popover-foreground shadow-md outline-none",
  typography: "text-body-sm",
  interaction: "transition duration-200 ease-out",
  state:
    "data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0",
  motion: "motion-reduce:transition-none",
});

const twContentVariant = defineStyles({
  default: {
    layout: "gap-5",
    geometry: "rounded-lg border border-border p-6",
  },
  campaign: {
    layout: "max-w-xl gap-0",
    geometry: "overflow-hidden rounded-lg border border-brand-gold/40 p-0",
    appearance: "bg-card text-foreground",
  },
});

const dialogContentVariants = cva(joinStyles(twContentShared), {
  variants: {
    variant: composeStyles(twContentVariant),
  },
  defaultVariants: {
    variant: "default",
  },
});

const twCloseStyles = defineStyles({
  layout: "absolute inset-e-3 top-3 z-10",
});

/*===== Parts =====*/

const twHeaderStyles = defineStyles({ layout: "flex flex-col gap-1.5 pe-10" });
const twFooterStyles = defineStyles({ layout: "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end" });
const twTitleStyles = defineStyles({ typography: "font-heading text-h2", appearance: "text-foreground" });
const twDescriptionStyles = defineStyles({ typography: "text-body-sm", appearance: "text-muted-foreground" });

export const dialogOverlayClasses = joinStyles(twOverlayStyles);
export { dialogContentVariants };
export const dialogCloseClasses = joinStyles(twCloseStyles);
export const dialogHeaderClasses = joinStyles(twHeaderStyles);
export const dialogFooterClasses = joinStyles(twFooterStyles);
export const dialogTitleClasses = joinStyles(twTitleStyles);
export const dialogDescriptionClasses = joinStyles(twDescriptionStyles);
