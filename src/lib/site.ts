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

type ClinicPhone = { number: string; label: () => string };

type ClinicDetails = {
  location: { address: () => string; shortAddress: () => string; mapUrl?: string } | null;
  phone: ClinicPhone | null;
  mobile: ClinicPhone | null;
  hours: (() => string) | null;
  bookingUrl: string | null;
  reviews: { url?: string; rating: { score: number; count: number } } | null;
};

/** Published clinic details for Avida Dental (Gorgan, Edalat 11). */
export const clinicDetails: ClinicDetails = {
  location: {
    address: m.site_clinic_address,
    shortAddress: m.site_clinic_short_address,
    mapUrl:
      "https://www.google.com/maps/search/?api=1&query=%DA%AF%D8%B1%DA%AF%D8%A7%D9%86+%D8%B9%D8%AF%D8%A7%D9%84%D8%AA+11+%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9+%D8%A2%D9%88%DB%8C%D8%AF%D8%A7",
  },
  phone: {
    number: "+981732356800",
    label: m.site_clinic_phone_label,
  },
  mobile: {
    number: "+989114845030",
    label: m.site_clinic_mobile_label,
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
