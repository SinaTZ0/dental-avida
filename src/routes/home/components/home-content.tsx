import { useEffect, useState } from "react";

import { Link } from "@tanstack/react-router";
import { ArrowLeftIcon, CalendarDaysIcon, ClockIcon, MinusIcon, PhoneIcon, PlusIcon } from "lucide-react";

import { buttonVariants } from "#/components/primitive/button/button.styles";
import { AvidaSmile } from "#/components/shared/avida-smile/avida-smile";
import { SiteLink } from "#/components/shared/site-link/site-link";
import { canPlayHomeIntro, onHomeIntroCompleted } from "#/lib/home-intro-state";
import { formatNumber } from "#/lib/locale";
import { clinicDetails, homeSections } from "#/lib/site";
import { m } from "#/paraglide/messages";
import patient720 from "#/routes/home/assets/patient-720.webp";
import patientDark720 from "#/routes/home/assets/patient-dark-720.webp";
import patientDark from "#/routes/home/assets/patient-dark.webp";
import patient from "#/routes/home/assets/patient.webp";
import treatmentRoom720 from "#/routes/home/assets/treatment-room-720.webp";
import treatmentRoom from "#/routes/home/assets/treatment-room.webp";
import { BlurText } from "#/routes/home/components/blur-text";
import { HomeConsultationGuide } from "#/routes/home/components/home-visit-guides";

/*===== Hero =====*/

const HERO_SMILE_INTRO_DELAY_MS = 500;

// C1-continuous periodic river curves (period 1440, tiled across 2880) so each current loops seamlessly.
// Extra vertical apron (y: 120 → 180) keeps the tilted river bank sealed below the hero clip edge at any width.
const HERO_RIVER_BACK_PATH =
  "M0 44 C260 12 460 76 720 44 C980 12 1180 76 1440 44 C1700 12 1900 76 2160 44 C2420 12 2620 76 2880 44 L2880 180 L0 180 Z";
const HERO_RIVER_MID_PATH =
  "M0 58 C240 94 520 22 780 54 C1040 86 1200 22 1440 58 C1680 94 1960 22 2220 54 C2480 86 2640 22 2880 58 L2880 180 L0 180 Z";
const HERO_RIVER_FRONT_CREST_PATH =
  "M0 70 C240 30 480 102 720 66 C960 30 1200 110 1440 70 C1680 30 1920 102 2160 66 C2400 30 2640 110 2880 70";
const HERO_RIVER_FRONT_PATH = `${HERO_RIVER_FRONT_CREST_PATH} L2880 180 L0 180 Z`;

export function HomeHero() {
  const [smilePlayTrigger, setSmilePlayTrigger] = useState(0);
  // Wait for the carved-smile arrival veil to clear on fresh loads so the blur reveal plays in view.
  const [headerRevealActive, setHeaderRevealActive] = useState(() => !canPlayHomeIntro());

  useEffect(() => {
    let timerId = 0;
    // Trigger immediately if the intro was already dismissed in layout, or fall back if interrupted.
    const fallbackTimerId = window.setTimeout(
      () => {
        setHeaderRevealActive(true);
      },
      canPlayHomeIntro() ? 850 : 0,
    );

    const unsubscribe = onHomeIntroCompleted(() => {
      window.clearTimeout(fallbackTimerId);
      setHeaderRevealActive(true);
      timerId = window.setTimeout(() => {
        setSmilePlayTrigger((count) => count + 1);
      }, HERO_SMILE_INTRO_DELAY_MS);
    });
    return () => {
      unsubscribe();
      window.clearTimeout(timerId);
      window.clearTimeout(fallbackTimerId);
    };
  }, []);

  const heroTitle = m.home_hero_title();
  const heroTitleWordCount = heroTitle.trim().split(/\s+/).length;

  const appointmentLabel = clinicDetails.bookingUrl
    ? m.home_appointment_online
    : clinicDetails.phone
      ? m.home_appointment_phone
      : m.home_appointment_plan;

  return (
    <section aria-labelledby="hero-title" className="home-hero relative isolate overflow-hidden bg-hero-surface">
      <div className="home-hero-inner mx-auto flex max-w-site-wide items-center px-4 sm:px-6">
        <div className="home-hero-copy relative z-10">
          <h1 id="hero-title" className="home-hero-title text-hero">
            <BlurText text={heroTitle} delay={110} direction="top" active={headerRevealActive} />{" "}
            <BlurText
              text={m.home_hero_emphasis()}
              delay={110}
              startIndex={heroTitleWordCount}
              direction="top"
              active={headerRevealActive}
              shiny
              className="block text-brand-text"
            />
          </h1>
          <div className="home-hero-smile-wrap" data-home-hero-smile-wrap="" aria-hidden>
            <AvidaSmile className="home-hero-smile" interactive playTrigger={smilePlayTrigger} />
          </div>
          <p className="home-hero-intro mt-4 max-w-lg text-body-lg text-muted-foreground">{m.home_hero_intro()}</p>
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
          {clinicDetails.phone && (
            <div className="home-hero-meta text-body-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <ClockIcon aria-hidden className="size-4 text-brand-gold" />
                {m.home_hero_hours_short()}
              </span>
              <span className="home-hero-meta-sep" aria-hidden />
              <SiteLink href={`tel:${clinicDetails.phone.number}`} className="home-hero-phone">
                <PhoneIcon aria-hidden className="size-4 text-brand-text" />
                <span>{m.home_hero_phone_prefix()}</span>
                <bdi dir="ltr" className="font-bold text-foreground tabular-nums">
                  {clinicDetails.phone.label()}
                </bdi>
              </SiteLink>
            </div>
          )}
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
        className="home-hero-photo home-hero-photo-light"
      />
      <img
        src={patientDark}
        srcSet={`${patientDark720} 720w, ${patientDark} 1264w`}
        sizes="(width < 48rem) 100vw, 68vw"
        width={1264}
        height={848}
        fetchPriority="high"
        alt={m.home_hero_image_alt()}
        className="home-hero-photo home-hero-photo-dark"
      />
      <div className="home-hero-river" aria-hidden="true">
        <svg
          className="home-hero-river-wave home-hero-river-wave-back"
          viewBox="0 0 2880 180"
          preserveAspectRatio="none"
        >
          <path d={HERO_RIVER_BACK_PATH} />
        </svg>
        <svg
          className="home-hero-river-wave home-hero-river-wave-mid"
          viewBox="0 0 2880 180"
          preserveAspectRatio="none"
        >
          <path d={HERO_RIVER_MID_PATH} />
        </svg>
        <svg
          className="home-hero-river-wave home-hero-river-wave-front"
          viewBox="0 0 2880 180"
          preserveAspectRatio="none"
        >
          <path d={HERO_RIVER_FRONT_PATH} />
          <path d={HERO_RIVER_FRONT_CREST_PATH} className="home-hero-river-crest" />
        </svg>
      </div>
    </section>
  );
}

/*===== Service Directory =====*/

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
    <section id={homeSections.services} aria-labelledby="services-title" className="home-section home-services-band">
      <div className="home-shell home-services-spread">
        <div className="home-services-lead">
          <div>
            <p className="home-kicker">{m.home_services_kicker()}</p>
            <h2 id="services-title" className="mt-2.5 text-section">
              {m.home_services_title()}
            </h2>
            <p className="mt-3 text-body-lg text-muted-foreground">{m.home_services_intro()}</p>
          </div>

          <div className="home-services-concierge home-glass-smoked">
            <p className="home-kicker home-kicker-dark">{m.home_appointment_kicker()}</p>
            <h3 className="mt-2 text-h3 text-brand-surface-foreground">{m.home_services_start_title()}</h3>
            <p className="mt-2 text-body-sm text-brand-surface-muted">{m.home_services_start_body()}</p>
            <a href={`#${homeSections.appointments}`} className="home-text-link home-text-link-dark mt-3">
              {m.home_services_start_action()}
              <ArrowLeftIcon className="size-4 ltr:rotate-180" aria-hidden />
            </a>
          </div>
        </div>

        {/* oxlint-disable-next-line jsx-a11y/no-redundant-roles -- WebKit can drop list semantics when markers are hidden. */}
        <ol className="home-services-stack home-glass-pane" role="list">
          {treatments.map(({ id, title, description, tags }, index) => {
            const tagItems = tags()
              .split("•")
              .map((part) => part.trim())
              .filter(Boolean);

            return (
              <li key={id} className="home-service-item">
                <span aria-hidden className="home-service-photo" />
                <span className="home-service-num tabular-nums" aria-hidden>
                  {formatNumber(index + 1).padStart(2, "۰")}
                </span>
                <div className="min-w-0">
                  <div className="home-service-head">
                    <h3 className="home-service-title text-h3 text-foreground">{title()}</h3>
                    <ul className="home-service-tags" aria-label={title()}>
                      {tagItems.map((tag) => (
                        <li key={tag} className="home-tag-chip text-caption">
                          {tag}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <p className="home-service-desc mt-1.5 text-body text-muted-foreground">{description()}</p>
                  {id === "children" && (
                    <a href={`#${homeSections.childVisit}`} className="home-text-link mt-1">
                      {m.home_child_visit_link()}
                      <ArrowLeftIcon className="size-4 ltr:rotate-180" aria-hidden />
                    </a>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
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
    credential: m.home_team_implant_credential,
    body: m.home_team_implant_body,
  },
  {
    id: "esthetic",
    title: m.home_team_esthetic_title,
    role: m.home_team_esthetic_role,
    credential: m.home_team_esthetic_credential,
    body: m.home_team_esthetic_body,
  },
  {
    id: "ortho",
    title: m.home_team_ortho_title,
    role: m.home_team_ortho_role,
    credential: m.home_team_ortho_credential,
    body: m.home_team_ortho_body,
  },
  {
    id: "family",
    title: m.home_team_family_title,
    role: m.home_team_family_role,
    credential: m.home_team_family_credential,
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

            <div className="home-practice-note home-glass-smoked">
              <h3 className="text-h3 text-brand-surface-foreground">{m.home_practice_reassurance_title()}</h3>
              <p className="mt-1.5 text-body text-brand-surface-muted">{m.home_practice_reassurance()}</p>
            </div>
          </div>

          <figure className="home-practice-media">
            <div className="home-glow-stage">
              <div className="home-photo-plate-wrap">
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
                <div className="home-photo-plate home-glass-smoked text-caption">
                  <span className="inline-flex items-center gap-2 font-semibold text-brand-surface-foreground">
                    <span className="home-glow-dot" aria-hidden />
                    {m.home_practice_plate_title()}
                  </span>
                  <span className="text-brand-surface-gold">{m.home_practice_plate_note()}</span>
                </div>
              </div>
            </div>
            <figcaption className="mt-3 text-caption text-brand-surface-muted">
              {m.home_practice_image_caption()}
            </figcaption>
          </figure>
        </div>

        {/*------ Interdisciplinary care smoked-glass bar ------*/}
        <div id={homeSections.team} className="home-disciplines">
          <div className="home-disciplines-head">
            <div>
              <p className="home-kicker home-kicker-dark">{m.home_team_kicker()}</p>
              <h3 className="mt-2 text-h2 text-brand-surface-foreground">{m.home_team_title()}</h3>
            </div>
            <p className="max-w-md text-body text-brand-surface-muted">{m.home_team_summary()}</p>
          </div>

          {/* oxlint-disable-next-line jsx-a11y/no-redundant-roles -- WebKit can drop list semantics when markers are hidden. */}
          <ol className="home-disciplines-bar home-glass-smoked" role="list">
            {careDisciplines.map(({ id, title, role, credential, body }, index) => (
              <li key={id} className="home-discipline-cell">
                <span className="home-discipline-num text-caption tabular-nums" aria-hidden>
                  {formatNumber(index + 1).padStart(2, "۰")}
                </span>
                <h4 className="mt-2.5 text-h3 text-brand-surface-foreground">{title()}</h4>
                <p className="mt-1 text-body-sm font-semibold text-brand-surface-gold">{role()}</p>
                <p className="home-doctor-credential mt-1.5 text-caption text-brand-surface-muted">{credential()}</p>
                <p className="mt-2.5 text-body-sm text-brand-surface-muted">{body()}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/*===== Patient Guide — Asymmetric Glass Diptych =====*/

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
    <section id={homeSections.visit} aria-labelledby="visit-title" className="home-section home-visit-band">
      <div className="home-shell">
        <div className="home-section-heading">
          <div>
            <p className="home-kicker">{m.home_visit_kicker()}</p>
            <h2 id="visit-title" className="mt-2.5 text-section">
              {m.home_visit_title()}
            </h2>
          </div>
          <p className="max-w-md text-body-lg text-muted-foreground">{m.home_visit_intro()}</p>
        </div>

        <div className="home-visit-spread">
          {/*------ Luminous frosted vertical visit timeline ------*/}
          <div className="home-visit-journey home-glass-pane">
            {/* oxlint-disable-next-line jsx-a11y/no-redundant-roles -- The custom step markers replace the native markers. */}
            <ol className="home-visit-timeline" role="list">
              {visitSteps.map(([title, description], index) => (
                <li key={title()} className="home-visit-stage">
                  <span aria-hidden className="home-visit-badge tabular-nums">
                    {formatNumber(index + 1).padStart(2, "۰")}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-h3 text-foreground">{title()}</h3>
                    <p className="mt-1.5 text-body text-muted-foreground">{description()}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/*------ Deep smoked-emerald preparation dossier ------*/}
          <div className="home-visit-prep-folio home-glass-smoked">
            {visitPreparation.map(({ title, items }) => (
              <div key={title()} className="home-prep-chapter">
                <h3 className="home-prep-chapter-title text-h4 text-brand-surface-foreground">
                  <span className="home-glow-dot" aria-hidden />
                  {title()}
                </h3>
                <ul className="home-prep-bullets text-body-sm text-brand-surface-muted">
                  {items.map((item) => (
                    <li key={item()}>{item()}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <HomeConsultationGuide />
      </div>
    </section>
  );
}

/*===== Common Questions =====*/

const questions = [
  [m.home_faq_records, m.home_faq_records_answer],
  [m.home_faq_insurance, m.home_faq_insurance_answer],
  [m.home_faq_implant_duration, m.home_faq_implant_duration_answer],
  [m.home_faq_cost, m.home_faq_cost_answer],
  [m.home_faq_sterilization, m.home_faq_sterilization_answer],
  [m.home_faq_anxiety, m.home_faq_anxiety_answer],
  [m.home_faq_unsure, m.home_faq_unsure_answer],
] as const;

export function HomeQuestions() {
  const { phone } = clinicDetails;

  return (
    <section
      id={homeSections.questions}
      aria-labelledby="questions-title"
      className="home-section home-questions-section"
    >
      <div className="home-shell home-questions">
        <div className="home-questions-intro">
          <p className="home-kicker">{m.home_faq_kicker()}</p>
          <h2 id="questions-title" className="mt-2.5 text-section">
            {m.home_faq_title()}
          </h2>
          <p className="mt-3 max-w-xs text-body-lg text-muted-foreground">{m.home_faq_intro()}</p>

          <div className="home-faq-companion home-glass-smoked max-w-xs">
            <p className="text-h4 text-brand-surface-foreground">{m.home_faq_companion_title()}</p>
            <p className="mt-1.5 text-body-sm text-brand-surface-muted">{m.home_faq_companion_body()}</p>
            {phone ? (
              <SiteLink href={`tel:${phone.number}`} className="home-text-link home-text-link-dark mt-2.5">
                <PhoneIcon className="size-4" aria-hidden />
                <span>{m.home_appointment_call()}</span>
                <bdi dir="ltr" className="tabular-nums">
                  {phone.label()}
                </bdi>
              </SiteLink>
            ) : (
              <a href={`#${homeSections.appointments}`} className="home-text-link home-text-link-dark mt-2.5">
                {m.home_appointment_plan()}
                <ArrowLeftIcon className="size-4 ltr:rotate-180" aria-hidden />
              </a>
            )}
          </div>
        </div>

        <div className="home-faq-panel home-glass-pane">
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
