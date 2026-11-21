import { ArrowLeftIcon, MessageCircleIcon } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/primitive/tabs/tabs";
import { homeSections } from "#/lib/site";
import { m } from "#/paraglide/messages";
import consultation720 from "#/routes/home/assets/consultation-720.webp";
import consultation from "#/routes/home/assets/consultation.webp";

/*===== Consultation prompts =====*/

const consultationTopics = [
  {
    id: "checkup",
    title: m.home_consultation_checkup,
    prompts: [m.home_consultation_checkup_priority, m.home_consultation_checkup_followup],
  },
  {
    id: "restoration",
    title: m.home_consultation_restoration,
    prompts: [m.home_consultation_restoration_options, m.home_consultation_restoration_sessions],
  },
  {
    id: "cosmetic",
    title: m.home_consultation_cosmetic,
    prompts: [m.home_consultation_cosmetic_outcome, m.home_consultation_cosmetic_care],
  },
] as const;

export function HomeConsultationGuide() {
  return (
    <section aria-labelledby="consultation-title" className="home-section home-shell home-consultation">
      <div className="min-w-0">
        <h2 id="consultation-title" className="text-section">
          {m.home_consultation_title()}
        </h2>
        <p className="mt-3 max-w-md text-body-lg text-muted-foreground">{m.home_consultation_intro()}</p>

        <Tabs className="mt-5" defaultValue={consultationTopics[0].id}>
          <TabsList aria-label={m.home_consultation_topics()} className="max-w-full" activateOnFocus>
            {consultationTopics.map(({ id, title }) => (
              <TabsTrigger key={id} value={id}>
                {title()}
              </TabsTrigger>
            ))}
          </TabsList>
          {consultationTopics.map(({ id, prompts }) => (
            <TabsContent key={id} value={id} className="mt-2">
              {/* oxlint-disable-next-line jsx-a11y/no-redundant-roles -- WebKit can drop list semantics when markers are hidden. */}
              <ul className="home-consultation-prompts text-body-lg" role="list">
                {prompts.map((prompt) => (
                  <li key={prompt()}>
                    <MessageCircleIcon className="mt-1 size-5 shrink-0" aria-hidden />
                    {prompt()}
                  </li>
                ))}
              </ul>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <figure>
        <img
          src={consultation}
          srcSet={`${consultation720} 720w, ${consultation} 1440w`}
          sizes="(min-width: 75rem) 33rem, (min-width: 48rem) 46vw, calc(100vw - 2rem)"
          width={1440}
          height={960}
          loading="lazy"
          decoding="async"
          alt={m.home_consultation_image_alt()}
          className="home-consultation-photo"
        />
        <figcaption className="mt-2 text-caption text-muted-foreground">
          {m.home_consultation_image_caption()}
        </figcaption>
      </figure>
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
    <section
      id={homeSections.childVisit}
      aria-labelledby="child-visit-title"
      className="home-section home-child-visit porcelain-grain"
    >
      <div className="home-shell home-child-visit-layout">
        <div className="home-child-visit-intro">
          <h2 id="child-visit-title" className="text-section">
            {m.home_child_visit_title()}
          </h2>
          <p className="mt-3 max-w-sm text-body-lg text-muted-foreground">{m.home_child_visit_intro()}</p>
          <a href={`#${homeSections.visit}`} className="home-text-link mt-3">
            {m.home_plan_visit()}
            <ArrowLeftIcon className="size-4 ltr:rotate-180" aria-hidden />
          </a>
          <span className="home-smile home-child-visit-smile" aria-hidden />
        </div>

        {/* oxlint-disable-next-line jsx-a11y/no-redundant-roles -- The timeline replaces the native markers. */}
        <ol className="home-child-visit-steps" role="list">
          {childVisitSteps.map(([title, description]) => (
            <li key={title()}>
              <h3 className="text-h3">{title()}</h3>
              <p className="mt-1 text-body text-muted-foreground">{description()}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
