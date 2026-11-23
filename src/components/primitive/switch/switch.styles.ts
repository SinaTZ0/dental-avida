import { defineStyles, joinStyles } from "../styles";

/*===== Switch =====*/

const twSwitchStyles = defineStyles({
  layout:
    "peer group/switch relative inline-flex h-6 w-11 shrink-0 items-center after:absolute after:-inset-x-2 after:-inset-y-2.5",
  geometry: "rounded-full border",
  appearance: "data-checked:border-primary data-checked:bg-primary data-unchecked:border-input data-unchecked:bg-muted",
  interaction: "transition-colors duration-150 outline-none",
  focus: "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
  disabled: "data-disabled:cursor-not-allowed data-disabled:opacity-50",
  motion: "motion-reduce:transition-none",
});

const twSwitchThumbStyles = defineStyles({
  layout: "pointer-events-none block size-4.5 rounded-full",
  appearance: "bg-foreground shadow-sm data-checked:bg-primary-foreground",
  interaction: "transition-transform duration-150",
  state:
    "data-checked:translate-x-5 rtl:data-checked:-translate-x-5 data-unchecked:translate-x-0.5 rtl:data-unchecked:-translate-x-0.5",
  motion: "motion-reduce:transition-none",
});

export const switchClasses = joinStyles(twSwitchStyles);
export const switchThumbClasses = joinStyles(twSwitchThumbStyles);
