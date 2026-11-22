import { cva } from "class-variance-authority";
import { composeStyles, defineStyles, joinStyles } from "../styles";

/*===== Tabs Styles =====*/

const twTabsStyles = defineStyles({
  layout: "group/tabs flex gap-2 data-horizontal:flex-col",
});

const twRootVariant = defineStyles({
  default: {},
  guide: {
    layout: "gap-4",
    geometry: "p-4 sm:p-6 md:p-7",
    appearance: "bg-transparent",
  },
});

/*===== List Styles =====*/

const twListStyles = defineStyles({
  layout: "group/tabs-list inline-flex w-fit items-center justify-center group-data-vertical/tabs:flex-col",
  geometry: "rounded-md p-1 data-[variant=line]:rounded-none",
  appearance: "text-muted-foreground",
});

// `data-variant` stays on the list as well, because TabsTrigger styles itself from it.
const twVariant = defineStyles({
  default: {
    appearance: "bg-muted",
  },
  guide: {
    layout: "relative flex-wrap gap-1 sm:flex-nowrap",
    geometry: "rounded-none border-b p-0",
    appearance: "border-border bg-transparent",
  },
  line: {
    layout: "gap-1",
    appearance: "bg-transparent",
  },
});

/*===== Trigger Styles =====*/

const twTriggerStyles = defineStyles({
  layout:
    "relative inline-flex flex-1 items-center justify-center gap-1.5 group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start",
  geometry: "min-h-target min-w-target rounded-sm border px-3 py-1",
  geometryIcon: "has-data-[icon=inline-end]:pe-2 has-data-[icon=inline-start]:ps-2",
  typography: "text-nav whitespace-nowrap",
  appearance: "border-transparent text-muted-foreground",
  interaction: "motion-safe:transition-colors motion-safe:duration-150",
  hover: "hover:text-brand-text",
  focus:
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid",
  disabled:
    "disabled:pointer-events-none disabled:opacity-45 aria-disabled:pointer-events-none aria-disabled:opacity-45",
  state:
    "data-active:bg-card data-active:text-foreground group-data-[variant=default]/tabs-list:data-active:border-brand-text group-data-[variant=default]/tabs-list:data-active:shadow-sm",
  stateGuide:
    "group-data-[variant=guide]/tabs-list:rounded-none group-data-[variant=guide]/tabs-list:text-body-sm group-data-[variant=guide]/tabs-list:sm:text-body group-data-[variant=guide]/tabs-list:data-active:bg-transparent group-data-[variant=guide]/tabs-list:data-active:font-bold group-data-[variant=guide]/tabs-list:data-active:text-brand-jade",
  // The line variant drops the active fill and shows the current-nav marker instead: `brand-text` over a gold
  // underline (`after:`).
  stateLine:
    "group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:data-active:bg-transparent group-data-[variant=line]/tabs-list:data-active:text-brand-text group-data-[variant=line]/tabs-list:data-active:shadow-none group-data-[variant=line]/tabs-list:data-active:after:opacity-100",
  stateIndicator:
    "after:absolute after:bg-gold after:opacity-0 after:transition-opacity group-data-horizontal/tabs:after:inset-x-0 group-data-horizontal/tabs:after:-bottom-1.25 group-data-horizontal/tabs:after:h-0.5 group-data-vertical/tabs:after:inset-y-0 group-data-vertical/tabs:after:-inset-e-1 group-data-vertical/tabs:after:w-0.5",
  icon: "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
});

/*===== Guide Indicator =====*/

const twGuideIndicatorStyles = defineStyles({
  layout: "pointer-events-none absolute start-(--active-tab-left) -bottom-px rtl:start-(--active-tab-right)",
  geometry: "h-0.75 w-(--active-tab-width) rounded-full",
  appearance: "bg-brand-gold",
  motion: "motion-safe:transition-[inset-inline-start,width] motion-safe:duration-250 motion-safe:ease-out",
});

/*===== Content Styles =====*/

const twContentStyles = defineStyles({
  layout: "flex-1",
  typography: "text-body-sm",
  focus:
    "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid",
});

/*===== Class Composition =====*/

const tabsVariants = cva(joinStyles(twTabsStyles), {
  variants: {
    variant: composeStyles(twRootVariant),
  },
  defaultVariants: { variant: "default" },
});

const tabsListVariants = cva(joinStyles(twListStyles), {
  variants: {
    variant: composeStyles(twVariant),
  },
  defaultVariants: { variant: "default" },
});

const tabsTriggerClasses = joinStyles(twTriggerStyles);
const tabsGuideIndicatorClasses = joinStyles(twGuideIndicatorStyles);
const tabsContentClasses = joinStyles(twContentStyles);

export { tabsVariants, tabsListVariants, tabsTriggerClasses, tabsContentClasses, tabsGuideIndicatorClasses, twVariant };
