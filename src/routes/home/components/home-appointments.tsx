import { Link } from "@tanstack/react-router";
import { ArrowLeftIcon, ExternalLinkIcon, PhoneIcon } from "lucide-react";

import { buttonVariants } from "#/components/primitive/button/button.styles";
import { SiteLink } from "#/components/shared/site-link/site-link";
import { clinicDetails, homeSections } from "#/lib/site";
import { m } from "#/paraglide/messages";
import appointmentPlanner from "#/routes/home/assets/appointment-planner.webp";
import { HomeReviews } from "#/routes/home/components/home-reviews";

/*===== Appointments =====*/

const appointmentButton = buttonVariants({ variant: "consultation", size: "hero" });

function AppointmentActions() {
  const { bookingUrl, phone } = clinicDetails;

  if (bookingUrl) {
    return (
      <>
        <p className="text-body text-brand-surface-muted">{m.home_appointment_online_description()}</p>
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
        <SiteLink href={`tel:${phone.number}`} className={appointmentButton}>
          <PhoneIcon data-icon="inline-start" aria-hidden />
          {m.home_appointment_call()}
        </SiteLink>
      </>
    );
  }

  return (
    <>
      <p className="text-body text-brand-surface-muted">{m.home_appointment_unavailable()}</p>
      <Link to="/" hash={homeSections.visit} className={appointmentButton}>
        {m.home_plan_visit()}
        <ArrowLeftIcon className="ltr:rotate-180" aria-hidden />
      </Link>
    </>
  );
}

/*===== Visit Panel =====*/

export function HomeAppointments() {
  return (
    <div id={homeSections.appointments} className="home-appointments home-shell">
      <section aria-labelledby="appointments-title" className="home-appointment-main porcelain-grain">
        <img
          src={appointmentPlanner}
          width={900}
          height={600}
          alt=""
          loading="lazy"
          decoding="async"
          className="home-appointment-photo"
        />
        <div className="home-appointment-copy">
          <h2 id="appointments-title" className="text-section">
            {m.home_appointment_title()}
          </h2>
          <div className="home-appointment-actions">
            <AppointmentActions />
          </div>
        </div>
      </section>
      <HomeReviews />
    </div>
  );
}
