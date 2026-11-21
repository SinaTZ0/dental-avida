import Autoplay from "embla-carousel-autoplay";
import { ExternalLinkIcon, MessageSquareTextIcon, PauseIcon, PlayIcon, StarIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "#/components/primitive/button/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "#/components/primitive/carousel/carousel";
import { SiteLink } from "#/components/shared/site-link/site-link";
import { clinicDetails } from "#/lib/site";
import { m } from "#/paraglide/messages";

/*===== Review Samples =====*/

const samples = [
  { score: 4.8, quote: m.home_reviews_sample_explanation },
  { score: 5, quote: m.home_reviews_sample_options },
  { score: 4.9, quote: m.home_reviews_sample_child_visit },
];

const reducedMotion = "(prefers-reduced-motion: reduce)";

function ReviewScore({ score }: { score: number }) {
  return (
    <p className="flex items-center gap-2 text-h3">
      <StarIcon aria-hidden className="size-4 fill-current text-brand-jade" />
      {m.home_reviews_rating({ score })}
    </p>
  );
}

/*===== Sample Carousel =====*/

function SampleReviews() {
  const [api, setApi] = useState<CarouselApi>();
  const [selected, setSelected] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [plugins] = useState(() => [Autoplay({ delay: 6500, playOnInit: false, stopOnFocusIn: false })]);
  const shouldAutoplay = !paused && !hovered;

  useEffect(() => {
    if (!api) return;

    function select(carousel: NonNullable<CarouselApi>) {
      setSelected(carousel.selectedScrollSnap());
    }

    function pauseOnDrag() {
      setPaused(true);
    }

    select(api);
    api.on("select", select).on("reInit", select).on("pointerDown", pauseOnDrag);
    return () => {
      api.off("select", select).off("reInit", select).off("pointerDown", pauseOnDrag);
    };
  }, [api]);

  useEffect(() => {
    if (!api) return;

    const preference = window.matchMedia(reducedMotion);
    const autoplay = api.plugins().autoplay;

    function updatePlayback() {
      if (shouldAutoplay && !preference.matches) autoplay.play();
      else autoplay.stop();
    }

    updatePlayback();
    api.on("reInit", updatePlayback);
    preference.addEventListener("change", updatePlayback);
    return () => {
      api.off("reInit", updatePlayback);
      preference.removeEventListener("change", updatePlayback);
      autoplay.stop();
    };
  }, [api, shouldAutoplay]);

  return (
    <Carousel
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- The reviews card already supplies the landmark.
      role="group"
      aria-labelledby="patient-reviews-title"
      opts={{ loop: true, breakpoints: { [reducedMotion]: { duration: 0 } } }}
      plugins={plugins}
      setApi={setApi}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="mt-2"
    >
      <CarouselContent aria-live={paused ? "polite" : "off"}>
        {samples.map(({ score, quote }, index) => (
          <CarouselItem
            key={score}
            aria-hidden={selected !== index}
            aria-label={m.common_carousel_position({ current: index + 1, total: samples.length })}
          >
            <ReviewScore score={score} />
            <blockquote className="mt-2 border-s-2 border-brand-jade/40 ps-3 text-body-sm text-muted-foreground">
              {quote()}
            </blockquote>
          </CarouselItem>
        ))}
      </CarouselContent>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-1">
        <span aria-hidden className="text-caption text-muted-foreground tabular-nums">
          {m.common_carousel_position({ current: selected + 1, total: samples.length })}
        </span>
        <div className="flex items-center">
          <div className="motion-reduce:hidden">
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={paused ? m.common_carousel_play() : m.common_carousel_pause()}
              onClick={() => setPaused(!paused)}
            >
              {paused ? <PlayIcon aria-hidden /> : <PauseIcon aria-hidden />}
            </Button>
          </div>
          <div className="flex items-center" onFocusCapture={() => setPaused(true)}>
            <CarouselPrevious variant="ghost" size="icon-xs" className="static m-0" />
            <CarouselNext variant="ghost" size="icon-xs" className="static m-0" />
          </div>
        </div>
      </div>
    </Carousel>
  );
}

/*===== Reviews Card =====*/

export function HomeReviews() {
  const { reviews } = clinicDetails;

  return (
    <section aria-labelledby="patient-reviews-title" className="home-appointment-reviews">
      <MessageSquareTextIcon aria-hidden className="size-6 text-brand-jade" />
      <div>
        <h2 id="patient-reviews-title" className="text-h3">
          {reviews ? m.home_reviews_title() : m.home_reviews_samples()}
        </h2>
        {reviews ? (
          <>
            {reviews.rating && (
              <div className="mt-2">
                <ReviewScore score={reviews.rating.score} />
                <p className="text-body-sm text-muted-foreground">
                  {m.home_reviews_count({ count: reviews.rating.count })}
                </p>
              </div>
            )}
            <SiteLink href={reviews.url} className="home-text-link">
              {m.home_reviews_link()}
              <ExternalLinkIcon aria-hidden className="size-4" />
            </SiteLink>
          </>
        ) : (
          <SampleReviews />
        )}
      </div>
    </section>
  );
}
