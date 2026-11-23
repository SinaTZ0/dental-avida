import { suppressCampaignModalScript } from "../../tools/auth-helper.mjs";

export const shots = [
  {
    id: "home-carousel",
    url: "/",
    viewport: { width: 1366, height: 860 },
    initScript: suppressCampaignModalScript,
    clip: "viewport",
    marks: [
      { n: 1, target: ".campaign-ribbon", at: "end" },
      { n: 2, target: ".home-hero-copy", at: "end" },
      { n: 3, target: ".home-hero-carousel-dock", at: "end" },
    ],
  },
  {
    id: "bf-hero-countdown",
    url: "/black-friday",
    viewport: { width: 1366, height: 860 },
    initScript: suppressCampaignModalScript,
    clip: "viewport",
    marks: [
      { n: 1, target: 'a[href="#campaign-lead-form"]' },
      { n: 2, target: ".bf-impact-band", at: "end" },
    ],
  },
  {
    id: "bf-discounts-terms",
    url: "/black-friday",
    viewport: { width: 1366, height: 960 },
    initScript: suppressCampaignModalScript,
    scrollTo: "#bf-discounts-title",
    clip: ['section[aria-labelledby="bf-discounts-title"]', 'section[aria-labelledby="bf-terms-title"]'],
    wide: true,
    pad: 16,
    marks: [
      { n: 1, target: "#bf-discounts-title", at: "end" },
      { n: 2, target: "#bf-terms-title", at: "end" },
    ],
  },
  {
    id: "bf-lead-form",
    url: "/black-friday",
    viewport: { width: 1366, height: 820 },
    initScript: suppressCampaignModalScript,
    scrollTo: "#campaign-lead-form",
    clip: "#campaign-lead-form",
    wide: true,
    pad: 12,
    marks: [
      { n: 1, target: '#campaign-lead-form input[autocomplete="name"]', at: "end" },
      { n: 2, target: '#campaign-lead-form input[autocomplete="tel"]', at: "end" },
      { n: 3, target: '#campaign-lead-form [role="combobox"]', at: "end" },
      { n: 4, target: '#campaign-lead-form a[href="/privacy"]', at: "end" },
      { n: 5, target: '#campaign-lead-form button[type="submit"]' },
    ],
  },
];
