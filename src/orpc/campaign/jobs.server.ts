import { Cause, Effect, Schedule, Schema } from "effect";

import { renderCampaignLeadAlert } from "#/mail/templates/campaign-lead-alert";
import { LEAD_TREATMENTS } from "#/orpc/campaign/constants";
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
