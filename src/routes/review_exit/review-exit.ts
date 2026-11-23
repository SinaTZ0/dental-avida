import { createFileRoute } from "@tanstack/react-router";
import { Effect } from "effect";

import { buildReviewClearCookie } from "#/orpc/review/auth.server";
import { AppConfig } from "#/server/config.server";
import { runInRequest } from "#/server/runtime.server";

/*===== Exit Review =====*/
/** `POST /review/exit`: clears the `avida_review` cookie so the browser leaves review mode. */
async function handlePost() {
  const secure = await runInRequest(AppConfig.use((config) => Effect.succeed(config.siteUrl.protocol === "https:")));

  return new Response(null, {
    status: 204,
    headers: {
      "Set-Cookie": buildReviewClearCookie({ secure }),
      "Cache-Control": "no-store",
    },
  });
}

/*===== Route =====*/
export const Route = createFileRoute("/review/exit")({
  server: { handlers: { POST: handlePost } },
});
