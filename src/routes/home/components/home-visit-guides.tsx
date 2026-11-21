import {
  ArrowLeftIcon,
  CircleHelpIcon,
  ClipboardCheckIcon,
  MessageCircleIcon,
  MessagesSquareIcon,
  ShieldPlusIcon,
  SparklesIcon,
} from "lucide-react";

import { buttonVariants } from "#/components/primitive/button/button.styles";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/primitive/tabs/tabs";
import { homeSections } from "#/lib/site";
import { m } from "#/paraglide/messages";
import consultationPhoto from "#/routes/home/assets/consultation-banner.webp";
import questionsTooth from "#/routes/home/assets/questions-tooth.webp";

/*===== Consultation and FAQ banner =====*/

export function HomeConsultationBanner() {
  return (
    <section aria-label={m.home_consultation_banner_label()} className="home-shell home-consultation-banner">
      <img
        src={consultationPhoto}
        width={900}
        height={600}
        loading="lazy"
        decoding="async"
        alt={m.home_consultation_image_alt()}
        className="home-consultation-photo"
      />

      <div className="home-consultation-copy">
        <h2 className="max-w-52 text-h2 text-balance">{m.home_consultation_banner_title()}</h2>
        <p className="max-w-64 text-body-sm text-brand-surface-foreground">{m.home_consultation_banner_intro()}</p>
        <a href="#consultation-guide" className={buttonVariants({ variant: "consultation", size: "pill" })}>
          <MessagesSquareIcon aria-hidden />
          {m.home_consultation_banner_action()}
        </a>
      </div>

      <div className="home-consultation-faq">
        <img src={questionsTooth} width={400} height={370} alt="" loading="lazy" decoding="async" />
        <div className="home-consultation-faq-copy">
          <h2 className="text-h2">{m.home_consultation_faq_title()}</h2>
          <p className="max-w-64 text-body-sm text-muted-foreground">{m.home_consultation_faq_intro()}</p>
          <a
            href={`#${homeSections.questions}`}
            className={buttonVariants({ variant: "consultation-outline", size: "pill" })}
          >
            <CircleHelpIcon aria-hidden />
            {m.home_consultation_faq_action()}
          </a>
        </div>
      </div>
    </section>
  );
}

/*===== Consultation prompts =====*/

const consultationTopics = [
  {
    id: "checkup",
    title: m.home_consultation_checkup,
    icon: ClipboardCheckIcon,
    prompts: [m.home_consultation_checkup_priority, m.home_consultation_checkup_followup],
  },
  {
    id: "restoration",
    title: m.home_consultation_restoration,
    icon: ShieldPlusIcon,
    prompts: [m.home_consultation_restoration_options, m.home_consultation_restoration_sessions],
  },
  {
    id: "cosmetic",
    title: m.home_consultation_cosmetic,
    icon: SparklesIcon,
    prompts: [m.home_consultation_cosmetic_outcome, m.home_consultation_cosmetic_care],
  },
] as const;

export function HomeConsultationGuide() {
  return (
    <section id="consultation-guide" aria-labelledby="consultation-title" className="home-consultation-guide">
      <div className="home-consultation-guide-intro">
        <MessagesSquareIcon className="size-6" aria-hidden />
        <h3 id="consultation-title" className="text-h2">
          {m.home_consultation_title()}
        </h3>
        <p className="text-body">{m.home_consultation_intro()}</p>
      </div>

      <Tabs variant="guide" className="min-w-0" defaultValue={consultationTopics[0].id}>
        <TabsList variant="guide" aria-label={m.home_consultation_topics()} className="w-full" activateOnFocus>
          {consultationTopics.map(({ id, title, icon: Icon }) => (
            <TabsTrigger key={id} value={id}>
              <Icon aria-hidden />
              {title()}
            </TabsTrigger>
          ))}
        </TabsList>
        {consultationTopics.map(({ id, prompts }) => (
          <TabsContent key={id} value={id}>
            {/* oxlint-disable-next-line jsx-a11y/no-redundant-roles -- WebKit can drop list semantics when markers are hidden. */}
            <ul className="home-consultation-prompts text-body-lg" role="list">
              {prompts.map((prompt) => (
                <li key={prompt()}>
                  <span className="home-consultation-prompt-icon">
                    <MessageCircleIcon className="size-4" aria-hidden />
                  </span>
                  <span>{prompt()}</span>
                </li>
              ))}
            </ul>
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
