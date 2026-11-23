import { Link } from "@tanstack/react-router";
import { ClockIcon, MapPinIcon, PhoneIcon, SmartphoneIcon } from "lucide-react";

import { AvidaBrandEmblem, AvidaSmile } from "#/components/shared/avida-smile/avida-smile";
import { SiteLink } from "#/components/shared/site-link/site-link";
import { clinicDetails, homeSections } from "#/lib/site";
import { m } from "#/paraglide/messages";

/*===== Site Footer =====*/

const footerSections = [
  [homeSections.services, m.nav_services],
  [homeSections.technology, m.nav_technology],
  [homeSections.practice, m.nav_practice],
  [homeSections.team, m.nav_team],
  [homeSections.visit, m.nav_visit],
  [homeSections.questions, m.nav_questions],
] as const;

const footerLinkClass =
  "inline-flex min-h-target min-w-target items-center rounded-sm underline decoration-transparent underline-offset-4 hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-surface-foreground";

function ClinicContact() {
  const { location, phone, mobile, hours } = clinicDetails;
  const hasAnyDetails = Boolean(location || phone || mobile || hours);

  const details = [
    {
      label: m.site_contact_address,
      icon: MapPinIcon,
      value: location && <address className="not-italic">{location.address()}</address>,
      action: location?.mapUrl && (
        <SiteLink href={location.mapUrl} className={`${footerLinkClass} text-nav text-brand-surface-foreground`}>
          {m.site_contact_directions()}
        </SiteLink>
      ),
    },
    {
      label: m.site_contact_phone,
      icon: PhoneIcon,
      value: (phone || mobile) && (
        <div className="flex flex-col items-start">
          {mobile && (
            <SiteLink
              href={`tel:${mobile.number}`}
              className={`${footerLinkClass} gap-1.5 text-brand-surface-foreground`}
            >
              <SmartphoneIcon aria-hidden className="size-4 shrink-0 text-brand-surface-gold" />
              <bdi dir="ltr" className="tabular-nums">
                {mobile.label()}
              </bdi>
            </SiteLink>
          )}
          {phone && (
            <SiteLink
              href={`tel:${phone.number}`}
              className={`${footerLinkClass} gap-1.5 text-brand-surface-foreground`}
            >
              <PhoneIcon aria-hidden className="size-4 shrink-0 text-brand-surface-gold" />
              <bdi dir="ltr" className="tabular-nums">
                {phone.label()}
              </bdi>
            </SiteLink>
          )}
        </div>
      ),
    },
    { label: m.site_contact_hours, icon: ClockIcon, value: hours?.() },
  ];

  return (
    <section aria-labelledby="clinic-contact-title">
      <h2 id="clinic-contact-title" className="text-h3">
        {m.site_contact_title()}
      </h2>
      {hasAnyDetails ? (
        <dl className="mt-4 grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-3">
          {details.map(({ icon: Icon, label, value, action }) => (
            <div key={label()} className="border-t border-brand-surface-gold/25 pt-3">
              <dt className="flex items-center gap-2 text-body font-semibold">
                <Icon aria-hidden className="size-5 shrink-0 text-brand-surface-gold" />
                {label()}
              </dt>
              <dd className="mt-1 text-body text-brand-surface-muted">
                {value ?? m.site_contact_unavailable()}
                {action && <div>{action}</div>}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <div className="mt-4 border-t border-brand-surface-gold/25 pt-4">
          <p className="max-w-lg text-body text-brand-surface-muted">{m.site_contact_pending()}</p>
        </div>
      )}
    </section>
  );
}

export function SiteFooter({ campaignActive = false }: { campaignActive?: boolean }) {
  return (
    <footer className="border-t border-brand-surface-gold/30 bg-brand-surface text-brand-surface-foreground">
      <div className="mx-auto max-w-site-wide px-4 pt-10 pb-6 sm:px-6 sm:pt-14 sm:pb-7">
        <div className="grid gap-8 pb-8 md:grid-cols-3 md:gap-12">
          <div>
            <div className="flex items-center gap-3">
              <AvidaBrandEmblem className="size-11 border-brand-surface-gold/55 bg-consultation-deep" />
              <div>
                <p className="text-h2 leading-snug font-extrabold">{m.site_name()}</p>
                <p className="text-caption text-brand-surface-gold">{m.site_brand_subtitle()}</p>
              </div>
            </div>
            <AvidaSmile className="mt-3 w-28 text-brand-surface-gold" accentDot={false} />
            <p className="mt-3 max-w-xs text-body-sm text-brand-surface-muted">{m.site_footer_description()}</p>
          </div>
          <div className="min-w-0 md:col-span-2">
            <ClinicContact />
          </div>
        </div>
        <div className="flex flex-col gap-3 border-t border-brand-surface-muted/25 pt-4 md:flex-row md:items-center md:justify-between">
          <nav aria-label={m.nav_footer()}>
            <ul className="flex flex-wrap gap-x-5 gap-y-1">
              {campaignActive && (
                <li>
                  <Link
                    to="/black-friday"
                    className={`${footerLinkClass} text-nav font-semibold text-brand-surface-gold`}
                  >
                    {m.nav_campaign()}
                  </Link>
                </li>
              )}
              {footerSections.map(([hash, label]) => (
                <li key={hash}>
                  <Link to="/" hash={hash} className={`${footerLinkClass} text-nav`}>
                    {label()}
                  </Link>
                </li>
              ))}
              <li>
                <Link to="/privacy" className={`${footerLinkClass} text-nav`}>
                  {m.nav_privacy()}
                </Link>
              </li>
            </ul>
          </nav>
          <p className="text-caption text-brand-surface-muted">{m.site_footer_copyright()}</p>
        </div>
      </div>
    </footer>
  );
}
