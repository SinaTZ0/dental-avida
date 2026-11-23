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
