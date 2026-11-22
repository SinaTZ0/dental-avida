import { CheckIcon } from "lucide-react";
import { type CSSProperties, useState } from "react";

import { Button } from "#/components/primitive/button/button";
import { Slider } from "#/components/primitive/slider/slider";
import { formatNumber } from "#/lib/locale";
import { homeSections } from "#/lib/site";
import { m } from "#/paraglide/messages";
import implantAfter from "#/routes/home/assets/implant-after.webp";
import implantBefore from "#/routes/home/assets/implant-before.webp";
import veneersAfter from "#/routes/home/assets/veneers-after.webp";
import veneersBefore from "#/routes/home/assets/veneers-before.webp";
import whiteningAfter from "#/routes/home/assets/whitening-after.webp";
import whiteningBefore from "#/routes/home/assets/whitening-before.webp";

/*===== Treatment examples =====*/

const examples = [
  {
    id: "implant",
    title: m.home_results_implants,
    change: m.home_results_implants_change,
    before: implantBefore,
    after: implantAfter,
  },
  {
    id: "veneers",
    title: m.home_results_veneers,
    change: m.home_results_veneers_change,
    before: veneersBefore,
    after: veneersAfter,
  },
  {
    id: "whitening",
    title: m.home_results_whitening,
    change: m.home_results_whitening_change,
    before: whiteningBefore,
    after: whiteningAfter,
  },
] as const;

/*===== Before and after =====*/

export function HomeTreatmentResults() {
  const [selected, setSelected] = useState(0);
  const example = examples[selected]!;

  return (
    <section
      id={homeSections.results}
      aria-labelledby="treatment-results-title"
      className="home-section home-results bg-hero-surface"
    >
      <div className="home-shell home-results-shell">
        <figure>
          <div className="home-results-layout">
            <div className="home-results-selector">
              <div>
                <p className="home-kicker home-kicker-dark">{m.home_results_kicker()}</p>
                <h2 id="treatment-results-title" className="mt-2.5 text-h2">
                  {m.home_results_title()}
                </h2>
                <p className="home-results-intro mt-2 text-body-sm text-brand-surface-muted">
                  {m.home_results_intro()}
                </p>
              </div>
              <fieldset className="min-w-0">
                <legend className="sr-only">{m.home_results_treatments()}</legend>
                <div className="home-results-choices">
                  {examples.map(({ id, title }, index) => (
                    <Button
                      key={id}
                      variant="choice"
                      size="choice"
                      aria-pressed={index === selected}
                      onClick={() => setSelected(index)}
                    >
                      <span className="home-results-choice-num text-caption tabular-nums" aria-hidden>
                        {formatNumber(index + 1).padStart(2, "۰")}
                      </span>
                      <span>{title()}</span>
                      {index === selected && <CheckIcon className="ms-auto hidden size-4 md:block" aria-hidden />}
                    </Button>
                  ))}
                </div>
              </fieldset>
            </div>
            <TreatmentComparison key={example.id} example={example} />
          </div>
          <figcaption className="home-results-caption">
            <span aria-live="polite" className="text-body font-medium text-foreground">
              {example.change()}
            </span>
            <span className="text-caption text-muted-foreground">{m.home_results_illustration()}</span>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

function TreatmentComparison({ example }: { example: (typeof examples)[number] }) {
  const [position, setPosition] = useState(50);

  return (
    <div className="home-results-frame" style={{ "--comparison-split": `${position}%` } as CSSProperties}>
      <div aria-hidden className="home-results-image">
        <img src={example.after} alt="" loading="lazy" decoding="async" />
        <span hidden={position > 68} className="home-results-tag home-results-tag-after text-caption">
          {m.home_results_after()}
        </span>
        <div className="home-results-before">
          <img src={example.before} alt="" loading="lazy" decoding="async" />
          <span hidden={position < 32} className="home-results-tag home-results-tag-before text-caption">
            {m.home_results_before()}
          </span>
        </div>
      </div>
      <Slider
        variant="comparison"
        className="absolute inset-0"
        label={m.home_results_comparison({ treatment: example.title() })}
        value={position}
        onValueChange={setPosition}
      />
    </div>
  );
}
