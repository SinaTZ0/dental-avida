import { m } from "#/paraglide/messages";

/*===== Homepage Navigation =====*/

export const homeSections = {
  appointments: "appointments",
  services: "services",
  implantShowcase: "implant-showcase",
  results: "results",
  technology: "technology",
  practice: "practice",
  team: "team",
  visit: "visit",
  childVisit: "child-visit",
  questions: "questions",
} as const;

/*===== Clinic Details =====*/

type ClinicDetails = {
  location: { address: () => string; shortAddress: () => string; mapUrl?: string } | null;
  phone: { number: string; label: () => string } | null;
  hours: (() => string) | null;
  bookingUrl: string | null;
  reviews: { url?: string; rating: { score: number; count: number } } | null;
};

/** Published clinic details (ready-to-edit Tehran flagship details for Avida Dental). */
export const clinicDetails: ClinicDetails = {
  location: {
    address: m.site_clinic_address,
    shortAddress: m.site_clinic_short_address,
    mapUrl: "https://maps.google.com/?q=35.7644,51.4184",
  },
  phone: {
    number: "+982122048610",
    label: m.site_clinic_phone_label,
  },
  hours: m.site_clinic_hours,
  bookingUrl: null,
  reviews: {
    rating: { score: 4.9, count: 240 },
  },
};

/*===== Site =====*/
// Browser-safe identity values for page titles and link previews. The site's name and default description are the
// `site_name` and `site_description` messages, one per locale; rename them per project (docs/frontend/seo.md).

/**
 * The default link-preview image: a 1200×630 file in `public/`, e.g. `{ url: "/og.png", alt: m.site_image_alt() }`.
 * Previews show text only until a project adds one. A function, so its `alt` message is read in each request's locale.
 */
export function siteImage(): { url: string; alt: string } | null {
  return null;
}

/** `<title>` for a page: «Page | Site», or just the site name for the home page. */
export function pageTitle(page?: string): string {
  return page ? `${page} | ${m.site_name()}` : m.site_name();
}
