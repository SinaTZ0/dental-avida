import { Context, DateTime, Effect, Layer, Option, Schema } from "effect";

import { APP_TIME_ZONE } from "#/lib/locale";
import {
  BLACK_FRIDAY_SLUG,
  computeCostPerLead,
  computeRemainingCapacity,
  isValidAdChannelCode,
  isValidLeadStatus,
  normalizeAdChannelCode,
  resolveCampaignStatus,
  type AdApprovalStatus,
  type AdPlacement,
  type AdPlatformType,
  type CampaignEventKind,
  type CapacityMode,
  type CrmSyncStatus,
  type DiscountCode,
  type LeadStatus,
  type LeadTreatment,
} from "#/orpc/campaign/constants";
import type {
  AdminCampaignOverview,
  CampaignAdChannel,
  CampaignDiscount,
  CampaignLead,
  PublicCampaign,
  SubmitLeadResult,
  TestCrmWebhookResult,
} from "#/orpc/campaign/contract";
import {
  AdChannelNotFound,
  CampaignInactive,
  CampaignLeadNotFound,
  CrmWebhookFailed,
  DuplicateAdChannelCode,
  DuplicateCampaignLead,
} from "#/orpc/campaign/errors";
import { NotifyCampaignLead, SyncCampaignLeadToCrm } from "#/orpc/campaign/jobs.server";
import {
  CampaignRepo,
  type CampaignAdChannelRecord,
  type CampaignDiscountRecord,
  type CampaignEventSourceCount,
  type CampaignLeadRecord,
  type CampaignSettingRecord,
} from "#/orpc/campaign/repository";
import {
  SaveAdChannelFields,
  SubmitLeadFields,
  UpdateLeadFields,
  UpdateSettingsFields,
} from "#/orpc/campaign/validation";
import { postCrmWebhook } from "#/orpc/campaign/webhook.server";
import { Db } from "#/server/db.server";
import { decodeInput, type InvalidInput } from "#/server/errors";
import { Jobs } from "#/server/jobs.server";

/*===== Helpers =====*/

const isUuid = Schema.is(Schema.String.check(Schema.isUUID()));

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
    basePriceToman: row.basePriceToman ?? null,
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
    crmSyncStatus: row.crmSyncStatus as CrmSyncStatus,
    crmSyncedAt: row.crmSyncedAt ?? null,
    crmLastError: row.crmLastError,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function matchesChannelSource(channelCode: string, sourceValue: string): boolean {
  const normalized = sourceValue.trim().toLowerCase();
  return normalized === channelCode || normalized.startsWith(`${channelCode} /`);
}

function toPublicAdChannel({
  row,
  leads,
  eventsBySource,
}: {
  row: CampaignAdChannelRecord;
  leads: readonly CampaignLead[];
  eventsBySource: readonly CampaignEventSourceCount[];
}): CampaignAdChannel {
  const code = row.code.toLowerCase();
  let adClicks = 0;
  let landingViews = 0;

  for (const event of eventsBySource) {
    if (!matchesChannelSource(code, event.source)) continue;
    if (event.kind === "ad_click") adClicks += event.count;
    else if (event.kind === "landing_view") landingViews += event.count;
  }

  let totalLeads = 0;
  let validLeads = 0;
  let confirmedLeads = 0;

  for (const lead of leads) {
    const matched = lead.utmSource.trim().toLowerCase() === code || matchesChannelSource(code, lead.source);
    if (!matched) continue;
    totalLeads += 1;
    if (isValidLeadStatus(lead.status)) validLeads += 1;
    if (lead.status === "confirmed") confirmedLeads += 1;
  }

  return {
    id: row.id,
    code: row.code,
    name: row.name,
    platformType: row.platformType as AdPlatformType,
    placement: row.placement as AdPlacement,
    budgetToman: row.budgetToman,
    spentToman: row.spentToman,
    scheduleText: row.scheduleText,
    approvalStatus: row.approvalStatus as AdApprovalStatus,
    notes: row.notes,
    adClicks,
    landingViews,
    totalLeads,
    validLeads,
    confirmedLeads,
    costPerLeadToman: computeCostPerLead({ spentToman: row.spentToman, count: totalLeads }),
    costPerValidLeadToman: computeCostPerLead({ spentToman: row.spentToman, count: validLeads }),
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
    /** Validates, deduplicates, and stores a visitor lead, queuing advisor email and/or CRM sync jobs. */
    readonly submitLead: (
      input: unknown,
    ) => Effect.Effect<SubmitLeadResult, InvalidInput | CampaignInactive | DuplicateCampaignLead>;
    /** Records a lightweight funnel event (landing page view, ribbon click, popup click, or ad click). */
    readonly trackEvent: (args: { kind: CampaignEventKind; source?: string }) => Effect.Effect<void>;
    /** Records a server-side `ad_click` for `/go/ad/$code` and returns the destination `/black-friday` URL with UTM params. */
    readonly recordAdClick: (rawCode: string) => Effect.Effect<{ redirectPath: string }>;
    /** Full admin dashboard snapshot: settings, discounts, leads, ad channels, CPL, Section 6 funnel, and readiness. */
    readonly getAdminOverview: Effect.Effect<AdminCampaignOverview>;
    /** Lists leads with optional status/treatment filters for Excel export. */
    readonly listLeadsForExport: (args: { status?: string; treatment?: string }) => Effect.Effect<CampaignLead[]>;
    /** Lists ad channels with live clicks, views, leads, and CPL for management-approval Excel export. */
    readonly listAdChannelsForExport: Effect.Effect<CampaignAdChannel[]>;
    /** Updates a lead's follow-up status and advisor notes. */
    readonly updateLead: (args: {
      id: string;
      input: unknown;
    }) => Effect.Effect<CampaignLead, InvalidInput | CampaignLeadNotFound>;
    /** Updates campaign settings, dates, capacity rules, theme flag, CRM webhook, and discount percentages/prices. */
    readonly updateSettings: (input: unknown) => Effect.Effect<PublicCampaign, InvalidInput>;
    /** Creates or updates a planned/active advertising channel for management approval and CPL tracking. */
    readonly saveAdChannel: (
      input: unknown,
    ) => Effect.Effect<CampaignAdChannel, InvalidInput | DuplicateAdChannelCode | AdChannelNotFound>;
    /** Removes an advertising channel from the media plan. */
    readonly deleteAdChannel: (id: string) => Effect.Effect<void, AdChannelNotFound>;
    /** Sends a signed `campaign.webhook.test` event to the configured CRM/PRM webhook URL. */
    readonly testCrmWebhook: Effect.Effect<TestCrmWebhookResult, CrmWebhookFailed>;
    /** Re-queues CRM/PRM webhook delivery for a single lead. */
    readonly retryLeadCrmSync: (id: string) => Effect.Effect<CampaignLead, CampaignLeadNotFound | CrmWebhookFailed>;
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
      const decodeAdChannel = decodeInput(SaveAdChannelFields);

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
            const hasCrmWebhook = setting.crmWebhookUrl.trim().length > 0;

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
              crmSyncStatus: hasCrmWebhook ? "pending" : "none",
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

            if (hasCrmWebhook) {
              yield* SyncCampaignLeadToCrm.enqueue({ leadId: inserted.value.id }).pipe(
                Effect.provideService(Jobs, jobs),
              );
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

      /*------ Tracked Ad Redirect (/go/ad/$code) ------*/
      const recordAdClick = Effect.fn("CampaignService.recordAdClick")(function* (rawCode: string) {
        const { setting } = yield* repo.ensureCampaign(BLACK_FRIDAY_SLUG);
        const normalized = normalizeAdChannelCode(rawCode);
        const safeCode = isValidAdChannelCode(normalized) ? normalized : "ad";

        const channel = yield* repo.findAdChannelByCode({ slug: setting.slug, code: safeCode });
        const placement = Option.isSome(channel) ? channel.value.placement : "ad";

        yield* repo.insertEvent({
          campaignSlug: setting.slug,
          kind: "ad_click",
          source: safeCode,
        });

        const params = new URLSearchParams({
          utm_source: safeCode,
          utm_medium: placement,
          utm_campaign: setting.slug,
        });
        return { redirectPath: `/black-friday?${params.toString()}` };
      });

      /*------ Admin Overview ------*/
      const getAdminOverview = Effect.gen(function* () {
        const [{ setting, discounts }, leadRows, adChannelRows, events, eventsBySource, now] = yield* Effect.all([
          repo.ensureCampaign(BLACK_FRIDAY_SLUG),
          repo.listLeads(BLACK_FRIDAY_SLUG),
          repo.listAdChannels(BLACK_FRIDAY_SLUG),
          repo.countEvents(BLACK_FRIDAY_SLUG),
          repo.countEventsBySource(BLACK_FRIDAY_SLUG),
          DateTime.now,
        ]);

        const leads = leadRows.map(toPublicLead);
        const adChannels = adChannelRows.map((row) => toPublicAdChannel({ row, leads, eventsBySource }));

        let validLeads = 0;
        let contactedOrBeyond = 0;
        let referredLeads = 0;
        let referredOrBeyond = 0;
        let confirmedLeads = 0;
        let todayLeads = 0;

        const todayIso = isoDayFormatter.format(DateTime.toDate(now));
        const dailyMap = new Map<
          string,
          { isoDay: string; jalaliDate: string; total: number; valid: number; referred: number; confirmed: number }
        >();

        for (const lead of leads) {
          const valid = isValidLeadStatus(lead.status);
          if (valid) validLeads += 1;
          if (lead.status === "contacted" || lead.status === "referred" || lead.status === "confirmed") {
            contactedOrBeyond += 1;
          }
          if (lead.status === "referred") referredLeads += 1;
          if (lead.status === "referred" || lead.status === "confirmed") referredOrBeyond += 1;
          if (lead.status === "confirmed") confirmedLeads += 1;

          const isoDay = isoDayFormatter.format(lead.createdAt);
          if (isoDay === todayIso) todayLeads += 1;
          const existing = dailyMap.get(isoDay) ?? {
            isoDay,
            jalaliDate: jalaliDayFormatter.format(lead.createdAt),
            total: 0,
            valid: 0,
            referred: 0,
            confirmed: 0,
          };
          existing.total += 1;
          if (valid) existing.valid += 1;
          if (lead.status === "referred") existing.referred += 1;
          if (lead.status === "confirmed") existing.confirmed += 1;
          dailyMap.set(isoDay, existing);
        }

        const publicState = toPublicCampaign({ setting, discounts, confirmedCount: confirmedLeads, now });
        const dailyReport = [...dailyMap.values()].toSorted((a, b) => b.isoDay.localeCompare(a.isoDay));

        const totalAdBudgetToman = adChannels.reduce((sum, ch) => sum + ch.budgetToman, 0);
        const totalAdSpentToman = adChannels.reduce((sum, ch) => sum + ch.spentToman, 0);
        const adAndBannerClicks = events.adClicks + events.bannerClicks + events.popupClicks;

        const hasApprovedAdChannel = adChannels.some(
          (ch) =>
            ch.approvalStatus === "approved" || ch.approvalStatus === "active" || ch.approvalStatus === "completed",
        );

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
            crmWebhookUrl: setting.crmWebhookUrl,
            crmWebhookSecretConfigured: setting.crmWebhookSecret.trim().length > 0,
            updatedAt: setting.updatedAt,
          },
          status: publicState.status,
          themeActive: publicState.themeActive,
          remainingCapacity: publicState.remainingCapacity,
          discounts: publicState.discounts,
          leads,
          adChannels,
          totals: {
            totalLeads: leads.length,
            validLeads,
            referredLeads,
            confirmedLeads,
            todayLeads,
            landingViews: events.landingViews,
            bannerClicks: events.bannerClicks,
            popupClicks: events.popupClicks,
            adClicks: events.adClicks,
            totalAdBudgetToman,
            totalAdSpentToman,
            overallCostPerLeadToman: computeCostPerLead({ spentToman: totalAdSpentToman, count: leads.length }),
            overallCostPerValidLeadToman: computeCostPerLead({ spentToman: totalAdSpentToman, count: validLeads }),
          },
          funnel: {
            adAndBannerClicks,
            landingViews: events.landingViews,
            totalLeads: leads.length,
            validLeads,
            contactedOrBeyond,
            referredOrBeyond,
            confirmedLeads,
          },
          readiness: {
            campaignActive: publicState.status === "active" && publicState.remainingCapacity > 0,
            discountsConfigured:
              publicState.discounts.length >= 3 && publicState.discounts.every((item) => item.cashPercent > 0),
            advisorDeliveryConfigured: setting.notifyEmail.trim().length > 0 || setting.crmWebhookUrl.trim().length > 0,
            hasApprovedAdChannel,
            hasTrackedTraffic: events.landingViews > 0 || adAndBannerClicks > 0,
            crmWebhookEnabled: setting.crmWebhookUrl.trim().length > 0,
          },
          dailyReport,
          bySource: buildBreakdown(leads.map((lead) => lead.source)),
          byTreatment: buildBreakdown(leads.map((lead) => lead.treatment)),
          byStatus: buildBreakdown(leads.map((lead) => lead.status)),
        };
      }).pipe(Effect.withSpan("CampaignService.getAdminOverview"));

      /*------ Export Queries ------*/
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

      const listAdChannelsForExport = Effect.gen(function* () {
        yield* repo.ensureCampaign(BLACK_FRIDAY_SLUG);
        const [leadRows, adChannelRows, eventsBySource] = yield* Effect.all([
          repo.listLeads(BLACK_FRIDAY_SLUG),
          repo.listAdChannels(BLACK_FRIDAY_SLUG),
          repo.countEventsBySource(BLACK_FRIDAY_SLUG),
        ]);
        const leads = leadRows.map(toPublicLead);
        return adChannelRows.map((row) => toPublicAdChannel({ row, leads, eventsBySource }));
      }).pipe(Effect.withSpan("CampaignService.listAdChannelsForExport"));

      /*------ Admin Lead Update ------*/
      const updateLead = Effect.fn("CampaignService.updateLead")(function* ({
        id,
        input,
      }: {
        id: string;
        input: unknown;
      }) {
        if (!isUuid(id)) return yield* new CampaignLeadNotFound({ id });
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

        const nextSecret = parsed.clearCrmWebhookSecret
          ? ""
          : parsed.crmWebhookSecret && parsed.crmWebhookSecret.length > 0
            ? parsed.crmWebhookSecret
            : undefined;

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
                crmWebhookUrl: parsed.crmWebhookUrl ?? "",
                crmWebhookSecret: nextSecret,
                updatedAt: DateTime.toDate(now),
              },
              discounts: parsed.discounts.map((item) => ({
                code: item.code,
                title: item.title,
                cashPercent: item.cashPercent,
                installmentPercent: item.installmentPercent,
                basePriceToman: item.basePriceToman && item.basePriceToman > 0 ? item.basePriceToman : null,
              })),
            });
            const confirmedCount = yield* repo.countConfirmedLeads(setting.slug);
            return toPublicCampaign({ setting, discounts, confirmedCount, now });
          }),
        );
      });

      /*------ Admin Ad Channels CRUD ------*/
      const saveAdChannel = Effect.fn("CampaignService.saveAdChannel")(function* (input: unknown) {
        const parsed = yield* decodeAdChannel(input);
        const now = yield* DateTime.nowAsDate;

        const saved = yield* db.transaction(
          Effect.gen(function* () {
            const { setting } = yield* repo.ensureCampaign(BLACK_FRIDAY_SLUG);

            if (parsed.id) {
              if (!isUuid(parsed.id)) return yield* new AdChannelNotFound({ id: parsed.id });
              const existing = yield* repo.findAdChannelById(parsed.id);
              if (Option.isNone(existing)) return yield* new AdChannelNotFound({ id: parsed.id });

              if (existing.value.code !== parsed.code) {
                const collision = yield* repo.findAdChannelByCode({ slug: setting.slug, code: parsed.code });
                if (Option.isSome(collision) && collision.value.id !== parsed.id) {
                  return yield* new DuplicateAdChannelCode({ code: parsed.code });
                }
              }

              const updated = yield* repo.updateAdChannel({
                id: parsed.id,
                code: parsed.code,
                name: parsed.name,
                platformType: parsed.platformType,
                placement: parsed.placement,
                budgetToman: parsed.budgetToman,
                spentToman: parsed.spentToman,
                scheduleText: parsed.scheduleText ?? "",
                approvalStatus: parsed.approvalStatus,
                notes: parsed.notes ?? "",
                updatedAt: now,
              });
              if (Option.isNone(updated)) return yield* new AdChannelNotFound({ id: parsed.id });
              return updated.value;
            }

            const inserted = yield* repo.insertAdChannelIfNew({
              campaignSlug: setting.slug,
              code: parsed.code,
              name: parsed.name,
              platformType: parsed.platformType,
              placement: parsed.placement,
              budgetToman: parsed.budgetToman,
              spentToman: parsed.spentToman,
              scheduleText: parsed.scheduleText ?? "",
              approvalStatus: parsed.approvalStatus,
              notes: parsed.notes ?? "",
            });
            if (Option.isNone(inserted)) {
              return yield* new DuplicateAdChannelCode({ code: parsed.code });
            }
            return inserted.value;
          }),
        );

        const [leadRows, eventsBySource] = yield* Effect.all([
          repo.listLeads(BLACK_FRIDAY_SLUG),
          repo.countEventsBySource(BLACK_FRIDAY_SLUG),
        ]);
        return toPublicAdChannel({ row: saved, leads: leadRows.map(toPublicLead), eventsBySource });
      });

      const deleteAdChannel = Effect.fn("CampaignService.deleteAdChannel")(function* (id: string) {
        if (!isUuid(id)) return yield* new AdChannelNotFound({ id });
        const deleted = yield* repo.deleteAdChannel(id);
        if (!deleted) return yield* new AdChannelNotFound({ id });
      });

      /*------ CRM Webhook Test & Retry ------*/
      const testCrmWebhook = Effect.gen(function* () {
        const [{ setting }, now] = yield* Effect.all([repo.ensureCampaign(BLACK_FRIDAY_SLUG), DateTime.now]);
        return yield* postCrmWebhook({
          url: setting.crmWebhookUrl,
          secret: setting.crmWebhookSecret,
          event: "campaign.webhook.test",
          payload: {
            campaignSlug: setting.slug,
            sentAt: DateTime.formatIso(now),
            clinic: "Avida Dental Clinic",
          },
        });
      }).pipe(Effect.withSpan("CampaignService.testCrmWebhook"));

      const retryLeadCrmSync = Effect.fn("CampaignService.retryLeadCrmSync")(function* (id: string) {
        if (!isUuid(id)) return yield* new CampaignLeadNotFound({ id });
        const { setting } = yield* repo.ensureCampaign(BLACK_FRIDAY_SLUG);
        if (!setting.crmWebhookUrl.trim()) {
          return yield* new CrmWebhookFailed({ reason: "not_configured" });
        }

        const updated = yield* db.transaction(
          Effect.gen(function* () {
            const lead = yield* repo.updateLeadCrmSync({
              id,
              crmSyncStatus: "pending",
              crmSyncedAt: null,
              crmLastError: "",
            });
            if (Option.isNone(lead)) return yield* new CampaignLeadNotFound({ id });
            yield* SyncCampaignLeadToCrm.enqueue({ leadId: lead.value.id }).pipe(Effect.provideService(Jobs, jobs));
            return lead.value;
          }),
        );

        return toPublicLead(updated);
      });

      return CampaignService.of({
        getPublic,
        submitLead,
        trackEvent,
        recordAdClick,
        getAdminOverview,
        listLeadsForExport,
        listAdChannelsForExport,
        updateLead,
        updateSettings,
        saveAdChannel,
        deleteAdChannel,
        testCrmWebhook,
        retryLeadCrmSync,
      });
    }),
  );
}
