import { defineStyles, joinStyles } from "#/components/primitive/styles";

/*===== Slider Styles =====*/

export const sliderClasses = joinStyles(defineStyles({ layout: "data-horizontal:w-full data-vertical:h-full" }));

export const sliderControlClasses = joinStyles(
  defineStyles({
    layout: "relative flex w-full items-center data-vertical:w-auto data-vertical:flex-col",
    geometry: "min-h-target min-w-target data-vertical:h-full data-vertical:min-h-40",
    interaction: "touch-none select-none",
    disabled: "data-disabled:opacity-50",
  }),
);

export const sliderTrackClasses = joinStyles(
  defineStyles({
    layout: "relative grow overflow-hidden",
    geometry: "rounded-full data-horizontal:h-1 data-horizontal:w-full data-vertical:h-full data-vertical:w-1",
    appearance: "bg-input",
  }),
);

export const sliderRangeClasses = joinStyles(
  defineStyles({ geometry: "data-horizontal:h-full data-vertical:w-full", appearance: "bg-primary" }),
);

export const sliderThumbClasses = joinStyles(
  defineStyles({
    layout: "grid shrink-0 place-items-center",
    geometry: "rounded-full",
    focus: "focus-within:outline-2 focus-within:outline-offset-2",
    disabled: "data-disabled:pointer-events-none",
  }),
);

export const standardThumbClasses = joinStyles(
  defineStyles({ geometry: "size-target", focus: "focus-within:outline-ring" }),
);

export const sliderKnobClasses = joinStyles(
  defineStyles({ geometry: "size-5 rounded-full", appearance: "bg-primary" }),
);

/*===== Image Comparison =====*/

export const comparisonControlClasses = joinStyles(defineStyles({ interaction: "h-full cursor-ew-resize" }));

export const comparisonThumbClasses = joinStyles(
  defineStyles({
    geometry: "size-12 border-2",
    appearance: "border-brand-surface-gold bg-brand-surface text-brand-surface-foreground shadow-md",
    focus: "focus-within:ring-2 focus-within:ring-brand-surface-gold focus-within:outline-brand-surface-foreground",
  }),
);
