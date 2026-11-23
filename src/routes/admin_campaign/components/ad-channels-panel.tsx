import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckIcon, CopyIcon, DownloadIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { type FormEvent, useId, useState } from "react";

import { Alert, AlertDescription } from "#/components/primitive/alert/alert";
import { Badge } from "#/components/primitive/badge/badge";
import { Button } from "#/components/primitive/button/button";
import { buttonVariants } from "#/components/primitive/button/button.styles";
import { Field, FieldGroup, FieldLabel } from "#/components/primitive/field/field";
import { Input } from "#/components/primitive/input/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#/components/primitive/select/select";
import { Spinner } from "#/components/primitive/spinner/spinner";
import { FormAlert } from "#/components/shared/form-alert/form-alert";
import { describeApiFailure } from "#/lib/api-error";
import { toLatinDigits } from "#/lib/digits";
import { formatNumber } from "#/lib/locale";
import {
  AD_APPROVAL_STATUSES,
  AD_PLACEMENTS,
  AD_PLATFORM_TYPES,
  type AdApprovalStatus,
  type AdPlacement,
  type AdPlatformType,
} from "#/orpc/campaign/constants";
import type { AdminCampaignOverview, CampaignAdChannel } from "#/orpc/campaign/contract";
import { client, orpc } from "#/orpc/client";
import { m } from "#/paraglide/messages";
import { AdBannerKit } from "#/routes/admin_campaign/components/ad-banner-kit";
import {
  adApprovalBadgeVariant,
  adApprovalLabel,
  adPlacementLabel,
  adPlatformLabel,
} from "#/routes/admin_campaign/labels";

/*===== Component =====*/

type ChannelFormState = {
  id?: string;
  name: string;
  code: string;
  platformType: AdPlatformType;
  placement: AdPlacement;
  budgetToman: string;
  spentToman: string;
  scheduleText: string;
  approvalStatus: AdApprovalStatus;
  notes: string;
};

const EMPTY_FORM: ChannelFormState = {
  name: "",
  code: "",
  platformType: "local_site",
  placement: "banner",
  budgetToman: "0",
  spentToman: "0",
  scheduleText: "۱ تا ۱۲ آذر ۱۴۰۵",
  approvalStatus: "pending_approval",
  notes: "",
};

/**
 * Advertising activation, management-approval media plan, tracked `/go/ad/$code` links, per-channel CPL reporting,
 * and downloadable banner studio (Section 4 #1–#4).
 */
export function AdChannelsPanel({ overview, siteOrigin }: { overview: AdminCampaignOverview; siteOrigin: string }) {
  const id = useId();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<ChannelFormState>(EMPTY_FORM);
  const [savedNotice, setSavedNotice] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: () =>
      client.campaign.saveAdChannel({
        id: form.id,
        code: form.code,
        name: form.name,
        platformType: form.platformType,
        placement: form.placement,
        budgetToman: Number(toLatinDigits(form.budgetToman || "0")),
        spentToman: Number(toLatinDigits(form.spentToman || "0")),
        scheduleText: form.scheduleText,
        approvalStatus: form.approvalStatus,
        notes: form.notes,
      }),
    onSuccess: async () => {
      setSavedNotice(true);
      setForm(EMPTY_FORM);
      await queryClient.invalidateQueries({ queryKey: orpc.campaign.adminOverview.key() });
    },
  });

  const remove = useMutation({
    mutationFn: (channelId: string) => client.campaign.deleteAdChannel({ id: channelId }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: orpc.campaign.adminOverview.key() });
    },
  });

  const failure = save.error
    ? describeApiFailure({ error: save.error, fallback: m.admin_campaign_ads_save_failed() })
    : null;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setSavedNotice(false);
    save.mutate();
  };

  const startEdit = (channel: CampaignAdChannel) => {
    setSavedNotice(false);
    setForm({
      id: channel.id,
      name: channel.name,
      code: channel.code,
      platformType: channel.platformType,
      placement: channel.placement,
      budgetToman: String(channel.budgetToman),
      spentToman: String(channel.spentToman),
      scheduleText: channel.scheduleText,
      approvalStatus: channel.approvalStatus,
      notes: channel.notes,
    });
  };

  const copyTrackedUrl = (channel: CampaignAdChannel) => {
    const base = siteOrigin.replace(/\/+$/, "");
    const trackedUrl = `${base}/go/ad/${channel.code}`;
    void navigator.clipboard.writeText(trackedUrl).then(() => {
      setCopiedId(channel.id);
      window.setTimeout(() => setCopiedId((prev) => (prev === channel.id ? null : prev)), 2200);
    });
  };

  const maxDiscountPercent = overview.discounts.reduce(
    (max, item) => Math.max(max, item.cashPercent, item.installmentPercent),
    0,
  );

  const summaryItems = [
    {
      label: m.admin_campaign_ads_summary_budget(),
      value: m.campaign_price_toman({ amount: formatNumber(overview.totals.totalAdBudgetToman) }),
    },
    {
      label: m.admin_campaign_ads_summary_spent(),
      value: m.campaign_price_toman({ amount: formatNumber(overview.totals.totalAdSpentToman) }),
    },
    {
      label: m.admin_campaign_ads_summary_clicks(),
      value: formatNumber(overview.totals.adClicks),
    },
    {
      label: m.admin_campaign_ads_summary_cpl(),
      value:
        overview.totals.overallCostPerLeadToman !== null
          ? m.campaign_price_toman({ amount: formatNumber(overview.totals.overallCostPerLeadToman) })
          : "—",
    },
  ] as const;

  return (
    <div className="space-y-12">
      {/*===== Header & Export =====*/}
      <section className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <h2 className="text-h2 text-foreground">{m.admin_campaign_ads_title()}</h2>
            <p className="max-w-3xl text-body-sm text-muted-foreground">{m.admin_campaign_ads_subtitle()}</p>
          </div>
          <a href="/admin/campaign/export?kind=ads" className={buttonVariants({ variant: "outline" })}>
            <DownloadIcon aria-hidden data-icon="inline-start" />
            <span>{m.admin_campaign_ads_export_xlsx()}</span>
          </a>
        </div>

        {/* Integrated Budget / Spend / Clicks / CPL Strip */}
        <dl className="grid grid-cols-2 divide-y divide-border border-y border-border py-2 sm:grid-cols-4 sm:divide-x sm:divide-y-0">
          {summaryItems.map((item) => (
            <div key={item.label} className="space-y-1 px-4 py-3 first:ps-0">
              <dt className="text-caption text-muted-foreground">{item.label}</dt>
              <dd className="text-h3 font-black text-foreground tabular-nums">{item.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/*===== Add / Edit Ad Channel Form =====*/}
      <section className="space-y-5 border-b border-border pb-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-h3 text-foreground">{m.admin_campaign_ads_add_title()}</h3>
          {form.id && (
            <Button type="button" variant="ghost" size="sm" onClick={() => setForm(EMPTY_FORM)}>
              {m.admin_campaign_ads_edit_cancel()}
            </Button>
          )}
        </div>

        {savedNotice && (
          <Alert variant="success">
            <CheckIcon aria-hidden />
            <AlertDescription>{m.admin_campaign_ads_saved()}</AlertDescription>
          </Alert>
        )}
        <FormAlert message={failure?.message ?? undefined} />

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <FieldGroup>
            <div className="grid gap-4 md:grid-cols-12">
              <div className="md:col-span-5">
                <Field>
                  <FieldLabel htmlFor={`${id}-ad-name`}>{m.admin_campaign_ads_col_name()}</FieldLabel>
                  <Input
                    id={`${id}-ad-name`}
                    placeholder={m.admin_campaign_ads_name_placeholder()}
                    value={form.name}
                    onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  />
                </Field>
              </div>
              <div className="md:col-span-3">
                <Field>
                  <FieldLabel htmlFor={`${id}-ad-code`}>{m.admin_campaign_ads_col_code()}</FieldLabel>
                  <Input
                    id={`${id}-ad-code`}
                    dir="ltr"
                    placeholder={m.admin_campaign_ads_code_placeholder()}
                    value={form.code}
                    onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))}
                  />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field>
                  <FieldLabel htmlFor={`${id}-ad-platform`}>{m.admin_campaign_ads_col_platform()}</FieldLabel>
                  <Select
                    value={form.platformType}
                    onValueChange={(value) => {
                      if (value) setForm((prev) => ({ ...prev, platformType: value as AdPlatformType }));
                    }}
                  >
                    <SelectTrigger id={`${id}-ad-platform`} className="w-full">
                      <SelectValue>{adPlatformLabel(form.platformType)}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {AD_PLATFORM_TYPES.map((item) => (
                        <SelectItem key={item} value={item}>
                          {adPlatformLabel(item)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field>
                  <FieldLabel htmlFor={`${id}-ad-placement`}>{m.admin_campaign_ads_col_placement()}</FieldLabel>
                  <Select
                    value={form.placement}
                    onValueChange={(value) => {
                      if (value) setForm((prev) => ({ ...prev, placement: value as AdPlacement }));
                    }}
                  >
                    <SelectTrigger id={`${id}-ad-placement`} className="w-full">
                      <SelectValue>{adPlacementLabel(form.placement)}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {AD_PLACEMENTS.map((item) => (
                        <SelectItem key={item} value={item}>
                          {adPlacementLabel(item)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-12">
              <div className="md:col-span-3">
                <Field>
                  <FieldLabel htmlFor={`${id}-ad-budget`}>{m.admin_campaign_ads_col_budget()}</FieldLabel>
                  <Input
                    id={`${id}-ad-budget`}
                    dir="ltr"
                    inputMode="numeric"
                    value={form.budgetToman}
                    onChange={(event) => setForm((prev) => ({ ...prev, budgetToman: event.target.value }))}
                  />
                </Field>
              </div>
              <div className="md:col-span-3">
                <Field>
                  <FieldLabel htmlFor={`${id}-ad-spent`}>{m.admin_campaign_ads_col_spent()}</FieldLabel>
                  <Input
                    id={`${id}-ad-spent`}
                    dir="ltr"
                    inputMode="numeric"
                    value={form.spentToman}
                    onChange={(event) => setForm((prev) => ({ ...prev, spentToman: event.target.value }))}
                  />
                </Field>
              </div>
              <div className="md:col-span-3">
                <Field>
                  <FieldLabel htmlFor={`${id}-ad-schedule`}>{m.admin_campaign_ads_col_schedule()}</FieldLabel>
                  <Input
                    id={`${id}-ad-schedule`}
                    placeholder={m.admin_campaign_ads_schedule_placeholder()}
                    value={form.scheduleText}
                    onChange={(event) => setForm((prev) => ({ ...prev, scheduleText: event.target.value }))}
                  />
                </Field>
              </div>
              <div className="md:col-span-3">
                <Field>
                  <FieldLabel htmlFor={`${id}-ad-approval`}>{m.admin_campaign_ads_col_approval()}</FieldLabel>
                  <Select
                    value={form.approvalStatus}
                    onValueChange={(value) => {
                      if (value) setForm((prev) => ({ ...prev, approvalStatus: value as AdApprovalStatus }));
                    }}
                  >
                    <SelectTrigger id={`${id}-ad-approval`} className="w-full">
                      <SelectValue>{adApprovalLabel(form.approvalStatus)}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {AD_APPROVAL_STATUSES.map((item) => (
                        <SelectItem key={item} value={item}>
                          {adApprovalLabel(item)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-12 md:items-end">
              <div className="md:col-span-9">
                <Field>
                  <FieldLabel htmlFor={`${id}-ad-notes`}>{m.admin_campaign_ads_col_notes()}</FieldLabel>
                  <Input
                    id={`${id}-ad-notes`}
                    placeholder={m.admin_campaign_ads_notes_placeholder()}
                    value={form.notes}
                    onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                  />
                </Field>
              </div>
              <div className="md:col-span-3">
                <Button type="submit" disabled={save.isPending} className="w-full">
                  {save.isPending ? (
                    <Spinner data-icon="inline-start" />
                  ) : (
                    <PlusIcon aria-hidden data-icon="inline-start" />
                  )}
                  <span>{form.id ? m.admin_campaign_ads_update() : m.admin_campaign_ads_save()}</span>
                </Button>
              </div>
            </div>
          </FieldGroup>
        </form>
      </section>

      {/*===== Ruled Media Plan & Live CPL Ledger =====*/}
      <section aria-label={m.admin_campaign_ads_title()} className="space-y-4">
        {overview.adChannels.length === 0 ? (
          <p className="border-y border-border py-10 text-center text-body-sm text-muted-foreground">
            {m.admin_campaign_ads_empty()}
          </p>
        ) : (
          <div className="overflow-x-auto border-y border-border">
            <table className="w-full min-w-205 border-collapse text-start">
              <thead>
                <tr className="border-b border-border text-caption text-muted-foreground">
                  <th scope="col" className="py-3 pe-4 text-start font-bold">
                    {m.admin_campaign_ads_col_name()}
                  </th>
                  <th scope="col" className="px-3 py-3 text-start font-bold">
                    {m.admin_campaign_ads_col_approval()}
                  </th>
                  <th scope="col" className="px-3 py-3 text-center font-bold">
                    {m.admin_campaign_ads_col_budget()}
                  </th>
                  <th scope="col" className="px-3 py-3 text-center font-bold">
                    {m.admin_campaign_ads_col_spent()}
                  </th>
                  <th scope="col" className="px-3 py-3 text-center font-bold">
                    {m.admin_campaign_ads_col_clicks()}
                  </th>
                  <th scope="col" className="px-3 py-3 text-center font-bold">
                    {m.admin_campaign_ads_col_views()}
                  </th>
                  <th scope="col" className="px-3 py-3 text-center font-bold">
                    {m.admin_campaign_ads_col_leads()}
                  </th>
                  <th scope="col" className="px-3 py-3 text-center font-bold">
                    {m.admin_campaign_ads_col_cpl()}
                  </th>
                  <th scope="col" className="py-3 ps-3 text-end font-bold">
                    {m.admin_campaign_ads_copy_link()}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {overview.adChannels.map((channel) => (
                  <tr key={channel.id}>
                    <th scope="row" aria-label={channel.name} className="py-4 pe-4 text-start font-normal">
                      <div className="space-y-1">
                        <span className="block text-body font-bold text-foreground">{channel.name}</span>
                        <span className="block text-caption text-muted-foreground">
                          {adPlatformLabel(channel.platformType)} • {adPlacementLabel(channel.placement)}
                          {channel.scheduleText ? ` • ${channel.scheduleText}` : ""}
                        </span>
                        <code dir="ltr" className="inline-block text-caption text-brand-text">
                          /go/ad/{channel.code}
                        </code>
                      </div>
                    </th>
                    <td className="px-3 py-4">
                      <Badge variant={adApprovalBadgeVariant(channel.approvalStatus)}>
                        {adApprovalLabel(channel.approvalStatus)}
                      </Badge>
                    </td>
                    <td className="px-3 py-4 text-center text-body-sm text-foreground tabular-nums">
                      {formatNumber(channel.budgetToman)}
                    </td>
                    <td className="px-3 py-4 text-center text-body-sm font-semibold text-foreground tabular-nums">
                      {formatNumber(channel.spentToman)}
                    </td>
                    <td className="px-3 py-4 text-center text-body font-bold text-foreground tabular-nums">
                      {formatNumber(channel.adClicks)}
                    </td>
                    <td className="px-3 py-4 text-center text-body-sm text-muted-foreground tabular-nums">
                      {formatNumber(channel.landingViews)}
                    </td>
                    <td className="px-3 py-4 text-center text-body font-bold text-brand-surface-gold tabular-nums">
                      {formatNumber(channel.totalLeads)}
                    </td>
                    <td className="px-3 py-4 text-center text-body-sm font-bold text-foreground tabular-nums">
                      {channel.costPerLeadToman !== null ? formatNumber(channel.costPerLeadToman) : "—"}
                    </td>
                    <td className="py-4 ps-3 text-end">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button type="button" variant="outline" size="sm" onClick={() => copyTrackedUrl(channel)}>
                          {copiedId === channel.id ? (
                            <CheckIcon aria-hidden data-icon="inline-start" />
                          ) : (
                            <CopyIcon aria-hidden data-icon="inline-start" />
                          )}
                          <span>
                            {copiedId === channel.id ? m.admin_campaign_ads_copied() : m.admin_campaign_ads_copy_link()}
                          </span>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={m.admin_campaign_ads_edit()}
                          onClick={() => startEdit(channel)}
                        >
                          <PencilIcon aria-hidden />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={m.admin_campaign_ads_delete()}
                          disabled={remove.isPending}
                          onClick={() => remove.mutate(channel.id)}
                        >
                          <Trash2Icon aria-hidden />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/*===== Ad Banner Creative Studio (Section 4.2) =====*/}
      <AdBannerKit maxDiscountPercent={maxDiscountPercent} totalCapacity={overview.settings.totalCapacity} />
    </div>
  );
}
