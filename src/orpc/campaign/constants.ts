import { toLatinDigits } from "#/lib/digits";

/*===== Campaign Identity & Defaults =====*/

export const BLACK_FRIDAY_SLUG = "black-friday-1405";

/** 1 Azar 1405 00:00:00 Asia/Tehran (+03:30). */
export const DEFAULT_CAMPAIGN_STARTS_AT_ISO = "2026-11-22T00:00:00+03:30";

/** 12 Azar 1405 23:59:59 Asia/Tehran (+03:30). */
export const DEFAULT_CAMPAIGN_ENDS_AT_ISO = "2026-12-03T23:59:59+03:30";

export const DEFAULT_CAMPAIGN_CAPACITY = 51;

/** 5 hours and 35 minutes = 335 minutes (drains 51 spots evenly across the 12-day campaign). */
export const DEFAULT_DECREMENT_INTERVAL_MINUTES = 335;

/*===== Allowed Values =====*/

export const CAPACITY_MODES = ["scheduled", "confirmed", "hybrid"] as const;
export type CapacityMode = (typeof CAPACITY_MODES)[number];

export const LEAD_STATUSES = ["new", "contacted", "confirmed", "unreachable", "cancelled"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_TREATMENTS = ["implant_fixture", "implant_with_crown", "laminate", "both_consultation"] as const;
export type LeadTreatment = (typeof LEAD_TREATMENTS)[number];

export const DISCOUNT_CODES = ["implant_fixture", "implant_with_crown", "laminate"] as const;
export type DiscountCode = (typeof DISCOUNT_CODES)[number];

export const CAMPAIGN_EVENT_KINDS = ["landing_view", "banner_click", "popup_click"] as const;
export type CampaignEventKind = (typeof CAMPAIGN_EVENT_KINDS)[number];

export const CAMPAIGN_STATUSES = ["upcoming", "active", "ended", "disabled"] as const;
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

/*===== Limits =====*/

export const LEAD_NAME_MAX_LENGTH = 100;
export const LEAD_NOTES_MAX_LENGTH = 1000;
export const LEAD_SOURCE_MAX_LENGTH = 160;
export const LEAD_UTM_MAX_LENGTH = 120;
export const LEAD_REFERRER_MAX_LENGTH = 300;
export const DISCOUNT_TITLE_MAX_LENGTH = 120;
export const MAX_CAMPAIGN_CAPACITY = 5000;
export const MAX_DECREMENT_INTERVAL_MINUTES = 10_080;
export const MAX_DISCOUNT_PERCENT = 90;

/*===== Default Discounts =====*/

export const DEFAULT_DISCOUNTS: readonly {
  readonly code: DiscountCode;
  readonly title: string;
  readonly cashPercent: number;
  readonly installmentPercent: number;
  readonly sortOrder: number;
}[] = [
  {
    code: "implant_fixture",
    title: "پایه ایمپلنت",
    cashPercent: 20,
    installmentPercent: 10,
    sortOrder: 0,
  },
  {
    code: "implant_with_crown",
    title: "پایه ایمپلنت همراه با روکش",
    cashPercent: 20,
    installmentPercent: 10,
    sortOrder: 1,
  },
  {
    code: "laminate",
    title: "لمینیت",
    cashPercent: 25,
    installmentPercent: 15,
    sortOrder: 2,
  },
];

/*===== Phone Normalization =====*/

const NON_PHONE_CHARS = /[\s\-().\u200c\u200e\u200f]+/g;
const IRAN_PHONE_PATTERN = /^0(?:9\d{9}|[1-8]\d{9})$/;

/**
 * Normalizes Iranian mobile and landline numbers to canonical Latin digits (`09xxxxxxxxx` or `021xxxxxxxx`) so
 * Persian/Arabic digits, spaces, dashes, and `+98`/`0098` country prefixes deduplicate to the same value.
 */
export function normalizeIranPhone(raw: string): string {
  const digits = toLatinDigits(raw).trim().replace(NON_PHONE_CHARS, "");
  if (!digits) return "";

  if (digits.startsWith("+98") && digits.length === 13) {
    return `0${digits.slice(3)}`;
  }
  if (digits.startsWith("0098") && digits.length === 14) {
    return `0${digits.slice(4)}`;
  }
  if (digits.startsWith("98") && digits.length === 12) {
    return `0${digits.slice(2)}`;
  }
  if (digits.startsWith("9") && digits.length === 10) {
    return `0${digits}`;
  }
  return digits;
}

/** Whether a normalized phone string is a valid 11-digit Iranian mobile or geographic landline number. */
export function isValidIranPhone(normalized: string): boolean {
  return IRAN_PHONE_PATTERN.test(normalized);
}

/*===== Campaign Window & Capacity Math =====*/

/** Determines the lifecycle status of a campaign at `nowMs`. */
export function resolveCampaignStatus({
  enabled,
  nowMs,
  startsAtMs,
  endsAtMs,
}: {
  enabled: boolean;
  nowMs: number;
  startsAtMs: number;
  endsAtMs: number;
}): CampaignStatus {
  if (!enabled) return "disabled";
  if (nowMs < startsAtMs) return "upcoming";
  if (nowMs >= endsAtMs) return "ended";
  return "active";
}

/**
 * Computes remaining campaign spots according to the configured `capacityMode`:
 * - `scheduled`: decrements 1 spot every `decrementIntervalMinutes` from `startsAtMs` (default: 5h 35m).
 * - `confirmed`: decrements by actual confirmed leads in Postgres.
 * - `hybrid`: takes the larger of scheduled and confirmed counts.
 */
export function computeRemainingCapacity({
  nowMs,
  startsAtMs,
  endsAtMs,
  totalCapacity,
  decrementIntervalMinutes,
  capacityMode,
  confirmedCount,
}: {
  nowMs: number;
  startsAtMs: number;
  endsAtMs: number;
  totalCapacity: number;
  decrementIntervalMinutes: number;
  capacityMode: CapacityMode;
  confirmedCount: number;
}): number {
  const intervalMs = Math.max(1, decrementIntervalMinutes) * 60_000;
  const elapsedMs = Math.max(0, Math.min(nowMs, endsAtMs) - startsAtMs);
  const scheduledTaken = Math.floor(elapsedMs / intervalMs);
  const confirmedTaken = Math.max(0, confirmedCount);

  let taken = scheduledTaken;
  if (capacityMode === "confirmed") {
    taken = confirmedTaken;
  } else if (capacityMode === "hybrid") {
    taken = Math.max(scheduledTaken, confirmedTaken);
  }

  return Math.max(0, totalCapacity - taken);
}
