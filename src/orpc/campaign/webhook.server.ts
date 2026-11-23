import { createHmac } from "node:crypto";
import { performance } from "node:perf_hooks";

import { Effect } from "effect";

import { isSafeWebhookUrl } from "#/orpc/campaign/constants";
import { CrmWebhookFailed } from "#/orpc/campaign/errors";

/*===== CRM / PRM Webhook Delivery =====*/
// Signed outbound JSON delivery with SSRF guard and strict 10-second timeout (Section 5 #9).

export type WebhookDeliveryResult = {
  readonly statusCode: number;
  readonly latencyMs: number;
};

/** Computes `sha256=<hex>` HMAC signature for outbound webhook payloads when a secret is configured. */
export function signWebhookPayload({ secret, body }: { secret: string; body: string }): string {
  return `sha256=${createHmac("sha256", secret).update(body, "utf8").digest("hex")}`;
}

/**
 * Posts a JSON event payload to an external CRM/PRM webhook URL.
 * Fails with `CrmWebhookFailed` (never throws defects) so callers can decide whether to retry (5xx/network) or stop (4xx).
 */
export const postCrmWebhook = Effect.fn("CampaignWebhook.post")(function* ({
  url,
  secret,
  event,
  payload,
}: {
  url: string;
  secret: string;
  event: "campaign.lead.created" | "campaign.webhook.test";
  payload: Record<string, unknown>;
}) {
  const cleanUrl = url.trim();
  if (!cleanUrl) {
    return yield* new CrmWebhookFailed({ reason: "not_configured" });
  }
  if (!isSafeWebhookUrl(cleanUrl)) {
    return yield* new CrmWebhookFailed({ reason: "unsafe_url" });
  }

  const body = JSON.stringify({ event, ...payload });
  const headers: Record<string, string> = {
    "Content-Type": "application/json; charset=utf-8",
    "User-Agent": "AvidaDental-CampaignWebhook/1.0",
    "X-Avida-Event": event,
  };
  const trimmedSecret = secret.trim();
  if (trimmedSecret) {
    headers["X-Avida-Signature"] = signWebhookPayload({ secret: trimmedSecret, body });
  }

  const startedAt = performance.now();
  const response = yield* Effect.tryPromise({
    try: () =>
      fetch(cleanUrl, {
        method: "POST",
        headers,
        body,
        redirect: "error",
        signal: AbortSignal.timeout(10_000),
      }),
    catch: () => new CrmWebhookFailed({ reason: "network" }),
  }).pipe(
    Effect.timeoutOrElse({
      duration: "12 seconds",
      orElse: () => Effect.fail(new CrmWebhookFailed({ reason: "network" })),
    }),
  );

  const latencyMs = Math.max(1, Math.round(performance.now() - startedAt));
  if (!response.ok) {
    return yield* new CrmWebhookFailed({ reason: "http_error", statusCode: response.status });
  }

  return { statusCode: response.status, latencyMs } satisfies WebhookDeliveryResult;
});
