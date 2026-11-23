import { Schema, SchemaTransformation } from "effect";

import { PersianText, standardSchema } from "#/lib/schema";
import { LEAD_NAME_MAX_LENGTH, LEAD_TREATMENTS, normalizeIranPhone } from "#/orpc/campaign/constants";
import { m } from "#/paraglide/messages";

/*===== Lead Capture Form Schema =====*/

const IRAN_PHONE_REGEX = /^0(?:9\d{9}|[1-8]\d{9})$/;

const NormalizedPhone = Schema.String.pipe(
  Schema.decodeTo(
    Schema.String,
    SchemaTransformation.transform({ decode: normalizeIranPhone, encode: (value: string) => value }),
  ),
);

const LeadFormStruct = Schema.Struct({
  fullName: PersianText.check(
    Schema.isMinLength(1, { text: () => m.campaign_error_name_required() }),
    Schema.isMaxLength(LEAD_NAME_MAX_LENGTH, {
      text: () => m.campaign_error_name_too_long({ max: LEAD_NAME_MAX_LENGTH }),
    }),
  ),
  phone: NormalizedPhone.check(
    Schema.isMinLength(1, { text: () => m.campaign_error_phone_required() }),
    Schema.isPattern(IRAN_PHONE_REGEX, { text: () => m.campaign_error_phone_invalid() }),
  ),
  treatment: Schema.Literals(LEAD_TREATMENTS).annotate({
    text: () => m.campaign_error_treatment_required(),
  }),
  consent: Schema.Boolean.check(
    Schema.makeFilter((value) => value === true, { text: () => m.campaign_error_consent_required() }),
  ),
  website: Schema.optional(Schema.String),
});

export type LeadFormValues = typeof LeadFormStruct.Type;

export const leadFormSchema = standardSchema(LeadFormStruct);
