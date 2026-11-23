/*===== Viewport Presets =====*/
/** Fixed artboard widths in CSS pixels, matching Chrome DevTools device presets so boxes align pixel-for-pixel. */
export const REVIEW_VIEWPORTS = {
  desktop: 1440,
  mobile: 390,
} as const;

export type ReviewViewport = keyof typeof REVIEW_VIEWPORTS;

export const REVIEW_VIEWPORT_KEYS = ["desktop", "mobile"] as const;

/*===== Statuses =====*/
export const REVIEW_STATUSES = ["open", "resolved"] as const;

export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const REVIEW_STATUS_FILTERS = ["open", "resolved", "all"] as const;

export type ReviewStatusFilter = (typeof REVIEW_STATUS_FILTERS)[number];

/*===== Cookie =====*/
export const REVIEW_COOKIE_NAME = "avida_review";

/** 30 days in seconds. Rotating `REVIEW_TOKEN` or `BETTER_AUTH_SECRET` revokes existing cookies immediately. */
export const REVIEW_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

/*===== Limits =====*/
export const REVIEW_COMMENT_MAX_LENGTH = 2000;
export const REVIEW_AUTHOR_MAX_LENGTH = 80;
export const REVIEW_PATHNAME_MAX_LENGTH = 300;
export const REVIEW_MIN_BOX_SIZE = 12;

/*===== Path Normalization =====*/
/**
 * Normalizes a route path to a clean leading-slash pathname without query, hash, or trailing slash (except `/`).
 * Returns `null` if the input is not a safe internal relative path.
 */
export function normalizeReviewPath(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return null;
  const withoutQuery = trimmed.split(/[?#]/, 1)[0] ?? "/";
  if (withoutQuery === "/" || withoutQuery === "") return "/";
  return withoutQuery.replace(/\/+$/, "") || "/";
}
