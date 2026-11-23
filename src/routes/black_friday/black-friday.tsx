import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDownIcon, ArrowLeftIcon, ClockIcon, SparklesIcon, UsersIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "#/components/primitive/alert/alert";
import { Badge } from "#/components/primitive/badge/badge";
import { buttonVariants } from "#/components/primitive/button/button.styles";
import { CampaignCountdown } from "#/components/shared/campaign/campaign-countdown";
import { consumeLandingViewFlag, readCampaignAttribution } from "#/lib/campaign-attribution";
import { pageMeta } from "#/lib/seo";
import { cn } from "#/lib/utils";
import { client, orpc } from "#/orpc/client";
import { m } from "#/paraglide/messages";
import heroArtUrl from "#/routes/black_friday/assets/campaign-hero.webp";
import "#/routes/black_friday/black-friday.css";
import { DiscountLedger } from "#/routes/black_friday/components/discount-ledger";
import { LeadCaptureForm } from "#/routes/black_friday/components/lead-capture-form";

/*===== Route =====*/

export const Route = createFileRoute("/_site-layout/black-friday")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(orpc.campaign.public.queryOptions({ staleTime: 60_000 })),
  head: (args) =>
    pageMeta({
      args,
      title: m.campaign_page_meta_title(),
      description: m.campaign_page_meta_description(),
    }),
  component: BlackFridayPage,
});

/*===== Page =====*/

function BlackFridayPage() {
  const { data: campaign } = useSuspenseQuery(orpc.campaign.public.queryOptions({ staleTime: 60_000 }));
  const [expiredLocally, setExpiredLocally] = useState(false);

  useEffect(() => {
    if (!consumeLandingViewFlag()) return;
    const { source } = readCampaignAttribution();
    void client.campaign.trackEvent({ kind: "landing_view", source }).catch(() => undefined);
  }, []);

  const isEnded = campaign.status === "ended" || campaign.status === "disabled" || expiredLocally;
  const isSoldOut = campaign.status === "active" && campaign.remainingCapacity <= 0;
  const isUpcoming = campaign.status === "upcoming";
  const canSubmit = campaign.status === "active" && !expiredLocally && !isSoldOut;

  return (
    <div className="flex flex-col">
      {/*===== Top Voltage Ticker =====*/}
      <div className="bf-ticker">
        <div className="mx-auto flex max-w-site flex-wrap items-center justify-between gap-2 px-4 py-2 text-caption font-extrabold sm:px-6">
          <span className="inline-flex items-center gap-2">
            <span className="inline-block size-2 bg-campaign-crimson" aria-hidden />
            {m.campaign_page_kicker()}
          </span>
          <span dir="ltr" className="font-mono tracking-wider uppercase">
            {m.campaign_ticker_banner({
              percent: String(campaign.maxDiscountPercent),
              total: String(campaign.totalCapacity),
            })}
          </span>
        </div>
      </div>

      {/*===== Full-Bleed Dental Black Friday Hero =====*/}
      <section className="bf-hero">
        <img src={heroArtUrl} alt="" aria-hidden className="bf-hero-art" />
        <div className="bf-hero-scrim" aria-hidden />

        <div className="relative mx-auto max-w-site px-4 py-12 sm:px-6 md:py-24">
          <div className="max-w-xl space-y-6">
            <div className="flex flex-wrap items-center gap-2.5">
              <Badge variant="crimson-solid">
                <SparklesIcon aria-hidden />
                {m.campaign_page_up_to_discount({ percent: campaign.maxDiscountPercent })}
              </Badge>
              <Badge variant="highlight-outline">
                {m.campaign_page_spots_left({ remaining: campaign.remainingCapacity })}
              </Badge>
            </div>

            <h1 className="text-hero font-black text-foreground">{m.campaign_page_title()}</h1>

            <p className="max-w-lg text-body-lg text-foreground/85">{m.campaign_page_intro()}</p>

            {canSubmit && (
              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <a href="#campaign-lead-form" className={buttonVariants({ variant: "highlight", size: "lg" })}>
                  <span>{m.campaign_page_jump_form()}</span>
                  <ArrowDownIcon aria-hidden data-icon="inline-end" />
                </a>
                <a href="#bf-discounts-title" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
                  <span>{m.campaign_table_title()}</span>
                </a>
              </div>
            )}
          </div>
        </div>
      </section>

      {/*===== Electric Yellow Impact Countdown & Capacity Band =====*/}
      <section className="bf-impact-band" aria-label={m.campaign_countdown_until()}>
        <div className="mx-auto grid max-w-site items-center gap-8 px-4 py-7 sm:px-6 lg:grid-cols-12">
          <div className="space-y-2.5 lg:col-span-5">
            <div className="flex items-center justify-between gap-2 text-body-sm font-black">
              <span className="inline-flex items-center gap-2">
                <UsersIcon aria-hidden className="size-4" />
                {m.campaign_page_capacity_label()}
              </span>
              <span className="rounded-sm bg-highlight-foreground px-2.5 py-0.5 text-caption font-extrabold text-highlight">
                {m.campaign_page_spots_left({ remaining: campaign.remainingCapacity })}
              </span>
            </div>
            <progress
              className="campaign-progress-impact"
              value={campaign.remainingCapacity}
              max={campaign.totalCapacity}
              aria-label={m.campaign_page_capacity_label()}
            />
            <p className="text-caption font-bold text-highlight-foreground/80">
              {m.campaign_modal_remaining({
                remaining: campaign.remainingCapacity,
                total: campaign.totalCapacity,
              })}
            </p>
          </div>

          <div className="lg:col-span-7 lg:border-s-2 lg:border-highlight-foreground/25 lg:ps-8">
            {isEnded ? (
              <p className="text-h3 font-black text-highlight-foreground">{m.campaign_ended_message()}</p>
            ) : isUpcoming ? (
              <p className="text-h3 font-black text-highlight-foreground">{m.campaign_upcoming_message()}</p>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="inline-flex items-center gap-2 text-body-sm font-black">
                  <ClockIcon aria-hidden className="size-4" />
                  {m.campaign_countdown_until()}
                </p>
                <CampaignCountdown
                  endsAt={campaign.endsAt}
                  serverNow={campaign.serverNow}
                  variant="impact"
                  onExpire={() => setExpiredLocally(true)}
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/*===== Discounts Table (Step 2.2) =====*/}
      <DiscountLedger discounts={campaign.discounts} />

      {/*===== Lead Capture Form Band (Step 2.3 & 2.4) =====*/}
      <section id="campaign-lead-form" aria-labelledby="bf-form-title" className="bf-lead-band scroll-mt-24">
        <div className="mx-auto max-w-site px-4 py-14 sm:px-6 md:py-20">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="space-y-4 border-s-4 border-brand-gold ps-5 lg:col-span-5">
              <p className="text-kicker font-extrabold text-brand-gold">{m.campaign_form_kicker()}</p>
              <h2 id="bf-form-title" className="text-h1 font-black text-foreground">
                {m.campaign_form_title()}
              </h2>
              <p className="text-body-sm text-muted-foreground">{m.campaign_form_reservation_disclaimer()}</p>
            </div>

            <div className="lg:col-span-7">
              {canSubmit ? (
                <LeadCaptureForm />
              ) : (
                <div className="space-y-6 border-y border-border py-8">
                  <Alert variant="warning">
                    <AlertTitle>
                      {isSoldOut
                        ? m.campaign_sold_out_message()
                        : isUpcoming
                          ? m.campaign_upcoming_message()
                          : m.campaign_ended_message()}
                    </AlertTitle>
                    <AlertDescription>{m.campaign_ended_body()}</AlertDescription>
                  </Alert>
                  <Link to="/" className={buttonVariants({ variant: "default", size: "lg" })}>
                    <span>{m.campaign_ended_cta()}</span>
                    <ArrowLeftIcon aria-hidden data-icon="inline-end" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
