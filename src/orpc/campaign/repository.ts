import { and, asc, count, desc, eq } from "drizzle-orm";
import { Context, DateTime, Effect, Layer, Option } from "effect";

import { campaignDiscount, campaignEvent, campaignLead, campaignSetting } from "#/db/schema";
import {
  BLACK_FRIDAY_SLUG,
  DEFAULT_CAMPAIGN_CAPACITY,
  DEFAULT_CAMPAIGN_ENDS_AT_ISO,
  DEFAULT_CAMPAIGN_STARTS_AT_ISO,
  DEFAULT_DECREMENT_INTERVAL_MINUTES,
  DEFAULT_DISCOUNTS,
  type CampaignEventKind,
  type CapacityMode,
  type DiscountCode,
  type LeadStatus,
  type LeadTreatment,
} from "#/orpc/campaign/constants";
import { Db } from "#/server/db.server";

/*===== Types =====*/

export type CampaignSettingRecord = typeof campaignSetting.$inferSelect;
export type CampaignDiscountRecord = typeof campaignDiscount.$inferSelect;
export type CampaignLeadRecord = typeof campaignLead.$inferSelect;

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
  updatedAt: Date;
};

type DiscountUpdateItem = {
  code: DiscountCode;
  title: string;
  cashPercent: number;
  installmentPercent: number;
};

export type CampaignEventCounts = {
  landingViews: number;
  bannerClicks: number;
  popupClicks: number;
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
    /** Counts leads in `confirmed` status for capacity calculation. */
    readonly countConfirmedLeads: (slug: string) => Effect.Effect<number>;
    /**
     * Inserts a lead only if its normalized phone is not already registered for `campaignSlug`.
     * Returns `Option.none()` on conflict instead of failing the transaction.
     */
    readonly insertLeadIfNew: (values: NewLeadRecord) => Effect.Effect<Option.Option<CampaignLeadRecord>>;
    /** Lists all leads for a campaign, newest first. */
    readonly listLeads: (slug: string) => Effect.Effect<CampaignLeadRecord[]>;
    /** Updates a lead's follow-up status and consultant notes, or returns `Option.none()` if missing. */
    readonly updateLead: (args: {
      id: string;
      status: LeadStatus;
      notes: string;
      updatedAt: Date;
    }) => Effect.Effect<Option.Option<CampaignLeadRecord>>;
    /** Updates campaign settings and each matching discount row inside the active transaction. */
    readonly updateSettings: (args: {
      slug: string;
      values: SettingUpdateValues;
      discounts: readonly DiscountUpdateItem[];
    }) => Effect.Effect<{ setting: CampaignSettingRecord; discounts: CampaignDiscountRecord[] }>;
    /** Records a lightweight funnel event (landing page view, banner click, popup click). */
    readonly insertEvent: (args: {
      campaignSlug: string;
      kind: CampaignEventKind;
      source: string;
    }) => Effect.Effect<void>;
    /** Returns aggregated counts of recorded funnel events for the campaign. */
    readonly countEvents: (slug: string) => Effect.Effect<CampaignEventCounts>;
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

      const updateSettings = Effect.fn("CampaignRepo.updateSettings")(function* ({
        slug,
        values,
        discounts,
      }: {
        slug: string;
        values: SettingUpdateValues;
        discounts: readonly DiscountUpdateItem[];
      }) {
        const [setting] = yield* q
          .update(campaignSetting)
          .set(values)
          .where(eq(campaignSetting.slug, slug))
          .returning();
        if (!setting) return yield* Effect.die(new Error("CampaignRepo.updateSettings: setting not found"));

        for (const item of discounts) {
          yield* q
            .update(campaignDiscount)
            .set({
              title: item.title,
              cashPercent: item.cashPercent,
              installmentPercent: item.installmentPercent,
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

        const counts: CampaignEventCounts = { landingViews: 0, bannerClicks: 0, popupClicks: 0 };
        for (const row of rows) {
          if (row.kind === "landing_view") counts.landingViews = row.value;
          else if (row.kind === "banner_click") counts.bannerClicks = row.value;
          else if (row.kind === "popup_click") counts.popupClicks = row.value;
        }
        return counts;
      }, Effect.orDie);

      return CampaignRepo.of({
        ensureCampaign,
        countConfirmedLeads,
        insertLeadIfNew,
        listLeads,
        updateLead,
        updateSettings,
        insertEvent,
        countEvents,
      });
    }),
  );
}
