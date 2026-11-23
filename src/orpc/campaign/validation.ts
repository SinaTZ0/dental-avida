import { Schema, SchemaTransformation } from "effect";

import { PersianText } from "#/lib/schema";
import {
  AD_APPROVAL_STATUSES,
  AD_NAME_MAX_LENGTH,
  AD_NOTES_MAX_LENGTH,
  AD_PLACEMENTS,
  AD_PLATFORM_TYPES,
  AD_SCHEDULE_MAX_LENGTH,
  CAPACITY_MODES,
  CRM_WEBHOOK_SECRET_MAX_LENGTH,
  CRM_WEBHOOK_URL_MAX_LENGTH,
  DISCOUNT_CODES,
  DISCOUNT_TITLE_MAX_LENGTH,
  LEAD_NAME_MAX_LENGTH,
  LEAD_NOTES_MAX_LENGTH,
  LEAD_REFERRER_MAX_LENGTH,
  LEAD_SOURCE_MAX_LENGTH,
  LEAD_STATUSES,
  LEAD_TREATMENTS,
  LEAD_UTM_MAX_LENGTH,
  MAX_AD_BUDGET_TOMAN,
  MAX_BASE_PRICE_TOMAN,
  MAX_CAMPAIGN_CAPACITY,
  MAX_DECREMENT_INTERVAL_MINUTES,
  MAX_DISCOUNT_PERCENT,
  isSafeWebhookUrl,
  isValidAdChannelCode,
  normalizeAdChannelCode,
  normalizeIranPhone,
} from "#/orpc/campaign/constants";
import { m } from "#/paraglide/messages";

/*===== Helpers =====*/

const IRAN_PHONE_REGEX = /^0(?:9\d{9}|[1-8]\d{9})$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const NormalizedPhone = Schema.String.pipe(
  Schema.decodeTo(
    Schema.String,
    SchemaTransformation.transform({ decode: normalizeIranPhone, encode: (value: string) => value }),
  ),
);

const NormalizedAdCode = Schema.String.pipe(
  Schema.decodeTo(
    Schema.String,
    SchemaTransformation.transform({ decode: normalizeAdChannelCode, encode: (value: string) => value }),
  ),
);

const TrimmedString = Schema.String.pipe(
  Schema.decodeTo(
    Schema.String,
    SchemaTransformation.transform({ decode: (value: string) => value.trim(), encode: (value: string) => value }),
  ),
);

/*===== Lead Submission =====*/

export const SubmitLeadFields = Schema.Struct({
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
  source: Schema.optional(TrimmedString.check(Schema.isMaxLength(LEAD_SOURCE_MAX_LENGTH))),
  utmSource: Schema.optional(TrimmedString.check(Schema.isMaxLength(LEAD_UTM_MAX_LENGTH))),
  utmMedium: Schema.optional(TrimmedString.check(Schema.isMaxLength(LEAD_UTM_MAX_LENGTH))),
  utmCampaign: Schema.optional(TrimmedString.check(Schema.isMaxLength(LEAD_UTM_MAX_LENGTH))),
  referrer: Schema.optional(TrimmedString.check(Schema.isMaxLength(LEAD_REFERRER_MAX_LENGTH))),
  website: Schema.optional(Schema.String),
});

export type SubmitLeadFields = typeof SubmitLeadFields.Type;

/*===== Admin Lead Update =====*/

export const UpdateLeadFields = Schema.Struct({
  status: Schema.Literals(LEAD_STATUSES),
  notes: Schema.optional(
    PersianText.check(
      Schema.isMaxLength(LEAD_NOTES_MAX_LENGTH, {
        text: () => m.campaign_error_notes_too_long({ max: LEAD_NOTES_MAX_LENGTH }),
      }),
    ),
  ),
});

export type UpdateLeadFields = typeof UpdateLeadFields.Type;

/*===== Admin Campaign Settings =====*/

const DiscountItemFields = Schema.Struct({
  code: Schema.Literals(DISCOUNT_CODES),
  title: PersianText.check(
    Schema.isMinLength(1, { text: () => m.campaign_error_name_required() }),
    Schema.isMaxLength(DISCOUNT_TITLE_MAX_LENGTH),
  ),
  cashPercent: Schema.Int.check(
    Schema.isBetween({ minimum: 0, maximum: MAX_DISCOUNT_PERCENT }, { text: () => m.campaign_error_invalid_percent() }),
  ),
  installmentPercent: Schema.Int.check(
    Schema.isBetween({ minimum: 0, maximum: MAX_DISCOUNT_PERCENT }, { text: () => m.campaign_error_invalid_percent() }),
  ),
  basePriceToman: Schema.optional(
    Schema.NullOr(
      Schema.Int.check(
        Schema.isBetween(
          { minimum: 0, maximum: MAX_BASE_PRICE_TOMAN },
          { text: () => m.campaign_error_invalid_price() },
        ),
      ),
    ),
  ),
});

export const UpdateSettingsFields = Schema.Struct({
  enabled: Schema.Boolean,
  themeEnabled: Schema.Boolean,
  startsAt: Schema.String.check(
    Schema.makeFilter((value) => !Number.isNaN(Date.parse(value)), {
      text: () => m.campaign_error_invalid_dates(),
    }),
  ),
  endsAt: Schema.String.check(
    Schema.makeFilter((value) => !Number.isNaN(Date.parse(value)), {
      text: () => m.campaign_error_invalid_dates(),
    }),
  ),
  totalCapacity: Schema.Int.check(
    Schema.isBetween(
      { minimum: 1, maximum: MAX_CAMPAIGN_CAPACITY },
      { text: () => m.campaign_error_invalid_capacity() },
    ),
  ),
  capacityMode: Schema.Literals(CAPACITY_MODES),
  decrementIntervalMinutes: Schema.Int.check(
    Schema.isBetween(
      { minimum: 1, maximum: MAX_DECREMENT_INTERVAL_MINUTES },
      { text: () => m.campaign_error_invalid_interval() },
    ),
  ),
  notifyEmail: Schema.optional(
    TrimmedString.check(
      Schema.makeFilter((value) => value === "" || EMAIL_REGEX.test(value), {
        text: () => m.campaign_error_invalid_email(),
      }),
    ),
  ),
  crmWebhookUrl: Schema.optional(
    TrimmedString.check(
      Schema.isMaxLength(CRM_WEBHOOK_URL_MAX_LENGTH),
      Schema.makeFilter((value) => value === "" || isSafeWebhookUrl(value), {
        text: () => m.campaign_error_invalid_webhook_url(),
      }),
    ),
  ),
  crmWebhookSecret: Schema.optional(TrimmedString.check(Schema.isMaxLength(CRM_WEBHOOK_SECRET_MAX_LENGTH))),
  clearCrmWebhookSecret: Schema.optional(Schema.Boolean),
  discounts: Schema.Array(DiscountItemFields),
}).check(
  Schema.makeFilter((value) => Date.parse(value.endsAt) > Date.parse(value.startsAt), {
    text: () => m.campaign_error_invalid_dates(),
  }),
);

export type UpdateSettingsFields = typeof UpdateSettingsFields.Type;

/*===== Admin Ad Channel =====*/

export const SaveAdChannelFields = Schema.Struct({
  id: Schema.optional(Schema.String),
  code: NormalizedAdCode.check(
    Schema.makeFilter(isValidAdChannelCode, { text: () => m.campaign_error_invalid_ad_code() }),
  ),
  name: PersianText.check(
    Schema.isMinLength(2, { text: () => m.campaign_error_name_required() }),
    Schema.isMaxLength(AD_NAME_MAX_LENGTH),
  ),
  platformType: Schema.Literals(AD_PLATFORM_TYPES),
  placement: Schema.Literals(AD_PLACEMENTS),
  budgetToman: Schema.Int.check(
    Schema.isBetween(
      { minimum: 0, maximum: MAX_AD_BUDGET_TOMAN },
      { text: () => m.campaign_error_invalid_ad_budget() },
    ),
  ),
  spentToman: Schema.Int.check(
    Schema.isBetween(
      { minimum: 0, maximum: MAX_AD_BUDGET_TOMAN },
      { text: () => m.campaign_error_invalid_ad_budget() },
    ),
  ),
  scheduleText: Schema.optional(PersianText.check(Schema.isMaxLength(AD_SCHEDULE_MAX_LENGTH))),
  approvalStatus: Schema.Literals(AD_APPROVAL_STATUSES),
  notes: Schema.optional(PersianText.check(Schema.isMaxLength(AD_NOTES_MAX_LENGTH))),
});

export type SaveAdChannelFields = typeof SaveAdChannelFields.Type;
