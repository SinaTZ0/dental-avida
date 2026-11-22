import Autoplay from "embla-carousel-autoplay";
import { ExternalLinkIcon, PauseIcon, PlayIcon, StarIcon } from "lucide-react";
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

/*===== Patient Reviews =====*/

const patientReviews = [
  {
    id: "explanation",
    score: 5,
    quote: m.home_reviews_sample_explanation,
    author: m.home_reviews_sample_explanation_author,
    tag: m.home_reviews_sample_explanation_tag,
  },
  {
    id: "options",
    score: 5,
    quote: m.home_reviews_sample_options,
    author: m.home_reviews_sample_options_author,
    tag: m.home_reviews_sample_options_tag,
  },
  {
    id: "child",
    score: 4.9,
    quote: m.home_reviews_sample_child_visit,
    author: m.home_reviews_sample_child_visit_author,
    tag: m.home_reviews_sample_child_visit_tag,
  },
  {
    id: "cosmetic",
    score: 5,
    quote: m.home_reviews_sample_cosmetic,
    author: m.home_reviews_sample_cosmetic_author,
    tag: m.home_reviews_sample_cosmetic_tag,
  },
  {
    id: "hygiene",
    score: 4.9,
    quote: m.home_reviews_sample_hygiene,
    author: m.home_reviews_sample_hygiene_author,
    tag: m.home_reviews_sample_hygiene_tag,
  },
];

const reducedMotion = "(prefers-reduced-motion: reduce)";

function ReviewScore({ score }: { score: number }) {
  return (
    <p className="flex items-center gap-1.5 text-h4 font-bold text-foreground tabular-nums">
      <StarIcon aria-hidden className="size-4 fill-current text-brand-gold" />
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
      className="mt-4 flex flex-1 flex-col justify-between"
    >
      <CarouselContent aria-live={paused ? "polite" : "off"}>
        {patientReviews.map(({ id, score, quote, author, tag }, index) => (
          <CarouselItem
            key={id}
            aria-hidden={selected !== index}
            aria-label={m.common_carousel_position({ current: index + 1, total: patientReviews.length })}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <ReviewScore score={score} />
              <span className="home-review-tag text-caption">{tag()}</span>
            </div>
            <blockquote className="home-review-quote mt-3.5 text-body text-foreground">«{quote()}»</blockquote>
            <p className="home-review-author mt-3 text-caption text-muted-foreground">— {author()}</p>
          </CarouselItem>
        ))}
      </CarouselContent>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3.5">
        <span aria-hidden className="text-caption text-muted-foreground tabular-nums">
          {m.common_carousel_position({ current: selected + 1, total: patientReviews.length })}
        </span>
        <div className="flex items-center gap-1.5">
          <div className="motion-reduce:hidden">
            <Button
              variant="outline"
              size="icon-xs"
              aria-label={paused ? m.common_carousel_play() : m.common_carousel_pause()}
              onClick={() => setPaused(!paused)}
            >
              {paused ? <PlayIcon aria-hidden /> : <PauseIcon aria-hidden />}
            </Button>
          </div>
          <div className="flex items-center gap-1.5" onFocusCapture={() => setPaused(true)}>
            <CarouselPrevious variant="outline" size="icon-xs" className="static m-0" />
            <CarouselNext variant="outline" size="icon-xs" className="static m-0" />
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
      <div className="home-reviews-head">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="patient-reviews-title" className="text-h3 text-foreground">
            {m.home_reviews_title()}
          </h2>
          {reviews?.rating && (
            <p className="text-caption text-muted-foreground tabular-nums">
              {m.home_reviews_count({ count: reviews.rating.count })}
            </p>
          )}
        </div>
        {reviews?.url && (
          <SiteLink href={reviews.url} className="home-text-link mt-2">
            {m.home_reviews_link()}
            <ExternalLinkIcon aria-hidden className="size-4" />
          </SiteLink>
        )}
      </div>
      <SampleReviews />
    </section>
  );
}
