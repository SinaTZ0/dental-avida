import { oc } from "@orpc/contract";
import { Schema } from "effect";

import { standardSchema } from "#/lib/schema";
import {
  AD_APPROVAL_STATUSES,
  AD_PLACEMENTS,
  AD_PLATFORM_TYPES,
  CAMPAIGN_EVENT_KINDS,
  CAMPAIGN_STATUSES,
  CAPACITY_MODES,
  CRM_SYNC_STATUSES,
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
  basePriceToman: Schema.NullOr(Schema.Int),
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
  crmSyncStatus: Schema.Literals(CRM_SYNC_STATUSES),
  crmSyncedAt: Schema.NullOr(Schema.Date),
  crmLastError: Schema.String,
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
  crmWebhookUrl: Schema.String,
  /** True when a signing secret is stored; the secret value itself is never sent back to the browser. */
  crmWebhookSecretConfigured: Schema.Boolean,
  updatedAt: Schema.Date,
});

export type CampaignSettings = typeof CampaignSettingsSchema.Type;

export const CampaignAdChannelSchema = Schema.Struct({
  id: Schema.String,
  code: Schema.String,
  name: Schema.String,
  platformType: Schema.Literals(AD_PLATFORM_TYPES),
  placement: Schema.Literals(AD_PLACEMENTS),
  budgetToman: Schema.Int,
  spentToman: Schema.Int,
  scheduleText: Schema.String,
  approvalStatus: Schema.Literals(AD_APPROVAL_STATUSES),
  notes: Schema.String,
  /** Live performance metrics computed from `campaign_event` and `campaign_lead`. */
  adClicks: Schema.Int,
  landingViews: Schema.Int,
  totalLeads: Schema.Int,
  validLeads: Schema.Int,
  confirmedLeads: Schema.Int,
  costPerLeadToman: Schema.NullOr(Schema.Int),
  costPerValidLeadToman: Schema.NullOr(Schema.Int),
  createdAt: Schema.Date,
  updatedAt: Schema.Date,
});

export type CampaignAdChannel = typeof CampaignAdChannelSchema.Type;

export const DailyLeadStatSchema = Schema.Struct({
  /** Jalali day label formatted in Asia/Tehran, e.g. `۱۴۰۵/۰۹/۰۲`. */
  jalaliDate: Schema.String,
  /** ISO day key in Asia/Tehran (`YYYY-MM-DD`) for stable sorting. */
  isoDay: Schema.String,
  total: Schema.Int,
  valid: Schema.Int,
  referred: Schema.Int,
  confirmed: Schema.Int,
});

export const BreakdownStatSchema = Schema.Struct({
  key: Schema.String,
  count: Schema.Int,
});

export const ConversionFunnelSchema = Schema.Struct({
  adAndBannerClicks: Schema.Int,
  landingViews: Schema.Int,
  totalLeads: Schema.Int,
  validLeads: Schema.Int,
  contactedOrBeyond: Schema.Int,
  referredOrBeyond: Schema.Int,
  confirmedLeads: Schema.Int,
});

export type ConversionFunnel = typeof ConversionFunnelSchema.Type;

export const CampaignReadinessSchema = Schema.Struct({
  campaignActive: Schema.Boolean,
  discountsConfigured: Schema.Boolean,
  advisorDeliveryConfigured: Schema.Boolean,
  hasApprovedAdChannel: Schema.Boolean,
  hasTrackedTraffic: Schema.Boolean,
  crmWebhookEnabled: Schema.Boolean,
});

export type CampaignReadiness = typeof CampaignReadinessSchema.Type;

export const AdminCampaignOverviewSchema = Schema.Struct({
  settings: CampaignSettingsSchema,
  status: Schema.Literals(CAMPAIGN_STATUSES),
  themeActive: Schema.Boolean,
  remainingCapacity: Schema.Int,
  discounts: Schema.Array(CampaignDiscountSchema),
  leads: Schema.Array(CampaignLeadSchema),
  adChannels: Schema.Array(CampaignAdChannelSchema),
  totals: Schema.Struct({
    totalLeads: Schema.Int,
    validLeads: Schema.Int,
    referredLeads: Schema.Int,
    confirmedLeads: Schema.Int,
    todayLeads: Schema.Int,
    landingViews: Schema.Int,
    bannerClicks: Schema.Int,
    popupClicks: Schema.Int,
    adClicks: Schema.Int,
    totalAdBudgetToman: Schema.Int,
    totalAdSpentToman: Schema.Int,
    overallCostPerLeadToman: Schema.NullOr(Schema.Int),
    overallCostPerValidLeadToman: Schema.NullOr(Schema.Int),
  }),
  funnel: ConversionFunnelSchema,
  readiness: CampaignReadinessSchema,
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
  crmWebhookUrl: Schema.optional(Schema.String),
  crmWebhookSecret: Schema.optional(Schema.String),
  clearCrmWebhookSecret: Schema.optional(Schema.Boolean),
  discounts: Schema.Array(
    Schema.Struct({
      code: Schema.String,
      title: Schema.String,
      cashPercent: Schema.Finite,
      installmentPercent: Schema.Finite,
      basePriceToman: Schema.optional(Schema.NullOr(Schema.Finite)),
    }),
  ),
});

const SaveAdChannelInput = Schema.Struct({
  id: Schema.optional(Schema.String),
  code: Schema.String,
  name: Schema.String,
  platformType: Schema.String,
  placement: Schema.String,
  budgetToman: Schema.Finite,
  spentToman: Schema.Finite,
  scheduleText: Schema.optional(Schema.String),
  approvalStatus: Schema.String,
  notes: Schema.optional(Schema.String),
});

const DeleteAdChannelInput = Schema.Struct({
  id: Schema.String,
});

const RetryLeadCrmInput = Schema.Struct({
  id: Schema.String,
});

const TestCrmWebhookOutput = Schema.Struct({
  statusCode: Schema.Int,
  latencyMs: Schema.Int,
});

export type TestCrmWebhookResult = typeof TestCrmWebhookOutput.Type;

/*===== Errors =====*/

const submitLeadErrors = {
  CONFLICT: { message: "Phone number already registered.", data: errorDataSchema },
  BAD_REQUEST: { message: "Campaign is not active.", data: errorDataSchema },
};

const notFoundErrors = {
  NOT_FOUND: { message: "Record not found.", data: errorDataSchema },
};

const adChannelErrors = {
  CONFLICT: { message: "Ad channel code already exists.", data: errorDataSchema },
  NOT_FOUND: { message: "Ad channel not found.", data: errorDataSchema },
};

const crmWebhookErrors = {
  BAD_REQUEST: { message: "CRM webhook test failed.", data: errorDataSchema },
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

export const saveAdChannelContract = oc
  .errors({ ...commonErrors, ...authErrors, ...roleErrors, ...adChannelErrors })
  .input(standardSchema(SaveAdChannelInput))
  .output(standardSchema(CampaignAdChannelSchema));

export const deleteAdChannelContract = oc
  .errors({ ...commonErrors, ...authErrors, ...roleErrors, ...notFoundErrors })
  .input(standardSchema(DeleteAdChannelInput))
  .output(standardSchema(Schema.Void));

export const testCrmWebhookContract = oc
  .errors({ ...commonErrors, ...authErrors, ...roleErrors, ...crmWebhookErrors })
  .output(standardSchema(TestCrmWebhookOutput));

export const retryLeadCrmSyncContract = oc
  .errors({ ...commonErrors, ...authErrors, ...roleErrors, ...notFoundErrors, ...crmWebhookErrors })
  .input(standardSchema(RetryLeadCrmInput))
  .output(standardSchema(CampaignLeadSchema));

export const campaignContract = {
  public: publicCampaignContract,
  submitLead: submitLeadContract,
  trackEvent: trackEventContract,
  adminOverview: adminOverviewContract,
  updateLead: updateLeadContract,
  updateSettings: updateSettingsContract,
  saveAdChannel: saveAdChannelContract,
  deleteAdChannel: deleteAdChannelContract,
  testCrmWebhook: testCrmWebhookContract,
  retryLeadCrmSync: retryLeadCrmSyncContract,
};
