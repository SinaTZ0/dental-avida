import { createHmac, timingSafeEqual } from "node:crypto";

import { Effect, Option, Redacted } from "effect";

import { REVIEW_COOKIE_MAX_AGE_SECONDS, REVIEW_COOKIE_NAME } from "#/orpc/review/constants";
import { Auth } from "#/server/auth.server";
import { AppConfig } from "#/server/config.server";
import { Unauthorized } from "#/server/errors";
import { RequestContext } from "#/server/request-context.server";

/*===== Types =====*/
export type ReviewAccess = {
  readonly allowed: boolean;
  readonly isAdmin: boolean;
  readonly hasCookie: boolean;
};

/*===== Signing =====*/
/** Constant-time string comparison that never leaks length or prefix matches. */
function safeEqual(left: string, right: string): boolean {
  const leftBytes = Buffer.from(left, "utf8");
  const rightBytes = Buffer.from(right, "utf8");
  if (leftBytes.length !== rightBytes.length) return false;
  return timingSafeEqual(leftBytes, rightBytes);
}

/**
 * Derives the signed cookie value from `REVIEW_TOKEN` and `BETTER_AUTH_SECRET` so the raw token never sits in a
 * cookie and rotating either secret invalidates every active review cookie.
 */
export function signReviewCookie({ authSecret, reviewToken }: { authSecret: string; reviewToken: string }): string {
  return createHmac("sha256", authSecret).update(`avida-review:${reviewToken}`).digest("base64url");
}

/** Extracts one cookie value from a raw `Cookie` header. */
function readCookie(headers: Headers, name: string): string | null {
  const header = headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const at = part.indexOf("=");
    if (at <= 0) continue;
    if (part.slice(0, at).trim() === name) return part.slice(at + 1).trim();
  }
  return null;
}

/** Builds the `Set-Cookie` header value that activates review mode for a client browser. */
export function buildReviewSetCookie({ value, secure }: { value: string; secure: boolean }): string {
  const parts = [
    `${REVIEW_COOKIE_NAME}=${value}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${REVIEW_COOKIE_MAX_AGE_SECONDS}`,
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

/** Builds the `Set-Cookie` header value that clears review mode. */
export function buildReviewClearCookie({ secure }: { secure: boolean }): string {
  const parts = [`${REVIEW_COOKIE_NAME}=`, "Path=/", "HttpOnly", "SameSite=Lax", "Max-Age=0"];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

/*===== Token Verification =====*/
/**
 * Verifies a magic-link token from `/review/enter?token=...` against `AppConfig.reviewToken`.
 * Returns `Option.some(cookieValue)` when valid, or `Option.none()` when disabled or mismatched.
 */
export const verifyReviewToken = Effect.fn("ReviewAuth.verifyToken")(function* (candidate: string) {
  const config = yield* AppConfig;
  if (Option.isNone(config.reviewToken) || !candidate) return Option.none<string>();

  const expectedToken = Redacted.value(config.reviewToken.value);
  if (!safeEqual(candidate, expectedToken)) return Option.none<string>();

  const cookieValue = signReviewCookie({
    authSecret: Redacted.value(config.authSecret),
    reviewToken: expectedToken,
  });
  return Option.some(cookieValue);
});

/*===== Request Access =====*/
/**
 * Checks whether the current request may use the `/review` studio: either it carries a valid `avida_review` cookie
 * (when `REVIEW_TOKEN` is configured), or it belongs to a signed-in active `admin` user.
 */
export const checkReviewAccess: Effect.Effect<ReviewAccess, never, AppConfig | Auth | RequestContext> = Effect.gen(
  function* () {
    const config = yield* AppConfig;
    const { headers } = yield* RequestContext;
    const auth = yield* Auth;

    let hasCookie = false;
    if (Option.isSome(config.reviewToken)) {
      const provided = readCookie(headers, REVIEW_COOKIE_NAME);
      if (provided) {
        const expected = signReviewCookie({
          authSecret: Redacted.value(config.authSecret),
          reviewToken: Redacted.value(config.reviewToken.value),
        });
        hasCookie = safeEqual(provided, expected);
      }
    }

    const session = yield* auth.session(headers);
    const isAdmin =
      Option.isSome(session) && session.value.user.status !== "blocked" && session.value.user.role === "admin";

    return { allowed: hasCookie || isAdmin, isAdmin, hasCookie };
  },
);

/** Fails with `Unauthorized` unless the request has valid review access (cookie or admin session). */
export const requireReviewAccess: Effect.Effect<ReviewAccess, Unauthorized, AppConfig | Auth | RequestContext> =
  checkReviewAccess.pipe(
    Effect.filterOrFail(
      (access) => access.allowed,
      () => new Unauthorized(),
    ),
  );
