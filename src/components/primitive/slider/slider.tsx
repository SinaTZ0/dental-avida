import { Slider as SliderPrimitive } from "@base-ui/react/slider";
import { ChevronsLeftRightIcon } from "lucide-react";

import {
  comparisonControlClasses,
  comparisonThumbClasses,
  sliderClasses,
  sliderControlClasses,
  sliderKnobClasses,
  sliderRangeClasses,
  sliderThumbClasses,
  sliderTrackClasses,
  standardThumbClasses,
} from "#/components/primitive/slider/slider.styles";
import { cn } from "#/lib/utils";

/*===== Slider =====*/

type SliderProps<Value extends number | readonly number[]> = SliderPrimitive.Root.Props<Value> & {
  variant?: "default" | "comparison";
  label: string | ((index: number) => string);
};

export function Slider<Value extends number | readonly number[]>({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  variant = "default",
  label,
  ...props
}: SliderProps<Value>) {
  const values = value ?? defaultValue;
  const thumbCount = typeof values === "object" ? values.length : 1;
  const isComparison = variant === "comparison";

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      className={cn(sliderClasses, className)}
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      thumbAlignment={isComparison ? "center" : "edge"}
      {...props}
    >
      <SliderPrimitive.Control className={cn(sliderControlClasses, isComparison && comparisonControlClasses)}>
        {!isComparison && (
          <SliderPrimitive.Track data-slot="slider-track" className={sliderTrackClasses}>
            <SliderPrimitive.Indicator data-slot="slider-range" className={sliderRangeClasses} />
          </SliderPrimitive.Track>
        )}
        {Array.from({ length: thumbCount }, (_, index) => (
          <SliderPrimitive.Thumb
            key={index}
            data-slot="slider-thumb"
            index={index}
            getAriaLabel={typeof label === "string" ? () => label : label}
            className={cn(sliderThumbClasses, isComparison ? comparisonThumbClasses : standardThumbClasses)}
          >
            {isComparison ? (
              <ChevronsLeftRightIcon aria-hidden className="size-6" />
            ) : (
              <span aria-hidden className={sliderKnobClasses} />
            )}
          </SliderPrimitive.Thumb>
        ))}
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  );
}
