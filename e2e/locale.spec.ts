import { expect, test } from "@playwright/test";

test("the Persian homepage is right-to-left and has no locale alternates", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  await expect(page.locator("html")).toHaveAttribute("lang", "fa");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute("content", "fa_IR");
  await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(0);

  const formerEnglishPage = await page.goto("/en");
  expect(formerEnglishPage?.status()).toBe(404);
});
