import { Link } from "@tanstack/react-router";
import Autoplay from "embla-carousel-autoplay";
import { ArrowLeftIcon, CalendarDaysIcon, ClockIcon, PauseIcon, PhoneIcon, PlayIcon, SparklesIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "#/components/primitive/badge/badge";
import { Button } from "#/components/primitive/button/button";
import { buttonVariants } from "#/components/primitive/button/button.styles";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "#/components/primitive/carousel/carousel";
import { AvidaSmile } from "#/components/shared/avida-smile/avida-smile";
import { useEffectiveCampaign } from "#/components/shared/campaign/use-effective-campaign";
import { SiteLink } from "#/components/shared/site-link/site-link";
import { readCampaignAttribution } from "#/lib/campaign-attribution";
import { canPlayHomeIntro, onHomeIntroCompleted } from "#/lib/home-intro-state";
import { formatNumber } from "#/lib/locale";
import { clinicDetails, homeSections } from "#/lib/site";
import type { DiscountCode } from "#/orpc/campaign/constants";
import type { CampaignDiscount, PublicCampaign } from "#/orpc/campaign/contract";
import { client } from "#/orpc/client";
import { m } from "#/paraglide/messages";
import campaignHeroUrl from "#/routes/black_friday/assets/campaign-hero.webp";
import offerImplantCrownUrl from "#/routes/home/assets/offer-implant-crown.webp";
import offerImplantFixtureUrl from "#/routes/home/assets/offer-implant-fixture.webp";
import offerLaminateUrl from "#/routes/home/assets/offer-laminate.webp";
import patient720 from "#/routes/home/assets/patient-720.webp";
import patientDark720 from "#/routes/home/assets/patient-dark-720.webp";
import patientDark from "#/routes/home/assets/patient-dark.webp";
import patient from "#/routes/home/assets/patient.webp";
import { BlurText } from "#/routes/home/components/blur-text";

/*===== Constants & Offer Assets =====*/

const HERO_SMILE_INTRO_DELAY_MS = 500;
const CAROUSEL_AUTOPLAY_DELAY_MS = 6500;
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

// C1-continuous periodic river curves (period 1440, tiled across 2880) so each current loops seamlessly.
// Extra vertical apron (y: 120 → 180) keeps the tilted river bank sealed below the hero clip edge at any width.
const HERO_RIVER_BACK_PATH =
  "M0 44 C260 12 460 76 720 44 C980 12 1180 76 1440 44 C1700 12 1900 76 2160 44 C2420 12 2620 76 2880 44 L2880 180 L0 180 Z";
const HERO_RIVER_MID_PATH =
  "M0 58 C240 94 520 22 780 54 C1040 86 1200 22 1440 58 C1680 94 1960 22 2220 54 C2480 86 2640 22 2880 58 L2880 180 L0 180 Z";
const HERO_RIVER_FRONT_CREST_PATH =
  "M0 70 C240 30 480 102 720 66 C960 30 1200 110 1440 70 C1680 30 1920 102 2160 66 C2400 30 2640 110 2880 70";
const HERO_RIVER_FRONT_PATH = `${HERO_RIVER_FRONT_CREST_PATH} L2880 180 L0 180 Z`;

const OFFER_SLIDE_MEDIA: Record<
  DiscountCode,
  {
    readonly image: string;
    readonly alt: () => string;
    readonly description: () => string;
  }
> = {
  implant_fixture: {
    image: offerImplantFixtureUrl,
    alt: m.home_hero_offer_implant_fixture_alt,
    description: m.home_hero_offer_implant_fixture_desc,
  },
  implant_with_crown: {
    image: offerImplantCrownUrl,
    alt: m.home_hero_offer_implant_with_crown_alt,
    description: m.home_hero_offer_implant_with_crown_desc,
  },
  laminate: {
    image: offerLaminateUrl,
    alt: m.home_hero_offer_laminate_alt,
    description: m.home_hero_offer_laminate_desc,
  },
};

function trackHeroCampaignClick() {
  const { source } = readCampaignAttribution();
  void client.campaign.trackEvent({ kind: "banner_click", source }).catch(() => undefined);
}

/*===== Shared River Edge =====*/

function HomeHeroRiver() {
  return (
    <div className="home-hero-river" aria-hidden="true">
      <svg className="home-hero-river-wave home-hero-river-wave-back" viewBox="0 0 2880 180" preserveAspectRatio="none">
        <path d={HERO_RIVER_BACK_PATH} />
      </svg>
      <svg className="home-hero-river-wave home-hero-river-wave-mid" viewBox="0 0 2880 180" preserveAspectRatio="none">
        <path d={HERO_RIVER_MID_PATH} />
      </svg>
      <svg
        className="home-hero-river-wave home-hero-river-wave-front"
        viewBox="0 0 2880 180"
        preserveAspectRatio="none"
      >
        <path d={HERO_RIVER_FRONT_PATH} />
        <path d={HERO_RIVER_FRONT_CREST_PATH} className="home-hero-river-crest" />
      </svg>
    </div>
  );
}

/*===== Normal Clinic Slide =====*/

function NormalHeroContent({
  isPrimaryHeading,
  headerRevealActive,
  smilePlayTrigger,
}: {
  isPrimaryHeading: boolean;
  headerRevealActive: boolean;
  smilePlayTrigger: number;
}) {
  const heroTitle = m.home_hero_title();
  const heroTitleWordCount = heroTitle.trim().split(/\s+/).length;

  const appointmentLabel = clinicDetails.bookingUrl
    ? m.home_appointment_online
    : clinicDetails.phone || clinicDetails.mobile
      ? m.home_appointment_phone
      : m.home_appointment_plan;

  const HeadingTag = isPrimaryHeading ? "h1" : "h2";

  return (
    <>
      <div className="home-hero-inner mx-auto flex max-w-site-wide items-center px-4 sm:px-6">
        <div className="home-hero-copy relative z-10">
          <HeadingTag id={isPrimaryHeading ? "hero-title" : undefined} className="home-hero-title text-hero">
            <BlurText text={heroTitle} delay={110} direction="top" active={headerRevealActive} />{" "}
            <BlurText
              text={m.home_hero_emphasis()}
              delay={110}
              startIndex={heroTitleWordCount}
              direction="top"
              active={headerRevealActive}
              shiny
              className="block text-brand-text"
            />
          </HeadingTag>
          <div className="home-hero-smile-wrap" data-home-hero-smile-wrap="" aria-hidden>
            <AvidaSmile className="home-hero-smile" interactive playTrigger={smilePlayTrigger} />
          </div>
          <p className="home-hero-intro mt-4 max-w-lg text-body-lg text-muted-foreground">{m.home_hero_intro()}</p>
          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link
              to="/"
              hash={homeSections.appointments}
              className={buttonVariants({ variant: "highlight", size: "hero" })}
            >
              <CalendarDaysIcon data-icon="inline-start" aria-hidden />
              {appointmentLabel()}
            </Link>
            <a href={`#${homeSections.services}`} className="home-text-link">
              {m.home_view_services()}
              <ArrowLeftIcon aria-hidden className="size-4 ltr:rotate-180" />
            </a>
          </div>
          {(clinicDetails.phone || clinicDetails.mobile) && (
            <div className="home-hero-meta text-body-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <ClockIcon aria-hidden className="size-4 text-brand-gold" />
                {m.home_hero_hours_short()}
              </span>
              {clinicDetails.mobile && (
                <>
                  <span className="home-hero-meta-sep" aria-hidden />
                  <SiteLink href={`tel:${clinicDetails.mobile.number}`} className="home-hero-phone">
                    <PhoneIcon aria-hidden className="size-4 text-brand-text" />
                    <span>{m.home_hero_phone_prefix()}</span>
                    <bdi dir="ltr" className="font-bold text-foreground tabular-nums">
                      {clinicDetails.mobile.label()}
                    </bdi>
                  </SiteLink>
                </>
              )}
              {clinicDetails.phone && (
                <>
                  <span className="home-hero-meta-sep" aria-hidden />
                  <SiteLink href={`tel:${clinicDetails.phone.number}`} className="home-hero-phone">
                    {!clinicDetails.mobile && <PhoneIcon aria-hidden className="size-4 text-brand-text" />}
                    {!clinicDetails.mobile && <span>{m.home_hero_phone_prefix()}</span>}
                    <bdi dir="ltr" className="font-bold text-foreground tabular-nums">
                      {clinicDetails.phone.label()}
                    </bdi>
                  </SiteLink>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <img
        src={patient}
        srcSet={`${patient720} 720w, ${patient} 1264w`}
        sizes="(width < 48rem) 100vw, 68vw"
        width={1264}
        height={848}
        fetchPriority={isPrimaryHeading ? "high" : "auto"}
        alt={m.home_hero_image_alt()}
        className="home-hero-photo home-hero-photo-light"
      />
      <img
        src={patientDark}
        srcSet={`${patientDark720} 720w, ${patientDark} 1264w`}
        sizes="(width < 48rem) 100vw, 68vw"
        width={1264}
        height={848}
        fetchPriority={isPrimaryHeading ? "high" : "auto"}
        alt={m.home_hero_image_alt()}
        className="home-hero-photo home-hero-photo-dark"
      />
    </>
  );
}

/*===== Black Friday General Slide =====*/

function CampaignOverviewSlide({ campaign }: { campaign: PublicCampaign }) {
  return (
    <div className="home-hero-slide relative isolate overflow-hidden">
      <div className="home-hero-inner mx-auto flex max-w-site-wide items-center px-4 sm:px-6">
        <div className="home-hero-copy relative z-10">
          <div className="mb-4 flex flex-wrap items-center gap-2.5">
            <Badge variant="crimson-solid">
              <SparklesIcon aria-hidden />
              {m.campaign_page_up_to_discount({ percent: campaign.maxDiscountPercent })}
            </Badge>
            <Badge variant="highlight-outline">
              {m.campaign_page_spots_left({ remaining: campaign.remainingCapacity })}
            </Badge>
          </div>

          <h1 id="hero-title" className="home-hero-title text-hero text-foreground">
            {m.campaign_page_title()}
          </h1>

          <p className="home-hero-intro mt-4 max-w-lg text-body-lg text-foreground/85">{m.campaign_page_intro()}</p>

          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2.5">
            <Link
              to="/black-friday"
              onClick={trackHeroCampaignClick}
              className={buttonVariants({ variant: "highlight", size: "hero" })}
            >
              <span>{m.campaign_modal_cta()}</span>
              <ArrowLeftIcon aria-hidden data-icon="inline-end" className="ltr:rotate-180" />
            </Link>
            <Link
              to="/black-friday"
              hash="bf-discounts-title"
              onClick={trackHeroCampaignClick}
              className="home-text-link"
            >
              {m.home_hero_offer_all_cta()}
              <ArrowLeftIcon aria-hidden className="size-4 ltr:rotate-180" />
            </Link>
          </div>
        </div>
      </div>

      <img
        src={campaignHeroUrl}
        width={1376}
        height={768}
        fetchPriority="high"
        alt={m.home_hero_campaign_art_alt()}
        className="home-hero-bf-art"
      />
      <div className="home-hero-bf-scrim" aria-hidden="true" />
    </div>
  );
}

/*===== Black Friday Offer Slide =====*/

function CampaignOfferSlide({
  discount,
  campaign,
  isTop,
}: {
  discount: CampaignDiscount;
  campaign: PublicCampaign;
  isTop: boolean;
}) {
  const media = OFFER_SLIDE_MEDIA[discount.code];

  return (
    <div className="home-hero-slide relative isolate overflow-hidden">
      <div className="home-hero-inner mx-auto flex max-w-site-wide items-center px-4 sm:px-6">
        <div className="home-hero-copy relative z-10">
          <div className="mb-4 flex flex-wrap items-center gap-2.5">
            <Badge variant="crimson-solid">
              <SparklesIcon aria-hidden />
              {isTop
                ? m.home_hero_offer_top_badge()
                : m.campaign_page_spots_left({ remaining: campaign.remainingCapacity })}
            </Badge>
            <Badge variant="highlight-outline">{m.campaign_ribbon_badge()}</Badge>
          </div>

          <h2 className="home-hero-title text-hero text-foreground">{discount.title}</h2>

          <p className="home-hero-intro mt-3.5 max-w-lg text-body-lg text-foreground/85">{media.description()}</p>

          {/*------ Ruled Cash vs. Installment Discount Strip ------*/}
          <dl className="home-hero-offer-metrics mt-6">
            <div className="flex flex-col gap-1">
              <dt className="text-caption font-bold text-muted-foreground">{m.home_hero_offer_cash_label()}</dt>
              <dd className="text-display leading-none font-black text-brand-gold tabular-nums">
                {m.campaign_percent_value({ percent: discount.cashPercent })}
              </dd>
            </div>
            <div className="flex flex-col gap-1 border-s border-border ps-6">
              <dt className="text-caption font-bold text-muted-foreground">{m.home_hero_offer_installment_label()}</dt>
              <dd className="text-h1 leading-none font-extrabold text-foreground tabular-nums">
                {m.campaign_percent_value({ percent: discount.installmentPercent })}
              </dd>
            </div>
          </dl>

          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2.5">
            <Link
              to="/black-friday"
              hash="campaign-lead-form"
              onClick={trackHeroCampaignClick}
              className={buttonVariants({ variant: "highlight", size: "hero" })}
            >
              <span>{m.home_hero_offer_cta()}</span>
              <ArrowLeftIcon aria-hidden data-icon="inline-end" className="ltr:rotate-180" />
            </Link>
            <Link
              to="/black-friday"
              hash="bf-discounts-title"
              onClick={trackHeroCampaignClick}
              className="home-text-link"
            >
              {m.home_hero_offer_all_cta()}
              <ArrowLeftIcon aria-hidden className="size-4 ltr:rotate-180" />
            </Link>
          </div>
        </div>
      </div>

      <img src={media.image} width={1376} height={768} alt={media.alt()} className="home-hero-bf-art" />
      <div className="home-hero-bf-scrim" aria-hidden="true" />
    </div>
  );
}

/*===== Campaign Hero Carousel =====*/

type HeroSlideTab = {
  readonly key: string;
  readonly label: string;
  readonly accent?: string;
};

function CampaignHeroCarousel({ campaign }: { campaign: PublicCampaign }) {
  const [api, setApi] = useState<CarouselApi>();
  const [selected, setSelected] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [plugins] = useState(() => [
    Autoplay({ delay: CAROUSEL_AUTOPLAY_DELAY_MS, playOnInit: false, stopOnFocusIn: false }),
  ]);

  const shouldAutoplay = !paused && !hovered;
  const topCash = campaign.discounts.length > 0 ? Math.max(...campaign.discounts.map((row) => row.cashPercent)) : 0;

  const tabs: HeroSlideTab[] = [
    {
      key: "campaign",
      label: m.home_hero_carousel_tab_campaign(),
      accent: m.campaign_percent_value({ percent: campaign.maxDiscountPercent }),
    },
    ...campaign.discounts.map((row) => ({
      key: row.id,
      label: row.title,
      accent: m.campaign_percent_value({ percent: row.cashPercent }),
    })),
    {
      key: "clinic",
      label: m.home_hero_carousel_tab_clinic(),
    },
  ];

  const totalSlides = tabs.length;

  useEffect(() => {
    if (!api) return;

    function handleSelect(carousel: NonNullable<CarouselApi>) {
      setSelected(carousel.selectedScrollSnap());
    }

    function pauseOnDrag() {
      setPaused(true);
    }

    handleSelect(api);
    api.on("select", handleSelect).on("reInit", handleSelect).on("pointerDown", pauseOnDrag);
    return () => {
      api.off("select", handleSelect).off("reInit", handleSelect).off("pointerDown", pauseOnDrag);
    };
  }, [api]);

  useEffect(() => {
    if (!api) return;

    const preference = window.matchMedia(REDUCED_MOTION_QUERY);
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

  const jumpToSlide = (index: number) => {
    setPaused(true);
    api?.scrollTo(index);
  };

  return (
    <section
      aria-label={m.home_hero_carousel_label()}
      className="home-hero home-hero-carousel relative isolate overflow-hidden bg-hero-surface"
    >
      <Carousel
        // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- The outer hero section already supplies the landmark.
        role="group"
        aria-label={m.home_hero_carousel_label()}
        bleed
        opts={{ loop: true, breakpoints: { [REDUCED_MOTION_QUERY]: { duration: 0 } } }}
        plugins={plugins}
        setApi={setApi}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <CarouselContent aria-live={paused ? "polite" : "off"}>
          {/*------ Slide 1: General Black Friday Campaign ------*/}
          <CarouselItem
            aria-hidden={selected !== 0}
            inert={selected !== 0}
            aria-label={m.common_carousel_position({ current: 1, total: totalSlides })}
          >
            <CampaignOverviewSlide campaign={campaign} />
          </CarouselItem>

          {/*------ Offer Slides (Live DB Discounts) ------*/}
          {campaign.discounts.map((discount, offset) => {
            const slideIndex = offset + 1;
            const isTop = topCash > 0 && discount.cashPercent === topCash;
            return (
              <CarouselItem
                key={discount.id}
                aria-hidden={selected !== slideIndex}
                inert={selected !== slideIndex}
                aria-label={m.common_carousel_position({ current: slideIndex + 1, total: totalSlides })}
              >
                <CampaignOfferSlide discount={discount} campaign={campaign} isTop={isTop} />
              </CarouselItem>
            );
          })}

          {/*------ Final Slide: Normal Clinic Hero ------*/}
          <CarouselItem
            aria-hidden={selected !== totalSlides - 1}
            inert={selected !== totalSlides - 1}
            aria-label={m.common_carousel_position({ current: totalSlides, total: totalSlides })}
          >
            <div className="home-hero-slide relative isolate overflow-hidden">
              <NormalHeroContent isPrimaryHeading={false} headerRevealActive smilePlayTrigger={0} />
            </div>
          </CarouselItem>
        </CarouselContent>

        {/*===== Integrated Editorial Control Dock =====*/}
        <div className="home-hero-carousel-dock">
          <div className="mx-auto max-w-site-wide px-4 sm:px-6">
            <div className="home-hero-carousel-bar">
              {/*------ Desktop & Tablet Ruled Slide Tabs ------*/}
              <div className="home-hero-carousel-tabs hidden md:flex">
                {tabs.map((tab, index) => {
                  const isActive = selected === index;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      data-active={isActive ? "true" : undefined}
                      aria-current={isActive ? "true" : undefined}
                      aria-label={m.home_hero_carousel_goto({ slide: tab.label })}
                      onClick={() => jumpToSlide(index)}
                      className="home-hero-carousel-tab"
                    >
                      <span className="home-hero-carousel-tab-num tabular-nums">
                        {formatNumber(index + 1, { minimumIntegerDigits: 2 })}
                      </span>
                      <span className="min-w-0 truncate">{tab.label}</span>
                      {tab.accent && <span className="home-hero-carousel-tab-accent tabular-nums">{tab.accent}</span>}
                    </button>
                  );
                })}
              </div>

              {/*------ Mobile Compact Segmented Progress ------*/}
              <div className="flex flex-1 items-center gap-3 md:hidden">
                <div className="flex flex-1 items-center gap-1.5">
                  {tabs.map((tab, index) => {
                    const isActive = selected === index;
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        data-active={isActive ? "true" : undefined}
                        aria-current={isActive ? "true" : undefined}
                        aria-label={m.home_hero_carousel_goto({ slide: tab.label })}
                        onClick={() => jumpToSlide(index)}
                        className="home-hero-carousel-pip"
                      />
                    );
                  })}
                </div>
                <span aria-hidden className="shrink-0 text-caption font-bold text-muted-foreground tabular-nums">
                  {m.common_carousel_position({ current: selected + 1, total: totalSlides })}
                </span>
              </div>

              {/*------ Playback & Prev/Next Controls ------*/}
              <div
                className="flex shrink-0 items-center gap-1.5 border-s border-border/70 ps-3"
                onFocusCapture={() => setPaused(true)}
              >
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
                <CarouselPrevious variant="outline" size="icon-xs" className="static m-0" />
                <CarouselNext variant="outline" size="icon-xs" className="static m-0" />
              </div>
            </div>
          </div>
        </div>
      </Carousel>

      <HomeHeroRiver />
    </section>
  );
}

/*===== Home Hero Entry =====*/

/**
 * Homepage hero: displays the standard Avida clinic hero with carved-smile intro choreography in normal mode,
 * and upgrades into a 5-slide Black Friday carousel (general campaign → 3 offer slides → normal clinic hero) while
 * the Black Friday campaign theme is active (or previewed in `/review`).
 */
export function HomeHero() {
  const { effectiveCampaign } = useEffectiveCampaign();
  const campaignCarouselActive = effectiveCampaign.themeActive && effectiveCampaign.status === "active";

  const [smilePlayTrigger, setSmilePlayTrigger] = useState(0);
  // Wait for the carved-smile arrival veil to clear on fresh normal loads so the blur reveal plays in view.
  const [headerRevealActive, setHeaderRevealActive] = useState(() => !canPlayHomeIntro());

  useEffect(() => {
    if (campaignCarouselActive) return;

    let timerId = 0;
    // Trigger immediately if the intro was already dismissed in layout, or fall back if interrupted.
    const fallbackTimerId = window.setTimeout(
      () => {
        setHeaderRevealActive(true);
      },
      canPlayHomeIntro() ? 850 : 0,
    );

    const unsubscribe = onHomeIntroCompleted(() => {
      window.clearTimeout(fallbackTimerId);
      setHeaderRevealActive(true);
      timerId = window.setTimeout(() => {
        setSmilePlayTrigger((count) => count + 1);
      }, HERO_SMILE_INTRO_DELAY_MS);
    });
    return () => {
      unsubscribe();
      window.clearTimeout(timerId);
      window.clearTimeout(fallbackTimerId);
    };
  }, [campaignCarouselActive]);

  if (campaignCarouselActive) {
    return <CampaignHeroCarousel campaign={effectiveCampaign} />;
  }

  return (
    <section aria-labelledby="hero-title" className="home-hero relative isolate overflow-hidden bg-hero-surface">
      <NormalHeroContent isPrimaryHeading headerRevealActive={headerRevealActive} smilePlayTrigger={smilePlayTrigger} />
      <HomeHeroRiver />
    </section>
  );
}
