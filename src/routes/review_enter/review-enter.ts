import { createFileRoute } from "@tanstack/react-router";
import { Effect, Option } from "effect";

import { buildReviewSetCookie, verifyReviewToken } from "#/orpc/review/auth.server";
import { normalizeReviewPath, normalizeReviewTheme } from "#/orpc/review/constants";
import { AppConfig } from "#/server/config.server";
import { runInRequest } from "#/server/runtime.server";

/*===== Magic-Link Entry =====*/
/**
 * `GET /review/enter?token=<REVIEW_TOKEN>[&style=normal|black-friday][&theme=light|dark|black-friday][&path=/some-page]`:
 * Validates the token in constant time, sets the signed `HttpOnly` review cookie, and redirects to `/review` with
 * the secret stripped from the URL. Returns 404 when `REVIEW_TOKEN` is unset or the token does not match.
 */
async function handleGet({ request }: { request: Request }) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";
  const requestedPath = normalizeReviewPath(url.searchParams.get("path") ?? "");
  const requestedTheme = normalizeReviewTheme(url.searchParams.get("theme") ?? url.searchParams.get("style"));

  const result = await runInRequest(
    Effect.gen(function* () {
      const config = yield* AppConfig;
      const cookieValue = yield* verifyReviewToken(token);
      return {
        cookieValue,
        secure: config.siteUrl.protocol === "https:",
      };
    }),
  );

  if (Option.isNone(result.cookieValue)) {
    return new Response("Not Found", { status: 404, headers: { "Cache-Control": "no-store" } });
  }

  const params = new URLSearchParams();
  if (requestedPath && requestedPath !== "/" && !requestedPath.startsWith("/review")) {
    params.set("path", requestedPath);
  }
  if (requestedTheme) {
    params.set("theme", requestedTheme);
  }
  const destination = params.size > 0 ? `/review?${params.toString()}` : "/review";

  return new Response(null, {
    status: 302,
    headers: {
      Location: destination,
      "Set-Cookie": buildReviewSetCookie({ value: result.cookieValue.value, secure: result.secure }),
      "Cache-Control": "no-store",
    },
  });
}

/*===== Route =====*/
export const Route = createFileRoute("/review/enter")({
  server: { handlers: { GET: handleGet } },
});
