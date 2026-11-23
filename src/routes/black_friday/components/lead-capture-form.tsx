import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { ORPCError } from "@orpc/client";
import { useMutation } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowLeftIcon, CheckCircle2Icon, InfoIcon, PhoneCallIcon } from "lucide-react";
import { useId, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { Alert, AlertDescription, AlertTitle } from "#/components/primitive/alert/alert";
import { Button } from "#/components/primitive/button/button";
import { buttonVariants } from "#/components/primitive/button/button.styles";
import { Checkbox } from "#/components/primitive/checkbox/checkbox";
import { Field, FieldError, FieldGroup, FieldLabel } from "#/components/primitive/field/field";
import { Input } from "#/components/primitive/input/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#/components/primitive/select/select";
import { Spinner } from "#/components/primitive/spinner/spinner";
import { FormAlert } from "#/components/shared/form-alert/form-alert";
import { describeApiFailure } from "#/lib/api-error";
import { markCampaignLeadSubmitted, readCampaignAttribution } from "#/lib/campaign-attribution";
import type { LeadTreatment } from "#/orpc/campaign/constants";
import { client } from "#/orpc/client";
import { m } from "#/paraglide/messages";
import { leadFormSchema, type LeadFormValues } from "#/routes/black_friday/schema";

/*===== Treatment Options =====*/

const TREATMENT_OPTIONS: readonly { value: LeadTreatment; label: () => string }[] = [
  { value: "implant_fixture", label: m.campaign_treatment_implant_fixture },
  { value: "implant_with_crown", label: m.campaign_treatment_implant_with_crown },
  { value: "laminate", label: m.campaign_treatment_laminate },
  { value: "both_consultation", label: m.campaign_treatment_both_consultation },
];

/*===== Component =====*/

/**
 * Short, low-friction 3-field lead capture form with Iranian phone normalization, consent notice linking to
 * `/privacy`, duplicate-phone feedback, and confirmation with the non-binding reservation disclaimer.
 */
export function LeadCaptureForm() {
  const id = useId();
  const [outcome, setOutcome] = useState<"idle" | "submitted" | "duplicate">("idle");

  const form = useForm<LeadFormValues>({
    resolver: standardSchemaResolver(leadFormSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      treatment: "implant_fixture",
      consent: true,
      website: "",
    },
  });

  const submit = useMutation({
    mutationFn: (values: LeadFormValues) => {
      const attribution = readCampaignAttribution();
      return client.campaign.submitLead({
        fullName: values.fullName,
        phone: values.phone,
        treatment: values.treatment,
        source: attribution.source,
        utmSource: attribution.utmSource || undefined,
        utmMedium: attribution.utmMedium || undefined,
        utmCampaign: attribution.utmCampaign || undefined,
        referrer: attribution.referrer || undefined,
        website: values.website || undefined,
      });
    },
    onSuccess: () => {
      markCampaignLeadSubmitted();
      setOutcome("submitted");
      form.reset();
    },
    onError: (error) => {
      if (error instanceof ORPCError && error.code === "CONFLICT") {
        markCampaignLeadSubmitted();
        setOutcome("duplicate");
      }
    },
  });

  if (outcome === "submitted") {
    return (
      <div className="space-y-6 border-y border-brand-gold/35 py-8">
        <Alert variant="success">
          <CheckCircle2Icon aria-hidden />
          <AlertTitle>{m.campaign_form_success_title()}</AlertTitle>
          <AlertDescription>{m.campaign_form_success_body()}</AlertDescription>
        </Alert>
        <p className="border-s-2 border-brand-gold/60 ps-4 text-body-sm text-muted-foreground">
          {m.campaign_form_reservation_disclaimer()}
        </p>
        <Link to="/" className={buttonVariants({ variant: "outline" })}>
          <span>{m.campaign_form_back_home()}</span>
          <ArrowLeftIcon aria-hidden data-icon="inline-end" />
        </Link>
      </div>
    );
  }

  if (outcome === "duplicate") {
    return (
      <div className="space-y-6 border-y border-brand-gold/35 py-8">
        <Alert variant="warning">
          <InfoIcon aria-hidden />
          <AlertTitle>{m.campaign_form_duplicate_title()}</AlertTitle>
          <AlertDescription>{m.campaign_form_duplicate_body()}</AlertDescription>
        </Alert>
        <p className="border-s-2 border-brand-gold/60 ps-4 text-body-sm text-muted-foreground">
          {m.campaign_form_reservation_disclaimer()}
        </p>
        <Link to="/" className={buttonVariants({ variant: "outline" })}>
          <span>{m.campaign_form_back_home()}</span>
          <ArrowLeftIcon aria-hidden data-icon="inline-end" />
        </Link>
      </div>
    );
  }

  const failure = submit.error
    ? describeApiFailure({ error: submit.error, fallback: m.campaign_form_submit_failed() })
    : null;

  const fullNameError = form.formState.errors.fullName?.message ?? failure?.fields.fullName;
  const phoneError = form.formState.errors.phone?.message ?? failure?.fields.phone;
  const treatmentError = form.formState.errors.treatment?.message ?? failure?.fields.treatment;
  const consentError = form.formState.errors.consent?.message;

  const fullNameErrorId = `${id}-name-error`;
  const phoneErrorId = `${id}-phone-error`;
  const treatmentErrorId = `${id}-treatment-error`;
  const consentErrorId = `${id}-consent-error`;

  return (
    <form onSubmit={form.handleSubmit((values) => submit.mutate(values))} noValidate className="relative">
      {/* Hidden honeypot field: stays invisible to visitors and catches naive bots. */}
      <div className="bf-honeypot" aria-hidden="true">
        <label htmlFor={`${id}-website`}>Website</label>
        <input id={`${id}-website`} tabIndex={-1} autoComplete="off" {...form.register("website")} />
      </div>

      <FieldGroup>
        <FormAlert message={failure?.message ?? undefined} />

        <div className="grid gap-5 md:grid-cols-2">
          <Field data-invalid={!!fullNameError || undefined}>
            <FieldLabel htmlFor={`${id}-name`}>{m.campaign_form_name_label()}</FieldLabel>
            <Input
              id={`${id}-name`}
              autoComplete="name"
              placeholder={m.campaign_form_name_placeholder()}
              aria-invalid={!!fullNameError}
              aria-describedby={fullNameError ? fullNameErrorId : undefined}
              {...form.register("fullName")}
            />
            <FieldError id={fullNameErrorId}>{fullNameError}</FieldError>
          </Field>

          <Field data-invalid={!!phoneError || undefined}>
            <FieldLabel htmlFor={`${id}-phone`}>{m.campaign_form_phone_label()}</FieldLabel>
            <Input
              id={`${id}-phone`}
              type="tel"
              dir="ltr"
              inputMode="tel"
              autoComplete="tel"
              placeholder={m.campaign_form_phone_placeholder()}
              aria-invalid={!!phoneError}
              aria-describedby={phoneError ? phoneErrorId : undefined}
              {...form.register("phone")}
            />
            <FieldError id={phoneErrorId}>{phoneError}</FieldError>
          </Field>
        </div>

        <Field data-invalid={!!treatmentError || undefined}>
          <FieldLabel htmlFor={`${id}-treatment`}>{m.campaign_form_treatment_label()}</FieldLabel>
          <Controller
            control={form.control}
            name="treatment"
            render={({ field }) => {
              const selectedLabel =
                TREATMENT_OPTIONS.find((item) => item.value === field.value)?.label() ??
                m.campaign_form_treatment_placeholder();

              return (
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    if (value) field.onChange(value as LeadTreatment);
                  }}
                >
                  <SelectTrigger
                    id={`${id}-treatment`}
                    aria-invalid={!!treatmentError}
                    aria-describedby={treatmentError ? treatmentErrorId : undefined}
                    className="w-full"
                  >
                    <SelectValue>{selectedLabel}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {TREATMENT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              );
            }}
          />
          <FieldError id={treatmentErrorId}>{treatmentError}</FieldError>
        </Field>

        {/*------ Privacy & Callback Consent (Section 5 #7) ------*/}
        <Field data-invalid={!!consentError || undefined}>
          <div className="flex items-start gap-3">
            <Controller
              control={form.control}
              name="consent"
              render={({ field }) => (
                <Checkbox
                  id={`${id}-consent`}
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                  aria-invalid={!!consentError}
                  aria-describedby={consentError ? consentErrorId : undefined}
                />
              )}
            />
            <label htmlFor={`${id}-consent`} className="cursor-pointer text-body-sm text-muted-foreground">
              {m.campaign_form_consent_prefix()}
              <Link
                to="/privacy"
                className="font-semibold text-brand-text underline decoration-brand-gold/60 underline-offset-4 hover:text-foreground"
              >
                {m.campaign_form_consent_link()}
              </Link>
              {m.campaign_form_consent_suffix()}
            </label>
          </div>
          <FieldError id={consentErrorId}>{consentError}</FieldError>
        </Field>

        <div className="pt-2">
          <Button type="submit" variant="crimson" size="lg" disabled={submit.isPending} className="w-full sm:w-auto">
            {submit.isPending ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <PhoneCallIcon aria-hidden data-icon="inline-start" />
            )}
            {submit.isPending ? m.campaign_form_submitting() : m.campaign_form_submit()}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
