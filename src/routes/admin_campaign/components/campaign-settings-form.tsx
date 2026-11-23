import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2Icon, PlugZapIcon } from "lucide-react";
import { type FormEvent, useId, useState } from "react";

import { Alert, AlertDescription } from "#/components/primitive/alert/alert";
import { Button } from "#/components/primitive/button/button";
import { Checkbox } from "#/components/primitive/checkbox/checkbox";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "#/components/primitive/field/field";
import { Input } from "#/components/primitive/input/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#/components/primitive/select/select";
import { Spinner } from "#/components/primitive/spinner/spinner";
import { Switch } from "#/components/primitive/switch/switch";
import { FormAlert } from "#/components/shared/form-alert/form-alert";
import { describeApiFailure } from "#/lib/api-error";
import { toLatinDigits } from "#/lib/digits";
import { APP_TIME_ZONE, formatNumber } from "#/lib/locale";
import { CAPACITY_MODES, type CapacityMode, type DiscountCode } from "#/orpc/campaign/constants";
import type { AdminCampaignOverview } from "#/orpc/campaign/contract";
import { client, orpc } from "#/orpc/client";
import { m } from "#/paraglide/messages";
import { capacityModeLabel } from "#/routes/admin_campaign/labels";

/*===== Tehran DateTime Helpers =====*/

const tehranPartsFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** Formats a `Date` as `YYYY-MM-DDTHH:mm` in `Asia/Tehran` for `<input type="datetime-local">`. */
function toTehranLocalInput(date: Date): string {
  const parts = Object.fromEntries(tehranPartsFormatter.formatToParts(date).map((part) => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

/** Interprets a `YYYY-MM-DDTHH:mm` value as `Asia/Tehran` (`+03:30`). */
function fromTehranLocalInput(local: string): string {
  return local.length === 16 ? `${local}:00+03:30` : `${local}+03:30`;
}

/*===== Component =====*/

type EditableDiscount = {
  code: DiscountCode;
  title: string;
  cashPercent: string;
  installmentPercent: string;
  basePriceToman: string;
};

/**
 * Live editor for campaign dates, capacity rules, reversible Black Friday theme toggle, notification email, CRM/PRM
 * webhook integration, and discount percentages + base Toman amounts (Section 5 #4, #5 & #9).
 */
export function CampaignSettingsForm({ overview }: { overview: AdminCampaignOverview }) {
  const id = useId();
  const queryClient = useQueryClient();

  const [enabled, setEnabled] = useState(overview.settings.enabled);
  const [themeEnabled, setThemeEnabled] = useState(overview.settings.themeEnabled);
  const [startsAt, setStartsAt] = useState(() => toTehranLocalInput(overview.settings.startsAt));
  const [endsAt, setEndsAt] = useState(() => toTehranLocalInput(overview.settings.endsAt));
  const [totalCapacity, setTotalCapacity] = useState(String(overview.settings.totalCapacity));
  const [capacityMode, setCapacityMode] = useState<CapacityMode>(overview.settings.capacityMode);
  const [intervalMinutes, setIntervalMinutes] = useState(String(overview.settings.decrementIntervalMinutes));
  const [notifyEmail, setNotifyEmail] = useState(overview.settings.notifyEmail);
  const [crmWebhookUrl, setCrmWebhookUrl] = useState(overview.settings.crmWebhookUrl);
  const [crmWebhookSecret, setCrmWebhookSecret] = useState("");
  const [clearCrmWebhookSecret, setClearCrmWebhookSecret] = useState(false);
  const [discounts, setDiscounts] = useState<EditableDiscount[]>(() =>
    overview.discounts.map((item) => ({
      code: item.code,
      title: item.title,
      cashPercent: String(item.cashPercent),
      installmentPercent: String(item.installmentPercent),
      basePriceToman: item.basePriceToman ? String(item.basePriceToman) : "",
    })),
  );
  const [savedOk, setSavedOk] = useState(false);

  const save = useMutation({
    mutationFn: () =>
      client.campaign.updateSettings({
        enabled,
        themeEnabled,
        startsAt: fromTehranLocalInput(startsAt),
        endsAt: fromTehranLocalInput(endsAt),
        totalCapacity: Number(toLatinDigits(totalCapacity)),
        capacityMode,
        decrementIntervalMinutes: Number(toLatinDigits(intervalMinutes)),
        notifyEmail: notifyEmail.trim(),
        crmWebhookUrl: crmWebhookUrl.trim(),
        crmWebhookSecret: crmWebhookSecret.trim() || undefined,
        clearCrmWebhookSecret,
        discounts: discounts.map((row) => {
          const cleanPrice = toLatinDigits(row.basePriceToman).trim();
          return {
            code: row.code,
            title: row.title,
            cashPercent: Number(toLatinDigits(row.cashPercent)),
            installmentPercent: Number(toLatinDigits(row.installmentPercent)),
            basePriceToman: cleanPrice ? Number(cleanPrice) : null,
          };
        }),
      }),
    onSuccess: async () => {
      setSavedOk(true);
      setCrmWebhookSecret("");
      setClearCrmWebhookSecret(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: orpc.campaign.adminOverview.key() }),
        queryClient.invalidateQueries({ queryKey: orpc.campaign.public.key() }),
      ]);
    },
  });

  const testCrm = useMutation({
    mutationFn: () => client.campaign.testCrmWebhook(),
  });

  const failure = save.error
    ? describeApiFailure({ error: save.error, fallback: m.admin_campaign_settings_save_failed() })
    : null;
  const crmTestError = testCrm.error
    ? describeApiFailure({ error: testCrm.error, fallback: m.admin_campaign_crm_error_network() })
    : null;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setSavedOk(false);
    save.mutate();
  };

  const updateDiscount = (index: number, patch: Partial<EditableDiscount>) => {
    setDiscounts((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-10" noValidate>
      {savedOk && (
        <Alert variant="success">
          <CheckCircle2Icon aria-hidden />
          <AlertDescription>{m.admin_campaign_settings_saved()}</AlertDescription>
        </Alert>
      )}
      <FormAlert message={failure?.message ?? undefined} />

      {/*------ General & Theme Variant Controls ------*/}
      <section className="space-y-6">
        <h2 className="border-b border-border pb-3 text-h3 text-foreground">
          {m.admin_campaign_settings_section_general()}
        </h2>

        <div className="divide-y divide-border border-b border-border">
          <div className="flex items-center justify-between gap-4 py-4">
            <div className="space-y-1">
              <label htmlFor={`${id}-enabled`} className="text-body font-semibold text-foreground">
                {m.admin_campaign_settings_enabled_label()}
              </label>
              <p className="text-body-sm text-muted-foreground">{m.admin_campaign_settings_enabled_hint()}</p>
            </div>
            <Switch
              id={`${id}-enabled`}
              checked={enabled}
              onCheckedChange={(checked) => setEnabled(Boolean(checked))}
            />
          </div>

          <div className="flex items-center justify-between gap-4 py-4">
            <div className="space-y-1">
              <label htmlFor={`${id}-theme`} className="text-body font-semibold text-foreground">
                {m.admin_campaign_settings_theme_label()}
              </label>
              <p className="text-body-sm text-muted-foreground">{m.admin_campaign_settings_theme_hint()}</p>
            </div>
            <Switch
              id={`${id}-theme`}
              checked={themeEnabled}
              onCheckedChange={(checked) => setThemeEnabled(Boolean(checked))}
            />
          </div>
        </div>

        <FieldGroup>
          <div className="grid gap-5 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor={`${id}-starts`}>{m.admin_campaign_settings_starts_at()}</FieldLabel>
              <Input
                id={`${id}-starts`}
                type="datetime-local"
                dir="ltr"
                value={startsAt}
                onChange={(event) => setStartsAt(event.target.value)}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor={`${id}-ends`}>{m.admin_campaign_settings_ends_at()}</FieldLabel>
              <Input
                id={`${id}-ends`}
                type="datetime-local"
                dir="ltr"
                value={endsAt}
                onChange={(event) => setEndsAt(event.target.value)}
              />
            </Field>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <Field>
              <FieldLabel htmlFor={`${id}-capacity`}>{m.admin_campaign_settings_capacity()}</FieldLabel>
              <Input
                id={`${id}-capacity`}
                dir="ltr"
                inputMode="numeric"
                value={totalCapacity}
                onChange={(event) => setTotalCapacity(event.target.value)}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor={`${id}-mode`}>{m.admin_campaign_settings_capacity_mode()}</FieldLabel>
              <Select
                value={capacityMode}
                onValueChange={(value) => {
                  if (value) setCapacityMode(value as CapacityMode);
                }}
              >
                <SelectTrigger id={`${id}-mode`} className="w-full">
                  <SelectValue>{capacityModeLabel(capacityMode)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {CAPACITY_MODES.map((mode) => (
                    <SelectItem key={mode} value={mode}>
                      {capacityModeLabel(mode)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor={`${id}-interval`}>{m.admin_campaign_settings_interval()}</FieldLabel>
              <Input
                id={`${id}-interval`}
                dir="ltr"
                inputMode="numeric"
                value={intervalMinutes}
                onChange={(event) => setIntervalMinutes(event.target.value)}
              />
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor={`${id}-notify`}>{m.admin_campaign_settings_notify_email()}</FieldLabel>
            <Input
              id={`${id}-notify`}
              type="email"
              dir="ltr"
              placeholder={m.admin_campaign_settings_notify_email_placeholder()}
              value={notifyEmail}
              onChange={(event) => setNotifyEmail(event.target.value)}
            />
            <FieldDescription>{m.admin_campaign_settings_notify_email_placeholder()}</FieldDescription>
          </Field>
        </FieldGroup>
      </section>

      {/*------ CRM / PRM Webhook Integration (Section 5 #9) ------*/}
      <section className="space-y-5">
        <div className="space-y-1 border-b border-border pb-3">
          <h2 className="text-h3 text-foreground">{m.admin_campaign_crm_section_title()}</h2>
          <p className="text-body-sm text-muted-foreground">{m.admin_campaign_crm_section_hint()}</p>
        </div>

        <FieldGroup>
          <div className="grid gap-5 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor={`${id}-crm-url`}>{m.admin_campaign_crm_url_label()}</FieldLabel>
              <Input
                id={`${id}-crm-url`}
                type="url"
                dir="ltr"
                placeholder={m.admin_campaign_crm_url_placeholder()}
                value={crmWebhookUrl}
                onChange={(event) => setCrmWebhookUrl(event.target.value)}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor={`${id}-crm-secret`}>{m.admin_campaign_crm_secret_label()}</FieldLabel>
              <Input
                id={`${id}-crm-secret`}
                type="password"
                dir="ltr"
                autoComplete="new-password"
                placeholder={m.admin_campaign_crm_secret_placeholder()}
                value={crmWebhookSecret}
                onChange={(event) => {
                  setCrmWebhookSecret(event.target.value);
                  if (event.target.value) setClearCrmWebhookSecret(false);
                }}
              />
              {overview.settings.crmWebhookSecretConfigured && (
                <FieldDescription>{m.admin_campaign_crm_secret_configured()}</FieldDescription>
              )}
            </Field>
          </div>

          {overview.settings.crmWebhookSecretConfigured && (
            <div className="flex items-center gap-2.5">
              <Checkbox
                id={`${id}-crm-clear`}
                checked={clearCrmWebhookSecret}
                onCheckedChange={(checked) => setClearCrmWebhookSecret(Boolean(checked))}
              />
              <label htmlFor={`${id}-crm-clear`} className="cursor-pointer text-body-sm text-muted-foreground">
                {m.admin_campaign_crm_secret_clear()}
              </label>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={testCrm.isPending || !overview.settings.crmWebhookUrl}
              onClick={() => testCrm.mutate()}
            >
              {testCrm.isPending ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <PlugZapIcon aria-hidden data-icon="inline-start" />
              )}
              <span>{m.admin_campaign_crm_test_button()}</span>
            </Button>
          </div>

          {testCrm.data && (
            <Alert variant="success">
              <CheckCircle2Icon aria-hidden />
              <AlertDescription>
                {m.admin_campaign_crm_test_ok({
                  status: formatNumber(testCrm.data.statusCode),
                  ms: formatNumber(testCrm.data.latencyMs),
                })}
              </AlertDescription>
            </Alert>
          )}
          {crmTestError?.message && <FormAlert message={crmTestError.message} />}
        </FieldGroup>
      </section>

      {/*------ Editable Discounts & Base Prices Ledger (Section 5 #4) ------*/}
      <section className="space-y-5">
        <h2 className="border-b border-border pb-3 text-h3 text-foreground">
          {m.admin_campaign_settings_discounts_title()}
        </h2>

        <div className="divide-y divide-border border-b border-border">
          {discounts.map((row, index) => (
            <div key={row.code} className="grid gap-4 py-4 md:grid-cols-12 md:items-end">
              <div className="md:col-span-4">
                <Field>
                  <FieldLabel htmlFor={`${id}-disc-title-${row.code}`}>
                    {m.admin_campaign_settings_discount_title()}
                  </FieldLabel>
                  <Input
                    id={`${id}-disc-title-${row.code}`}
                    value={row.title}
                    onChange={(event) => updateDiscount(index, { title: event.target.value })}
                  />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field>
                  <FieldLabel htmlFor={`${id}-disc-cash-${row.code}`}>
                    {m.admin_campaign_settings_discount_cash()}
                  </FieldLabel>
                  <Input
                    id={`${id}-disc-cash-${row.code}`}
                    dir="ltr"
                    inputMode="numeric"
                    value={row.cashPercent}
                    onChange={(event) => updateDiscount(index, { cashPercent: event.target.value })}
                  />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field>
                  <FieldLabel htmlFor={`${id}-disc-inst-${row.code}`}>
                    {m.admin_campaign_settings_discount_installment()}
                  </FieldLabel>
                  <Input
                    id={`${id}-disc-inst-${row.code}`}
                    dir="ltr"
                    inputMode="numeric"
                    value={row.installmentPercent}
                    onChange={(event) => updateDiscount(index, { installmentPercent: event.target.value })}
                  />
                </Field>
              </div>
              <div className="md:col-span-4">
                <Field>
                  <FieldLabel htmlFor={`${id}-disc-price-${row.code}`}>
                    {m.admin_campaign_settings_discount_base_price()}
                  </FieldLabel>
                  <Input
                    id={`${id}-disc-price-${row.code}`}
                    dir="ltr"
                    inputMode="numeric"
                    placeholder="—"
                    value={row.basePriceToman}
                    onChange={(event) => updateDiscount(index, { basePriceToman: event.target.value })}
                  />
                </Field>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Button type="submit" size="lg" disabled={save.isPending}>
        {save.isPending && <Spinner data-icon="inline-start" />}
        {m.admin_campaign_settings_save()}
      </Button>
    </form>
  );
}
