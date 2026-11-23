import { formatNumber } from "#/lib/locale";
import type { LeadTreatment } from "#/orpc/campaign/constants";
import type { AdminCampaignOverview } from "#/orpc/campaign/contract";
import { m } from "#/paraglide/messages";
import { leadTreatmentLabel, sourceLabel } from "#/routes/admin_campaign/labels";

/*===== Daily & Source Report =====*/

export function DailyReport({ overview }: { overview: AdminCampaignOverview }) {
  return (
    <div className="space-y-12">
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
                  <th scope="col" className="py-3 ps-4 text-center font-bold">
                    {m.admin_campaign_report_daily_col_confirmed()}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {overview.dailyReport.map((day) => (
                  <tr key={day.isoDay}>
                    <td className="py-3.5 pe-4 text-body font-semibold text-foreground">{day.jalaliDate}</td>
                    <td className="px-4 py-3.5 text-center text-body font-bold text-brand-surface-gold">
                      {formatNumber(day.total)}
                    </td>
                    <td className="py-3.5 ps-4 text-center text-body font-bold text-success">
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
                  <dd className="text-body font-bold text-brand-surface-gold">{formatNumber(row.count)}</dd>
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
                  <dd className="text-body font-bold text-brand-surface-gold">{formatNumber(row.count)}</dd>
                </div>
              ))}
            </dl>
          )}
        </section>
      </div>
    </div>
  );
}
