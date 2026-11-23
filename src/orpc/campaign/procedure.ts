import { Effect } from "effect";

import type { RateLimitPolicy } from "#/lib/rate-limit.server";
import { CampaignService } from "#/orpc/campaign/service";
import { effectProcedure } from "#/orpc/effect.server";
import { base } from "#/orpc/implementer.server";
import { m } from "#/paraglide/messages";

/*===== Rate Limits =====*/

const LEAD_SUBMIT_LIMIT: RateLimitPolicy = { name: "campaign-lead", limit: 15, windowMs: 60_000 };
const EVENT_TRACK_LIMIT: RateLimitPolicy = { name: "campaign-event", limit: 90, windowMs: 60_000 };
const CRM_TEST_LIMIT: RateLimitPolicy = { name: "campaign-crm-test", limit: 10, windowMs: 60_000 };

/*===== Error Helpers =====*/

function crmWebhookMessage(reason: "not_configured" | "unsafe_url" | "network" | "http_error", statusCode?: number) {
  if (reason === "not_configured") return m.admin_campaign_crm_error_not_configured();
  if (reason === "unsafe_url") return m.campaign_error_invalid_webhook_url();
  if (reason === "http_error" && statusCode !== undefined) {
    return m.admin_campaign_crm_error_http({ status: statusCode });
  }
  return m.admin_campaign_crm_error_network();
}

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

export const saveAdChannelProcedure = effectProcedure(base.campaign.saveAdChannel, {
  access: ["admin"],
  run: ({ input }) =>
    Effect.gen(function* () {
      const campaign = yield* CampaignService;
      return yield* campaign.saveAdChannel(input);
    }),
  errors: {
    DuplicateAdChannelCode: ({ errors }) =>
      errors.CONFLICT({
        data: {
          errors: [m.admin_campaign_ads_error_duplicate_code()],
          fields: { code: m.admin_campaign_ads_error_duplicate_code() },
        },
      }),
    AdChannelNotFound: ({ errors }) =>
      errors.NOT_FOUND({
        data: { errors: [m.admin_campaign_ads_error_not_found()], fields: {} },
      }),
  },
});

export const deleteAdChannelProcedure = effectProcedure(base.campaign.deleteAdChannel, {
  access: ["admin"],
  run: ({ input: { id } }) =>
    Effect.gen(function* () {
      const campaign = yield* CampaignService;
      yield* campaign.deleteAdChannel(id);
    }),
  errors: {
    AdChannelNotFound: ({ errors }) =>
      errors.NOT_FOUND({
        data: { errors: [m.admin_campaign_ads_error_not_found()], fields: {} },
      }),
  },
});

export const testCrmWebhookProcedure = effectProcedure(base.campaign.testCrmWebhook, {
  access: ["admin"],
  rateLimit: CRM_TEST_LIMIT,
  run: () => CampaignService.use((campaign) => campaign.testCrmWebhook),
  errors: {
    CrmWebhookFailed: ({ error, errors }) =>
      errors.BAD_REQUEST({
        data: { errors: [crmWebhookMessage(error.reason, error.statusCode)], fields: {} },
      }),
  },
});

export const retryLeadCrmSyncProcedure = effectProcedure(base.campaign.retryLeadCrmSync, {
  access: ["admin"],
  rateLimit: CRM_TEST_LIMIT,
  run: ({ input: { id } }) =>
    Effect.gen(function* () {
      const campaign = yield* CampaignService;
      return yield* campaign.retryLeadCrmSync(id);
    }),
  errors: {
    CampaignLeadNotFound: ({ errors }) =>
      errors.NOT_FOUND({
        data: { errors: [m.campaign_error_lead_not_found()], fields: {} },
      }),
    CrmWebhookFailed: ({ error, errors }) =>
      errors.BAD_REQUEST({
        data: { errors: [crmWebhookMessage(error.reason, error.statusCode)], fields: {} },
      }),
  },
});
