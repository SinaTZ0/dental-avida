import { Link } from "@tanstack/react-router";

import { homeSections } from "#/lib/site";
import { m } from "#/paraglide/messages";

/*===== Site Footer =====*/

const footerSections = [
  [homeSections.services, m.nav_services],
  [homeSections.practice, m.nav_practice],
  [homeSections.visit, m.nav_visit],
  [homeSections.questions, m.nav_questions],
] as const;

export function SiteFooter() {
  return (
    <footer className="bg-brand-surface text-brand-surface-foreground">
      <div className="mx-auto flex max-w-site flex-wrap items-center justify-between gap-x-10 gap-y-4 px-4 py-9 sm:px-6 sm:py-12">
        <div>
          <p className="text-h3">{m.site_name()}</p>
          <p className="mt-1 text-body text-brand-surface-muted">{m.site_footer_description()}</p>
        </div>
        <nav aria-label={m.nav_footer()}>
          <ul className="flex flex-wrap gap-x-5">
            {footerSections.map(([hash, label]) => (
              <li key={hash}>
                <Link
                  to="/"
                  hash={hash}
                  className="inline-flex min-h-10 items-center rounded-sm text-nav underline-offset-4 hover:underline focus-visible:outline-brand-surface-foreground"
                >
                  {label()}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
