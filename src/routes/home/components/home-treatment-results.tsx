import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, GemIcon, ScanLineIcon, SparklesIcon } from "lucide-react";
import { type CSSProperties, useState } from "react";

import { Button } from "#/components/primitive/button/button";
import { Slider } from "#/components/primitive/slider/slider";
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
    icon: ScanLineIcon,
    before: implantBefore,
    after: implantAfter,
  },
  {
    id: "veneers",
    title: m.home_results_veneers,
    change: m.home_results_veneers_change,
    icon: GemIcon,
    before: veneersBefore,
    after: veneersAfter,
  },
  {
    id: "whitening",
    title: m.home_results_whitening,
    change: m.home_results_whitening_change,
    icon: SparklesIcon,
    before: whiteningBefore,
    after: whiteningAfter,
  },
] as const;

/*===== Before and after =====*/

export function HomeTreatmentResults() {
  const [selected, setSelected] = useState(0);
  const example = examples[selected]!;

  function move(offset: number) {
    setSelected((current) => (current + offset + examples.length) % examples.length);
  }

  return (
    <section aria-labelledby="treatment-results-title" className="home-section bg-hero-surface porcelain-grain">
      <div className="home-shell home-results-shell">
        <div className="home-results-heading">
          <h2 id="treatment-results-title" className="text-section">
            {m.home_results_title()}
          </h2>
          <p className="mt-2 text-body-lg text-muted-foreground">{m.home_results_intro()}</p>
        </div>

        <div className="home-results-layout">
          <fieldset className="home-results-treatments min-w-0">
            <legend className="sr-only">{m.home_results_treatments()}</legend>
            <div className="home-results-choices">
              {examples.map(({ id, title, icon: Icon }, index) => (
                <Button
                  key={id}
                  variant="choice"
                  size="choice"
                  aria-pressed={index === selected}
                  onClick={() => setSelected(index)}
                >
                  <Icon aria-hidden />
                  {title()}
                  {index === selected && <CheckIcon className="ms-auto hidden size-4 md:block" aria-hidden />}
                </Button>
              ))}
            </div>
          </fieldset>
          <figure className="home-results-figure min-w-0">
            <TreatmentComparison key={example.id} example={example} />
            <figcaption className="mt-3 text-body-sm text-muted-foreground">
              <span className="sr-only" aria-live="polite">
                {example.change()}
              </span>
              {m.home_results_illustration()}
            </figcaption>
          </figure>
          <div className="home-results-arrows">
            <Button variant="outline" size="icon-lg" aria-label={m.home_results_previous()} onClick={() => move(-1)}>
              <ArrowRightIcon aria-hidden className="size-5 ltr:rotate-180" />
            </Button>
            <Button variant="outline" size="icon-lg" aria-label={m.home_results_next()} onClick={() => move(1)}>
              <ArrowLeftIcon aria-hidden className="size-5 ltr:rotate-180" />
            </Button>
          </div>
        </div>
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
        <span hidden={position > 68} className="home-results-tag home-results-tag-after text-body-sm">
          {m.home_results_after()}
        </span>
        <div className="home-results-before">
          <img src={example.before} alt="" loading="lazy" decoding="async" />
          <span hidden={position < 32} className="home-results-tag home-results-tag-before text-body-sm">
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
