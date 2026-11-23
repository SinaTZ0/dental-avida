import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { DownloadIcon, ExternalLinkIcon } from "lucide-react";

import { buttonVariants } from "#/components/primitive/button/button.styles";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/primitive/tabs/tabs";
import { formatNumber } from "#/lib/locale";
import { pageMeta } from "#/lib/seo";
import { orpc } from "#/orpc/client";
import { m } from "#/paraglide/messages";
import { CampaignSettingsForm } from "#/routes/admin_campaign/components/campaign-settings-form";
import { DailyReport } from "#/routes/admin_campaign/components/daily-report";
import { LeadsLedger } from "#/routes/admin_campaign/components/leads-ledger";
import { adminCampaignSearchSchema, type AdminCampaignSearch } from "#/routes/admin_campaign/search-params";

/*===== Route =====*/

export const Route = createFileRoute("/_site-layout/_admin-layout/admin/campaign")({
  validateSearch: adminCampaignSearchSchema,
  loader: ({ context }) => context.queryClient.ensureQueryData(orpc.campaign.adminOverview.queryOptions()),
  head: (args) =>
    pageMeta({
      args,
      title: m.admin_campaign_meta_title(),
      index: false,
    }),
  component: AdminCampaignPage,
});

/*===== Page =====*/

function AdminCampaignPage() {
  const { data: overview } = useSuspenseQuery(orpc.campaign.adminOverview.queryOptions());
  const search = Route.useSearch();
  const tab = search.tab ?? "leads";
  const status = search.status ?? "all";
  const treatment = search.treatment ?? "all";
  const navigate = useNavigate({ from: Route.fullPath });

  const updateSearch = (patch: Partial<AdminCampaignSearch>) => {
    void navigate({
      search: (prev) => ({
        ...prev,
        ...patch,
        q: patch.q === "" ? undefined : (patch.q ?? prev.q),
      }),
      replace: true,
    });
  };

  const exportParams = new URLSearchParams();
  if (status !== "all") exportParams.set("status", status);
  if (treatment !== "all") exportParams.set("treatment", treatment);
  const exportHref =
    exportParams.size > 0 ? `/admin/campaign/export?${exportParams.toString()}` : "/admin/campaign/export";

  const kpis = [
    { label: m.admin_campaign_kpi_total(), value: formatNumber(overview.totals.totalLeads) },
    { label: m.admin_campaign_kpi_confirmed(), value: formatNumber(overview.totals.confirmedLeads) },
    { label: m.admin_campaign_kpi_today(), value: formatNumber(overview.totals.todayLeads) },
    { label: m.admin_campaign_kpi_remaining(), value: formatNumber(overview.remainingCapacity) },
    { label: m.admin_campaign_kpi_views(), value: formatNumber(overview.totals.landingViews) },
    {
      label: m.admin_campaign_kpi_clicks(),
      value: formatNumber(overview.totals.bannerClicks + overview.totals.popupClicks),
    },
  ] as const;

  return (
    <div className="mx-auto max-w-site-wide space-y-10 px-4 py-10 sm:px-6 md:py-14">
      {/*===== Header =====*/}
      <header className="flex flex-col gap-5 border-b border-border pb-8 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <p className="text-kicker text-brand-text">{m.admin_campaign_kicker()}</p>
          <h1 className="text-h1 text-foreground">{m.admin_campaign_title()}</h1>
          <p className="max-w-2xl text-body-sm text-muted-foreground">{m.admin_campaign_subtitle()}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <a href={exportHref} className={buttonVariants({ variant: "default" })}>
            <DownloadIcon aria-hidden data-icon="inline-start" />
            <span>{m.admin_campaign_export_xlsx()}</span>
          </a>
          <Link to="/black-friday" className={buttonVariants({ variant: "outline" })}>
            <ExternalLinkIcon aria-hidden data-icon="inline-start" />
            <span>{m.admin_campaign_view_public()}</span>
          </Link>
        </div>
      </header>

      {/*===== Integrated KPI Strip =====*/}
      <dl className="grid grid-cols-2 divide-y divide-border border-b border-border pb-6 sm:grid-cols-3 lg:grid-cols-6 lg:divide-x lg:divide-y-0">
        {kpis.map((item) => (
          <div key={item.label} className="space-y-1 px-3 py-3 first:ps-0">
            <dt className="text-caption text-muted-foreground">{item.label}</dt>
            <dd className="text-stat text-foreground">{item.value}</dd>
          </div>
        ))}
      </dl>

      {/*===== Tabs =====*/}
      <Tabs
        value={tab}
        onValueChange={(value) => {
          if (value) updateSearch({ tab: value as AdminCampaignSearch["tab"] });
        }}
      >
        <TabsList>
          <TabsTrigger value="leads">{m.admin_campaign_tab_leads()}</TabsTrigger>
          <TabsTrigger value="report">{m.admin_campaign_tab_report()}</TabsTrigger>
          <TabsTrigger value="settings">{m.admin_campaign_tab_settings()}</TabsTrigger>
        </TabsList>

        <TabsContent value="leads" className="mt-6">
          <LeadsLedger
            leads={overview.leads}
            statusFilter={status}
            treatmentFilter={treatment}
            query={search.q ?? ""}
            onFilterChange={updateSearch}
          />
        </TabsContent>

        <TabsContent value="report" className="mt-6">
          <DailyReport overview={overview} />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <CampaignSettingsForm overview={overview} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
