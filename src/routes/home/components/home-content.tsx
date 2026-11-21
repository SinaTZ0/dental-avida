import { Link } from "@tanstack/react-router";
import {
  ArrowLeftIcon,
  BabyIcon,
  CalendarDaysIcon,
  ClipboardListIcon,
  ClipboardPenLineIcon,
  HeartHandshakeIcon,
  MessageCircleIcon,
  MinusIcon,
  PlusIcon,
  ScanFaceIcon,
  ScanLineIcon,
  ShieldCheckIcon,
  SparklesIcon,
  WrenchIcon,
} from "lucide-react";

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
    <section
      aria-labelledby="hero-title"
      className="home-hero relative isolate overflow-hidden bg-hero-surface porcelain-grain"
    >
      <div className="home-hero-inner mx-auto flex max-w-site-wide items-center px-4 sm:px-6">
        <div className="home-hero-copy relative z-10">
          <h1 id="hero-title" className="text-hero">
            {m.home_hero_title()} <span className="block">{m.home_hero_emphasis()}</span>
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
        srcSet={`${patient720} 720w, ${patient} 1536w`}
        sizes="(width < 48rem) 100vw, 68vw"
        width={1536}
        height={1024}
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
    icon: ShieldCheckIcon,
    title: m.home_service_checkup,
    description: m.home_service_checkup_description,
  },
  {
    id: "restoration",
    icon: WrenchIcon,
    title: m.home_service_restoration,
    description: m.home_service_restoration_description,
  },
  {
    id: "cosmetic",
    icon: SparklesIcon,
    title: m.home_service_cosmetic,
    description: m.home_service_cosmetic_description,
  },
  {
    id: "orthodontics",
    icon: ScanFaceIcon,
    title: m.home_service_orthodontics,
    description: m.home_service_orthodontics_description,
  },
  {
    id: "implants",
    icon: ScanLineIcon,
    title: m.home_service_implants,
    description: m.home_service_implants_description,
  },
  { id: "children", icon: BabyIcon, title: m.home_service_children, description: m.home_service_children_description },
] as const;

export function HomeServices() {
  return (
    <section id={homeSections.services} aria-labelledby="services-title" className="home-section home-shell">
      <div className="home-section-heading">
        <h2 id="services-title" className="text-section">
          {m.home_services_title()}
        </h2>
        <p className="max-w-md text-body-lg text-muted-foreground">{m.home_services_intro()}</p>
      </div>

      {/* oxlint-disable-next-line jsx-a11y/no-redundant-roles -- WebKit can drop list semantics when markers are hidden. */}
      <ul className="home-treatments" role="list">
        {treatments.map(({ id, icon: Icon, title, description }) => (
          <li key={id} className="home-treatment">
            <span aria-hidden className="home-treatment-photo" />
            <Icon className="home-treatment-icon size-7 shrink-0" aria-hidden />
            <div>
              <h3 className="text-h3">{title()}</h3>
              <p className="home-treatment-description mt-1 text-body">{description()}</p>
              {id === "children" && (
                <a href={`#${homeSections.childVisit}`} className="home-text-link mt-1">
                  {m.home_child_visit_link()}
                  <ArrowLeftIcon className="size-4 ltr:rotate-180" aria-hidden />
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>

      <div className="home-services-prompt porcelain-grain">
        <div>
          <h3 className="text-h3">{m.home_services_start_title()}</h3>
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

/*===== Practice =====*/

export function HomePractice() {
  return (
    <section
      id={homeSections.practice}
      aria-labelledby="practice-title"
      className="home-section bg-brand-surface porcelain-grain text-brand-surface-foreground"
    >
      <div className="home-shell home-practice">
        <div className="home-practice-copy">
          <h2 id="practice-title" className="text-section">
            {m.home_practice_title()}
          </h2>
          <p className="mt-4 text-body-lg text-brand-surface-muted">{m.home_practice_intro()}</p>
          <div className="home-practice-note">
            <HeartHandshakeIcon className="mt-1 size-6 shrink-0 text-brand-surface-muted" aria-hidden />
            <div>
              <h3 className="text-h3">{m.home_practice_reassurance_title()}</h3>
              <p className="mt-1 text-body text-brand-surface-muted">{m.home_practice_reassurance()}</p>
            </div>
          </div>
        </div>
        <figure>
          <img
            src={treatmentRoom}
            srcSet={`${treatmentRoom720} 720w, ${treatmentRoom} 1536w`}
            sizes="auto, (min-width: 120rem) 47rem, (min-width: 97rem) 40vw, (min-width: 75rem) 36rem, (min-width: 48rem) 50vw, calc(100vw - 2rem)"
            width={1536}
            height={1024}
            loading="lazy"
            decoding="async"
            alt={m.home_practice_image_alt()}
            className="home-practice-photo"
          />
          <figcaption className="mt-2 text-caption text-brand-surface-muted">
            {m.home_practice_image_caption()}
          </figcaption>
        </figure>
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
    icon: ClipboardListIcon,
    title: m.home_visit_checklist_title,
    items: [m.home_visit_checklist_records, m.home_visit_checklist_medications, m.home_visit_checklist_questions],
  },
  {
    icon: ClipboardPenLineIcon,
    title: m.home_visit_share_title,
    items: [m.home_visit_share_concern, m.home_visit_share_history, m.home_visit_share_comfort],
  },
  {
    icon: MessageCircleIcon,
    title: m.home_visit_questions_title,
    items: [m.home_visit_question_priority, m.home_visit_question_options, m.home_visit_question_followup],
  },
] as const;

export function HomeVisit() {
  return (
    <section id={homeSections.visit} aria-labelledby="visit-title" className="home-section home-shell">
      <div className="home-section-heading">
        <h2 id="visit-title" className="text-section">
          {m.home_visit_title()}
        </h2>
        <p className="max-w-md text-body-lg text-muted-foreground">{m.home_visit_intro()}</p>
      </div>

      {/* oxlint-disable-next-line jsx-a11y/no-redundant-roles -- The custom step markers replace the native markers. */}
      <ol className="home-visit-steps" role="list">
        {visitSteps.map(([title, description], index) => (
          <li key={title()} className="home-visit-step">
            <span aria-hidden className="home-visit-number text-h3 tabular-nums">
              {formatNumber(index + 1)}
            </span>
            <div>
              <h3 className="text-h3">{title()}</h3>
              <p className="mt-1 text-body text-muted-foreground">{description()}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="home-visit-preparation porcelain-grain">
        {visitPreparation.map(({ icon: Icon, title, items }) => (
          <div key={title()}>
            <h3 className="flex items-start gap-3 text-h3">
              <Icon className="mt-1 size-5 shrink-0 text-brand-text" aria-hidden />
              {title()}
            </h3>
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
      className="home-section bg-muted porcelain-grain"
    >
      <div className="home-shell home-questions">
        <div>
          <h2 id="questions-title" className="text-section">
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
              <p className="max-w-2xl pe-8 pb-5 text-body-lg text-muted-foreground">{answer()}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
