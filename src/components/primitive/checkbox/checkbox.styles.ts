import { defineStyles, joinStyles } from "../styles";

/*===== Checkbox =====*/

const twCheckboxStyles = defineStyles({
  layout: "peer relative flex size-5 shrink-0 items-center justify-center after:absolute after:-inset-2.5",
  geometry: "rounded-sm border border-input",
  appearance: "bg-card text-primary-foreground",
  interaction: "transition-colors duration-150 outline-none",
  focus: "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
  disabled: "disabled:cursor-not-allowed disabled:opacity-50",
  invalid: "aria-invalid:border-destructive",
  state: "data-checked:border-primary data-checked:bg-primary",
  motion: "motion-reduce:transition-none",
});

const twCheckboxIndicatorStyles = defineStyles({
  layout: "grid place-content-center",
  appearance: "text-current",
  icon: "[&>svg]:size-3.5",
});

export const checkboxClasses = joinStyles(twCheckboxStyles);
export const checkboxIndicatorClasses = joinStyles(twCheckboxIndicatorStyles);
