import { MANUAL_EMAIL, MANUAL_PASSWORD, signInAsAdmin, suppressCampaignModalScript } from "../../tools/auth-helper.mjs";

export const shots = [
  {
    id: "header-sign-in",
    url: "/",
    wide: true,
    initScript: suppressCampaignModalScript,
    clip: "header.site-header-floating",
    pad: 12,
    marks: [{ n: 1, target: 'header a[href="/auth"]' }],
  },
  {
    id: "sign-in-form",
    url: "/auth",
    initScript: suppressCampaignModalScript,
    clip: "main",
    pad: 20,
    marks: [
      { n: 1, target: '[role="tab"]:has-text("ورود")' },
      { n: 2, target: "#sign-in-email", at: "end" },
      { n: 3, target: "#sign-in-password", at: "end" },
      { n: 4, target: 'form button[type="submit"]' },
      { n: 5, target: '[role="tab"]:has-text("ثبت‌نام")', style: "dotted" },
      { n: 6, target: 'a[href="/forgot-password"]', at: "end" },
    ],
  },
  {
    id: "sign-in-wrong",
    url: "/auth",
    initScript: suppressCampaignModalScript,
    before: async (page) => {
      await page.fill("#sign-in-email", MANUAL_EMAIL);
      await page.fill("#sign-in-password", "WrongPassword#000");
      await page.locator('form button[type="submit"]').click();
      await page.locator('[role="alert"]').first().waitFor({ state: "visible", timeout: 8000 });
    },
    clip: "main",
    pad: 20,
    marks: [{ n: 1, target: '[role="alert"]', at: "end" }],
  },
  {
    id: "account-menu",
    url: "/black-friday",
    initScript: suppressCampaignModalScript,
    before: async (page) => {
      await signInAsAdmin({ context: page.context(), base: new URL(page.url()).origin });
      await page.reload({ waitUntil: "networkidle" });
      await page.locator('button[aria-label="حساب کاربری"]').click();
      await page.locator('[role="menu"]').waitFor({ state: "visible", timeout: 5000 });
    },
    clip: ['button[aria-label="حساب کاربری"]', '[role="menu"]'],
    pad: 24,
    marks: [
      { n: 1, target: 'button[aria-label="حساب کاربری"]' },
      { n: 2, target: '[role="menuitem"]:has-text("مدیریت کمپین")', inset: true },
      { n: 3, target: '[role="menuitem"]:has-text("خروج")', inset: true },
    ],
  },
];
