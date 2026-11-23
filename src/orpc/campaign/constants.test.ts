import { describe, expect, it } from "vitest";

import {
  computeRemainingCapacity,
  isValidIranPhone,
  normalizeIranPhone,
  resolveCampaignStatus,
} from "#/orpc/campaign/constants";

describe("campaign phone normalization", () => {
  it("normalizes Persian digits, Arabic digits, spaces, dashes and +98/0098 prefixes to 09xxxxxxxxx", () => {
    expect(normalizeIranPhone("۰۹۱۲ ۳۴۵-۶۷۸۹")).toBe("09123456789");
    expect(normalizeIranPhone("٠٩١٢٣٤٥٦٧٨٩")).toBe("09123456789");
    expect(normalizeIranPhone("+98 912 345 6789")).toBe("09123456789");
    expect(normalizeIranPhone("00989123456789")).toBe("09123456789");
    expect(normalizeIranPhone("989123456789")).toBe("09123456789");
    expect(normalizeIranPhone("9123456789")).toBe("09123456789");
    expect(isValidIranPhone(normalizeIranPhone("۰۹۱۲۳۴۵۶۷۸۹"))).toBe(true);
    expect(isValidIranPhone(normalizeIranPhone("02122048610"))).toBe(true);
    expect(isValidIranPhone(normalizeIranPhone("12345"))).toBe(false);
  });
});

describe("campaign capacity and lifecycle", () => {
  const start = Date.parse("2026-11-22T00:00:00+03:30");
  const end = Date.parse("2026-12-03T23:59:59+03:30");

  it("decrements 1 spot every 335 minutes (5h 35m) in scheduled mode and clamps at 0", () => {
    expect(
      computeRemainingCapacity({
        nowMs: start - 60_000,
        startsAtMs: start,
        endsAtMs: end,
        totalCapacity: 51,
        decrementIntervalMinutes: 335,
        capacityMode: "scheduled",
        confirmedCount: 10,
      }),
    ).toBe(51);

    expect(
      computeRemainingCapacity({
        nowMs: start + 3 * 335 * 60_000 + 1000,
        startsAtMs: start,
        endsAtMs: end,
        totalCapacity: 51,
        decrementIntervalMinutes: 335,
        capacityMode: "scheduled",
        confirmedCount: 0,
      }),
    ).toBe(48);

    expect(
      computeRemainingCapacity({
        nowMs: end + 86_400_000,
        startsAtMs: start,
        endsAtMs: end,
        totalCapacity: 51,
        decrementIntervalMinutes: 335,
        capacityMode: "scheduled",
        confirmedCount: 0,
      }),
    ).toBe(0);
  });

  it("supports confirmed-only and hybrid modes", () => {
    expect(
      computeRemainingCapacity({
        nowMs: start + 10 * 335 * 60_000,
        startsAtMs: start,
        endsAtMs: end,
        totalCapacity: 51,
        decrementIntervalMinutes: 335,
        capacityMode: "confirmed",
        confirmedCount: 4,
      }),
    ).toBe(47);

    expect(
      computeRemainingCapacity({
        nowMs: start + 2 * 335 * 60_000,
        startsAtMs: start,
        endsAtMs: end,
        totalCapacity: 51,
        decrementIntervalMinutes: 335,
        capacityMode: "hybrid",
        confirmedCount: 7,
      }),
    ).toBe(44);
  });

  it("resolves disabled, upcoming, active, and ended states", () => {
    expect(resolveCampaignStatus({ enabled: false, nowMs: start + 1000, startsAtMs: start, endsAtMs: end })).toBe(
      "disabled",
    );
    expect(resolveCampaignStatus({ enabled: true, nowMs: start - 1000, startsAtMs: start, endsAtMs: end })).toBe(
      "upcoming",
    );
    expect(resolveCampaignStatus({ enabled: true, nowMs: start + 1000, startsAtMs: start, endsAtMs: end })).toBe(
      "active",
    );
    expect(resolveCampaignStatus({ enabled: true, nowMs: end + 1000, startsAtMs: start, endsAtMs: end })).toBe("ended");
  });
});
