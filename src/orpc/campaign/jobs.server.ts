import { Cause, DateTime, Effect, Option, Schedule, Schema } from "effect";

import { renderCampaignLeadAlert } from "#/mail/templates/campaign-lead-alert";
import { BLACK_FRIDAY_SLUG, LEAD_TREATMENTS } from "#/orpc/campaign/constants";
import { CampaignRepo } from "#/orpc/campaign/repository";
import { postCrmWebhook } from "#/orpc/campaign/webhook.server";
import { baseLocale } from "#/paraglide/runtime";
import { AppConfig } from "#/server/config.server";
import { defineJob } from "#/server/jobs.server";
import { Mailer } from "#/server/mailer.server";

/*===== Lead Alert Job =====*/

const LeadAlertPayload = Schema.Struct({
  to: Schema.String,
  fullName: Schema.String,
  phone: Schema.String,
  treatment: Schema.Literals(LEAD_TREATMENTS),
  source: Schema.String,
});

export type LeadAlertPayload = typeof LeadAlertPayload.Type;

/**
 * Queued inside `CampaignService.submitLead`'s transaction when an advisor notification email is configured, so the
 * visitor gets an instant response while SMTP delivery runs and retries safely in the background.
 */
export const NotifyCampaignLead = defineJob({
  name: "campaign.notify-lead",
  payload: LeadAlertPayload,
  maxAttempts: 6,
  retrySchedule: Schedule.exponential("2 seconds"),
  run: Effect.fn("CampaignJobs.notifyLead")(function* ({ to, fullName, phone, treatment, source }: LeadAlertPayload) {
    const { siteUrl } = yield* AppConfig;
    const adminUrl = new URL("/admin/campaign", siteUrl).href;
    const email = yield* Effect.promise(() =>
      renderCampaignLeadAlert({
        locale: baseLocale,
        fullName,
        phone,
        treatment,
        source,
        adminUrl,
      }),
    );
    const mailer = yield* Mailer;
    const { messageId } = yield* mailer.send({ to, ...email }).pipe(
      Effect.catchIf(
        (error) => error.permanent,
        (error) =>
          Effect.logError("campaign lead alert refused by mail server", Cause.fail(error)).pipe(
            Effect.as({ messageId: "" }),
          ),
      ),
    );
    if (messageId) {
      yield* Effect.logInfo("campaign lead alert sent").pipe(Effect.annotateLogs({ messageId }));
    }
  }),
});

/*===== CRM / PRM Webhook Sync Job =====*/

const CrmSyncPayload = Schema.Struct({
  leadId: Schema.String,
});

export type CrmSyncPayload = typeof CrmSyncPayload.Type;

/**
 * Delivers a newly captured campaign lead to the configured external CRM/PRM webhook with optional HMAC signing
 * (Section 5 #9). Retries transient network/5xx errors with exponential backoff and stops immediately on 4xx refusals.
 */
export const SyncCampaignLeadToCrm = defineJob({
  name: "campaign.sync-lead-crm",
  payload: CrmSyncPayload,
  maxAttempts: 6,
  retrySchedule: Schedule.exponential("3 seconds"),
  run: Effect.fn("CampaignJobs.syncLeadToCrm")(function* ({ leadId }: CrmSyncPayload) {
    const repo = yield* CampaignRepo;
    const [{ setting }, foundLead] = yield* Effect.all([
      repo.ensureCampaign(BLACK_FRIDAY_SLUG),
      repo.findLeadById(leadId),
    ]);

    if (Option.isNone(foundLead)) return;
    const lead = foundLead.value;
    const url = setting.crmWebhookUrl.trim();
    if (!url) return;

    const outcome = yield* postCrmWebhook({
      url,
      secret: setting.crmWebhookSecret,
      event: "campaign.lead.created",
      payload: {
        campaignSlug: lead.campaignSlug,
        lead: {
          id: lead.id,
          fullName: lead.fullName,
          phone: lead.phoneNormalized,
          treatment: lead.treatment,
          source: lead.source,
          utmSource: lead.utmSource,
          utmMedium: lead.utmMedium,
          utmCampaign: lead.utmCampaign,
          referrer: lead.referrer,
          status: lead.status,
          createdAt: lead.createdAt.toISOString(),
        },
      },
    }).pipe(Effect.result);

    if (outcome._tag === "Success") {
      const now = yield* DateTime.nowAsDate;
      yield* repo.updateLeadCrmSync({
        id: lead.id,
        crmSyncStatus: "synced",
        crmSyncedAt: now,
        crmLastError: "",
      });
      yield* Effect.logInfo("campaign lead synced to CRM").pipe(
        Effect.annotateLogs({
          leadId: lead.id,
          statusCode: outcome.success.statusCode,
          latencyMs: outcome.success.latencyMs,
        }),
      );
      return;
    }

    const err = outcome.failure;
    const errorLabel =
      err.reason === "http_error" && err.statusCode !== undefined ? `HTTP ${err.statusCode}` : err.reason;

    yield* repo.updateLeadCrmSync({
      id: lead.id,
      crmSyncStatus: "failed",
      crmSyncedAt: null,
      crmLastError: errorLabel,
    });

    const isPermanent =
      err.reason === "not_configured" ||
      err.reason === "unsafe_url" ||
      (err.reason === "http_error" &&
        err.statusCode !== undefined &&
        err.statusCode >= 400 &&
        err.statusCode < 500 &&
        err.statusCode !== 429);

    if (isPermanent) {
      yield* Effect.logError("campaign CRM webhook refused lead permanently", Cause.fail(err)).pipe(
        Effect.annotateLogs({ leadId: lead.id, reason: err.reason, statusCode: err.statusCode }),
      );
      return;
    }

    return yield* err;
  }),
});
