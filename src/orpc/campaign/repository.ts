import { and, asc, count, desc, eq } from "drizzle-orm";
import { Context, DateTime, Effect, Layer, Option } from "effect";

import { campaignAdChannel, campaignDiscount, campaignEvent, campaignLead, campaignSetting } from "#/db/schema";
import {
  BLACK_FRIDAY_SLUG,
  DEFAULT_CAMPAIGN_CAPACITY,
  DEFAULT_CAMPAIGN_ENDS_AT_ISO,
  DEFAULT_CAMPAIGN_STARTS_AT_ISO,
  DEFAULT_DECREMENT_INTERVAL_MINUTES,
  DEFAULT_DISCOUNTS,
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
import { Db } from "#/server/db.server";

/*===== Types =====*/

export type CampaignSettingRecord = typeof campaignSetting.$inferSelect;
export type CampaignDiscountRecord = typeof campaignDiscount.$inferSelect;
export type CampaignLeadRecord = typeof campaignLead.$inferSelect;
export type CampaignAdChannelRecord = typeof campaignAdChannel.$inferSelect;

type NewLeadRecord = {
  campaignSlug: string;
  fullName: string;
  phoneRaw: string;
  phoneNormalized: string;
  treatment: LeadTreatment;
  source: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  referrer: string;
  crmSyncStatus: CrmSyncStatus;
};

type SettingUpdateValues = {
  enabled: boolean;
  themeEnabled: boolean;
  startsAt: Date;
  endsAt: Date;
  totalCapacity: number;
  capacityMode: CapacityMode;
  decrementIntervalMinutes: number;
  notifyEmail: string;
  crmWebhookUrl: string;
  crmWebhookSecret?: string;
  updatedAt: Date;
};

type DiscountUpdateItem = {
  code: DiscountCode;
  title: string;
  cashPercent: number;
  installmentPercent: number;
  basePriceToman: number | null;
};

type AdChannelValues = {
  code: string;
  name: string;
  platformType: AdPlatformType;
  placement: AdPlacement;
  budgetToman: number;
  spentToman: number;
  scheduleText: string;
  approvalStatus: AdApprovalStatus;
  notes: string;
};

export type CampaignEventCounts = {
  landingViews: number;
  bannerClicks: number;
  popupClicks: number;
  adClicks: number;
};

export type CampaignEventSourceCount = {
  kind: CampaignEventKind;
  source: string;
  count: number;
};

/*===== Campaign Repository =====*/
/**
 * Focused reads and writes for the campaign tables. Every method joins the caller's `Db.transaction`, and a failed
 * query is a defect.
 */
export class CampaignRepo extends Context.Service<
  CampaignRepo,
  {
    /** Ensures the default Black Friday campaign setting and discount rows exist, then returns them. */
    readonly ensureCampaign: (
      slug?: string,
    ) => Effect.Effect<{ setting: CampaignSettingRecord; discounts: CampaignDiscountRecord[] }>;
    /** Counts leads in `confirmed` (final booked) status for capacity calculation. */
    readonly countConfirmedLeads: (slug: string) => Effect.Effect<number>;
    /**
     * Inserts a lead only if its normalized phone is not already registered for `campaignSlug`.
     * Returns `Option.none()` on conflict instead of failing the transaction.
     */
    readonly insertLeadIfNew: (values: NewLeadRecord) => Effect.Effect<Option.Option<CampaignLeadRecord>>;
    /** Finds a single lead by ID. */
    readonly findLeadById: (id: string) => Effect.Effect<Option.Option<CampaignLeadRecord>>;
    /** Lists all leads for a campaign, newest first. */
    readonly listLeads: (slug: string) => Effect.Effect<CampaignLeadRecord[]>;
    /** Updates a lead's follow-up status and consultant notes, or returns `Option.none()` if missing. */
    readonly updateLead: (args: {
      id: string;
      status: LeadStatus;
      notes: string;
      updatedAt: Date;
    }) => Effect.Effect<Option.Option<CampaignLeadRecord>>;
    /** Records CRM/PRM webhook delivery status on a lead row. */
    readonly updateLeadCrmSync: (args: {
      id: string;
      crmSyncStatus: CrmSyncStatus;
      crmSyncedAt: Date | null;
      crmLastError: string;
    }) => Effect.Effect<Option.Option<CampaignLeadRecord>>;
    /** Updates campaign settings and each matching discount row inside the active transaction. */
    readonly updateSettings: (args: {
      slug: string;
      values: SettingUpdateValues;
      discounts: readonly DiscountUpdateItem[];
    }) => Effect.Effect<{ setting: CampaignSettingRecord; discounts: CampaignDiscountRecord[] }>;
    /** Records a lightweight funnel event (landing page view, banner click, popup click, or ad click). */
    readonly insertEvent: (args: {
      campaignSlug: string;
      kind: CampaignEventKind;
      source: string;
    }) => Effect.Effect<void>;
    /** Returns aggregated counts of recorded funnel events for the campaign. */
    readonly countEvents: (slug: string) => Effect.Effect<CampaignEventCounts>;
    /** Returns per-source event counts so ad channels report live clicks and landing views. */
    readonly countEventsBySource: (slug: string) => Effect.Effect<CampaignEventSourceCount[]>;
    /** Lists all planned and active ad channels for the campaign, newest first. */
    readonly listAdChannels: (slug: string) => Effect.Effect<CampaignAdChannelRecord[]>;
    /** Finds an ad channel by campaign slug and normalized tracking code. */
    readonly findAdChannelByCode: (args: {
      slug: string;
      code: string;
    }) => Effect.Effect<Option.Option<CampaignAdChannelRecord>>;
    /** Finds an ad channel by ID. */
    readonly findAdChannelById: (id: string) => Effect.Effect<Option.Option<CampaignAdChannelRecord>>;
    /** Inserts a new ad channel or returns `Option.none()` if its code already exists for this campaign. */
    readonly insertAdChannelIfNew: (
      args: { campaignSlug: string } & AdChannelValues,
    ) => Effect.Effect<Option.Option<CampaignAdChannelRecord>>;
    /** Updates an existing ad channel by ID, returning `Option.none()` if not found. */
    readonly updateAdChannel: (
      args: { id: string; updatedAt: Date } & AdChannelValues,
    ) => Effect.Effect<Option.Option<CampaignAdChannelRecord>>;
    /** Deletes an ad channel by ID, returning whether a row was removed. */
    readonly deleteAdChannel: (id: string) => Effect.Effect<boolean>;
  }
>()("app/orpc/campaign/CampaignRepo") {
  static readonly layer = Layer.effect(
    CampaignRepo,
    Effect.gen(function* () {
      const { q } = yield* Db;

      const defaultStartsAt = DateTime.toDate(DateTime.makeUnsafe(DEFAULT_CAMPAIGN_STARTS_AT_ISO));
      const defaultEndsAt = DateTime.toDate(DateTime.makeUnsafe(DEFAULT_CAMPAIGN_ENDS_AT_ISO));

      const ensureCampaign = Effect.fn("CampaignRepo.ensureCampaign")(function* (slug = BLACK_FRIDAY_SLUG) {
        let [setting] = yield* q.select().from(campaignSetting).where(eq(campaignSetting.slug, slug)).limit(1);

        if (!setting) {
          yield* q
            .insert(campaignSetting)
            .values({
              slug,
              enabled: true,
              themeEnabled: true,
              startsAt: defaultStartsAt,
              endsAt: defaultEndsAt,
              totalCapacity: DEFAULT_CAMPAIGN_CAPACITY,
              capacityMode: "scheduled",
              decrementIntervalMinutes: DEFAULT_DECREMENT_INTERVAL_MINUTES,
              notifyEmail: "",
              crmWebhookUrl: "",
              crmWebhookSecret: "",
            })
            .onConflictDoNothing({ target: campaignSetting.slug });
          [setting] = yield* q.select().from(campaignSetting).where(eq(campaignSetting.slug, slug)).limit(1);
        }

        if (!setting) {
          return yield* Effect.die(new Error("CampaignRepo.ensureCampaign: setting missing after insert"));
        }

        let discounts = yield* q
          .select()
          .from(campaignDiscount)
          .where(eq(campaignDiscount.campaignSlug, slug))
          .orderBy(asc(campaignDiscount.sortOrder));

        if (discounts.length === 0) {
          yield* q
            .insert(campaignDiscount)
            .values(DEFAULT_DISCOUNTS.map((item) => ({ campaignSlug: slug, ...item })))
            .onConflictDoNothing({ target: [campaignDiscount.campaignSlug, campaignDiscount.code] });
          discounts = yield* q
            .select()
            .from(campaignDiscount)
            .where(eq(campaignDiscount.campaignSlug, slug))
            .orderBy(asc(campaignDiscount.sortOrder));
        }

        return { setting, discounts };
      }, Effect.orDie);

      const countConfirmedLeads = Effect.fn("CampaignRepo.countConfirmedLeads")(function* (slug: string) {
        const [row] = yield* q
          .select({ value: count() })
          .from(campaignLead)
          .where(and(eq(campaignLead.campaignSlug, slug), eq(campaignLead.status, "confirmed")));
        return row?.value ?? 0;
      }, Effect.orDie);

      const insertLeadIfNew = Effect.fn("CampaignRepo.insertLeadIfNew")(function* (values: NewLeadRecord) {
        const [row] = yield* q
          .insert(campaignLead)
          .values(values)
          .onConflictDoNothing({ target: [campaignLead.campaignSlug, campaignLead.phoneNormalized] })
          .returning();
        return Option.fromNullishOr(row);
      }, Effect.orDie);

      const findLeadById = Effect.fn("CampaignRepo.findLeadById")(function* (id: string) {
        const [row] = yield* q.select().from(campaignLead).where(eq(campaignLead.id, id)).limit(1);
        return Option.fromNullishOr(row);
      }, Effect.orDie);

      const listLeads = Effect.fn("CampaignRepo.listLeads")(function* (slug: string) {
        return yield* q
          .select()
          .from(campaignLead)
          .where(eq(campaignLead.campaignSlug, slug))
          .orderBy(desc(campaignLead.createdAt), desc(campaignLead.id));
      }, Effect.orDie);

      const updateLead = Effect.fn("CampaignRepo.updateLead")(function* ({
        id,
        status,
        notes,
        updatedAt,
      }: {
        id: string;
        status: LeadStatus;
        notes: string;
        updatedAt: Date;
      }) {
        const [row] = yield* q
          .update(campaignLead)
          .set({ status, notes, updatedAt })
          .where(eq(campaignLead.id, id))
          .returning();
        return Option.fromNullishOr(row);
      }, Effect.orDie);

      const updateLeadCrmSync = Effect.fn("CampaignRepo.updateLeadCrmSync")(function* ({
        id,
        crmSyncStatus,
        crmSyncedAt,
        crmLastError,
      }: {
        id: string;
        crmSyncStatus: CrmSyncStatus;
        crmSyncedAt: Date | null;
        crmLastError: string;
      }) {
        const [row] = yield* q
          .update(campaignLead)
          .set({ crmSyncStatus, crmSyncedAt, crmLastError })
          .where(eq(campaignLead.id, id))
          .returning();
        return Option.fromNullishOr(row);
      }, Effect.orDie);

      const updateSettings = Effect.fn("CampaignRepo.updateSettings")(function* ({
        slug,
        values,
        discounts,
      }: {
        slug: string;
        values: SettingUpdateValues;
        discounts: readonly DiscountUpdateItem[];
      }) {
        const patch: Partial<typeof campaignSetting.$inferInsert> = {
          enabled: values.enabled,
          themeEnabled: values.themeEnabled,
          startsAt: values.startsAt,
          endsAt: values.endsAt,
          totalCapacity: values.totalCapacity,
          capacityMode: values.capacityMode,
          decrementIntervalMinutes: values.decrementIntervalMinutes,
          notifyEmail: values.notifyEmail,
          crmWebhookUrl: values.crmWebhookUrl,
          updatedAt: values.updatedAt,
        };
        if (values.crmWebhookSecret !== undefined) {
          patch.crmWebhookSecret = values.crmWebhookSecret;
        }

        const [setting] = yield* q.update(campaignSetting).set(patch).where(eq(campaignSetting.slug, slug)).returning();
        if (!setting) return yield* Effect.die(new Error("CampaignRepo.updateSettings: setting not found"));

        for (const item of discounts) {
          yield* q
            .update(campaignDiscount)
            .set({
              title: item.title,
              cashPercent: item.cashPercent,
              installmentPercent: item.installmentPercent,
              basePriceToman: item.basePriceToman,
            })
            .where(and(eq(campaignDiscount.campaignSlug, slug), eq(campaignDiscount.code, item.code)));
        }

        const updatedDiscounts = yield* q
          .select()
          .from(campaignDiscount)
          .where(eq(campaignDiscount.campaignSlug, slug))
          .orderBy(asc(campaignDiscount.sortOrder));

        return { setting, discounts: updatedDiscounts };
      }, Effect.orDie);

      const insertEvent = Effect.fn("CampaignRepo.insertEvent")(function* ({
        campaignSlug,
        kind,
        source,
      }: {
        campaignSlug: string;
        kind: CampaignEventKind;
        source: string;
      }) {
        yield* q.insert(campaignEvent).values({ campaignSlug, kind, source });
      }, Effect.orDie);

      const countEvents = Effect.fn("CampaignRepo.countEvents")(function* (slug: string) {
        const rows = yield* q
          .select({ kind: campaignEvent.kind, value: count() })
          .from(campaignEvent)
          .where(eq(campaignEvent.campaignSlug, slug))
          .groupBy(campaignEvent.kind);

        const counts: CampaignEventCounts = { landingViews: 0, bannerClicks: 0, popupClicks: 0, adClicks: 0 };
        for (const row of rows) {
          if (row.kind === "landing_view") counts.landingViews = row.value;
          else if (row.kind === "banner_click") counts.bannerClicks = row.value;
          else if (row.kind === "popup_click") counts.popupClicks = row.value;
          else if (row.kind === "ad_click") counts.adClicks = row.value;
        }
        return counts;
      }, Effect.orDie);

      const countEventsBySource = Effect.fn("CampaignRepo.countEventsBySource")(function* (slug: string) {
        const rows = yield* q
          .select({ kind: campaignEvent.kind, source: campaignEvent.source, value: count() })
          .from(campaignEvent)
          .where(eq(campaignEvent.campaignSlug, slug))
          .groupBy(campaignEvent.kind, campaignEvent.source);

        return rows.map((row) => ({
          kind: row.kind as CampaignEventKind,
          source: row.source,
          count: row.value,
        }));
      }, Effect.orDie);

      const listAdChannels = Effect.fn("CampaignRepo.listAdChannels")(function* (slug: string) {
        return yield* q
          .select()
          .from(campaignAdChannel)
          .where(eq(campaignAdChannel.campaignSlug, slug))
          .orderBy(desc(campaignAdChannel.createdAt), desc(campaignAdChannel.id));
      }, Effect.orDie);

      const findAdChannelByCode = Effect.fn("CampaignRepo.findAdChannelByCode")(function* ({
        slug,
        code,
      }: {
        slug: string;
        code: string;
      }) {
        const [row] = yield* q
          .select()
          .from(campaignAdChannel)
          .where(and(eq(campaignAdChannel.campaignSlug, slug), eq(campaignAdChannel.code, code)))
          .limit(1);
        return Option.fromNullishOr(row);
      }, Effect.orDie);

      const findAdChannelById = Effect.fn("CampaignRepo.findAdChannelById")(function* (id: string) {
        const [row] = yield* q.select().from(campaignAdChannel).where(eq(campaignAdChannel.id, id)).limit(1);
        return Option.fromNullishOr(row);
      }, Effect.orDie);

      const insertAdChannelIfNew = Effect.fn("CampaignRepo.insertAdChannelIfNew")(function* (
        values: { campaignSlug: string } & AdChannelValues,
      ) {
        const [row] = yield* q
          .insert(campaignAdChannel)
          .values(values)
          .onConflictDoNothing({ target: [campaignAdChannel.campaignSlug, campaignAdChannel.code] })
          .returning();
        return Option.fromNullishOr(row);
      }, Effect.orDie);

      const updateAdChannel = Effect.fn("CampaignRepo.updateAdChannel")(function* ({
        id,
        updatedAt,
        ...values
      }: { id: string; updatedAt: Date } & AdChannelValues) {
        const [row] = yield* q
          .update(campaignAdChannel)
          .set({ ...values, updatedAt })
          .where(eq(campaignAdChannel.id, id))
          .returning();
        return Option.fromNullishOr(row);
      }, Effect.orDie);

      const deleteAdChannel = Effect.fn("CampaignRepo.deleteAdChannel")(function* (id: string) {
        const rows = yield* q
          .delete(campaignAdChannel)
          .where(eq(campaignAdChannel.id, id))
          .returning({ id: campaignAdChannel.id });
        return rows.length > 0;
      }, Effect.orDie);

      return CampaignRepo.of({
        ensureCampaign,
        countConfirmedLeads,
        insertLeadIfNew,
        findLeadById,
        listLeads,
        updateLead,
        updateLeadCrmSync,
        updateSettings,
        insertEvent,
        countEvents,
        countEventsBySource,
        listAdChannels,
        findAdChannelByCode,
        findAdChannelById,
        insertAdChannelIfNew,
        updateAdChannel,
        deleteAdChannel,
      });
    }),
  );
}
