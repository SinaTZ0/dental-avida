import { createFileRoute } from "@tanstack/react-router";

import { absoluteUrl, jsonLd, pageMeta } from "#/lib/seo";
import { m } from "#/paraglide/messages";
import { localizeHref } from "#/paraglide/runtime";
import { HomeHero, HomePractice, HomeQuestions, HomeServices, HomeVisit } from "#/routes/home/components/home-content";
import { HomeTreatmentResults } from "#/routes/home/components/home-treatment-results";
import { HomeChildVisit, HomeConsultationGuide } from "#/routes/home/components/home-visit-guides";
import "#/routes/home/home.css";

/*===== Route =====*/

export const Route = createFileRoute("/_site-layout/")({
  head: (args) => ({
    ...pageMeta({ args }),
    scripts: [
      jsonLd({
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: m.site_name(),
        url: absoluteUrl({ matches: args.matches, path: localizeHref("/") }),
      }),
    ],
  }),
  component: Home,
});

/*===== Home =====*/

function Home() {
  return (
    <>
      <HomeHero />
      <HomeServices />
      <HomeTreatmentResults />
      <HomePractice />
      <HomeVisit />
      <HomeConsultationGuide />
      <HomeChildVisit />
      <HomeQuestions />
    </>
  );
}
