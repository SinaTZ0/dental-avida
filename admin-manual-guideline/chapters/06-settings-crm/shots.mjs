import { signInAsAdmin, suppressCampaignModalScript } from "../../tools/auth-helper.mjs";

export const setup = signInAsAdmin;

export const shots = [
  {
    id: "settings-general",
    url: "/admin/campaign?tab=settings",
    viewport: { width: 1366, height: 920 },
    initScript: suppressCampaignModalScript,
    scrollTo: '[role="tabpanel"] form section:first-of-type',
    clip: '[role="tabpanel"] form section:first-of-type',
    wide: true,
    pad: 20,
    marks: [
      { n: 1, target: '[role="tabpanel"] form section:first-of-type [data-slot="switch"]' },
      {
        n: 2,
        target: '[role="tabpanel"] form section:first-of-type > div > div:nth-child(2) [data-slot="switch"]',
      },
      { n: 3, target: 'input[type="datetime-local"]', at: "end" },
      { n: 4, target: 'input[id$="-capacity"]', at: "end" },
      { n: 5, target: 'input[type="email"]', at: "end" },
    ],
  },
  {
    id: "settings-crm",
    url: "/admin/campaign?tab=settings",
    viewport: { width: 1366, height: 860 },
    initScript: suppressCampaignModalScript,
    scrollTo: '[role="tabpanel"] form section:nth-of-type(2)',
    clip: '[role="tabpanel"] form section:nth-of-type(2)',
    wide: true,
    pad: 20,
    marks: [
      { n: 1, target: 'input[type="url"]', at: "end" },
      { n: 2, target: 'input[type="password"]', at: "end" },
      { n: 3, target: 'button:has-text("تست اتصال CRM")' },
    ],
  },
  {
    id: "settings-discounts",
    url: "/admin/campaign?tab=settings",
    viewport: { width: 1366, height: 860 },
    initScript: suppressCampaignModalScript,
    scrollTo: '[role="tabpanel"] form section:nth-of-type(3)',
    clip: ['[role="tabpanel"] form section:nth-of-type(3)', '[role="tabpanel"] form button[type="submit"]'],
    wide: true,
    pad: 20,
    marks: [
      { n: 1, target: '[role="tabpanel"] form section:nth-of-type(3) > div > div:first-child', at: "end" },
      {
        n: 2,
        target: '[role="tabpanel"] form section:nth-of-type(3) input[id*="-disc-price-"]',
        at: "end",
      },
      { n: 3, target: '[role="tabpanel"] form button[type="submit"]' },
    ],
  },
];
