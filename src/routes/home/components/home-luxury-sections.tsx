import { Link } from "@tanstack/react-router";
import { ArrowLeftIcon, CalendarDaysIcon } from "lucide-react";

import { buttonVariants } from "#/components/primitive/button/button.styles";
import { formatNumber } from "#/lib/locale";
import { homeSections } from "#/lib/site";
import { m } from "#/paraglide/messages";
import implantShowcase from "#/routes/home/assets/implant-showcase.webp";
import technologySuite from "#/routes/home/assets/technology-suite.webp";

/*===== Clinic Highlights Smoked-Emerald Dock =====*/

const highlights = [
  {
    id: "digital",
    title: m.home_highlight_digital_title,
    body: m.home_highlight_digital_body,
  },
  {
    id: "sterile",
    title: m.home_highlight_sterile_title,
    body: m.home_highlight_sterile_body,
  },
  {
    id: "transparent",
    title: m.home_highlight_transparent_title,
    body: m.home_highlight_transparent_body,
  },
  {
    id: "comfort",
    title: m.home_highlight_comfort_title,
    body: m.home_highlight_comfort_body,
  },
] as const;

export function HomeHighlights() {
  return (
    <section aria-label={m.home_highlights_label()} className="home-dock-wrap home-shell">
      {/* oxlint-disable-next-line jsx-a11y/no-redundant-roles -- WebKit can drop list semantics when markers are hidden. */}
      <ol className="home-dock home-glass-smoked" role="list">
        {highlights.map(({ id, title, body }, index) => (
          <li key={id} className="home-dock-cell">
            <span className="home-discipline-num text-caption tabular-nums" aria-hidden>
              {formatNumber(index + 1).padStart(2, "۰")}
            </span>
            <h2 className="mt-2 text-h4 text-brand-surface-foreground">{title()}</h2>
            <p className="mt-1 text-body-sm text-brand-surface-muted">{body()}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

/*===== Implant & Smile Luxury Showcase =====*/

const implantPillars = [
  {
    id: "scan",
    title: m.home_implant_pillar_scan_title,
    body: m.home_implant_pillar_scan_body,
  },
  {
    id: "material",
    title: m.home_implant_pillar_material_title,
    body: m.home_implant_pillar_material_body,
  },
  {
    id: "timeline",
    title: m.home_implant_pillar_timeline_title,
    body: m.home_implant_pillar_timeline_body,
  },
  {
    id: "followup",
    title: m.home_implant_pillar_followup_title,
    body: m.home_implant_pillar_followup_body,
  },
] as const;

export function HomeImplantShowcase() {
  return (
    <section
      id={homeSections.implantShowcase}
      aria-labelledby="implant-showcase-title"
      className="home-section home-implant-section bg-brand-surface text-brand-surface-foreground"
    >
      <div className="home-shell home-implant-layout">
        <div className="home-implant-copy">
          <p className="home-kicker home-kicker-dark">{m.home_implant_kicker()}</p>
          <h2 id="implant-showcase-title" className="mt-3 text-section">
            {m.home_implant_title()}
          </h2>
          <p className="mt-4 text-body-lg text-brand-surface-muted">{m.home_implant_intro()}</p>

          {/* oxlint-disable-next-line jsx-a11y/no-redundant-roles -- WebKit can drop list semantics when markers are hidden. */}
          <ol className="home-implant-pillars-slab home-glass-smoked" role="list">
            {implantPillars.map(({ id, title, body }, index) => (
              <li key={id} className="home-implant-pillar-cell">
                <div className="home-implant-pillar-head">
                  <span className="home-implant-index text-caption tabular-nums" aria-hidden>
                    {formatNumber(index + 1).padStart(2, "۰")}
                  </span>
                  <h3 className="text-h4 text-brand-surface-foreground">{title()}</h3>
                </div>
                <p className="mt-1.5 text-body-sm text-brand-surface-muted">{body()}</p>
              </li>
            ))}
          </ol>

          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
            <Link
              to="/"
              hash={homeSections.appointments}
              className={buttonVariants({ variant: "consultation", size: "hero" })}
            >
              <CalendarDaysIcon data-icon="inline-start" aria-hidden />
              {m.home_implant_cta_book()}
            </Link>
            <a href={`#${homeSections.results}`} className="home-text-link home-text-link-dark">
              {m.home_implant_cta_results()}
              <ArrowLeftIcon className="size-4 ltr:rotate-180" aria-hidden />
            </a>
          </div>
        </div>

        <figure className="home-implant-media">
          <div className="home-glow-stage">
            <div className="home-photo-plate-wrap">
              <img
                src={implantShowcase}
                width={1200}
                height={896}
                loading="lazy"
                decoding="async"
                alt={m.home_implant_image_alt()}
                className="home-implant-photo"
              />
              <div className="home-photo-plate home-glass-smoked text-caption">
                <span className="inline-flex items-center gap-2 font-semibold text-brand-surface-foreground">
                  <span className="home-glow-dot" aria-hidden />
                  {m.home_implant_plate_title()}
                </span>
                <span className="text-brand-surface-gold">{m.home_implant_plate_note()}</span>
              </div>
            </div>
          </div>
          <figcaption className="mt-3 text-caption text-brand-surface-muted">
            {m.home_implant_image_caption()}
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

/*===== Digital Technology & Hygiene Standards =====*/

const techFeatures = [
  {
    id: "scanner",
    title: m.home_tech_scanner_title,
    body: m.home_tech_scanner_body,
  },
  {
    id: "imaging",
    title: m.home_tech_imaging_title,
    body: m.home_tech_imaging_body,
  },
  {
    id: "sterile",
    title: m.home_tech_sterile_title,
    body: m.home_tech_sterile_body,
  },
  {
    id: "gentle",
    title: m.home_tech_gentle_title,
    body: m.home_tech_gentle_body,
  },
] as const;

export function HomeTechnology() {
  return (
    <section id={homeSections.technology} aria-labelledby="technology-title" className="home-section home-tech-section">
      <div className="home-shell">
        <div className="home-section-heading">
          <div>
            <p className="home-kicker">{m.home_tech_kicker()}</p>
            <h2 id="technology-title" className="mt-2.5 text-section">
              {m.home_tech_title()}
            </h2>
          </div>
          <p className="max-w-md text-body-lg text-muted-foreground">{m.home_tech_intro()}</p>
        </div>

        <div className="home-tech-overlap">
          <figure className="home-tech-media">
            <div className="home-tech-photo-stage">
              <img
                src={technologySuite}
                width={1200}
                height={896}
                loading="lazy"
                decoding="async"
                alt={m.home_tech_image_alt()}
                className="home-tech-photo"
              />
            </div>
            <figcaption className="mt-3 text-caption text-muted-foreground">{m.home_tech_image_caption()}</figcaption>
          </figure>

          {/* oxlint-disable-next-line jsx-a11y/no-redundant-roles -- WebKit can drop list semantics when markers are hidden. */}
          <ol className="home-tech-glass-panel home-glass-pane" role="list">
            {techFeatures.map(({ id, title, body }, index) => (
              <li key={id} className="home-tech-glass-row">
                <span className="home-tech-num tabular-nums" aria-hidden>
                  {formatNumber(index + 1).padStart(2, "۰")}
                </span>
                <div className="min-w-0">
                  <h3 className="text-h3 text-foreground">{title()}</h3>
                  <p className="mt-1 text-body text-muted-foreground">{body()}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
