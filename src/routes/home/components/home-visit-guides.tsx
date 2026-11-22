import { ArrowLeftIcon } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/primitive/tabs/tabs";
import { formatNumber } from "#/lib/locale";
import { homeSections } from "#/lib/site";
import { m } from "#/paraglide/messages";
import consultationEditorial from "#/routes/home/assets/consultation-editorial.webp";

/*===== Consultation prompts =====*/

const consultationTopics = [
  {
    id: "checkup",
    title: m.home_consultation_checkup,
    prompts: [
      m.home_consultation_checkup_priority,
      m.home_consultation_checkup_followup,
      m.home_consultation_checkup_prevention,
    ],
  },
  {
    id: "implants",
    title: m.home_consultation_implants,
    prompts: [
      m.home_consultation_implants_readiness,
      m.home_consultation_implants_timeline,
      m.home_consultation_implants_crown,
    ],
  },
  {
    id: "restoration",
    title: m.home_consultation_restoration,
    prompts: [
      m.home_consultation_restoration_options,
      m.home_consultation_restoration_sessions,
      m.home_consultation_restoration_durability,
    ],
  },
  {
    id: "cosmetic",
    title: m.home_consultation_cosmetic,
    prompts: [
      m.home_consultation_cosmetic_outcome,
      m.home_consultation_cosmetic_care,
      m.home_consultation_cosmetic_preserve,
    ],
  },
] as const;

export function HomeConsultationGuide() {
  return (
    <section id="consultation-guide" aria-labelledby="consultation-title" className="home-consultation-guide">
      <div className="home-consultation-guide-intro">
        <img
          src={consultationEditorial}
          width={1080}
          height={806}
          loading="lazy"
          decoding="async"
          alt={m.home_consultation_image_alt()}
          className="home-consultation-guide-photo"
        />
        <div className="home-consultation-guide-copy">
          <h3 id="consultation-title" className="text-h2 text-brand-surface-foreground">
            {m.home_consultation_title()}
          </h3>
          <p className="mt-2 text-body-sm text-brand-surface-muted">{m.home_consultation_intro()}</p>
        </div>
      </div>

      <Tabs variant="guide" className="min-w-0" defaultValue={consultationTopics[0].id}>
        <TabsList variant="guide" aria-label={m.home_consultation_topics()} className="w-full" activateOnFocus>
          {consultationTopics.map(({ id, title }) => (
            <TabsTrigger key={id} value={id}>
              {title()}
            </TabsTrigger>
          ))}
        </TabsList>
        {consultationTopics.map(({ id, prompts }) => (
          <TabsContent key={id} value={id}>
            {/* oxlint-disable-next-line jsx-a11y/no-redundant-roles -- WebKit can drop list semantics when markers are hidden. */}
            <ol className="home-consultation-prompts" role="list">
              {prompts.map((prompt, index) => (
                <li key={prompt()} className="home-consultation-prompt">
                  <span className="home-consultation-prompt-num tabular-nums" aria-hidden>
                    {formatNumber(index + 1).padStart(2, "۰")}
                  </span>
                  <span className="text-body-lg text-foreground">{prompt()}</span>
                </li>
              ))}
            </ol>
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}

/*===== A child's first visit =====*/

const childVisitSteps = [
  [m.home_child_visit_before, m.home_child_visit_before_description],
  [m.home_child_visit_at_clinic, m.home_child_visit_at_clinic_description],
  [m.home_child_visit_after, m.home_child_visit_after_description],
] as const;

export function HomeChildVisit() {
  return (
    <section id={homeSections.childVisit} aria-labelledby="child-visit-title" className="home-section home-child-visit">
      <div className="home-shell home-child-visit-layout">
        <div className="home-child-visit-intro">
          <p className="home-kicker">{m.home_child_visit_kicker()}</p>
          <h2 id="child-visit-title" className="mt-2.5 text-section">
            {m.home_child_visit_title()}
          </h2>
          <p className="mt-3 max-w-sm text-body-lg text-muted-foreground">{m.home_child_visit_intro()}</p>
          <a href={`#${homeSections.visit}`} className="home-text-link mt-3">
            {m.home_plan_visit()}
            <ArrowLeftIcon className="size-4 ltr:rotate-180" aria-hidden />
          </a>
        </div>

        {/* oxlint-disable-next-line jsx-a11y/no-redundant-roles -- The timeline replaces the native markers. */}
        <ol className="home-child-visit-steps" role="list">
          {childVisitSteps.map(([title, description]) => (
            <li key={title()}>
              <h3 className="text-h3 text-foreground">{title()}</h3>
              <p className="mt-1.5 text-body text-muted-foreground">{description()}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
