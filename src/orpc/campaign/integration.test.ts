import { randomInt } from "node:crypto";

import { expect, layer } from "@effect/vitest";
import { eq, inArray } from "drizzle-orm";
import { Effect, Layer } from "effect";

import { campaignEvent, campaignLead } from "#/db/schema";
import {
  BLACK_FRIDAY_SLUG,
  DEFAULT_CAMPAIGN_CAPACITY,
  DEFAULT_CAMPAIGN_ENDS_AT_ISO,
  DEFAULT_CAMPAIGN_STARTS_AT_ISO,
  DEFAULT_DECREMENT_INTERVAL_MINUTES,
  DEFAULT_DISCOUNTS,
} from "#/orpc/campaign/constants";
import { CampaignInactive, DuplicateCampaignLead } from "#/orpc/campaign/errors";
import { CampaignService } from "#/orpc/campaign/service";
import { Db } from "#/server/db.server";
import { AppLayer } from "#/server/runtime.server";

/*===== Helpers =====*/

const query = <A>(f: (q: Db["Service"]["q"]) => Effect.Effect<A, unknown>) =>
  Db.use(({ q }) => f(q).pipe(Effect.orDie));

const createdPhones: string[] = [];

function uniquePhone(): string {
  const suffix = String(randomInt(10_000_000, 99_999_999));
  const phone = `099${suffix}`;
  createdPhones.push(phone);
  return phone;
}

const Cleanup = Layer.effectDiscard(
  Effect.acquireRelease(Effect.void, () =>
    Effect.gen(function* () {
      if (createdPhones.length > 0) {
        yield* query((q) => q.delete(campaignLead).where(inArray(campaignLead.phoneNormalized, createdPhones)));
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
          discounts: DEFAULT_DISCOUNTS.map(({ code, title, cashPercent, installmentPercent }) => ({
            code,
            title,
            cashPercent,
            installmentPercent,
          })),
        })
        .pipe(Effect.orDie);
    }),
  ),
);

/*===== Tests =====*/

layer(Cleanup.pipe(Layer.provideMerge(AppLayer)), { excludeTestServices: true })("campaign", (it) => {
  it.effect("submits a normalized lead, deduplicates alternate phone formats, and updates follow-up status", () =>
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
        discounts: DEFAULT_DISCOUNTS.map(({ code, title, cashPercent, installmentPercent }) => ({
          code,
          title,
          cashPercent,
          installmentPercent,
        })),
      });

      expect(disabled.status).toBe("disabled");
      expect(disabled.themeActive).toBe(false);

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
