import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { useEffect, useSyncExternalStore } from "react";

import { CampaignEntryModal } from "#/components/shared/campaign/campaign-entry-modal";
import { SiteFooter } from "#/components/shared/site-footer/site-footer";
import { SiteHeader } from "#/components/shared/site-header/site-header";
import { captureCampaignAttribution } from "#/lib/campaign-attribution";
import { setReportedUser } from "#/lib/error-reporting.browser";
import { markHomeIntroConsumed } from "#/lib/home-intro-state";
import {
  applyReviewPreviewTheme,
  getReviewPreviewTheme,
  subscribeToReviewPreviewTheme,
  syncCampaignTheme,
} from "#/lib/theme";
import type { PublicCampaign } from "#/orpc/campaign/contract";
import { orpc } from "#/orpc/client";
import { m } from "#/paraglide/messages";

/*===== Route =====*/
export const Route = createFileRoute("/_site-layout")({
  // The header needs the viewer and active campaign state on every page, so both load before any page renders.
  beforeLoad: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(orpc.session.viewer.queryOptions()),
      context.queryClient.ensureQueryData(orpc.campaign.public.queryOptions({ staleTime: 60_000 })),
    ]);
  },
  component: SiteLayout,
});

/*===== Site Layout =====*/

/** The chrome shared by every page: skip link, header, `main` landmark and footer. */
function SiteLayout() {
  const { data: viewer } = useSuspenseQuery(orpc.session.viewer.queryOptions());
  const { data: campaign } = useSuspenseQuery(orpc.campaign.public.queryOptions({ staleTime: 60_000 }));
  const userId = viewer?.id ?? null;
  const pathname = useLocation({ select: (location) => location.pathname });
  // Non-null only when rendered inside the `/review` studio iframe, allowing clients to compare styles per tab.
  const reviewPreviewTheme = useSyncExternalStore(subscribeToReviewPreviewTheme, getReviewPreviewTheme, () => null);

  const effectiveCampaign: PublicCampaign =
    reviewPreviewTheme === "light" || reviewPreviewTheme === "dark"
      ? { ...campaign, themeActive: false, status: "disabled" }
      : reviewPreviewTheme === "black-friday"
        ? { ...campaign, themeActive: true, status: "active" }
        : campaign;

  /*------ Error Reports ------*/
  // Browser reports carry the signed-in user's ID, like the server's (docs/backend/logging.md → User ID). Sign-in and
  // sign-out invalidate the viewer query, which updates it.
  useEffect(() => setReportedUser(userId), [userId]);

  /*------ Reversible Campaign Theme & Attribution ------*/
  useEffect(() => {
    if (reviewPreviewTheme) {
      applyReviewPreviewTheme(reviewPreviewTheme);
      return;
    }
    syncCampaignTheme(campaign.themeActive);
  }, [campaign.themeActive, reviewPreviewTheme]);

  useEffect(() => {
    captureCampaignAttribution();
  }, []);

  /*------ Home Intro Eligibility ------*/
  // Once the visitor has been on any inner route, navigating back to `/` skips the initial load intro.
  useEffect(() => {
    if (pathname !== "/") {
      markHomeIntroConsumed();
    }
  }, [pathname]);

  return (
    <div data-site-layout="" className="flex min-h-svh flex-col pb-(--site-mobile-nav-inset) md:pb-0">
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-primary px-4 py-2 text-button text-primary-foreground focus:not-sr-only focus:fixed focus:inset-s-4 focus:top-4 focus:inline-flex focus:min-h-target focus:min-w-target focus:items-center"
      >
        {m.common_skip_to_content()}
      </a>
      <SiteHeader viewer={viewer} campaign={effectiveCampaign} />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <SiteFooter campaignActive={effectiveCampaign.status === "active"} />
      <CampaignEntryModal campaign={effectiveCampaign} />
    </div>
  );
}
