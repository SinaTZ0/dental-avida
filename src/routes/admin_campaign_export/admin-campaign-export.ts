import { createFileRoute } from "@tanstack/react-router";
import { Effect } from "effect";

import { formatDate, formatNumber } from "#/lib/locale";
import {
  LEAD_STATUSES,
  LEAD_TREATMENTS,
  type AdApprovalStatus,
  type AdPlacement,
  type AdPlatformType,
  type CrmSyncStatus,
  type LeadStatus,
  type LeadTreatment,
} from "#/orpc/campaign/constants";
import { CampaignService } from "#/orpc/campaign/service";
import { buildRtlXlsx } from "#/orpc/campaign/xlsx.server";
import { m } from "#/paraglide/messages";
import { RequestContext, requireRole } from "#/server/request-context.server";
import { runInRequest } from "#/server/runtime.server";

/*===== Labels =====*/

function statusText(status: LeadStatus): string {
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

function treatmentText(treatment: LeadTreatment): string {
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

function crmSyncText(status: CrmSyncStatus): string {
  switch (status) {
    case "none":
      return "—";
    case "pending":
      return m.admin_campaign_crm_status_pending();
    case "synced":
      return m.admin_campaign_crm_status_synced();
    case "failed":
      return m.admin_campaign_crm_status_failed();
  }
}

function platformText(type: AdPlatformType): string {
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

function placementText(placement: AdPlacement): string {
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

function approvalText(status: AdApprovalStatus): string {
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

/*===== Handler =====*/

/**
 * `GET /admin/campaign/export[?kind=leads|ads&status=...&treatment=...]`:
 * Admin-only server route that streams an RTL Persian-safe `.xlsx` workbook of campaign leads or the advertising media
 * plan & CPL performance report (Section 3 #2 & Section 4 #4).
 */
async function handleGet({ request }: { request: Request }) {
  const url = new URL(request.url);
  const kind = url.searchParams.get("kind") === "ads" ? "ads" : "leads";
  const rawStatus = url.searchParams.get("status") ?? "";
  const rawTreatment = url.searchParams.get("treatment") ?? "";
  const status = LEAD_STATUSES.includes(rawStatus as LeadStatus) ? rawStatus : undefined;
  const treatment = LEAD_TREATMENTS.includes(rawTreatment as LeadTreatment) ? rawTreatment : undefined;

  if (kind === "ads") {
    const outcome = await runInRequest(
      Effect.gen(function* () {
        yield* requireRole(["admin"]);
        const campaign = yield* CampaignService;
        return yield* campaign.listAdChannelsForExport;
      }).pipe(
        Effect.provideService(RequestContext, { headers: request.headers }),
        Effect.map((channels) => ({ ok: true as const, channels })),
        Effect.catchTags({
          Unauthorized: () => Effect.succeed({ ok: false as const, status: 401 }),
          Forbidden: () => Effect.succeed({ ok: false as const, status: 403 }),
        }),
      ),
    );

    if (!outcome.ok) {
      return new Response(outcome.status === 401 ? "Unauthorized" : "Forbidden", {
        status: outcome.status,
        headers: { "Cache-Control": "no-store" },
      });
    }

    const columns = [
      { header: m.admin_campaign_col_index(), width: 8 },
      { header: m.admin_campaign_ads_col_name(), width: 28 },
      { header: m.admin_campaign_ads_col_code(), width: 20 },
      { header: m.admin_campaign_ads_col_platform(), width: 20 },
      { header: m.admin_campaign_ads_col_placement(), width: 16 },
      { header: m.admin_campaign_ads_col_schedule(), width: 22 },
      { header: m.admin_campaign_ads_col_approval(), width: 20 },
      { header: m.admin_campaign_ads_col_budget(), width: 18 },
      { header: m.admin_campaign_ads_col_spent(), width: 18 },
      { header: m.admin_campaign_ads_col_clicks(), width: 12 },
      { header: m.admin_campaign_ads_col_views(), width: 14 },
      { header: m.admin_campaign_ads_col_leads(), width: 12 },
      { header: m.admin_campaign_ads_col_valid_leads(), width: 14 },
      { header: m.admin_campaign_ads_col_cpl(), width: 20 },
      { header: m.admin_campaign_ads_col_notes(), width: 30 },
    ] as const;

    const rows = outcome.channels.map((ch, idx) => [
      formatNumber(idx + 1),
      ch.name,
      ch.code,
      platformText(ch.platformType),
      placementText(ch.placement),
      ch.scheduleText || "—",
      approvalText(ch.approvalStatus),
      formatNumber(ch.budgetToman),
      formatNumber(ch.spentToman),
      formatNumber(ch.adClicks),
      formatNumber(ch.landingViews),
      formatNumber(ch.totalLeads),
      formatNumber(ch.validLeads),
      ch.costPerLeadToman !== null ? formatNumber(ch.costPerLeadToman) : "—",
      ch.notes,
    ]);

    const buffer = buildRtlXlsx({
      sheetName: "برنامه تبلیغات و CPL",
      columns,
      rows,
    });

    return new Response(Buffer.from(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="avida-black-friday-ads-plan.xlsx"',
        "Cache-Control": "no-store",
      },
    });
  }

  const outcome = await runInRequest(
    Effect.gen(function* () {
      yield* requireRole(["admin"]);
      const campaign = yield* CampaignService;
      return yield* campaign.listLeadsForExport({ status, treatment });
    }).pipe(
      Effect.provideService(RequestContext, { headers: request.headers }),
      Effect.map((leads) => ({ ok: true as const, leads })),
      Effect.catchTags({
        Unauthorized: () => Effect.succeed({ ok: false as const, status: 401 }),
        Forbidden: () => Effect.succeed({ ok: false as const, status: 403 }),
      }),
    ),
  );

  if (!outcome.ok) {
    return new Response(outcome.status === 401 ? "Unauthorized" : "Forbidden", {
      status: outcome.status,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const columns = [
    { header: m.admin_campaign_col_index(), width: 8 },
    { header: m.admin_campaign_col_name(), width: 26 },
    { header: m.admin_campaign_col_phone(), width: 18 },
    { header: m.admin_campaign_col_treatment(), width: 28 },
    { header: m.admin_campaign_col_created(), width: 22 },
    { header: m.admin_campaign_col_source(), width: 22 },
    { header: m.admin_campaign_col_status(), width: 18 },
    { header: m.admin_campaign_col_crm(), width: 18 },
    { header: m.admin_campaign_col_notes(), width: 34 },
  ] as const;

  const rows = outcome.leads.map((lead, idx) => [
    formatNumber(idx + 1),
    lead.fullName,
    lead.phoneNormalized,
    treatmentText(lead.treatment),
    formatDate(lead.createdAt, { dateStyle: "short", timeStyle: "short" }),
    lead.source === "direct" ? m.admin_campaign_source_direct() : lead.source,
    statusText(lead.status),
    crmSyncText(lead.crmSyncStatus),
    lead.notes,
  ]);

  const buffer = buildRtlXlsx({
    sheetName: "لیدهای بلک فرایدی",
    columns,
    rows,
  });

  return new Response(Buffer.from(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="avida-black-friday-leads.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}

/*===== Route =====*/

export const Route = createFileRoute("/admin/campaign/export")({
  server: { handlers: { GET: handleGet } },
});
