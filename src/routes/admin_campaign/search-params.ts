import { Schema } from "effect";

import { optionalSearchParam, searchParam, searchSchema } from "#/lib/schema";
import { LEAD_STATUSES, LEAD_TREATMENTS } from "#/orpc/campaign/constants";

/*===== Admin Campaign Search Params =====*/

const ADMIN_TABS = ["leads", "report", "settings"] as const;
const STATUS_FILTERS = ["all", ...LEAD_STATUSES] as const;
const TREATMENT_FILTERS = ["all", ...LEAD_TREATMENTS] as const;

const AdminCampaignSearchStruct = Schema.Struct({
  tab: searchParam(Schema.Literals(ADMIN_TABS), "leads"),
  status: searchParam(Schema.Literals(STATUS_FILTERS), "all"),
  treatment: searchParam(Schema.Literals(TREATMENT_FILTERS), "all"),
  q: optionalSearchParam(Schema.String),
});

export type AdminCampaignSearch = typeof AdminCampaignSearchStruct.Type;
export const adminCampaignSearchSchema = searchSchema(AdminCampaignSearchStruct);
