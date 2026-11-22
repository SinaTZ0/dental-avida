import { Link } from "@tanstack/react-router";
import { ArrowLeftIcon, ClockIcon, ExternalLinkIcon, MapPinIcon, PhoneIcon } from "lucide-react";

import { buttonVariants } from "#/components/primitive/button/button.styles";
import { AvidaSmile } from "#/components/shared/avida-smile/avida-smile";
import { SiteLink } from "#/components/shared/site-link/site-link";
import { clinicDetails, homeSections } from "#/lib/site";
import { m } from "#/paraglide/messages";
import appointmentPlanner from "#/routes/home/assets/appointment-planner.webp";
import { HomeReviews } from "#/routes/home/components/home-reviews";

/*===== Appointments =====*/

const appointmentButton = buttonVariants({ variant: "consultation", size: "hero" });

function AppointmentActions() {
  const { bookingUrl, phone, location, hours } = clinicDetails;

  const clinicMeta = (hours || location) && (
    <dl className="home-appointment-meta text-body-sm text-brand-surface-muted">
      {hours && (
        <div className="flex items-start gap-2">
          <dt className="sr-only">{m.site_contact_hours()}</dt>
          <ClockIcon aria-hidden className="mt-1 size-4 shrink-0 text-brand-surface-gold" />
          <dd>{hours()}</dd>
        </div>
      )}
      {location && (
        <div className="flex items-start gap-2">
          <dt className="sr-only">{m.site_contact_address()}</dt>
          <MapPinIcon aria-hidden className="mt-1 size-4 shrink-0 text-brand-surface-gold" />
          <dd>{location.shortAddress()}</dd>
        </div>
      )}
    </dl>
  );

  if (bookingUrl) {
    return (
      <>
        <p className="text-body text-brand-surface-muted">{m.home_appointment_online_description()}</p>
        {clinicMeta}
        <SiteLink href={bookingUrl} className={appointmentButton}>
          <ExternalLinkIcon data-icon="inline-start" aria-hidden />
          {m.home_appointment_online()}
        </SiteLink>
      </>
    );
  }

  if (phone) {
    return (
      <>
        <p className="text-body text-brand-surface-muted">{m.home_appointment_phone_description()}</p>
        {clinicMeta}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <SiteLink href={`tel:${phone.number}`} className={appointmentButton}>
            <PhoneIcon data-icon="inline-start" aria-hidden />
            <span>{m.home_appointment_call()}</span>
            <bdi dir="ltr" className="tabular-nums">
              {phone.label()}
            </bdi>
          </SiteLink>
          {location?.mapUrl && (
            <SiteLink href={location.mapUrl} className="home-text-link home-text-link-dark">
              {m.site_contact_directions()}
              <ArrowLeftIcon aria-hidden className="size-4 ltr:rotate-180" />
            </SiteLink>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <p className="text-body text-brand-surface-muted">{m.home_appointment_prepare_description()}</p>
      <Link to="/" hash={homeSections.visit} className={appointmentButton}>
        {m.home_plan_visit()}
        <ArrowLeftIcon data-icon="inline-end" className="ltr:rotate-180" aria-hidden />
      </Link>
    </>
  );
}

/*===== Visit Panel =====*/

export function HomeAppointments() {
  return (
    <div id={homeSections.appointments} className="home-appointments home-shell">
      <section aria-labelledby="appointments-title" className="home-appointment-main">
        <img
          src={appointmentPlanner}
          width={1080}
          height={725}
          alt=""
          loading="lazy"
          decoding="async"
          className="home-appointment-photo"
        />
        <div className="home-appointment-copy">
          <p className="home-kicker home-kicker-dark">{m.home_appointment_kicker()}</p>
          <h2 id="appointments-title" className="mt-2.5 text-h1">
            {m.home_appointment_title()}
          </h2>
          <AvidaSmile className="mt-2 w-24 text-brand-surface-gold" accentDot={false} />
          <div className="home-appointment-actions">
            <AppointmentActions />
          </div>
        </div>
      </section>
      <HomeReviews />
    </div>
  );
}
