import { Effect } from "effect";

import type { RateLimitPolicy } from "#/lib/rate-limit.server";
import { CampaignService } from "#/orpc/campaign/service";
import { effectProcedure } from "#/orpc/effect.server";
import { base } from "#/orpc/implementer.server";
import { m } from "#/paraglide/messages";

/*===== Rate Limits =====*/

const LEAD_SUBMIT_LIMIT: RateLimitPolicy = { name: "campaign-lead", limit: 15, windowMs: 60_000 };
const EVENT_TRACK_LIMIT: RateLimitPolicy = { name: "campaign-event", limit: 90, windowMs: 60_000 };

/*===== Public Procedures =====*/

export const publicCampaignProcedure = effectProcedure(base.campaign.public, {
  run: () => CampaignService.use((campaign) => campaign.getPublic),
  errors: {},
});

export const submitLeadProcedure = effectProcedure(base.campaign.submitLead, {
  rateLimit: LEAD_SUBMIT_LIMIT,
  run: ({ input }) =>
    Effect.gen(function* () {
      const campaign = yield* CampaignService;
      return yield* campaign.submitLead(input);
    }),
  errors: {
    DuplicateCampaignLead: ({ errors }) =>
      errors.CONFLICT({
        data: {
          errors: [m.campaign_error_duplicate_phone()],
          fields: { phone: m.campaign_error_duplicate_phone() },
        },
      }),
    CampaignInactive: ({ error, errors }) =>
      errors.BAD_REQUEST({
        data: {
          errors: [
            error.reason === "sold_out"
              ? m.campaign_sold_out_message()
              : error.reason === "not_started"
                ? m.campaign_upcoming_message()
                : m.campaign_error_inactive(),
          ],
          fields: {},
        },
      }),
  },
});

export const trackEventProcedure = effectProcedure(base.campaign.trackEvent, {
  rateLimit: EVENT_TRACK_LIMIT,
  run: ({ input }) =>
    Effect.gen(function* () {
      const campaign = yield* CampaignService;
      yield* campaign.trackEvent({ kind: input.kind, source: input.source });
    }),
  errors: {},
});

/*===== Admin Procedures =====*/

export const adminOverviewProcedure = effectProcedure(base.campaign.adminOverview, {
  access: ["admin"],
  run: () => CampaignService.use((campaign) => campaign.getAdminOverview),
  errors: {},
});

export const updateLeadProcedure = effectProcedure(base.campaign.updateLead, {
  access: ["admin"],
  run: ({ input: { id, ...fields } }) =>
    Effect.gen(function* () {
      const campaign = yield* CampaignService;
      return yield* campaign.updateLead({ id, input: fields });
    }),
  errors: {
    CampaignLeadNotFound: ({ errors }) =>
      errors.NOT_FOUND({
        data: { errors: [m.campaign_error_lead_not_found()], fields: {} },
      }),
  },
});

export const updateSettingsProcedure = effectProcedure(base.campaign.updateSettings, {
  access: ["admin"],
  run: ({ input }) =>
    Effect.gen(function* () {
      const campaign = yield* CampaignService;
      return yield* campaign.updateSettings(input);
    }),
  errors: {},
});
