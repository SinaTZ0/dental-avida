import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2Icon } from "lucide-react";
import { type FormEvent, useId, useState } from "react";

import { Alert, AlertDescription } from "#/components/primitive/alert/alert";
import { Button } from "#/components/primitive/button/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "#/components/primitive/field/field";
import { Input } from "#/components/primitive/input/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#/components/primitive/select/select";
import { Spinner } from "#/components/primitive/spinner/spinner";
import { Switch } from "#/components/primitive/switch/switch";
import { FormAlert } from "#/components/shared/form-alert/form-alert";
import { describeApiFailure } from "#/lib/api-error";
import { toLatinDigits } from "#/lib/digits";
import { APP_TIME_ZONE } from "#/lib/locale";
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
};

/**
 * Live editor for campaign dates, capacity rules, reversible Black Friday theme toggle, notification email, and
 * discount table percentages (Section 5 #4 & #5).
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
  const [discounts, setDiscounts] = useState<EditableDiscount[]>(() =>
    overview.discounts.map((item) => ({
      code: item.code,
      title: item.title,
      cashPercent: String(item.cashPercent),
      installmentPercent: String(item.installmentPercent),
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
        discounts: discounts.map((row) => ({
          code: row.code,
          title: row.title,
          cashPercent: Number(toLatinDigits(row.cashPercent)),
          installmentPercent: Number(toLatinDigits(row.installmentPercent)),
        })),
      }),
    onSuccess: async () => {
      setSavedOk(true);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: orpc.campaign.adminOverview.key() }),
        queryClient.invalidateQueries({ queryKey: orpc.campaign.public.key() }),
      ]);
    },
  });

  const failure = save.error
    ? describeApiFailure({ error: save.error, fallback: m.admin_campaign_settings_save_failed() })
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

      {/*------ Editable Discounts Ledger ------*/}
      <section className="space-y-5">
        <h2 className="border-b border-border pb-3 text-h3 text-foreground">
          {m.admin_campaign_settings_discounts_title()}
        </h2>

        <div className="divide-y divide-border border-b border-border">
          {discounts.map((row, index) => (
            <div key={row.code} className="grid gap-4 py-4 md:grid-cols-12 md:items-end">
              <div className="md:col-span-6">
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
              <div className="md:col-span-3">
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
              <div className="md:col-span-3">
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
