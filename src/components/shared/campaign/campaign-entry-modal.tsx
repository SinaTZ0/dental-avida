import { Link, useLocation } from "@tanstack/react-router";
import { ArrowLeftIcon, SparklesIcon, UsersIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "#/components/primitive/badge/badge";
import { Button } from "#/components/primitive/button/button";
import { buttonVariants } from "#/components/primitive/button/button.styles";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "#/components/primitive/dialog/dialog";
import { CampaignCountdown } from "#/components/shared/campaign/campaign-countdown";
import modalArtUrl from "#/components/shared/campaign/campaign-modal-art.webp";
import {
  markCampaignModalDismissed,
  readCampaignAttribution,
  shouldShowCampaignModal,
} from "#/lib/campaign-attribution";
import { canPlayHomeIntro, onHomeIntroCompleted } from "#/lib/home-intro-state";
import { client } from "#/orpc/client";
import type { PublicCampaign } from "#/orpc/campaign/contract";
import { m } from "#/paraglide/messages";
import "#/components/shared/campaign/campaign.css";

/*===== Suppressed Routes =====*/

function isModalSuppressedRoute(pathname: string): boolean {
  return (
    pathname === "/black-friday" ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/review")
  );
}

/*===== Component =====*/

/**
 * First-visit Black Friday & Mother's Day entry modal. Waits for the homepage carved-smile intro to finish before
 * opening, and stays politely silent after dismissal (24h cooldown) or form submission (permanent).
 */
export function CampaignEntryModal({ campaign }: { campaign: PublicCampaign }) {
  const pathname = useLocation({ select: (location) => location.pathname });
  const [open, setOpen] = useState(false);

  const eligible = campaign.status === "active" && !isModalSuppressedRoute(pathname);

  useEffect(() => {
    if (!eligible || !shouldShowCampaignModal()) return;

    let timer = 0;
    const scheduleOpen = (delayMs: number) => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (shouldShowCampaignModal()) {
          setOpen(true);
        }
      }, delayMs);
    };

    if (pathname === "/" && canPlayHomeIntro()) {
      const unsubscribe = onHomeIntroCompleted(() => scheduleOpen(450));
      // Fallback in case the intro skipped immediately (reduced motion, hash, scroll).
      scheduleOpen(1400);
      return () => {
        unsubscribe();
        window.clearTimeout(timer);
      };
    }

    scheduleOpen(600);
    return () => window.clearTimeout(timer);
  }, [eligible, pathname]);

  if (!eligible) return null;

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      markCampaignModalDismissed();
    }
  };

  const handleCtaClick = () => {
    setOpen(false);
    markCampaignModalDismissed();
    const { source } = readCampaignAttribution();
    void client.campaign.trackEvent({ kind: "popup_click", source }).catch(() => undefined);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent variant="campaign">
        {/*===== Editorial Artwork Header =====*/}
        <div className="campaign-modal-art-frame">
          <img src={modalArtUrl} alt="" aria-hidden className="campaign-modal-art-img" />
          <div className="campaign-modal-art-scrim" aria-hidden />
          <div className="absolute inset-x-6 bottom-4 flex flex-wrap items-center gap-2">
            <Badge variant="crimson-solid">
              <SparklesIcon aria-hidden />
              {m.campaign_modal_kicker()}
            </Badge>
          </div>
        </div>

        {/*===== Campaign Body =====*/}
        <div className="flex flex-col gap-5 p-6">
          <div className="space-y-2">
            <DialogTitle>{m.campaign_modal_title()}</DialogTitle>
            <p className="text-body font-bold text-brand-surface-gold">
              {m.campaign_modal_capacity_headline({
                total: campaign.totalCapacity,
                maxPercent: campaign.maxDiscountPercent,
              })}
            </p>
            <DialogDescription>{m.campaign_modal_body()}</DialogDescription>
          </div>

          {/*------ Remaining Capacity ------*/}
          <div className="space-y-2 border-y border-border py-3.5">
            <div className="flex items-center justify-between gap-2 text-caption font-semibold">
              <span className="inline-flex items-center gap-1.5 text-foreground">
                <UsersIcon aria-hidden className="size-4 text-campaign-crimson" />
                {m.campaign_modal_remaining({
                  remaining: campaign.remainingCapacity,
                  total: campaign.totalCapacity,
                })}
              </span>
              <span className="text-brand-surface-gold">
                {m.campaign_page_up_to_discount({ percent: campaign.maxDiscountPercent })}
              </span>
            </div>
            <progress
              className="campaign-progress"
              value={campaign.remainingCapacity}
              max={campaign.totalCapacity}
              aria-label={m.campaign_page_capacity_label()}
            />
          </div>

          {/*------ Live Countdown ------*/}
          <div className="space-y-2">
            <p className="text-caption font-semibold text-muted-foreground">{m.campaign_countdown_until()}</p>
            <CampaignCountdown endsAt={campaign.endsAt} serverNow={campaign.serverNow} variant="editorial" />
          </div>

          {/*------ Actions ------*/}
          <div className="flex flex-col gap-2 pt-1">
            <Link
              to="/black-friday"
              onClick={handleCtaClick}
              className={buttonVariants({ variant: "crimson", size: "lg", className: "w-full" })}
            >
              <span>{m.campaign_modal_cta()}</span>
              <ArrowLeftIcon aria-hidden data-icon="inline-end" />
            </Link>
            <Button variant="ghost" size="sm" onClick={() => handleOpenChange(false)} className="w-full">
              {m.campaign_modal_dismiss()}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
