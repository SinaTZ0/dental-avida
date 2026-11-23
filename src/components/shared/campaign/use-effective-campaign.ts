import { useSuspenseQuery } from "@tanstack/react-query";
import { useSyncExternalStore } from "react";

import { getReviewPreviewTheme, subscribeToReviewPreviewTheme } from "#/lib/theme";
import type { PublicCampaign } from "#/orpc/campaign/contract";
import { orpc } from "#/orpc/client";
import type { ReviewTheme } from "#/orpc/review/constants";

/*===== Effective Campaign Hook =====*/

/**
 * Reads the public campaign state and applies any active `/review` preview override (`"light" | "dark"` disables the
 * Black Friday campaign chrome & hero carousel; `"black-friday"` forces them on). Outside `/review`, `reviewPreviewTheme`
 * is always `null` so public visitors see the live database state with zero hydration mismatch.
 */
export function useEffectiveCampaign(): {
  campaign: PublicCampaign;
  effectiveCampaign: PublicCampaign;
  reviewPreviewTheme: ReviewTheme | null;
} {
  const { data: campaign } = useSuspenseQuery(orpc.campaign.public.queryOptions({ staleTime: 60_000 }));
  const reviewPreviewTheme = useSyncExternalStore(subscribeToReviewPreviewTheme, getReviewPreviewTheme, () => null);

  const effectiveCampaign: PublicCampaign =
    reviewPreviewTheme === "light" || reviewPreviewTheme === "dark"
      ? { ...campaign, themeActive: false, status: "disabled" }
      : reviewPreviewTheme === "black-friday"
        ? { ...campaign, themeActive: true, status: "active" }
        : campaign;

  return { campaign, effectiveCampaign, reviewPreviewTheme };
}
