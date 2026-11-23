/*===== Manual Screenshot Auth Helper =====*/
// Signs a Playwright context into the temporary admin account used while capturing manual screenshots.

export const MANUAL_EMAIL = process.env.MANUAL_ADMIN_EMAIL ?? "manual-admin@avidadental.ir";
export const MANUAL_PASSWORD = process.env.MANUAL_ADMIN_PASSWORD ?? "AvidaManual#1405";

export async function signInAsAdmin({ context, base }) {
  const page = await context.newPage();
  await page.setViewportSize({ width: 1366, height: 820 });
  await page.goto(`${base}/auth`, { waitUntil: "networkidle" });
  await page.fill("#sign-in-email", MANUAL_EMAIL);
  await page.fill("#sign-in-password", MANUAL_PASSWORD);
  await page.locator('form button[type="submit"]').click();
  await page.waitForURL((url) => !url.pathname.startsWith("/auth"), { timeout: 10_000 });
  await page.waitForLoadState("networkidle");
  await page.close();
}

/** Suppresses the first-visit Black Friday entry popup so page screenshots stay unobstructed. */
export function suppressCampaignModalScript() {
  try {
    localStorage.setItem("avida:bf-modal-dismissed-at", String(Date.now()));
  } catch {}
}
