import { Schema } from "effect";

/*===== Campaign Errors =====*/
// Facts only: the procedure boundary maps each tagged error to localized user-facing text.

/** Lead submission arrived outside the active campaign window or after capacity ran out. */
export class CampaignInactive extends Schema.TaggedError<CampaignInactive>()("CampaignInactive", {
  reason: Schema.Literals(["disabled", "not_started", "ended", "sold_out"]),
}) {}

/** The normalized phone number is already registered for this campaign. */
export class DuplicateCampaignLead extends Schema.TaggedError<DuplicateCampaignLead>()("DuplicateCampaignLead", {
  phoneNormalized: Schema.String,
}) {}

/** No lead exists with the requested ID. */
export class CampaignLeadNotFound extends Schema.TaggedError<CampaignLeadNotFound>()("CampaignLeadNotFound", {
  id: Schema.String,
}) {}

/** An ad channel with this tracking code already exists for this campaign. */
export class DuplicateAdChannelCode extends Schema.TaggedError<DuplicateAdChannelCode>()("DuplicateAdChannelCode", {
  code: Schema.String,
}) {}

/** No ad channel exists with the requested ID. */
export class AdChannelNotFound extends Schema.TaggedError<AdChannelNotFound>()("AdChannelNotFound", {
  id: Schema.String,
}) {}

/** Outbound CRM/PRM webhook request was refused, unreachable, or not configured. */
export class CrmWebhookFailed extends Schema.TaggedError<CrmWebhookFailed>()("CrmWebhookFailed", {
  reason: Schema.Literals(["not_configured", "unsafe_url", "network", "http_error"]),
  statusCode: Schema.optional(Schema.Int),
}) {}
