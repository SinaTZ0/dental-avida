import { signInAsAdmin, suppressCampaignModalScript } from "../../tools/auth-helper.mjs";

export const setup = signInAsAdmin;

export const shots = [
  {
    id: "ads-summary-form",
    url: "/admin/campaign?tab=ads",
    viewport: { width: 1366, height: 920 },
    initScript: suppressCampaignModalScript,
    scrollTo: 'a[href="/admin/campaign/export?kind=ads"]',
    clip: ['a[href="/admin/campaign/export?kind=ads"]', 'form button[type="submit"]'],
    wide: true,
    pad: 22,
    marks: [
      { n: 1, target: '[role="tabpanel"] dl', at: "end" },
      { n: 2, target: 'a[href="/admin/campaign/export?kind=ads"]' },
      { n: 3, target: 'input[placeholder*="سایت خبری"]', at: "end" },
      { n: 4, target: 'input[placeholder*="provincial-news"]', at: "end" },
      { n: 5, target: 'label:has-text("بودجهٔ پیشنهادی") + input', at: "end" },
      { n: 6, target: 'label:has-text("هزینهٔ واقعی") + input', at: "end" },
      { n: 7, target: 'label:has-text("وضعیت تأیید مدیریت") + button', at: "end" },
      { n: 8, target: '[role="tabpanel"] form button[type="submit"]' },
    ],
  },
  {
    id: "ads-channels-table",
    url: "/admin/campaign?tab=ads",
    viewport: { width: 1366, height: 860 },
    initScript: suppressCampaignModalScript,
    scrollTo: '[role="tabpanel"] table',
    clip: '[role="tabpanel"] table',
    wide: true,
    pad: 20,
    marks: [
      { n: 1, target: '[role="tabpanel"] tbody tr:first-child th code' },
      { n: 2, target: '[role="tabpanel"] tbody tr:first-child button:has-text("کپی لینک پیگیری")' },
      { n: 3, target: '[role="tabpanel"] tbody tr:first-child button[aria-label="ویرایش"]' },
      { n: 4, target: '[role="tabpanel"] tbody tr:first-child td:nth-child(8)' },
    ],
  },
  {
    id: "ads-banner-kit",
    url: "/admin/campaign?tab=ads",
    viewport: { width: 1366, height: 860 },
    initScript: suppressCampaignModalScript,
    scrollTo: "#admin-banners-title",
    clip: 'section[aria-labelledby="admin-banners-title"]',
    wide: true,
    pad: 20,
    marks: [{ n: 1, target: 'section[aria-labelledby="admin-banners-title"] button:has-text("دانلود PNG")' }],
  },
];
