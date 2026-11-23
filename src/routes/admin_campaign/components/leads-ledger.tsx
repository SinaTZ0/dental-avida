import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckIcon, PhoneIcon, RefreshCwIcon, SearchIcon } from "lucide-react";
import { useState } from "react";

import { Badge } from "#/components/primitive/badge/badge";
import { Button } from "#/components/primitive/button/button";
import { Input } from "#/components/primitive/input/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#/components/primitive/select/select";
import { Spinner } from "#/components/primitive/spinner/spinner";
import { FormAlert } from "#/components/shared/form-alert/form-alert";
import { describeApiFailure } from "#/lib/api-error";
import { formatDate, formatNumber } from "#/lib/locale";
import { matchesSearch, searchWords } from "#/lib/persian-text";
import { LEAD_STATUSES, LEAD_TREATMENTS, type LeadStatus, type LeadTreatment } from "#/orpc/campaign/constants";
import type { CampaignLead } from "#/orpc/campaign/contract";
import { client, orpc } from "#/orpc/client";
import { m } from "#/paraglide/messages";
import {
  crmSyncBadgeVariant,
  crmSyncLabel,
  leadStatusBadgeVariant,
  leadStatusLabel,
  leadTreatmentLabel,
  sourceLabel,
} from "#/routes/admin_campaign/labels";

/*===== Lead Row =====*/

function LeadRow({ index, lead, crmEnabled }: { index: number; lead: CampaignLead; crmEnabled: boolean }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<LeadStatus>(lead.status);
  const [notes, setNotes] = useState(lead.notes);
  const [savedNotice, setSavedNotice] = useState(false);

  const update = useMutation({
    mutationFn: (payload: { status: LeadStatus; notes: string }) =>
      client.campaign.updateLead({ id: lead.id, status: payload.status, notes: payload.notes }),
    onSuccess: async () => {
      setSavedNotice(true);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: orpc.campaign.adminOverview.key() }),
        queryClient.invalidateQueries({ queryKey: orpc.campaign.public.key() }),
      ]);
      window.setTimeout(() => setSavedNotice(false), 2200);
    },
  });

  const retryCrm = useMutation({
    mutationFn: () => client.campaign.retryLeadCrmSync({ id: lead.id }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: orpc.campaign.adminOverview.key() });
    },
  });

  const failure = update.error
    ? describeApiFailure({ error: update.error, fallback: m.admin_campaign_lead_save_failed() })
    : retryCrm.error
      ? describeApiFailure({ error: retryCrm.error, fallback: m.admin_campaign_crm_retry_failed() })
      : null;

  const isDirty = status !== lead.status || notes !== lead.notes;
  const crmLabel = crmSyncLabel(lead.crmSyncStatus);

  return (
    <div className="grid gap-4 border-b border-border py-5 lg:grid-cols-12 lg:items-start">
      {/*------ Identity & Phone ------*/}
      <div className="space-y-1.5 lg:col-span-3">
        <div className="flex items-center gap-2">
          <span className="text-caption font-semibold text-muted-foreground">{formatNumber(index)}</span>
          <p className="text-body font-bold text-foreground">{lead.fullName}</p>
        </div>
        <a
          href={`tel:${lead.phoneNormalized}`}
          dir="ltr"
          className="inline-flex items-center gap-1.5 text-body-sm font-semibold text-brand-text hover:underline"
        >
          <PhoneIcon aria-hidden className="size-3.5" />
          <span>{lead.phoneNormalized}</span>
        </a>
        <p className="text-caption text-muted-foreground">
          {formatDate(lead.createdAt, { dateStyle: "short", timeStyle: "short" })}
        </p>
      </div>

      {/*------ Treatment, Source & CRM Sync ------*/}
      <div className="flex flex-wrap items-center gap-2 lg:col-span-3 lg:flex-col lg:items-start">
        <Badge variant="outline">{leadTreatmentLabel(lead.treatment)}</Badge>
        <Badge variant={leadStatusBadgeVariant(lead.status)}>{leadStatusLabel(lead.status)}</Badge>
        {crmLabel && (
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant={crmSyncBadgeVariant(lead.crmSyncStatus)}>{crmLabel}</Badge>
            {crmEnabled && (lead.crmSyncStatus === "failed" || lead.crmSyncStatus === "none") && (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                disabled={retryCrm.isPending}
                onClick={() => retryCrm.mutate()}
              >
                <RefreshCwIcon aria-hidden data-icon="inline-start" />
                <span>{m.admin_campaign_crm_retry()}</span>
              </Button>
            )}
          </div>
        )}
        {!crmLabel && crmEnabled && (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            disabled={retryCrm.isPending}
            onClick={() => retryCrm.mutate()}
          >
            <RefreshCwIcon aria-hidden data-icon="inline-start" />
            <span>{m.admin_campaign_crm_retry()}</span>
          </Button>
        )}
        <span className="text-caption text-muted-foreground">{sourceLabel(lead.source)}</span>
      </div>

      {/*------ Status & Consultant Notes ------*/}
      <div className="space-y-2 lg:col-span-6">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Select
            value={status}
            onValueChange={(value) => {
              if (!value) return;
              const nextStatus = value as LeadStatus;
              setStatus(nextStatus);
              update.mutate({ status: nextStatus, notes });
            }}
          >
            <SelectTrigger aria-label={m.admin_campaign_col_status()} className="sm:w-44">
              <SelectValue>{leadStatusLabel(status)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {LEAD_STATUSES.map((item) => (
                <SelectItem key={item} value={item}>
                  {leadStatusLabel(item)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder={m.admin_campaign_notes_placeholder()}
            aria-label={m.admin_campaign_col_notes()}
            className="flex-1"
          />

          <Button
            type="button"
            variant={isDirty ? "default" : "outline"}
            size="sm"
            disabled={update.isPending || !isDirty}
            onClick={() => update.mutate({ status, notes })}
          >
            {update.isPending ? (
              <Spinner data-icon="inline-start" />
            ) : savedNotice ? (
              <CheckIcon aria-hidden data-icon="inline-start" />
            ) : null}
            {m.admin_campaign_save_note()}
          </Button>
        </div>

        {failure?.message && <FormAlert message={failure.message} />}
      </div>
    </div>
  );
}

/*===== Leads Ledger =====*/

export function LeadsLedger({
  leads,
  crmEnabled,
  statusFilter,
  treatmentFilter,
  query,
  onFilterChange,
}: {
  leads: readonly CampaignLead[];
  crmEnabled: boolean;
  statusFilter: "all" | LeadStatus;
  treatmentFilter: "all" | LeadTreatment;
  query: string;
  onFilterChange: (patch: { status?: "all" | LeadStatus; treatment?: "all" | LeadTreatment; q?: string }) => void;
}) {
  const words = searchWords(query);
  const filtered = leads.filter((lead) => {
    if (statusFilter !== "all" && lead.status !== statusFilter) return false;
    if (treatmentFilter !== "all" && lead.treatment !== treatmentFilter) return false;
    return matchesSearch(words, [lead.fullName, lead.phoneNormalized, lead.phoneRaw, lead.source, lead.notes]);
  });

  return (
    <div className="space-y-6">
      {/*------ Filters ------*/}
      <div className="grid gap-3 md:grid-cols-12">
        <div className="relative md:col-span-6">
          <Input
            value={query}
            onChange={(event) => onFilterChange({ q: event.target.value })}
            placeholder={m.admin_campaign_search_placeholder()}
            aria-label={m.admin_campaign_search_placeholder()}
          />
          <SearchIcon
            aria-hidden
            className="pointer-events-none absolute inset-e-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
        </div>

        <div className="md:col-span-3">
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              if (value) onFilterChange({ status: value as "all" | LeadStatus });
            }}
          >
            <SelectTrigger aria-label={m.admin_campaign_col_status()} className="w-full">
              <SelectValue>
                {statusFilter === "all" ? m.admin_campaign_filter_all_statuses() : leadStatusLabel(statusFilter)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{m.admin_campaign_filter_all_statuses()}</SelectItem>
              {LEAD_STATUSES.map((item) => (
                <SelectItem key={item} value={item}>
                  {leadStatusLabel(item)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-3">
          <Select
            value={treatmentFilter}
            onValueChange={(value) => {
              if (value) onFilterChange({ treatment: value as "all" | LeadTreatment });
            }}
          >
            <SelectTrigger aria-label={m.admin_campaign_col_treatment()} className="w-full">
              <SelectValue>
                {treatmentFilter === "all"
                  ? m.admin_campaign_filter_all_treatments()
                  : leadTreatmentLabel(treatmentFilter)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{m.admin_campaign_filter_all_treatments()}</SelectItem>
              {LEAD_TREATMENTS.map((item) => (
                <SelectItem key={item} value={item}>
                  {leadTreatmentLabel(item)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/*------ Ruled List ------*/}
      {filtered.length === 0 ? (
        <p className="border-y border-border py-10 text-center text-body text-muted-foreground">
          {m.admin_campaign_leads_empty()}
        </p>
      ) : (
        <div className="border-t border-border">
          {filtered.map((lead, idx) => (
            <LeadRow key={lead.id} index={idx + 1} lead={lead} crmEnabled={crmEnabled} />
          ))}
        </div>
      )}
    </div>
  );
}
