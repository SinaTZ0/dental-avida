import { Link, useLocation } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";

import { CampaignCountdown } from "#/components/shared/campaign/campaign-countdown";
import { readCampaignAttribution } from "#/lib/campaign-attribution";
import { client } from "#/orpc/client";
import type { PublicCampaign } from "#/orpc/campaign/contract";
import { m } from "#/paraglide/messages";
import "#/components/shared/campaign/campaign.css";

/*===== Campaign Top Ribbon =====*/

function trackBannerClick() {
  const { source } = readCampaignAttribution();
  void client.campaign.trackEvent({ kind: "banner_click", source }).catch(() => undefined);
}

/**
 * Thin announcement bar docked at the very top of `<header>` while the Black Friday & Mother's Day campaign is live.
 * Disappears automatically once the campaign ends or is disabled in `/admin/campaign`.
 */
export function CampaignRibbon({ campaign }: { campaign: PublicCampaign }) {
  const pathname = useLocation({ select: (location) => location.pathname });
  if (campaign.status !== "active") return null;

  const onCampaignPage = pathname === "/black-friday";

  return (
    <section className="campaign-ribbon pointer-events-auto" aria-label={m.campaign_ribbon_badge()}>
      <div className="mx-auto flex min-h-10 max-w-site-wide flex-wrap items-center justify-between gap-x-4 gap-y-1.5 px-4 py-1.5 sm:px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <span aria-hidden className="campaign-ribbon-dot shrink-0 motion-safe:animate-pulse" />
          <span className="truncate text-caption font-extrabold text-brand-surface-foreground">
            {m.campaign_ribbon_badge()}
          </span>
          <span aria-hidden className="hidden text-brand-surface-gold/50 sm:inline">
            •
          </span>
          <span className="hidden text-caption font-semibold text-brand-surface-gold sm:inline">
            {m.campaign_ribbon_offer({
              percent: campaign.maxDiscountPercent,
              remaining: campaign.remainingCapacity,
            })}
          </span>
          <span className="text-caption font-semibold text-brand-surface-gold sm:hidden">
            {m.campaign_ribbon_offer_compact({ percent: campaign.maxDiscountPercent })}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:block">
            <CampaignCountdown endsAt={campaign.endsAt} serverNow={campaign.serverNow} variant="compact" />
          </div>
          {!onCampaignPage && (
            <Link to="/black-friday" onClick={trackBannerClick} className="campaign-ribbon-cta">
              <span>{m.campaign_ribbon_cta()}</span>
              <ArrowLeftIcon aria-hidden className="size-3.5" />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
