import { createFileRoute } from "@tanstack/react-router";
import { Effect } from "effect";

import { formatDate, formatNumber } from "#/lib/locale";
import { LEAD_STATUSES, LEAD_TREATMENTS, type LeadStatus, type LeadTreatment } from "#/orpc/campaign/constants";
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

/*===== Handler =====*/

/**
 * `GET /admin/campaign/export[?status=...&treatment=...]`:
 * Admin-only server route that streams an RTL Persian-safe `.xlsx` workbook of campaign leads.
 */
async function handleGet({ request }: { request: Request }) {
  const url = new URL(request.url);
  const rawStatus = url.searchParams.get("status") ?? "";
  const rawTreatment = url.searchParams.get("treatment") ?? "";
  const status = LEAD_STATUSES.includes(rawStatus as LeadStatus) ? rawStatus : undefined;
  const treatment = LEAD_TREATMENTS.includes(rawTreatment as LeadTreatment) ? rawTreatment : undefined;

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
