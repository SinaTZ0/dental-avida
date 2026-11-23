import { signInAsAdmin, suppressCampaignModalScript } from "../../tools/auth-helper.mjs";

export const setup = signInAsAdmin;

export const shots = [
  {
    id: "report-funnel",
    url: "/admin/campaign?tab=report",
    viewport: { width: 1366, height: 860 },
    initScript: suppressCampaignModalScript,
    scrollTo: "#admin-funnel-title",
    clip: 'section[aria-labelledby="admin-funnel-title"]',
    wide: true,
    pad: 20,
    marks: [
      { n: 1, target: 'section[aria-labelledby="admin-funnel-title"] ol > li:first-child', at: "end" },
      {
        n: 2,
        target: 'section[aria-labelledby="admin-funnel-title"] ol > li:nth-child(3) span.text-h3',
      },
      {
        n: 3,
        target: 'section[aria-labelledby="admin-funnel-title"] ol > li:nth-child(3) span.w-16',
      },
    ],
  },
  {
    id: "report-readiness",
    url: "/admin/campaign?tab=report",
    viewport: { width: 1366, height: 860 },
    initScript: suppressCampaignModalScript,
    scrollTo: "#admin-readiness-title",
    clip: 'section[aria-labelledby="admin-readiness-title"]',
    wide: true,
    pad: 20,
    marks: [{ n: 1, target: 'section[aria-labelledby="admin-readiness-title"] ul > li:first-child', at: "end" }],
  },
  {
    id: "report-daily-breakdowns",
    url: "/admin/campaign?tab=report",
    viewport: { width: 1366, height: 920 },
    initScript: suppressCampaignModalScript,
    scrollTo: "#admin-daily-report-title",
    clip: [
      'section[aria-labelledby="admin-daily-report-title"]',
      'section[aria-labelledby="admin-source-breakdown"]',
      'section[aria-labelledby="admin-treatment-breakdown"]',
    ],
    wide: true,
    pad: 20,
    marks: [
      { n: 1, target: "#admin-daily-report-title", at: "end" },
      { n: 2, target: "#admin-source-breakdown", at: "end" },
      { n: 3, target: "#admin-treatment-breakdown", at: "end" },
    ],
  },
];
