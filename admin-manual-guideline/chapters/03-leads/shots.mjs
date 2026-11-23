import { signInAsAdmin, suppressCampaignModalScript } from "../../tools/auth-helper.mjs";

export const setup = signInAsAdmin;

export const shots = [
  {
    id: "admin-overview-kpis",
    url: "/admin/campaign?tab=leads",
    viewport: { width: 1366, height: 820 },
    initScript: suppressCampaignModalScript,
    clip: ["main header", "main dl", '[role="tablist"]'],
    wide: true,
    pad: 20,
    marks: [
      { n: 1, target: 'a[href^="/admin/campaign/export"]' },
      { n: 2, target: 'main header a[href="/black-friday"]' },
      { n: 3, target: "main dl", at: "end" },
      { n: 4, target: '[role="tablist"]', at: "end" },
    ],
  },
  {
    id: "leads-filters",
    url: "/admin/campaign?tab=leads",
    viewport: { width: 1366, height: 820 },
    initScript: suppressCampaignModalScript,
    clip: ['input[placeholder*="جست‌وجو"]', 'button[aria-label="درمان موردنظر"]'],
    wide: true,
    pad: 22,
    marks: [
      { n: 1, target: 'input[placeholder*="جست‌وجو"]', at: "end" },
      { n: 2, target: 'button[aria-label="وضعیت پیگیری"]', at: "end" },
      { n: 3, target: 'button[aria-label="درمان موردنظر"]', at: "end" },
    ],
  },
  {
    id: "leads-row-workflow",
    url: "/admin/campaign?tab=leads",
    viewport: { width: 1366, height: 820 },
    initScript: suppressCampaignModalScript,
    clip: "div.border-t.border-border > div.grid:first-child",
    wide: true,
    pad: 18,
    marks: [
      { n: 1, target: 'div.border-t.border-border > div.grid:first-child a[href^="tel:"]' },
      { n: 2, target: "div.border-t.border-border > div.grid:first-child > div:nth-child(2)", at: "end" },
      { n: 3, target: 'div.border-t.border-border > div.grid:first-child button[aria-label="وضعیت پیگیری"]' },
      {
        n: 4,
        target: 'div.border-t.border-border > div.grid:first-child input[aria-label="یادداشت مشاور"]',
        at: "end",
      },
      { n: 5, target: 'div.border-t.border-border > div.grid:first-child button:has-text("ذخیره")' },
    ],
  },
];
