import type {
  AdApprovalStatus,
  AdPlacement,
  AdPlatformType,
  CapacityMode,
  CrmSyncStatus,
  LeadStatus,
  LeadTreatment,
} from "#/orpc/campaign/constants";
import { m } from "#/paraglide/messages";

/*===== Localized Labels =====*/
// Functions rather than module-scope constants so messages always render in the active request's locale.

export function leadStatusLabel(status: LeadStatus): string {
  switch (status) {
    case "new":
      return m.admin_campaign_status_new();
    case "contacted":
      return m.admin_campaign_status_contacted();
    case "referred":
      return m.admin_campaign_status_referred();
    case "confirmed":
      return m.admin_campaign_status_confirmed();
    case "unreachable":
      return m.admin_campaign_status_unreachable();
    case "cancelled":
      return m.admin_campaign_status_cancelled();
  }
}

export function leadStatusBadgeVariant(
  status: LeadStatus,
): "default" | "info" | "success" | "warning" | "destructive" | "outline" {
  switch (status) {
    case "new":
      return "info";
    case "contacted":
      return "warning";
    case "referred":
      return "outline";
    case "confirmed":
      return "success";
    case "unreachable":
      return "default";
    case "cancelled":
      return "destructive";
  }
}

export function crmSyncLabel(status: CrmSyncStatus): string | null {
  switch (status) {
    case "none":
      return null;
    case "pending":
      return m.admin_campaign_crm_status_pending();
    case "synced":
      return m.admin_campaign_crm_status_synced();
    case "failed":
      return m.admin_campaign_crm_status_failed();
  }
}

export function crmSyncBadgeVariant(status: CrmSyncStatus): "default" | "info" | "success" | "destructive" {
  switch (status) {
    case "pending":
      return "info";
    case "synced":
      return "success";
    case "failed":
      return "destructive";
    case "none":
      return "default";
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

export function adPlatformLabel(type: AdPlatformType): string {
  switch (type) {
    case "local_site":
      return m.admin_campaign_ads_platform_local_site();
    case "provincial_portal":
      return m.admin_campaign_ads_platform_provincial_portal();
    case "ad_network":
      return m.admin_campaign_ads_platform_ad_network();
    case "social":
      return m.admin_campaign_ads_platform_social();
    case "search":
      return m.admin_campaign_ads_platform_search();
    case "other":
      return m.admin_campaign_ads_platform_other();
  }
}

export function adPlacementLabel(placement: AdPlacement): string {
  switch (placement) {
    case "banner":
      return m.admin_campaign_ads_placement_banner();
    case "cpc":
      return m.admin_campaign_ads_placement_cpc();
    case "story":
      return m.admin_campaign_ads_placement_story();
    case "advertorial":
      return m.admin_campaign_ads_placement_advertorial();
    case "other":
      return m.admin_campaign_ads_placement_other();
  }
}

export function adApprovalLabel(status: AdApprovalStatus): string {
  switch (status) {
    case "draft":
      return m.admin_campaign_ads_approval_draft();
    case "pending_approval":
      return m.admin_campaign_ads_approval_pending();
    case "approved":
      return m.admin_campaign_ads_approval_approved();
    case "active":
      return m.admin_campaign_ads_approval_active();
    case "paused":
      return m.admin_campaign_ads_approval_paused();
    case "completed":
      return m.admin_campaign_ads_approval_completed();
  }
}

export function adApprovalBadgeVariant(
  status: AdApprovalStatus,
): "default" | "info" | "success" | "warning" | "outline" {
  switch (status) {
    case "draft":
      return "outline";
    case "pending_approval":
      return "warning";
    case "approved":
      return "info";
    case "active":
      return "success";
    case "paused":
      return "default";
    case "completed":
      return "outline";
  }
}

export function sourceLabel(source: string): string {
  return source === "direct" ? m.admin_campaign_source_direct() : source;
}
