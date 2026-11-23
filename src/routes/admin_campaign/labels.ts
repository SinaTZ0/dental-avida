import type { CapacityMode, LeadStatus, LeadTreatment } from "#/orpc/campaign/constants";
import { m } from "#/paraglide/messages";

/*===== Localized Labels =====*/
// Functions rather than module-scope constants so messages always render in the active request's locale.

export function leadStatusLabel(status: LeadStatus): string {
  switch (status) {
    case "new":
      return m.admin_campaign_status_new();
    case "contacted":
      return m.admin_campaign_status_contacted();
    case "confirmed":
      return m.admin_campaign_status_confirmed();
    case "unreachable":
      return m.admin_campaign_status_unreachable();
    case "cancelled":
      return m.admin_campaign_status_cancelled();
  }
}

export function leadStatusBadgeVariant(status: LeadStatus): "default" | "info" | "success" | "warning" | "destructive" {
  switch (status) {
    case "new":
      return "info";
    case "contacted":
      return "warning";
    case "confirmed":
      return "success";
    case "unreachable":
      return "default";
    case "cancelled":
      return "destructive";
  }
}

export function leadTreatmentLabel(treatment: LeadTreatment): string {
  switch (treatment) {
    case "implant_fixture":
      return m.campaign_treatment_implant_fixture();
    case "implant_with_crown":
      return m.campaign_treatment_implant_with_crown();
    case "laminate":
      return m.campaign_treatment_laminate();
    case "both_consultation":
      return m.campaign_treatment_both_consultation();
  }
}

export function capacityModeLabel(mode: CapacityMode): string {
  switch (mode) {
    case "scheduled":
      return m.admin_campaign_mode_scheduled();
    case "confirmed":
      return m.admin_campaign_mode_confirmed();
    case "hybrid":
      return m.admin_campaign_mode_hybrid();
  }
}

export function sourceLabel(source: string): string {
  return source === "direct" ? m.admin_campaign_source_direct() : source;
}
