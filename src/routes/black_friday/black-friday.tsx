import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDownIcon, ArrowLeftIcon, ClockIcon, UsersIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "#/components/primitive/alert/alert";
import { Badge } from "#/components/primitive/badge/badge";
import { buttonVariants } from "#/components/primitive/button/button.styles";
import { CampaignCountdown } from "#/components/shared/campaign/campaign-countdown";
import { consumeLandingViewFlag, readCampaignAttribution } from "#/lib/campaign-attribution";
import { pageMeta } from "#/lib/seo";
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
      {/*===== Hero Band =====*/}
      <section className="bf-hero">
        <img src={heroArtUrl} alt="" aria-hidden className="bf-hero-art" />
        <div className="bf-hero-scrim" aria-hidden />

        <div className="relative mx-auto grid max-w-site gap-10 px-4 py-14 sm:px-6 md:grid-cols-12 md:items-end md:py-20">
          {/*------ Editorial Headline & Copy ------*/}
          <div className="space-y-5 md:col-span-7">
            <p className="bf-kicker">{m.campaign_page_kicker()}</p>
            <h1 className="text-hero text-foreground">{m.campaign_page_title()}</h1>
            <p className="max-w-2xl text-body-lg text-muted-foreground">{m.campaign_page_intro()}</p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Badge variant="crimson-solid">
                {m.campaign_page_up_to_discount({ percent: campaign.maxDiscountPercent })}
              </Badge>
              <Badge variant="outline">
                <UsersIcon aria-hidden />
                {m.campaign_modal_capacity_headline({
                  total: campaign.totalCapacity,
                  maxPercent: campaign.maxDiscountPercent,
                })}
              </Badge>
            </div>

            {canSubmit && (
              <div className="pt-2">
                <a href="#campaign-lead-form" className={buttonVariants({ variant: "crimson", size: "lg" })}>
                  <span>{m.campaign_page_jump_form()}</span>
                  <ArrowDownIcon aria-hidden data-icon="inline-end" />
                </a>
              </div>
            )}
          </div>

          {/*------ Live Countdown & Remaining Capacity Column ------*/}
          <div className="space-y-5 border-t border-brand-gold/35 pt-6 md:col-span-5 md:border-s md:border-t-0 md:ps-8 md:pt-0">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2 text-body-sm font-semibold">
                <span className="inline-flex items-center gap-2 text-foreground">
                  <UsersIcon aria-hidden className="size-4 text-campaign-crimson" />
                  {m.campaign_page_capacity_label()}
                </span>
                <span className="font-bold text-brand-surface-gold">
                  {m.campaign_page_spots_left({ remaining: campaign.remainingCapacity })}
                </span>
              </div>
              <progress
                className="campaign-progress"
                value={campaign.remainingCapacity}
                max={campaign.totalCapacity}
                aria-label={m.campaign_page_capacity_label()}
              />
              <p className="text-caption text-muted-foreground">
                {m.campaign_modal_remaining({
                  remaining: campaign.remainingCapacity,
                  total: campaign.totalCapacity,
                })}
              </p>
            </div>

            <div className="space-y-2.5">
              <p className="inline-flex items-center gap-2 text-caption font-semibold text-muted-foreground">
                <ClockIcon aria-hidden className="size-4 text-brand-gold" />
                {m.campaign_countdown_until()}
              </p>
              {isEnded ? (
                <Alert variant="destructive">
                  <AlertTitle>{m.campaign_ended_message()}</AlertTitle>
                </Alert>
              ) : isUpcoming ? (
                <Alert variant="info">
                  <AlertTitle>{m.campaign_upcoming_message()}</AlertTitle>
                </Alert>
              ) : (
                <CampaignCountdown
                  endsAt={campaign.endsAt}
                  serverNow={campaign.serverNow}
                  variant="editorial"
                  onExpire={() => setExpiredLocally(true)}
                />
              )}
            </div>
          </div>
        </div>
      </section>

      {/*===== Discounts Table (Step 2.2) =====*/}
      <DiscountLedger discounts={campaign.discounts} />

      {/*===== Lead Capture Form Band (Step 2.3 & 2.4) =====*/}
      <section id="campaign-lead-form" aria-labelledby="bf-form-title" className="bf-lead-band scroll-mt-24">
        <div className="mx-auto max-w-site px-4 py-14 sm:px-6 md:py-20">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="space-y-3 lg:col-span-5">
              <p className="bf-kicker">{m.campaign_form_kicker()}</p>
              <h2 id="bf-form-title" className="text-h1 text-foreground">
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
