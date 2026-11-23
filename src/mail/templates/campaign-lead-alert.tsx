import { render } from "@react-email/render";

import { MailLayout, MailText } from "#/mail/templates/layout";
import type { LeadTreatment } from "#/orpc/campaign/constants";
import { m } from "#/paraglide/messages";
import type { Locale } from "#/paraglide/runtime";

/*===== Treatment Label =====*/

function treatmentLabel(treatment: LeadTreatment, locale: Locale): string {
  switch (treatment) {
    case "implant_fixture":
      return m.campaign_treatment_implant_fixture({}, { locale });
    case "implant_with_crown":
      return m.campaign_treatment_implant_with_crown({}, { locale });
    case "laminate":
      return m.campaign_treatment_laminate({}, { locale });
    case "both_consultation":
      return m.campaign_treatment_both_consultation({}, { locale });
  }
}

/*===== Template =====*/

export type CampaignLeadAlertProps = {
  locale: Locale;
  fullName: string;
  phone: string;
  treatment: LeadTreatment;
  source: string;
  adminUrl: string;
};

/** Immediate consultation-team alert sent via Effect background job whenever a new campaign lead is captured. */
export function CampaignLeadAlert({ locale, fullName, phone, treatment, source, adminUrl }: CampaignLeadAlertProps) {
  const treatmentText = treatmentLabel(treatment, locale);
  const sourceText = source === "direct" ? m.admin_campaign_source_direct({}, { locale }) : source;

  return (
    <MailLayout
      locale={locale}
      preview={m.mail_campaign_lead_preview({ name: fullName, treatment: treatmentText }, { locale })}
      heading={m.mail_campaign_lead_heading({}, { locale })}
      action={{ label: m.mail_campaign_lead_action({}, { locale }), url: adminUrl }}
    >
      <MailText>{m.mail_campaign_lead_body({}, { locale })}</MailText>
      <MailText>{m.mail_campaign_lead_row_name({ name: fullName }, { locale })}</MailText>
      <MailText>{m.mail_campaign_lead_row_phone({ phone }, { locale })}</MailText>
      <MailText>{m.mail_campaign_lead_row_treatment({ treatment: treatmentText }, { locale })}</MailText>
      <MailText muted>{m.mail_campaign_lead_row_source({ source: sourceText }, { locale })}</MailText>
    </MailLayout>
  );
}

/** Renders HTML and plain-text parts for the campaign lead notification email. */
export async function renderCampaignLeadAlert(props: CampaignLeadAlertProps) {
  const element = <CampaignLeadAlert {...props} />;
  const [html, text] = await Promise.all([render(element), render(element, { plainText: true })]);
  return {
    subject: m.mail_campaign_lead_subject({ name: props.fullName }, { locale: props.locale }),
    fromName: m.site_name({}, { locale: props.locale }),
    html,
    text,
  };
}
