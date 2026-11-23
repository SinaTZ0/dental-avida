import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";

import { buttonVariants } from "#/components/primitive/button/button.styles";
import { pageMeta } from "#/lib/seo";
import { m } from "#/paraglide/messages";

/*===== Route =====*/

export const Route = createFileRoute("/_site-layout/privacy")({
  head: (args) =>
    pageMeta({
      args,
      title: m.privacy_meta_title(),
      description: m.privacy_meta_description(),
    }),
  component: PrivacyPage,
});

/*===== Page =====*/

const SECTIONS = [
  { title: m.privacy_section_collect_title, body: m.privacy_section_collect_body },
  { title: m.privacy_section_use_title, body: m.privacy_section_use_body },
  { title: m.privacy_section_security_title, body: m.privacy_section_security_body },
  { title: m.privacy_section_rights_title, body: m.privacy_section_rights_body },
] as const;

function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6 md:py-20">
      <header className="space-y-4 border-b border-border pb-8">
        <p className="text-kicker text-brand-text">{m.privacy_kicker()}</p>
        <h1 className="text-h1 text-foreground">{m.privacy_title()}</h1>
        <p className="text-body-lg text-muted-foreground">{m.privacy_intro()}</p>
      </header>

      <div className="divide-y divide-border">
        {SECTIONS.map((section) => (
          <section key={section.title()} className="space-y-2 py-7">
            <h2 className="text-h3 text-foreground">{section.title()}</h2>
            <p className="text-body text-muted-foreground">{section.body()}</p>
          </section>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 border-t border-border pt-8">
        <Link to="/black-friday" className={buttonVariants({ variant: "default" })}>
          <span>{m.privacy_back_campaign()}</span>
          <ArrowLeftIcon aria-hidden data-icon="inline-end" />
        </Link>
        <Link to="/" className={buttonVariants({ variant: "outline" })}>
          {m.root_go_home()}
        </Link>
      </div>
    </article>
  );
}
