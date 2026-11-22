import { Link } from "@tanstack/react-router";
import { ArrowLeftIcon, CalendarDaysIcon, MinusIcon, PlusIcon } from "lucide-react";

import { buttonVariants } from "#/components/primitive/button/button.styles";
import { formatNumber } from "#/lib/locale";
import { clinicDetails, homeSections } from "#/lib/site";
import { m } from "#/paraglide/messages";
import patient720 from "#/routes/home/assets/patient-720.webp";
import patient from "#/routes/home/assets/patient.webp";
import treatmentRoom720 from "#/routes/home/assets/treatment-room-720.webp";
import treatmentRoom from "#/routes/home/assets/treatment-room.webp";
import { HomeConsultationGuide } from "#/routes/home/components/home-visit-guides";

/*===== Hero =====*/

export function HomeHero() {
  const appointmentLabel = clinicDetails.bookingUrl
    ? m.home_appointment_online
    : clinicDetails.phone
      ? m.home_appointment_phone
      : m.home_appointment_plan;

  return (
    <section aria-labelledby="hero-title" className="home-hero relative isolate overflow-hidden bg-hero-surface">
      <div className="home-hero-inner mx-auto flex max-w-site-wide items-center px-4 sm:px-6">
        <div className="home-hero-copy relative z-10">
          <p className="home-hero-kicker">
            <span className="home-hero-kicker-dot" aria-hidden />
            {m.home_hero_kicker()}
          </p>
          <h1 id="hero-title" className="mt-4 text-hero">
            {m.home_hero_title()} <span className="block text-brand-text">{m.home_hero_emphasis()}</span>
          </h1>
          <span className="home-smile home-hero-smile" aria-hidden />
          <p className="home-hero-intro mt-5 max-w-md text-body-lg text-muted-foreground">{m.home_hero_intro()}</p>
          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link
              to="/"
              hash={homeSections.appointments}
              className={buttonVariants({ variant: "highlight", size: "hero" })}
            >
              <CalendarDaysIcon data-icon="inline-start" aria-hidden />
              {appointmentLabel()}
            </Link>
            <a href={`#${homeSections.services}`} className="home-text-link">
              {m.home_view_services()}
              <ArrowLeftIcon aria-hidden className="size-4 ltr:rotate-180" />
            </a>
          </div>
        </div>
      </div>
      <img
        src={patient}
        srcSet={`${patient720} 720w, ${patient} 1264w`}
        sizes="(width < 48rem) 100vw, 68vw"
        width={1264}
        height={848}
        fetchPriority="high"
        alt={m.home_hero_image_alt()}
        className="home-hero-photo"
      />
    </section>
  );
}

/*===== Service directory =====*/

const treatments = [
  {
    id: "checkup",
    title: m.home_service_checkup,
    description: m.home_service_checkup_description,
    tags: m.home_service_checkup_tags,
  },
  {
    id: "restoration",
    title: m.home_service_restoration,
    description: m.home_service_restoration_description,
    tags: m.home_service_restoration_tags,
  },
  {
    id: "cosmetic",
    title: m.home_service_cosmetic,
    description: m.home_service_cosmetic_description,
    tags: m.home_service_cosmetic_tags,
  },
  {
    id: "orthodontics",
    title: m.home_service_orthodontics,
    description: m.home_service_orthodontics_description,
    tags: m.home_service_orthodontics_tags,
  },
  {
    id: "implants",
    title: m.home_service_implants,
    description: m.home_service_implants_description,
    tags: m.home_service_implants_tags,
  },
  {
    id: "children",
    title: m.home_service_children,
    description: m.home_service_children_description,
    tags: m.home_service_children_tags,
  },
] as const;

export function HomeServices() {
  return (
    <section
      id={homeSections.services}
      aria-labelledby="services-title"
      className="home-section home-shell home-services"
    >
      <div className="home-section-heading">
        <div>
          <p className="home-kicker">{m.home_services_kicker()}</p>
          <h2 id="services-title" className="mt-2.5 text-section">
            {m.home_services_title()}
          </h2>
        </div>
        <p className="max-w-md text-body-lg text-muted-foreground">{m.home_services_intro()}</p>
      </div>

      {/* oxlint-disable-next-line jsx-a11y/no-redundant-roles -- WebKit can drop list semantics when markers are hidden. */}
      <ol className="home-service-ledger" role="list">
        {treatments.map(({ id, title, description, tags }, index) => {
          const tagItems = tags()
            .split("•")
            .map((part) => part.trim())
            .filter(Boolean);

          return (
            <li key={id} className="home-service-row">
              <span className="home-service-num tabular-nums" aria-hidden>
                {formatNumber(index + 1).padStart(2, "۰")}
              </span>
              <div className="home-service-primary">
                <h3 className="text-h2 text-foreground">{title()}</h3>
                <ul className="home-service-meta" aria-label={title()}>
                  {tagItems.map((tag) => (
                    <li key={tag} className="home-service-meta-item text-caption">
                      {tag}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="home-service-detail">
                <p className="text-body text-muted-foreground">{description()}</p>
                {id === "children" && (
                  <a href={`#${homeSections.childVisit}`} className="home-text-link mt-2">
                    {m.home_child_visit_link()}
                    <ArrowLeftIcon className="size-4 ltr:rotate-180" aria-hidden />
                  </a>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <div className="home-services-prompt">
        <div>
          <h3 className="text-h3 text-foreground">{m.home_services_start_title()}</h3>
          <p className="mt-1 text-body text-muted-foreground">{m.home_services_start_body()}</p>
        </div>
        <a href={`#${homeSections.visit}`} className="home-text-link">
          {m.home_plan_visit()}
          <ArrowLeftIcon className="size-4 ltr:rotate-180" aria-hidden />
        </a>
      </div>
    </section>
  );
}

/*===== Practice & Interdisciplinary Care =====*/

const practicePromises = [
  m.home_practice_promise_time,
  m.home_practice_promise_clear,
  m.home_practice_promise_pace,
] as const;

const careDisciplines = [
  {
    id: "implant",
    title: m.home_team_implant_title,
    role: m.home_team_implant_role,
    body: m.home_team_implant_body,
  },
  {
    id: "esthetic",
    title: m.home_team_esthetic_title,
    role: m.home_team_esthetic_role,
    body: m.home_team_esthetic_body,
  },
  {
    id: "ortho",
    title: m.home_team_ortho_title,
    role: m.home_team_ortho_role,
    body: m.home_team_ortho_body,
  },
  {
    id: "family",
    title: m.home_team_family_title,
    role: m.home_team_family_role,
    body: m.home_team_family_body,
  },
] as const;

export function HomePractice() {
  return (
    <section
      id={homeSections.practice}
      aria-labelledby="practice-title"
      className="home-section home-practice-section bg-brand-surface text-brand-surface-foreground"
    >
      <div className="home-shell">
        <div className="home-practice">
          <div className="home-practice-copy">
            <p className="home-kicker home-kicker-dark">{m.home_practice_kicker()}</p>
            <h2 id="practice-title" className="mt-3 text-section">
              {m.home_practice_title()}
            </h2>
            <p className="mt-4 text-body-lg text-brand-surface-muted">{m.home_practice_intro()}</p>

            {/* oxlint-disable-next-line jsx-a11y/no-redundant-roles -- WebKit can drop list semantics when markers are hidden. */}
            <ul className="home-practice-promises" role="list">
              {practicePromises.map((promise) => (
                <li key={promise()} className="home-practice-promise text-body-sm">
                  {promise()}
                </li>
              ))}
            </ul>

            <div className="home-practice-note">
              <h3 className="text-h3 text-brand-surface-foreground">{m.home_practice_reassurance_title()}</h3>
              <p className="mt-1.5 text-body text-brand-surface-muted">{m.home_practice_reassurance()}</p>
            </div>
          </div>

          <figure className="home-practice-media">
            <div className="home-glow-stage">
              <img
                src={treatmentRoom}
                srcSet={`${treatmentRoom720} 720w, ${treatmentRoom} 1264w`}
                sizes="auto, (min-width: 120rem) 47rem, (min-width: 97rem) 40vw, (min-width: 75rem) 36rem, (min-width: 48rem) 50vw, calc(100vw - 2rem)"
                width={1264}
                height={848}
                loading="lazy"
                decoding="async"
                alt={m.home_practice_image_alt()}
                className="home-practice-photo"
              />
            </div>
            <figcaption className="mt-3 text-caption text-brand-surface-muted">
              {m.home_practice_image_caption()}
            </figcaption>
          </figure>
        </div>

        {/*------ Interdisciplinary care columns ------*/}
        <div id={homeSections.team} className="home-disciplines">
          <div className="home-disciplines-head">
            <div>
              <p className="home-kicker home-kicker-dark">{m.home_team_kicker()}</p>
              <h3 className="mt-2 text-h2 text-brand-surface-foreground">{m.home_team_title()}</h3>
            </div>
            <p className="max-w-md text-body text-brand-surface-muted">{m.home_team_summary()}</p>
          </div>

          {/* oxlint-disable-next-line jsx-a11y/no-redundant-roles -- WebKit can drop list semantics when markers are hidden. */}
          <ol className="home-disciplines-grid" role="list">
            {careDisciplines.map(({ id, title, role, body }, index) => (
              <li key={id} className="home-discipline-col">
                <span className="home-discipline-num text-caption tabular-nums" aria-hidden>
                  {formatNumber(index + 1).padStart(2, "۰")}
                </span>
                <h4 className="mt-3 text-h4 text-brand-surface-foreground">{title()}</h4>
                <p className="mt-1 text-caption text-brand-surface-gold">{role()}</p>
                <p className="mt-2.5 text-body-sm text-brand-surface-muted">{body()}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/*===== Patient guide =====*/

const visitSteps = [
  [m.home_visit_talk, m.home_visit_talk_description],
  [m.home_visit_exam, m.home_visit_exam_description],
  [m.home_visit_plan, m.home_visit_plan_description],
] as const;

const visitPreparation = [
  {
    title: m.home_visit_checklist_title,
    items: [m.home_visit_checklist_records, m.home_visit_checklist_medications, m.home_visit_checklist_questions],
  },
  {
    title: m.home_visit_share_title,
    items: [m.home_visit_share_concern, m.home_visit_share_history, m.home_visit_share_comfort],
  },
  {
    title: m.home_visit_questions_title,
    items: [m.home_visit_question_priority, m.home_visit_question_options, m.home_visit_question_followup],
  },
] as const;

export function HomeVisit() {
  return (
    <section id={homeSections.visit} aria-labelledby="visit-title" className="home-section home-shell">
      <div className="home-section-heading">
        <div>
          <p className="home-kicker">{m.home_visit_kicker()}</p>
          <h2 id="visit-title" className="mt-2.5 text-section">
            {m.home_visit_title()}
          </h2>
        </div>
        <p className="max-w-md text-body-lg text-muted-foreground">{m.home_visit_intro()}</p>
      </div>

      {/* oxlint-disable-next-line jsx-a11y/no-redundant-roles -- The custom step markers replace the native markers. */}
      <ol className="home-visit-steps" role="list">
        {visitSteps.map(([title, description], index) => (
          <li key={title()} className="home-visit-step">
            <span aria-hidden className="home-visit-number tabular-nums">
              {formatNumber(index + 1).padStart(2, "۰")}
            </span>
            <div>
              <h3 className="text-h3 text-foreground">{title()}</h3>
              <p className="mt-2 text-body text-muted-foreground">{description()}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="home-visit-preparation">
        {visitPreparation.map(({ title, items }, index) => (
          <div key={title()} className="home-preparation-col">
            <span className="home-editorial-index text-caption tabular-nums" aria-hidden>
              {formatNumber(index + 1).padStart(2, "۰")}
            </span>
            <h3 className="mt-1.5 text-h3 text-foreground">{title()}</h3>
            <ul className="home-preparation-list text-body text-muted-foreground">
              {items.map((item) => (
                <li key={item()}>{item()}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <HomeConsultationGuide />
    </section>
  );
}

/*===== Common questions =====*/

const questions = [
  [m.home_faq_unsure, m.home_faq_unsure_answer],
  [m.home_faq_anxiety, m.home_faq_anxiety_answer],
  [m.home_faq_implant_duration, m.home_faq_implant_duration_answer],
  [m.home_faq_sterilization, m.home_faq_sterilization_answer],
  [m.home_faq_cost, m.home_faq_cost_answer],
  [m.home_faq_records, m.home_faq_records_answer],
  [m.home_faq_child, m.home_faq_child_answer],
  [m.home_faq_followup, m.home_faq_followup_answer],
] as const;

export function HomeQuestions() {
  return (
    <section
      id={homeSections.questions}
      aria-labelledby="questions-title"
      className="home-section home-questions-section bg-muted"
    >
      <div className="home-shell home-questions">
        <div className="home-questions-intro">
          <p className="home-kicker">{m.home_faq_kicker()}</p>
          <h2 id="questions-title" className="mt-2.5 text-section">
            {m.home_faq_title()}
          </h2>
          <p className="mt-3 max-w-xs text-body-lg text-muted-foreground">{m.home_faq_intro()}</p>
        </div>
        <div className="home-question-list">
          {questions.map(([question, answer]) => (
            <details key={question()} className="group">
              <summary className="home-question text-h3">
                <span>{question()}</span>
                <span className="home-question-indicator" aria-hidden>
                  <PlusIcon className="size-4 group-open:hidden" />
                  <MinusIcon className="hidden size-4 group-open:block" />
                </span>
              </summary>
              <p className="max-w-2xl pe-8 pb-5 text-body text-muted-foreground">{answer()}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
