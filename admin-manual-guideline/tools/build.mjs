/*===== Build =====*/
// Turns the chapters' text and screenshots into the standalone offline folder handed to the clinic team:
//
//   node admin-manual-guideline/tools/build.mjs
//
// Reads `intro.md`, `labels.json`, and every `chapters/<nn-name>/content.md` (in CHAPTERS order), writes
// `manual/index.html` and one `manual/<nn-name>.html` per chapter, and copies bundled Vazirmatn fonts in.
// Every path is relative so `manual/index.html` opens offline with a double click in any browser.

import { copyFile, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const OUT = path.join(ROOT, "manual");
const FONTS = path.resolve(ROOT, "../node_modules/@fontsource-variable/vazirmatn/files");

const labels = JSON.parse(await readFile(path.join(ROOT, "labels.json"), "utf8"));
for (const key of [
  "manualTitle",
  "contents",
  "prev",
  "next",
  "figure",
  "note",
  "warn",
  "tip",
  "sidebar",
  "theme",
  "sections",
  "features",
  "chapter",
  "step",
  "table",
  "keyTopic",
  "keyReview",
  "keyDescription",
  "paragraph",
  "list",
  "steps",
]) {
  if (!labels[key]) throw new Error(`labels.json has no "${key}"`);
}

/*===== Inline Text =====*/

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const LATIN_RUN = /[A-Za-z0-9۰-۹][A-Za-z0-9۰-۹ .,:;@%٪+\-_/#&]*[A-Za-z0-9۰-۹%٪]|[A-Za-z0-9۰-۹]/g;

const escapeHtml = (text) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const toPersianDigits = (text) => text.replace(/[0-9]/g, (d) => PERSIAN_DIGITS[Number(d)]);

/** Plain text to HTML with RTL bidi rules: Latin/number runs isolated in `<bdi dir="ltr">`, numbers in Persian digits. */
function bidiText(text) {
  let html = "";
  let last = 0;
  for (const match of text.matchAll(LATIN_RUN)) {
    const run = match[0].replace(/[ ,.:;]+$/, "");
    html += toPersianDigits(escapeHtml(text.slice(last, match.index)));
    const shown = /[A-Za-z]/.test(run) ? escapeHtml(run) : toPersianDigits(escapeHtml(run)).replace(/%/g, "٪");
    html += `<bdi dir="ltr">${shown}</bdi>`;
    last = match.index + run.length;
  }
  return html + toPersianDigits(escapeHtml(text.slice(last)));
}

/*===== Chapters =====*/
const CHAPTERS = ["sign-in", "public-experience", "leads", "ads-banners", "reports-funnel", "settings-crm"];

const folderOf = (name) => `${String(CHAPTERS.indexOf(name) + 1).padStart(2, "0")}-${name}`;
const writtenChapters = new Set();

function chapterRef(name) {
  if (!CHAPTERS.includes(name)) throw new Error(`No chapter "${name}" (CHAPTERS in tools/build.mjs): {{${name}}}`);
  const words = `${escapeHtml(labels.chapter)} ${toPersianDigits(String(CHAPTERS.indexOf(name) + 1))}`;
  const folder = folderOf(name);
  return writtenChapters.has(folder) ? `<a class="ch-ref" href="${folder}.html">${words}</a>` : words;
}

function inline(source) {
  return source
    .split(/(`[^`]+`)/)
    .map((part) => {
      if (part.startsWith("`") && part.endsWith("`")) return `<code dir="ltr">${escapeHtml(part.slice(1, -1))}</code>`;
      return part
        .split(/(\[\[[^\]]+\]\]|\*\*[^*]+\*\*|\{\{[a-z-]+\}\}|\{\d+\})/)
        .map((piece) => {
          if (piece.startsWith("[[")) {
            const label = piece.slice(2, -2);
            return `<span class="ui${label.length <= 28 ? " whole" : ""}">${bidiText(label)}</span>`;
          }
          if (piece.startsWith("**")) return `<strong>${bidiText(piece.slice(2, -2))}</strong>`;
          if (/^\{\{[a-z-]+\}\}$/.test(piece)) return chapterRef(piece.slice(2, -2));
          if (/^\{\d+\}$/.test(piece)) return `<span class="mark">${toPersianDigits(piece.slice(1, -1))}</span>`;
          return bidiText(piece);
        })
        .join("");
    })
    .join("");
}

/*===== Icons =====*/
const svg = (paths) =>
  `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
const ICON = {
  chevron: `<span class="chev">${svg('<path d="m6 9 6 6 6-6"/>')}</span>`,
  sidebar: svg('<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M15 3v18"/>'),
  moon: svg('<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>'),
  key: svg(
    '<path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"/><circle cx="16.5" cy="7.5" r=".5" fill="currentColor"/>',
  ),
  note: svg('<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>'),
  tip: svg(
    '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',
  ),
  warn: svg(
    '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  ),
  sun: svg(
    '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2m-7.07-14.07 1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
  ),
};

/*===== Figures =====*/

const COLUMN = 760;

function figure({ chapter, id, caption, shots, number }) {
  const shot = shots[id];
  if (!shot) throw new Error(`${chapter}: no screenshot "${id}" in shots.json (run tools/shoot.mjs ${chapter})`);
  const { width, height, marks } = shot;
  const scale = Math.max(1, width / COLUMN);
  const r = 13 * scale;
  const stroke = 1.6 * scale;
  const gap = 3 * scale;

  const drawn = marks.map(({ n, style, inset, at, x, y, width: w, height: h }) => {
    const grow = inset ? -(gap + 1) : gap;
    const end = inset || at === "end";
    const cx = Math.min(width - r - 2, Math.max(r + 2, end ? x + r + 2 * gap : x + w));
    const cy = Math.min(height - r - 2, Math.max(r + 2, y + (end ? h / 2 : 0)));
    const line =
      style === "dotted"
        ? ` stroke-dasharray="0 ${4 * scale}" stroke-linecap="round" stroke-width="${2.5 * scale}"`
        : ` stroke-dasharray="${6 * scale} ${4 * scale}" stroke-width="${stroke}"`;
    return [
      `<rect x="${x - grow}" y="${y - grow}" width="${w + 2 * grow}" height="${h + 2 * grow}" rx="${8 * scale}" class="box"${line}/>`,
      `<circle cx="${cx}" cy="${cy}" r="${r}" class="dot" stroke-width="${stroke}"/>`,
      `<text x="${cx}" y="${cy}" class="num" font-size="${15 * scale}">${toPersianDigits(String(n))}</text>`,
    ].join("");
  });

  return `<figure style="--w:${width}px">
  <div class="shot"${width > COLUMN ? " data-zoom" : ""}>
    <img src="images/${chapter}/${id}.png" width="${width}" height="${height}" alt="${escapeHtml(caption)}">
    <svg viewBox="0 0 ${width} ${height}" aria-hidden="true">${drawn.join("")}</svg>
  </div>
  <figcaption><span class="fig-no">${escapeHtml(labels.figure)} ${number}</span> ${inline(caption)}</figcaption>
</figure>`;
}

const numbered = (chapterNo, n) => toPersianDigits(chapterNo ? `${chapterNo}-${n}` : String(n));

function table({ rows, caption, number }) {
  const cells = (row, tag) => row.map((cell) => `<${tag}>${inline(cell)}</${tag}>`).join("");
  const [head, ...body] = rows;
  return `<table class="tab">
  <caption><span class="fig-no">${escapeHtml(labels.table)} ${number}</span> ${inline(caption)}</caption>
  <thead><tr>${cells(head, "th")}</tr></thead>
  <tbody>${body.map((row) => `<tr>${cells(row, "td")}</tr>`).join("")}</tbody>
</table>`;
}

/*===== Blocks =====*/

function render({ source, chapter, shots, chapterNo }) {
  const lines = source.replace(/\r/g, "").split("\n");
  const out = [];
  let title = "";
  const sections = [];
  const keys = [];
  let figures = 0;
  let tables = 0;
  let pendingKey = null;
  let i = 0;

  const take = (test, strip) => {
    const items = [];
    while (i < lines.length && test(lines[i])) items.push(lines[i++].replace(strip, ""));
    return items;
  };

  const emit = (html, kind) => {
    if (pendingKey === null) return out.push(html);
    const id = `k${keys.length + 1}`;
    keys.push({ id, kind, description: pendingKey });
    pendingKey = null;
    out.push(
      `<div class="key" id="${id}"><span class="key-badge">${ICON.key}<span>${escapeHtml(labels.keyTopic)}</span></span>${html}</div>`,
    );
  };

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }

    const key = /^\[!key\]\s+(.+)$/.exec(line);
    if (key) {
      if (!chapterNo) throw new Error(`${chapter}: [!key] only marks a block of a chapter's own text`);
      pendingKey = key[1];
      i++;
      continue;
    }

    const heading = /^(#{1,3}) (.+)$/.exec(line);
    if (heading) {
      if (pendingKey !== null) throw new Error(`${chapter}: [!key] before a heading: "${line}"`);
      const level = heading[1].length;
      if (level === 1) title = heading[2];
      if (level === 1 && chapterNo) {
        out.push(
          `<header class="opener"><p class="opener-no"><span>${escapeHtml(labels.chapter)}</span><b>${toPersianDigits(String(chapterNo))}</b></p><h1>${inline(heading[2])}</h1></header>`,
        );
      } else if (level === 2) {
        if (sections.length) out.push("</div></details>");
        const id = `s${sections.length + 1}`;
        sections.push({ id, title: heading[2] });
        out.push(
          `<details class="fold" id="${id}" open><summary><h2>${inline(heading[2])}</h2>${ICON.chevron}</summary><div class="fold-body">`,
        );
      } else {
        out.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      }
      i++;
      continue;
    }

    const shot = /^!\[([\w-]+)\]\s*(.*)$/.exec(line);
    if (shot) {
      const number = numbered(chapterNo, ++figures);
      emit(figure({ chapter, id: shot[1], caption: shot[2], shots, number }), `${escapeHtml(labels.figure)} ${number}`);
      i++;
      continue;
    }

    const caption = /^\[!table\]\s+(.+)$/.exec(line);
    if (caption) {
      i++;
      while (lines[i]?.trim() === "") i++;
      const rows = take((l) => l.startsWith("|"), /^/)
        .filter((row) => !/^\|[\s:|-]+\|?$/.test(row))
        .map((row) =>
          row
            .replace(/^\||\|$/g, "")
            .split("|")
            .map((cell) => cell.trim()),
        );
      if (rows.length < 2) throw new Error(`${chapter}: table "${caption[1]}" needs a header row and at least one row`);
      const number = numbered(chapterNo, ++tables);
      emit(table({ rows, caption: caption[1], number }), `${escapeHtml(labels.table)} ${number}`);
      continue;
    }
    if (line.startsWith("|"))
      throw new Error(`${chapter}: a table needs a "[!table] caption" line above it: "${line}"`);

    if (/^\d+\. /.test(line)) {
      const start = Number.parseInt(line, 10);
      const items = take((l) => /^\d+\. /.test(l) || /^ {2,}\S/.test(l), /^\d+\. /);
      emit(
        `<ol class="steps" style="counter-reset: step ${start - 1}">${joinContinued(items)
          .map((t) => `<li>${inline(t)}</li>`)
          .join("")}</ol>`,
        escapeHtml(labels.steps),
      );
      continue;
    }
    if (line.startsWith("- ")) {
      const items = take((l) => l.startsWith("- ") || /^ {2,}\S/.test(l), /^- /);
      emit(
        `<ul>${joinContinued(items)
          .map((t) => `<li>${inline(t)}</li>`)
          .join("")}</ul>`,
        escapeHtml(labels.list),
      );
      continue;
    }

    if (line.startsWith("> ")) {
      const body = take((l) => l.startsWith(">"), /^> ?/);
      const kind = /^\[!(note|warn|tip|features)\]\s*/.exec(body[0]);
      if (kind) body[0] = body[0].slice(kind[0].length);
      const type = kind?.[1] ?? "note";
      const inside = render({ source: body.join("\n"), chapter, shots }).html;
      const icon = ICON[type] ?? "";
      emit(
        `<aside class="${type}"><p class="aside-title">${icon}<span>${escapeHtml(labels[type])}</span></p><div class="aside-body">${inside}</div></aside>`,
        escapeHtml(labels[type]),
      );
      continue;
    }

    const paragraph = take((l) => l.trim() && !/^(#{1,3} |!\[|\d+\. |- |> |\[!|\|)/.test(l), /^/);
    emit(`<p>${inline(paragraph.join(" "))}</p>`, escapeHtml(labels.paragraph));
  }

  if (pendingKey !== null) throw new Error(`${chapter}: [!key] "${pendingKey}" marks nothing: it ends the text`);
  if (sections.length) out.push("</div></details>");

  if (keys.length) {
    const id = `s${sections.length + 1}`;
    sections.push({ id, title: labels.keyReview });
    const rows = keys
      .map(
        (k) =>
          `<tr><td><a class="key-ref" href="#${k.id}">${ICON.key}<span>${k.kind}</span></a></td><td>${inline(k.description)}</td></tr>`,
      )
      .join("");
    out.push(
      `<details class="fold review" id="${id}" open><summary><h2>${escapeHtml(labels.keyReview)}</h2>${ICON.chevron}</summary><div class="fold-body">`,
      `<table class="tab"><thead><tr><th>${escapeHtml(labels.keyTopic)}</th><th>${escapeHtml(labels.keyDescription)}</th></tr></thead><tbody>${rows}</tbody></table>`,
      "</div></details>",
    );
  }
  return { html: out.join("\n"), title, sections };
}

function joinContinued(items) {
  const joined = [];
  for (const item of items) {
    if (/^ {2,}\S/.test(item) && joined.length) joined[joined.length - 1] += " " + item.trim();
    else joined.push(item);
  }
  return joined;
}

/*===== Page =====*/

const cssString = (text) => text.replace(/[\\"]/g, "\\$&").replace(/\n/g, " ");

function sidebar({ chapters, current }) {
  const items = chapters.map((chapter, index) => {
    const here = chapter.id === current;
    const number = `<span class="ch-no">${toPersianDigits(String(index + 1))}</span>`;
    const sections = chapter.sections
      .map((section) => `<li><a href="${chapter.file}#${section.id}">${inline(section.title)}</a></li>`)
      .join("");
    const fold = sections
      ? `<button type="button" class="toc-fold" aria-expanded="${here}" aria-controls="toc-${chapter.id}" aria-label="${escapeHtml(labels.sections)}">${ICON.chevron}</button>`
      : "";
    return `<li class="toc-ch${here ? " here" : ""}">
  <div class="toc-row"><a href="${chapter.file}" title="${escapeHtml(chapter.title)}"${here ? ' aria-current="page"' : ""}>${number}<span class="toc-label">${inline(chapter.title)}</span></a>${fold}</div>
  ${sections ? `<ol class="toc-sub" id="toc-${chapter.id}"${here ? "" : " hidden"}>${sections}</ol>` : ""}
</li>`;
  });
  return `<nav class="side" id="side" aria-label="${escapeHtml(labels.contents)}"><ol class="toc">${items.join("")}</ol></nav>`;
}

function page({ title, body, nav, chapters, current, runningHead }) {
  const link = (target, label, cls) =>
    target
      ? `<a class="${cls}" href="${target.file}"><span>${escapeHtml(label)}</span>${inline(target.title)}</a>`
      : "<span></span>";
  return `<!doctype html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)} · ${escapeHtml(labels.manualTitle)}</title>
<link rel="stylesheet" href="assets/manual.css">
<style>
  :root { --step-label: "${cssString(labels.step)}"; }
  @page { @top-right { content: "${cssString(runningHead ?? labels.manualTitle)}"; } }
</style>
<script>
  try {
    const theme = localStorage.getItem("manual-theme");
    if (theme) document.documentElement.dataset.theme = theme;
    if (localStorage.getItem("manual-side") === "bar") document.documentElement.dataset.side = "bar";
  } catch {}
  document.fonts.load("1em Vazirmatn", "ا");
  document.fonts.load("1em Vazirmatn", "a");
</script>
<script src="assets/manual.js" defer></script>
</head>
<body>
<header class="top">
  <button type="button" class="tool" id="side-toggle" aria-controls="side" aria-label="${escapeHtml(labels.sidebar)}">${ICON.sidebar}</button>
  <a class="brand" href="index.html">${escapeHtml(labels.manualTitle)}</a>
  <button type="button" class="tool" id="theme-toggle" aria-label="${escapeHtml(labels.theme)}"><span class="moon">${ICON.moon}</span><span class="sun">${ICON.sun}</span></button>
</header>
<div class="layout">
${sidebar({ chapters, current })}
<div class="scrim" id="scrim" hidden></div>
<div class="content">
<main>
${body}
</main>
${nav ? `<nav class="pager">${link(nav.prev, labels.prev, "prev")}${link(nav.next, labels.next, "next")}</nav>` : ""}
</div>
</div>
</body>
</html>
`;
}

/*===== Run =====*/

const chapterIds = (await readdir(path.join(ROOT, "chapters"), { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .toSorted();

for (const id of chapterIds) {
  if (!CHAPTERS.some((name) => folderOf(name) === id))
    throw new Error(`chapters/${id} isn't in CHAPTERS (tools/build.mjs)`);
  const written = await readFile(path.join(ROOT, "chapters", id, "content.md"), "utf8").then(
    () => true,
    () => false,
  );
  if (written) writtenChapters.add(id);
}

const chapters = [];
for (const id of chapterIds) {
  const source = await readFile(path.join(ROOT, "chapters", id, "content.md"), "utf8").catch(() => null);
  if (source === null) continue;
  const shots = JSON.parse(await readFile(path.join(ROOT, "chapters", id, "shots.json"), "utf8").catch(() => "{}"));
  chapters.push({
    id,
    file: `${id}.html`,
    ...render({ source, chapter: id, shots, chapterNo: Number.parseInt(id, 10) }),
  });
}

await mkdir(path.join(OUT, "assets", "fonts"), { recursive: true });
for (const font of ["vazirmatn-arabic-wght-normal.woff2", "vazirmatn-latin-wght-normal.woff2"]) {
  await copyFile(path.join(FONTS, font), path.join(OUT, "assets", "fonts", font));
}

chapters.forEach((chapter, index) => {
  chapter.nav = { prev: chapters[index - 1], next: chapters[index + 1] };
});
for (const chapter of chapters) {
  await writeFile(
    path.join(OUT, chapter.file),
    page({
      title: chapter.title,
      body: chapter.html,
      nav: chapter.nav,
      chapters,
      current: chapter.id,
      runningHead: `${labels.chapter} ${toPersianDigits(String(Number.parseInt(chapter.id, 10)))} · ${chapter.title}`,
    }),
  );
}

const intro = render({ source: await readFile(path.join(ROOT, "intro.md"), "utf8"), chapter: "intro", shots: {} });
const contents = chapters
  .map(
    (c, i) =>
      `<li><a class="contents-ch" href="${c.file}"><span class="ch-no">${toPersianDigits(String(i + 1))}</span>${inline(c.title)}</a><ol class="contents-sub">${c.sections
        .map((section) => `<li><a href="${c.file}#${section.id}">${inline(section.title)}</a></li>`)
        .join("")}</ol></li>`,
  )
  .join("");
await writeFile(
  path.join(OUT, "index.html"),
  page({
    title: labels.contents,
    body: `${intro.html}\n<h2 class="contents-title">${escapeHtml(labels.contents)}</h2>\n<ol class="contents">${contents}</ol>`,
    chapters,
    current: null,
  }),
);

console.info(`Built ${chapters.length} chapter(s) into ${path.relative(process.cwd(), OUT) || "."}/`);
