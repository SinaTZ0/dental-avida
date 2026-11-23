import { Context, DateTime, Effect, Layer, Option, Schema } from "effect";

import { APP_TIME_ZONE } from "#/lib/locale";
import {
  BLACK_FRIDAY_SLUG,
  computeRemainingCapacity,
  resolveCampaignStatus,
  type CampaignEventKind,
  type CapacityMode,
  type DiscountCode,
  type LeadStatus,
  type LeadTreatment,
} from "#/orpc/campaign/constants";
import type {
  AdminCampaignOverview,
  CampaignDiscount,
  CampaignLead,
  PublicCampaign,
  SubmitLeadResult,
} from "#/orpc/campaign/contract";
import { CampaignInactive, CampaignLeadNotFound, DuplicateCampaignLead } from "#/orpc/campaign/errors";
import { NotifyCampaignLead } from "#/orpc/campaign/jobs.server";
import {
  CampaignRepo,
  type CampaignDiscountRecord,
  type CampaignLeadRecord,
  type CampaignSettingRecord,
} from "#/orpc/campaign/repository";
import { SubmitLeadFields, UpdateLeadFields, UpdateSettingsFields } from "#/orpc/campaign/validation";
import { Db } from "#/server/db.server";
import { decodeInput, type InvalidInput } from "#/server/errors";
import { Jobs } from "#/server/jobs.server";

/*===== Helpers =====*/

const isLeadId = Schema.is(Schema.String.check(Schema.isUUID()));

const jalaliDayFormatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  timeZone: APP_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const isoDayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function toPublicDiscount(row: CampaignDiscountRecord): CampaignDiscount {
  return {
    id: row.id,
    code: row.code as DiscountCode,
    title: row.title,
    cashPercent: row.cashPercent,
    installmentPercent: row.installmentPercent,
    sortOrder: row.sortOrder,
  };
}

function toPublicLead(row: CampaignLeadRecord): CampaignLead {
  return {
    id: row.id,
    fullName: row.fullName,
    phoneRaw: row.phoneRaw,
    phoneNormalized: row.phoneNormalized,
    treatment: row.treatment as LeadTreatment,
    source: row.source,
    utmSource: row.utmSource,
    utmMedium: row.utmMedium,
    utmCampaign: row.utmCampaign,
    referrer: row.referrer,
    status: row.status as LeadStatus,
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toPublicCampaign({
  setting,
  discounts,
  confirmedCount,
  now,
}: {
  setting: CampaignSettingRecord;
  discounts: readonly CampaignDiscountRecord[];
  confirmedCount: number;
  now: DateTime.Utc;
}): PublicCampaign {
  const nowMs = DateTime.toEpochMillis(now);
  const startsAtMs = setting.startsAt.getTime();
  const endsAtMs = setting.endsAt.getTime();
  const status = resolveCampaignStatus({ enabled: setting.enabled, nowMs, startsAtMs, endsAtMs });
  const remainingCapacity = computeRemainingCapacity({
    nowMs,
    startsAtMs,
    endsAtMs,
    totalCapacity: setting.totalCapacity,
    decrementIntervalMinutes: setting.decrementIntervalMinutes,
    capacityMode: setting.capacityMode as CapacityMode,
    confirmedCount,
  });
  const maxDiscountPercent = discounts.reduce(
    (max, item) => Math.max(max, item.cashPercent, item.installmentPercent),
    0,
  );

  return {
    slug: setting.slug,
    status,
    // Reversible theme variant: active only while inside the active window AND themeEnabled is on.
    themeActive: status === "active" && setting.themeEnabled,
    startsAt: setting.startsAt,
    endsAt: setting.endsAt,
    serverNow: DateTime.toDate(now),
    totalCapacity: setting.totalCapacity,
    remainingCapacity,
    maxDiscountPercent,
    discounts: discounts.map(toPublicDiscount),
  };
}

function deriveSourceLabel({
  source,
  utmSource,
  utmMedium,
  referrer,
}: {
  source?: string;
  utmSource?: string;
  utmMedium?: string;
  referrer?: string;
}): string {
  if (source) return source;
  if (utmSource && utmMedium) return `${utmSource} / ${utmMedium}`;
  if (utmSource) return utmSource;
  if (referrer) return referrer;
  return "direct";
}

function buildBreakdown(values: readonly string[]): { key: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([key, count]) => ({ key, count }))
    .toSorted((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}

/*===== Campaign Service =====*/

export class CampaignService extends Context.Service<
  CampaignService,
  {
    /** Public campaign state, live remaining capacity, theme variant flag, and discount rows. */
    readonly getPublic: Effect.Effect<PublicCampaign>;
    /** Validates, deduplicates, and stores a visitor lead, optionally queuing an advisor alert email. */
    readonly submitLead: (
      input: unknown,
    ) => Effect.Effect<SubmitLeadResult, InvalidInput | CampaignInactive | DuplicateCampaignLead>;
    /** Records a lightweight funnel event (landing page view, ribbon click, or popup click). */
    readonly trackEvent: (args: { kind: CampaignEventKind; source?: string }) => Effect.Effect<void>;
    /** Full admin dashboard snapshot: settings, discounts, leads, Jalali daily report, breakdowns, and funnel stats. */
    readonly getAdminOverview: Effect.Effect<AdminCampaignOverview>;
    /** Lists leads with optional status/treatment filters for Excel export. */
    readonly listLeadsForExport: (args: { status?: string; treatment?: string }) => Effect.Effect<CampaignLead[]>;
    /** Updates a lead's follow-up status and advisor notes. */
    readonly updateLead: (args: {
      id: string;
      input: unknown;
    }) => Effect.Effect<CampaignLead, InvalidInput | CampaignLeadNotFound>;
    /** Updates campaign settings, dates, capacity rules, theme flag, and discount percentages. */
    readonly updateSettings: (input: unknown) => Effect.Effect<PublicCampaign, InvalidInput>;
  }
>()("app/orpc/campaign/CampaignService") {
  static readonly layer = Layer.effect(
    CampaignService,
    Effect.gen(function* () {
      const db = yield* Db;
      const repo = yield* CampaignRepo;
      const jobs = yield* Jobs;
      const decodeLead = decodeInput(SubmitLeadFields);
      const decodeLeadUpdate = decodeInput(UpdateLeadFields);
      const decodeSettings = decodeInput(UpdateSettingsFields);

      /*------ Public Read ------*/
      const getPublic = Effect.gen(function* () {
        const [{ setting, discounts }, confirmedCount, now] = yield* Effect.all([
          repo.ensureCampaign(BLACK_FRIDAY_SLUG),
          repo.countConfirmedLeads(BLACK_FRIDAY_SLUG),
          DateTime.now,
        ]);
        return toPublicCampaign({ setting, discounts, confirmedCount, now });
      }).pipe(Effect.withSpan("CampaignService.getPublic"));

      /*------ Lead Submission ------*/
      const submitLead = Effect.fn("CampaignService.submitLead")(function* (input: unknown) {
        const parsed = yield* decodeLead(input);
        const now = yield* DateTime.now;

        // Honeypot filled by an automated script: pretend success without writing anything.
        if (parsed.website && parsed.website.trim().length > 0) {
          return { id: "00000000-0000-0000-0000-000000000000", createdAt: DateTime.toDate(now) };
        }

        const rawPhone =
          typeof input === "object" && input !== null && "phone" in input && typeof input.phone === "string"
            ? input.phone.trim()
            : parsed.phone;

        return yield* db.transaction(
          Effect.gen(function* () {
            const { setting, discounts } = yield* repo.ensureCampaign(BLACK_FRIDAY_SLUG);
            const confirmedCount = yield* repo.countConfirmedLeads(setting.slug);
            const current = toPublicCampaign({ setting, discounts, confirmedCount, now });

            if (current.status === "disabled") return yield* new CampaignInactive({ reason: "disabled" });
            if (current.status === "upcoming") return yield* new CampaignInactive({ reason: "not_started" });
            if (current.status === "ended") return yield* new CampaignInactive({ reason: "ended" });
            if (current.remainingCapacity <= 0) return yield* new CampaignInactive({ reason: "sold_out" });

            const source = deriveSourceLabel({
              source: parsed.source,
              utmSource: parsed.utmSource,
              utmMedium: parsed.utmMedium,
              referrer: parsed.referrer,
            });

            const inserted = yield* repo.insertLeadIfNew({
              campaignSlug: setting.slug,
              fullName: parsed.fullName,
              phoneRaw: rawPhone,
              phoneNormalized: parsed.phone,
              treatment: parsed.treatment,
              source,
              utmSource: parsed.utmSource ?? "",
              utmMedium: parsed.utmMedium ?? "",
              utmCampaign: parsed.utmCampaign ?? "",
              referrer: parsed.referrer ?? "",
            });

            if (Option.isNone(inserted)) {
              return yield* new DuplicateCampaignLead({ phoneNormalized: parsed.phone });
            }

            if (setting.notifyEmail.trim()) {
              yield* NotifyCampaignLead.enqueue({
                to: setting.notifyEmail.trim(),
                fullName: inserted.value.fullName,
                phone: inserted.value.phoneNormalized,
                treatment: inserted.value.treatment as LeadTreatment,
                source: inserted.value.source,
              }).pipe(Effect.provideService(Jobs, jobs));
            }

            return { id: inserted.value.id, createdAt: inserted.value.createdAt };
          }),
        );
      });

      /*------ Funnel Event Tracking ------*/
      const trackEvent = Effect.fn("CampaignService.trackEvent")(function* ({
        kind,
        source,
      }: {
        kind: CampaignEventKind;
        source?: string;
      }) {
        const { setting } = yield* repo.ensureCampaign(BLACK_FRIDAY_SLUG);
        const cleanSource = (source ?? "").trim().slice(0, 160) || "direct";
        yield* repo.insertEvent({ campaignSlug: setting.slug, kind, source: cleanSource });
      });

      /*------ Admin Overview ------*/
      const getAdminOverview = Effect.gen(function* () {
        const [{ setting, discounts }, leadRows, events, now] = yield* Effect.all([
          repo.ensureCampaign(BLACK_FRIDAY_SLUG),
          repo.listLeads(BLACK_FRIDAY_SLUG),
          repo.countEvents(BLACK_FRIDAY_SLUG),
          DateTime.now,
        ]);

        const leads = leadRows.map(toPublicLead);
        const confirmedLeads = leads.filter((lead) => lead.status === "confirmed").length;
        const publicState = toPublicCampaign({ setting, discounts, confirmedCount: confirmedLeads, now });

        const todayIso = isoDayFormatter.format(DateTime.toDate(now));
        const dailyMap = new Map<string, { isoDay: string; jalaliDate: string; total: number; confirmed: number }>();
        let todayLeads = 0;

        for (const lead of leads) {
          const isoDay = isoDayFormatter.format(lead.createdAt);
          if (isoDay === todayIso) todayLeads += 1;
          const existing = dailyMap.get(isoDay) ?? {
            isoDay,
            jalaliDate: jalaliDayFormatter.format(lead.createdAt),
            total: 0,
            confirmed: 0,
          };
          existing.total += 1;
          if (lead.status === "confirmed") existing.confirmed += 1;
          dailyMap.set(isoDay, existing);
        }

        const dailyReport = [...dailyMap.values()].toSorted((a, b) => b.isoDay.localeCompare(a.isoDay));

        return {
          settings: {
            slug: setting.slug,
            enabled: setting.enabled,
            themeEnabled: setting.themeEnabled,
            startsAt: setting.startsAt,
            endsAt: setting.endsAt,
            totalCapacity: setting.totalCapacity,
            capacityMode: setting.capacityMode as CapacityMode,
            decrementIntervalMinutes: setting.decrementIntervalMinutes,
            notifyEmail: setting.notifyEmail,
            updatedAt: setting.updatedAt,
          },
          status: publicState.status,
          themeActive: publicState.themeActive,
          remainingCapacity: publicState.remainingCapacity,
          discounts: publicState.discounts,
          leads,
          totals: {
            totalLeads: leads.length,
            confirmedLeads,
            todayLeads,
            landingViews: events.landingViews,
            bannerClicks: events.bannerClicks,
            popupClicks: events.popupClicks,
          },
          dailyReport,
          bySource: buildBreakdown(leads.map((lead) => lead.source)),
          byTreatment: buildBreakdown(leads.map((lead) => lead.treatment)),
          byStatus: buildBreakdown(leads.map((lead) => lead.status)),
        };
      }).pipe(Effect.withSpan("CampaignService.getAdminOverview"));

      /*------ Export Query ------*/
      const listLeadsForExport = Effect.fn("CampaignService.listLeadsForExport")(function* ({
        status,
        treatment,
      }: {
        status?: string;
        treatment?: string;
      }) {
        yield* repo.ensureCampaign(BLACK_FRIDAY_SLUG);
        const rows = yield* repo.listLeads(BLACK_FRIDAY_SLUG);
        return rows
          .map(toPublicLead)
          .filter((lead) => (!status || lead.status === status) && (!treatment || lead.treatment === treatment));
      });

      /*------ Admin Lead Update ------*/
      const updateLead = Effect.fn("CampaignService.updateLead")(function* ({
        id,
        input,
      }: {
        id: string;
        input: unknown;
      }) {
        if (!isLeadId(id)) return yield* new CampaignLeadNotFound({ id });
        const parsed = yield* decodeLeadUpdate(input);
        const now = yield* DateTime.nowAsDate;
        const updated = yield* repo.updateLead({
          id,
          status: parsed.status,
          notes: parsed.notes ?? "",
          updatedAt: now,
        });
        if (Option.isNone(updated)) return yield* new CampaignLeadNotFound({ id });
        return toPublicLead(updated.value);
      });

      /*------ Admin Settings Update ------*/
      const updateSettings = Effect.fn("CampaignService.updateSettings")(function* (input: unknown) {
        const parsed = yield* decodeSettings(input);
        const now = yield* DateTime.now;
        const startsAt = DateTime.toDate(DateTime.makeUnsafe(parsed.startsAt));
        const endsAt = DateTime.toDate(DateTime.makeUnsafe(parsed.endsAt));

        return yield* db.transaction(
          Effect.gen(function* () {
            yield* repo.ensureCampaign(BLACK_FRIDAY_SLUG);
            const { setting, discounts } = yield* repo.updateSettings({
              slug: BLACK_FRIDAY_SLUG,
              values: {
                enabled: parsed.enabled,
                themeEnabled: parsed.themeEnabled,
                startsAt,
                endsAt,
                totalCapacity: parsed.totalCapacity,
                capacityMode: parsed.capacityMode,
                decrementIntervalMinutes: parsed.decrementIntervalMinutes,
                notifyEmail: parsed.notifyEmail ?? "",
                updatedAt: DateTime.toDate(now),
              },
              discounts: parsed.discounts,
            });
            const confirmedCount = yield* repo.countConfirmedLeads(setting.slug);
            return toPublicCampaign({ setting, discounts, confirmedCount, now });
          }),
        );
      });

      return CampaignService.of({
        getPublic,
        submitLead,
        trackEvent,
        getAdminOverview,
        listLeadsForExport,
        updateLead,
        updateSettings,
      });
    }),
  );
}
