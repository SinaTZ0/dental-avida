import { randomInt } from "node:crypto";

import { expect, layer } from "@effect/vitest";
import { eq, inArray } from "drizzle-orm";
import { Effect, Layer } from "effect";

import { campaignAdChannel, campaignEvent, campaignLead } from "#/db/schema";
import {
  BLACK_FRIDAY_SLUG,
  DEFAULT_CAMPAIGN_CAPACITY,
  DEFAULT_CAMPAIGN_ENDS_AT_ISO,
  DEFAULT_CAMPAIGN_STARTS_AT_ISO,
  DEFAULT_DECREMENT_INTERVAL_MINUTES,
  DEFAULT_DISCOUNTS,
} from "#/orpc/campaign/constants";
import { CampaignInactive, DuplicateAdChannelCode, DuplicateCampaignLead } from "#/orpc/campaign/errors";
import { CampaignService } from "#/orpc/campaign/service";
import { Db } from "#/server/db.server";
import { AppLayer } from "#/server/runtime.server";

/*===== Helpers =====*/

const query = <A>(f: (q: Db["Service"]["q"]) => Effect.Effect<A, unknown>) =>
  Db.use(({ q }) => f(q).pipe(Effect.orDie));

const createdPhones: string[] = [];
const createdAdCodes: string[] = [];

function uniquePhone(): string {
  const suffix = String(randomInt(10_000_000, 99_999_999));
  const phone = `099${suffix}`;
  createdPhones.push(phone);
  return phone;
}

function uniqueAdCode(): string {
  const code = `test-ad-${randomInt(100_000, 999_999)}`;
  createdAdCodes.push(code);
  return code;
}

const Cleanup = Layer.effectDiscard(
  Effect.acquireRelease(Effect.void, () =>
    Effect.gen(function* () {
      if (createdPhones.length > 0) {
        yield* query((q) => q.delete(campaignLead).where(inArray(campaignLead.phoneNormalized, createdPhones)));
      }
      if (createdAdCodes.length > 0) {
        yield* query((q) => q.delete(campaignAdChannel).where(inArray(campaignAdChannel.code, createdAdCodes)));
        yield* query((q) => q.delete(campaignEvent).where(inArray(campaignEvent.source, createdAdCodes)));
      }
      yield* query((q) => q.delete(campaignEvent).where(eq(campaignEvent.source, "test-suite")));
      // Restore default campaign settings so tests never leave the site disabled or altered.
      const campaign = yield* CampaignService;
      yield* campaign
        .updateSettings({
          enabled: true,
          themeEnabled: true,
          startsAt: DEFAULT_CAMPAIGN_STARTS_AT_ISO,
          endsAt: DEFAULT_CAMPAIGN_ENDS_AT_ISO,
          totalCapacity: DEFAULT_CAMPAIGN_CAPACITY,
          capacityMode: "scheduled",
          decrementIntervalMinutes: DEFAULT_DECREMENT_INTERVAL_MINUTES,
          notifyEmail: "",
          crmWebhookUrl: "",
          clearCrmWebhookSecret: true,
          discounts: DEFAULT_DISCOUNTS.map(({ code, title, cashPercent, installmentPercent }) => ({
            code,
            title,
            cashPercent,
            installmentPercent,
            basePriceToman: null,
          })),
        })
        .pipe(Effect.orDie);
    }),
  ),
);

/*===== Tests =====*/

layer(Cleanup.pipe(Layer.provideMerge(AppLayer)), { excludeTestServices: true })("campaign", (it) => {
  it.effect("submits a normalized lead, deduplicates alternate phone formats, and tracks Section 6 pipeline", () =>
    Effect.gen(function* () {
      const campaign = yield* CampaignService;
      const phone = uniquePhone();
      const intlPhone = `+98${phone.slice(1)}`;

      const pub = yield* campaign.getPublic;
      expect(pub.slug).toBe(BLACK_FRIDAY_SLUG);
      expect(pub.discounts.length).toBeGreaterThanOrEqual(3);

      const created = yield* campaign.submitLead({
        fullName: "  سارا احمدي  ",
        phone,
        treatment: "laminate",
        utmSource: "instagram",
        utmMedium: "banner",
      });
      expect(created.id).toBeTruthy();

      const dup = yield* Effect.flip(
        campaign.submitLead({
          fullName: "تکراری",
          phone: intlPhone,
          treatment: "implant_fixture",
        }),
      );
      expect(dup).toBeInstanceOf(DuplicateCampaignLead);

      const referred = yield* campaign.updateLead({
        id: created.id,
        input: { status: "referred", notes: "ارجاع به پذیرش برای نوبت معاینه" },
      });
      expect(referred.status).toBe("referred");

      const updated = yield* campaign.updateLead({
        id: created.id,
        input: { status: "confirmed", notes: "تماس گرفته شد و وقت مشاوره رزرو شد" },
      });
      expect(updated.fullName).toBe("سارا احمدی");
      expect(updated.source).toBe("instagram / banner");
      expect(updated.status).toBe("confirmed");
      expect(updated.notes).toContain("رزرو شد");
    }),
  );

  it.effect("tracks ad channels, /go/ad/$code redirects, live CPL, and prevents duplicate codes", () =>
    Effect.gen(function* () {
      const campaign = yield* CampaignService;
      const code = uniqueAdCode();

      const channel = yield* campaign.saveAdChannel({
        code,
        name: "سایت خبری استان — بنر صفحه اول",
        platformType: "provincial_portal",
        placement: "banner",
        budgetToman: 10_000_000,
        spentToman: 4_000_000,
        scheduleText: "۱ تا ۱۲ آذر ۱۴۰۵",
        approvalStatus: "approved",
        notes: "تأیید مدیریت انجام شد",
      });
      expect(channel.code).toBe(code);
      expect(channel.approvalStatus).toBe("approved");

      const dupCode = yield* Effect.flip(
        campaign.saveAdChannel({
          code,
          name: "تکراری",
          platformType: "local_site",
          placement: "cpc",
          budgetToman: 0,
          spentToman: 0,
          approvalStatus: "draft",
        }),
      );
      expect(dupCode).toBeInstanceOf(DuplicateAdChannelCode);

      const { redirectPath } = yield* campaign.recordAdClick(code);
      expect(redirectPath).toBe(`/black-friday?utm_source=${code}&utm_medium=banner&utm_campaign=${BLACK_FRIDAY_SLUG}`);

      yield* campaign.trackEvent({ kind: "landing_view", source: code });
      yield* campaign.submitLead({
        fullName: "مریم رضایی",
        phone: uniquePhone(),
        treatment: "implant_with_crown",
        utmSource: code,
        utmMedium: "banner",
      });

      const overview = yield* campaign.getAdminOverview;
      const measured = overview.adChannels.find((ch) => ch.id === channel.id);
      expect(measured).toBeDefined();
      expect(measured?.adClicks).toBe(1);
      expect(measured?.landingViews).toBe(1);
      expect(measured?.totalLeads).toBe(1);
      expect(measured?.validLeads).toBe(1);
      expect(measured?.costPerLeadToman).toBe(4_000_000);
      expect(overview.readiness.hasApprovedAdChannel).toBe(true);

      yield* campaign.deleteAdChannel(channel.id);
    }),
  );

  it.effect("disables submissions and reverts themeActive when campaign is turned off", () =>
    Effect.gen(function* () {
      const campaign = yield* CampaignService;

      const disabled = yield* campaign.updateSettings({
        enabled: false,
        themeEnabled: true,
        startsAt: DEFAULT_CAMPAIGN_STARTS_AT_ISO,
        endsAt: DEFAULT_CAMPAIGN_ENDS_AT_ISO,
        totalCapacity: 51,
        capacityMode: "scheduled",
        decrementIntervalMinutes: 335,
        notifyEmail: "",
        crmWebhookUrl: "",
        discounts: DEFAULT_DISCOUNTS.map(({ code, title, cashPercent, installmentPercent }) => ({
          code,
          title,
          cashPercent,
          installmentPercent,
          basePriceToman: 20_000_000,
        })),
      });

      expect(disabled.status).toBe("disabled");
      expect(disabled.themeActive).toBe(false);
      expect(disabled.discounts[0]?.basePriceToman).toBe(20_000_000);

      const rejected = yield* Effect.flip(
        campaign.submitLead({
          fullName: "کاربر تست",
          phone: uniquePhone(),
          treatment: "laminate",
        }),
      );
      expect(rejected).toBeInstanceOf(CampaignInactive);
    }),
  );
});
