/*===== Screenshots =====*/
// Takes a chapter's screenshots from the running app and records where each numbered marker goes.
//
//   node admin-manual-guideline/tools/shoot.mjs <chapter> [--base http://localhost:3000]
//
// Reads `chapters/<chapter>/shots.mjs`, writes PNGs to `manual/images/<chapter>/<id>.png`, and writes exact marker
// coordinates into `chapters/<chapter>/shots.json` so `build.mjs` renders sharp SVG overlays on top of each image.

import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const args = process.argv.slice(2);
const chapter = args[0];
const base = args.includes("--base") ? args[args.indexOf("--base") + 1] : "http://localhost:3000";
if (!chapter) throw new Error("Usage: shoot.mjs <chapter> [--base <url>]");

const mod = await import(path.join(ROOT, "chapters", chapter, "shots.mjs"));
const { shots, setup } = mod;
const outDir = path.join(ROOT, "manual", "images", chapter);
await mkdir(outDir, { recursive: true });

/*===== Helpers =====*/

async function boxOf(page, target) {
  if (typeof target !== "string") return target;
  const box = await page.locator(target).first().boundingBox({ timeout: 8000 });
  if (!box) throw new Error(`Nothing to mark: ${target}`);
  return box;
}

function around(boxes, pad, viewport) {
  const x = Math.max(0, Math.min(...boxes.map((b) => b.x)) - pad);
  const y = Math.max(0, Math.min(...boxes.map((b) => b.y)) - pad);
  const right = Math.min(viewport.width, Math.max(...boxes.map((b) => b.x + b.width)) + pad);
  const bottom = Math.min(viewport.height, Math.max(...boxes.map((b) => b.y + b.height)) + pad);
  return { x, y, width: right - x, height: bottom - y };
}

/*===== Shoot =====*/

const browser = await chromium.launch();
const context = await browser.newContext({ locale: "fa-IR", colorScheme: "light", deviceScaleFactor: 2 });
if (setup) await setup({ context, base });

const record = {};

for (const shot of shots) {
  const viewport = shot.viewport ?? { width: 1366, height: 820 };
  const page = await context.newPage();
  await page.setViewportSize(viewport);
  if (shot.initScript) await page.addInitScript(shot.initScript);
  await page.goto(base + shot.url, { waitUntil: "networkidle" });
  if (shot.before) await shot.before(page);
  await page.evaluate(() => document.fonts.ready);
  await page.mouse.move(viewport.width - 2, viewport.height - 2);
  await page.waitForTimeout(350);

  if (shot.scrollTo) {
    await page.locator(shot.scrollTo).first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(250);
  }

  const marks = [];
  for (const mark of shot.marks ?? []) marks.push({ ...mark, box: await boxOf(page, mark.target) });

  const clip =
    shot.clip === "viewport" || !shot.clip
      ? { x: 0, y: 0, ...viewport }
      : typeof shot.clip === "object" && !Array.isArray(shot.clip)
        ? shot.clip
        : around(await Promise.all([shot.clip].flat().map((t) => boxOf(page, t))), shot.pad ?? 28, viewport);

  if (shot.wide) Object.assign(clip, { x: 0, width: viewport.width });

  await page.screenshot({ path: path.join(outDir, `${shot.id}.png`), clip });
  record[shot.id] = {
    width: Math.round(clip.width),
    height: Math.round(clip.height),
    marks: marks.map(({ n, style, inset, at, box }) => ({
      n,
      style: style ?? "box",
      inset: Boolean(inset),
      ...(at ? { at } : {}),
      x: Math.round(box.x - clip.x),
      y: Math.round(box.y - clip.y),
      width: Math.round(box.width),
      height: Math.round(box.height),
    })),
  };
  console.info(`${chapter}/${shot.id}: ${record[shot.id].width}×${record[shot.id].height}, ${marks.length} marks`);
  await page.close();
}

await browser.close();
await writeFile(path.join(ROOT, "chapters", chapter, "shots.json"), JSON.stringify(record, null, 2) + "\n");
