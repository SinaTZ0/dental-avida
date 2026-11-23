import useEmblaCarousel, { type UseEmblaCarouselType } from "embla-carousel-react";
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ComponentProps, KeyboardEvent } from "react";

import { Button } from "#/components/primitive/button/button";
import { twCarousel } from "#/components/primitive/carousel/carousel.styles";
import { useDirection } from "#/components/primitive/direction/direction";
import { joinStyles } from "#/components/primitive/styles";
import { cn } from "#/lib/utils";
import { m } from "#/paraglide/messages";

/*===== Context =====*/

export type CarouselApi = UseEmblaCarouselType[1];
type CarouselProps = {
  opts?: Parameters<typeof useEmblaCarousel>[0];
  plugins?: Parameters<typeof useEmblaCarousel>[1];
  orientation?: "horizontal" | "vertical";
  /** Removes the default inter-slide gutter for full-bleed hero slides. */
  bleed?: boolean;
  setApi?: (api: CarouselApi) => void;
};

type CarouselContextValue = CarouselProps & {
  carouselRef: UseEmblaCarouselType[0];
  api: CarouselApi;
  scrollPrev: () => void;
  scrollNext: () => void;
  canScrollPrev: boolean;
  canScrollNext: boolean;
};

const CarouselContext = createContext<CarouselContextValue | null>(null);

export function useCarousel() {
  const context = useContext(CarouselContext);
  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />");
  }
  return context;
}

/*===== Carousel =====*/

export function Carousel({
  orientation = "horizontal",
  bleed = false,
  opts,
  setApi,
  plugins,
  dir,
  className,
  children,
  ...props
}: ComponentProps<"section"> & CarouselProps) {
  const inheritedDirection = useDirection();
  const direction = opts?.direction ?? (dir === "ltr" || dir === "rtl" ? dir : inheritedDirection);
  const horizontal = orientation === "horizontal";
  const [carouselRef, api] = useEmblaCarousel({ ...opts, axis: horizontal ? "x" : "y", direction }, plugins);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const scrollPrev = useCallback(() => api?.scrollPrev(), [api]);
  const scrollNext = useCallback(() => api?.scrollNext(), [api]);

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    const previousKey = horizontal ? (direction === "rtl" ? "ArrowRight" : "ArrowLeft") : "ArrowUp";
    const nextKey = horizontal ? (direction === "rtl" ? "ArrowLeft" : "ArrowRight") : "ArrowDown";

    if (event.key === previousKey || event.key === nextKey) {
      event.preventDefault();
      if (event.key === previousKey) scrollPrev();
      else scrollNext();
    }
  }

  useEffect(() => {
    if (!api) return;
    setApi?.(api);
  }, [api, setApi]);

  useEffect(() => {
    if (!api) return;

    function updateControls(carousel: NonNullable<CarouselApi>) {
      setCanScrollPrev(carousel.canScrollPrev());
      setCanScrollNext(carousel.canScrollNext());
    }

    updateControls(api);
    api.on("reInit", updateControls).on("select", updateControls);
    return () => {
      api.off("reInit", updateControls).off("select", updateControls);
    };
  }, [api]);

  return (
    <CarouselContext.Provider
      value={{ carouselRef, api, opts, orientation, bleed, scrollPrev, scrollNext, canScrollPrev, canScrollNext }}
    >
      <section
        onKeyDownCapture={handleKeyDown}
        className={cn(joinStyles(twCarousel.root), className)}
        dir={direction}
        aria-roledescription={m.common_carousel()}
        data-slot="carousel"
        {...props}
      >
        {children}
      </section>
    </CarouselContext.Provider>
  );
}

/*===== Slides =====*/

export function CarouselContent({ className, ...props }: ComponentProps<"div">) {
  const { carouselRef, orientation, bleed } = useCarousel();
  const axisStyles =
    orientation === "horizontal"
      ? bleed
        ? twCarousel.horizontalBleedTrack
        : twCarousel.horizontalTrack
      : bleed
        ? twCarousel.verticalBleedTrack
        : twCarousel.verticalTrack;

  return (
    <div ref={carouselRef} className={joinStyles(twCarousel.viewport)} data-slot="carousel-content">
      <div className={cn(joinStyles(twCarousel.track), joinStyles(axisStyles), className)} {...props} />
    </div>
  );
}

export function CarouselItem({ className, ...props }: ComponentProps<"div">) {
  const { orientation, bleed } = useCarousel();
  const axisStyles = bleed ? null : orientation === "horizontal" ? twCarousel.horizontalItem : twCarousel.verticalItem;

  return (
    <div
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- Carousel slides group arbitrary content.
      role="group"
      aria-roledescription={m.common_carousel_slide()}
      data-slot="carousel-item"
      className={cn(joinStyles(twCarousel.item), axisStyles && joinStyles(axisStyles), className)}
      {...props}
    />
  );
}

/*===== Navigation Buttons =====*/

export function CarouselPrevious({
  className,
  variant = "outline",
  size = "icon-sm",
  ...props
}: ComponentProps<typeof Button>) {
  const { orientation, scrollPrev, canScrollPrev } = useCarousel();
  const horizontal = orientation === "horizontal";

  return (
    <Button
      data-slot="carousel-previous"
      variant={variant}
      size={size}
      className={cn(
        joinStyles(twCarousel.arrow),
        joinStyles(horizontal ? twCarousel.horizontalPrevious : twCarousel.verticalPrevious),
        className,
      )}
      disabled={!canScrollPrev}
      onClick={scrollPrev}
      {...props}
    >
      {horizontal ? <ChevronLeftIcon aria-hidden className="rtl:rotate-180" /> : <ChevronUpIcon aria-hidden />}
      <span className="sr-only">{m.common_carousel_previous()}</span>
    </Button>
  );
}

export function CarouselNext({
  className,
  variant = "outline",
  size = "icon-sm",
  ...props
}: ComponentProps<typeof Button>) {
  const { orientation, scrollNext, canScrollNext } = useCarousel();
  const horizontal = orientation === "horizontal";

  return (
    <Button
      data-slot="carousel-next"
      variant={variant}
      size={size}
      className={cn(
        joinStyles(twCarousel.arrow),
        joinStyles(horizontal ? twCarousel.horizontalNext : twCarousel.verticalNext),
        className,
      )}
      disabled={!canScrollNext}
      onClick={scrollNext}
      {...props}
    >
      {horizontal ? <ChevronRightIcon aria-hidden className="rtl:rotate-180" /> : <ChevronDownIcon aria-hidden />}
      <span className="sr-only">{m.common_carousel_next()}</span>
    </Button>
  );
}
