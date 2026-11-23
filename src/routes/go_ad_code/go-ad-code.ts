import { createFileRoute } from "@tanstack/react-router";
import { Effect } from "effect";

import { CampaignService } from "#/orpc/campaign/service";
import { runInRequest } from "#/server/runtime.server";

/*===== Handler =====*/

/**
 * `GET /go/ad/$code`:
 * Records a server-side `ad_click` event for the advertising channel and redirects visitors directly to the dedicated
 * `/black-friday` campaign page with UTM attribution query parameters intact (Section 4 #3 & #4).
 */
async function handleGet({ params }: { params: { code: string } }) {
  const { redirectPath } = await runInRequest(
    Effect.gen(function* () {
      const campaign = yield* CampaignService;
      return yield* campaign.recordAdClick(params.code);
    }),
  );

  return new Response(null, {
    status: 302,
    headers: {
      Location: redirectPath,
      "Cache-Control": "no-store",
    },
  });
}

/*===== Route =====*/

export const Route = createFileRoute("/go/ad/$code")({
  server: { handlers: { GET: handleGet } },
});
