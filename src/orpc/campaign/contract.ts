import { oc } from "@orpc/contract";
import { Schema } from "effect";

import { standardSchema } from "#/lib/schema";
import {
  CAMPAIGN_EVENT_KINDS,
  CAMPAIGN_STATUSES,
  CAPACITY_MODES,
  DISCOUNT_CODES,
  LEAD_STATUSES,
  LEAD_TREATMENTS,
} from "#/orpc/campaign/constants";
import { authErrors, commonErrors, errorDataSchema, roleErrors } from "#/orpc/errors";

/*===== Public Schemas =====*/

export const CampaignDiscountSchema = Schema.Struct({
  id: Schema.String,
  code: Schema.Literals(DISCOUNT_CODES),
  title: Schema.String,
  cashPercent: Schema.Int,
  installmentPercent: Schema.Int,
  sortOrder: Schema.Int,
});

export type CampaignDiscount = typeof CampaignDiscountSchema.Type;

export const PublicCampaignSchema = Schema.Struct({
  slug: Schema.String,
  status: Schema.Literals(CAMPAIGN_STATUSES),
  /** True only when the campaign is live AND `themeEnabled` is on; drives `data-campaign="black-friday"` on `<html>`. */
  themeActive: Schema.Boolean,
  startsAt: Schema.Date,
  endsAt: Schema.Date,
  /** Server clock at read time so client countdowns stay accurate even when a visitor's system clock is skewed. */
  serverNow: Schema.Date,
  totalCapacity: Schema.Int,
  remainingCapacity: Schema.Int,
  maxDiscountPercent: Schema.Int,
  discounts: Schema.Array(CampaignDiscountSchema),
});

export type PublicCampaign = typeof PublicCampaignSchema.Type;

// Structure only: normalization and domain rules live in `validation.ts`.
const SubmitLeadInput = Schema.Struct({
  fullName: Schema.String,
  phone: Schema.String,
  treatment: Schema.String,
  source: Schema.optional(Schema.String),
  utmSource: Schema.optional(Schema.String),
  utmMedium: Schema.optional(Schema.String),
  utmCampaign: Schema.optional(Schema.String),
  referrer: Schema.optional(Schema.String),
  /** Hidden honeypot field: bots fill it, real visitors leave it empty. */
  website: Schema.optional(Schema.String),
});

const SubmitLeadOutput = Schema.Struct({
  id: Schema.String,
  createdAt: Schema.Date,
});

export type SubmitLeadResult = typeof SubmitLeadOutput.Type;

const TrackEventInput = Schema.Struct({
  kind: Schema.Literals(CAMPAIGN_EVENT_KINDS),
  source: Schema.optional(Schema.String),
});

/*===== Admin Schemas =====*/

export const CampaignLeadSchema = Schema.Struct({
  id: Schema.String,
  fullName: Schema.String,
  phoneRaw: Schema.String,
  phoneNormalized: Schema.String,
  treatment: Schema.Literals(LEAD_TREATMENTS),
  source: Schema.String,
  utmSource: Schema.String,
  utmMedium: Schema.String,
  utmCampaign: Schema.String,
  referrer: Schema.String,
  status: Schema.Literals(LEAD_STATUSES),
  notes: Schema.String,
  createdAt: Schema.Date,
  updatedAt: Schema.Date,
});

export type CampaignLead = typeof CampaignLeadSchema.Type;

export const CampaignSettingsSchema = Schema.Struct({
  slug: Schema.String,
  enabled: Schema.Boolean,
  themeEnabled: Schema.Boolean,
  startsAt: Schema.Date,
  endsAt: Schema.Date,
  totalCapacity: Schema.Int,
  capacityMode: Schema.Literals(CAPACITY_MODES),
  decrementIntervalMinutes: Schema.Int,
  notifyEmail: Schema.String,
  updatedAt: Schema.Date,
});

export type CampaignSettings = typeof CampaignSettingsSchema.Type;

export const DailyLeadStatSchema = Schema.Struct({
  /** Jalali day label formatted in Asia/Tehran, e.g. `۱۴۰۵/۰۹/۰۲`. */
  jalaliDate: Schema.String,
  /** ISO day key in Asia/Tehran (`YYYY-MM-DD`) for stable sorting. */
  isoDay: Schema.String,
  total: Schema.Int,
  confirmed: Schema.Int,
});

export const BreakdownStatSchema = Schema.Struct({
  key: Schema.String,
  count: Schema.Int,
});

export const AdminCampaignOverviewSchema = Schema.Struct({
  settings: CampaignSettingsSchema,
  status: Schema.Literals(CAMPAIGN_STATUSES),
  themeActive: Schema.Boolean,
  remainingCapacity: Schema.Int,
  discounts: Schema.Array(CampaignDiscountSchema),
  leads: Schema.Array(CampaignLeadSchema),
  totals: Schema.Struct({
    totalLeads: Schema.Int,
    confirmedLeads: Schema.Int,
    todayLeads: Schema.Int,
    landingViews: Schema.Int,
    bannerClicks: Schema.Int,
    popupClicks: Schema.Int,
  }),
  dailyReport: Schema.Array(DailyLeadStatSchema),
  bySource: Schema.Array(BreakdownStatSchema),
  byTreatment: Schema.Array(BreakdownStatSchema),
  byStatus: Schema.Array(BreakdownStatSchema),
});

export type AdminCampaignOverview = typeof AdminCampaignOverviewSchema.Type;

const UpdateLeadInput = Schema.Struct({
  id: Schema.String,
  status: Schema.String,
  notes: Schema.optional(Schema.String),
});

const UpdateSettingsInput = Schema.Struct({
  enabled: Schema.Boolean,
  themeEnabled: Schema.Boolean,
  startsAt: Schema.String,
  endsAt: Schema.String,
  totalCapacity: Schema.Finite,
  capacityMode: Schema.String,
  decrementIntervalMinutes: Schema.Finite,
  notifyEmail: Schema.optional(Schema.String),
  discounts: Schema.Array(
    Schema.Struct({
      code: Schema.String,
      title: Schema.String,
      cashPercent: Schema.Finite,
      installmentPercent: Schema.Finite,
    }),
  ),
});

/*===== Errors =====*/

const submitLeadErrors = {
  CONFLICT: { message: "Phone number already registered.", data: errorDataSchema },
  BAD_REQUEST: { message: "Campaign is not active.", data: errorDataSchema },
};

const notFoundErrors = {
  NOT_FOUND: { message: "Campaign lead not found.", data: errorDataSchema },
};

/*===== Procedures =====*/

export const publicCampaignContract = oc.errors(commonErrors).output(standardSchema(PublicCampaignSchema));

export const submitLeadContract = oc
  .errors({ ...commonErrors, ...submitLeadErrors })
  .input(standardSchema(SubmitLeadInput))
  .output(standardSchema(SubmitLeadOutput));

export const trackEventContract = oc
  .errors(commonErrors)
  .input(standardSchema(TrackEventInput))
  .output(standardSchema(Schema.Void));

export const adminOverviewContract = oc
  .errors({ ...commonErrors, ...authErrors, ...roleErrors })
  .output(standardSchema(AdminCampaignOverviewSchema));

export const updateLeadContract = oc
  .errors({ ...commonErrors, ...authErrors, ...roleErrors, ...notFoundErrors })
  .input(standardSchema(UpdateLeadInput))
  .output(standardSchema(CampaignLeadSchema));

export const updateSettingsContract = oc
  .errors({ ...commonErrors, ...authErrors, ...roleErrors })
  .input(standardSchema(UpdateSettingsInput))
  .output(standardSchema(PublicCampaignSchema));

export const campaignContract = {
  public: publicCampaignContract,
  submitLead: submitLeadContract,
  trackEvent: trackEventContract,
  adminOverview: adminOverviewContract,
  updateLead: updateLeadContract,
  updateSettings: updateSettingsContract,
};
