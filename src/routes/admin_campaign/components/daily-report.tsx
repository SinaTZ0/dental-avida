import { CheckCircle2Icon, AlertTriangleIcon } from "lucide-react";

import { Badge } from "#/components/primitive/badge/badge";
import { formatNumber } from "#/lib/locale";
import type { LeadTreatment } from "#/orpc/campaign/constants";
import type { AdminCampaignOverview } from "#/orpc/campaign/contract";
import { m } from "#/paraglide/messages";
import { leadTreatmentLabel, sourceLabel } from "#/routes/admin_campaign/labels";

/*===== Funnel, Readiness & Daily Report =====*/

export function DailyReport({ overview }: { overview: AdminCampaignOverview }) {
  const funnelSteps = [
    { label: m.admin_campaign_funnel_clicks(), value: overview.funnel.adAndBannerClicks },
    { label: m.admin_campaign_funnel_views(), value: overview.funnel.landingViews },
    { label: m.admin_campaign_funnel_leads(), value: overview.funnel.totalLeads },
    { label: m.admin_campaign_funnel_valid(), value: overview.funnel.validLeads },
    { label: m.admin_campaign_funnel_contacted(), value: overview.funnel.contactedOrBeyond },
    { label: m.admin_campaign_funnel_referred(), value: overview.funnel.referredOrBeyond },
    { label: m.admin_campaign_funnel_confirmed(), value: overview.funnel.confirmedLeads },
  ] as const;

  const funnelPeak = Math.max(1, ...funnelSteps.map((step) => step.value));

  const readinessItems = [
    { label: m.admin_campaign_readiness_campaign(), ok: overview.readiness.campaignActive },
    { label: m.admin_campaign_readiness_discounts(), ok: overview.readiness.discountsConfigured },
    { label: m.admin_campaign_readiness_privacy(), ok: true },
    { label: m.admin_campaign_readiness_advisor(), ok: overview.readiness.advisorDeliveryConfigured },
    { label: m.admin_campaign_readiness_ads(), ok: overview.readiness.hasApprovedAdChannel },
    { label: m.admin_campaign_readiness_tracking(), ok: overview.readiness.hasTrackedTraffic },
  ] as const;

  return (
    <div className="space-y-12">
      {/*------ Section 6 End-to-End Conversion Funnel ------*/}
      <section aria-labelledby="admin-funnel-title" className="space-y-4">
        <div className="space-y-1">
          <h2 id="admin-funnel-title" className="text-h2 text-foreground">
            {m.admin_campaign_report_funnel_title()}
          </h2>
          <p className="text-body-sm text-muted-foreground">{m.admin_campaign_report_funnel_subtitle()}</p>
        </div>

        <ol className="divide-y divide-border border-y border-border">
          {funnelSteps.map((step, index) => {
            const prevValue = index > 0 ? funnelSteps[index - 1]!.value : null;
            const stepRate =
              prevValue && prevValue > 0 ? Math.min(100, Math.round((step.value / prevValue) * 100)) : null;

            return (
              <li key={step.label} className="grid gap-3 py-3.5 md:grid-cols-12 md:items-center">
                <div className="flex items-center gap-3 md:col-span-4">
                  <span className="text-caption font-extrabold text-muted-foreground tabular-nums">
                    {formatNumber(index + 1)}
                  </span>
                  <span className="text-body-sm font-bold text-foreground">{step.label}</span>
                </div>

                <div className="md:col-span-5">
                  <progress className="campaign-progress" value={step.value} max={funnelPeak} aria-label={step.label} />
                </div>

                <div className="flex items-center justify-between gap-3 md:col-span-3 md:justify-end">
                  <span className="text-h3 font-black text-foreground tabular-nums">{formatNumber(step.value)}</span>
                  <span className="w-16 text-end text-caption font-semibold text-muted-foreground tabular-nums">
                    {stepRate !== null ? m.campaign_percent_value({ percent: stepRate }) : "—"}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {/*------ Section 5 #12 Pre-Launch Readiness Checklist ------*/}
      <section aria-labelledby="admin-readiness-title" className="space-y-4">
        <div className="space-y-1">
          <h2 id="admin-readiness-title" className="text-h3 text-foreground">
            {m.admin_campaign_readiness_title()}
          </h2>
          <p className="text-body-sm text-muted-foreground">{m.admin_campaign_readiness_subtitle()}</p>
        </div>

        <ul className="divide-y divide-border border-y border-border">
          {readinessItems.map((item) => (
            <li key={item.label} className="flex flex-wrap items-center justify-between gap-3 py-3.5">
              <span className="inline-flex items-center gap-2.5 text-body-sm text-foreground">
                {item.ok ? (
                  <CheckCircle2Icon aria-hidden className="size-4 shrink-0 text-success" />
                ) : (
                  <AlertTriangleIcon aria-hidden className="size-4 shrink-0 text-brand-surface-gold" />
                )}
                <span>{item.label}</span>
              </span>
              <Badge variant={item.ok ? "success" : "warning"}>
                {item.ok ? m.admin_campaign_readiness_ok() : m.admin_campaign_readiness_attention()}
              </Badge>
            </li>
          ))}
        </ul>
      </section>

      {/*------ Jalali Daily Lead Table ------*/}
      <section aria-labelledby="admin-daily-report-title" className="space-y-4">
        <h2 id="admin-daily-report-title" className="text-h3 text-foreground">
          {m.admin_campaign_report_daily_title()}
        </h2>
        {overview.dailyReport.length === 0 ? (
          <p className="border-y border-border py-8 text-body-sm text-muted-foreground">
            {m.admin_campaign_report_empty()}
          </p>
        ) : (
          <div className="overflow-x-auto border-y border-border">
            <table className="w-full border-collapse text-start">
              <thead>
                <tr className="border-b border-border text-caption text-muted-foreground">
                  <th scope="col" className="py-3 pe-4 text-start font-bold">
                    {m.admin_campaign_report_daily_col_date()}
                  </th>
                  <th scope="col" className="px-4 py-3 text-center font-bold">
                    {m.admin_campaign_report_daily_col_total()}
                  </th>
                  <th scope="col" className="px-4 py-3 text-center font-bold">
                    {m.admin_campaign_report_daily_col_valid()}
                  </th>
                  <th scope="col" className="px-4 py-3 text-center font-bold">
                    {m.admin_campaign_report_daily_col_referred()}
                  </th>
                  <th scope="col" className="py-3 ps-4 text-center font-bold">
                    {m.admin_campaign_report_daily_col_confirmed()}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {overview.dailyReport.map((day) => (
                  <tr key={day.isoDay}>
                    <td className="py-3.5 pe-4 text-body font-semibold text-foreground">{day.jalaliDate}</td>
                    <td className="px-4 py-3.5 text-center text-body font-bold text-brand-surface-gold tabular-nums">
                      {formatNumber(day.total)}
                    </td>
                    <td className="px-4 py-3.5 text-center text-body font-semibold text-foreground tabular-nums">
                      {formatNumber(day.valid)}
                    </td>
                    <td className="px-4 py-3.5 text-center text-body font-semibold text-foreground tabular-nums">
                      {formatNumber(day.referred)}
                    </td>
                    <td className="py-3.5 ps-4 text-center text-body font-bold text-success tabular-nums">
                      {formatNumber(day.confirmed)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/*------ Source & Treatment Breakdowns ------*/}
      <div className="grid gap-10 md:grid-cols-2">
        <section aria-labelledby="admin-source-breakdown" className="space-y-4">
          <h3 id="admin-source-breakdown" className="text-h3 text-foreground">
            {m.admin_campaign_report_sources_title()}
          </h3>
          {overview.bySource.length === 0 ? (
            <p className="border-y border-border py-6 text-body-sm text-muted-foreground">
              {m.admin_campaign_report_empty()}
            </p>
          ) : (
            <dl className="divide-y divide-border border-y border-border">
              {overview.bySource.map((row) => (
                <div key={row.key} className="flex items-center justify-between gap-4 py-3.5">
                  <dt className="text-body-sm text-foreground">{sourceLabel(row.key)}</dt>
                  <dd className="text-body font-bold text-brand-surface-gold tabular-nums">
                    {formatNumber(row.count)}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </section>

        <section aria-labelledby="admin-treatment-breakdown" className="space-y-4">
          <h3 id="admin-treatment-breakdown" className="text-h3 text-foreground">
            {m.admin_campaign_report_treatments_title()}
          </h3>
          {overview.byTreatment.length === 0 ? (
            <p className="border-y border-border py-6 text-body-sm text-muted-foreground">
              {m.admin_campaign_report_empty()}
            </p>
          ) : (
            <dl className="divide-y divide-border border-y border-border">
              {overview.byTreatment.map((row) => (
                <div key={row.key} className="flex items-center justify-between gap-4 py-3.5">
                  <dt className="text-body-sm text-foreground">{leadTreatmentLabel(row.key as LeadTreatment)}</dt>
                  <dd className="text-body font-bold text-brand-surface-gold tabular-nums">
                    {formatNumber(row.count)}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </section>
      </div>
    </div>
  );
}
