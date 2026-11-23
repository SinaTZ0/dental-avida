/*===== Avida Dental Admin Manual =====*/
// Interactive behaviors: collapsible sidebar (open ↔ number bar on desktop, slide-over drawer on mobile), night mode,
// sidebar section folding, opening folded sections targeted by hash links, and click-to-zoom wide figures.

const root = document.documentElement;
const NARROW = window.matchMedia("(max-width: 900px)");

const store = {
  get: (key) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch {}
  },
};

/*===== Sidebar =====*/

const sideToggle = document.getElementById("side-toggle");
const scrim = document.getElementById("scrim");

function setDrawer(open) {
  root.toggleAttribute("data-drawer", open);
  scrim.hidden = !open;
  sideToggle.setAttribute("aria-expanded", String(open));
}

sideToggle.addEventListener("click", () => {
  if (NARROW.matches) return setDrawer(!root.hasAttribute("data-drawer"));
  const bar = root.dataset.side !== "bar";
  if (bar) root.dataset.side = "bar";
  else delete root.dataset.side;
  store.set("manual-side", bar ? "bar" : "open");
  sideToggle.setAttribute("aria-expanded", String(!bar));
});
sideToggle.setAttribute("aria-expanded", String(!NARROW.matches && root.dataset.side !== "bar"));

scrim.addEventListener("click", () => setDrawer(false));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && root.hasAttribute("data-drawer")) setDrawer(false);
});
document.getElementById("side").addEventListener("click", (event) => {
  if (event.target.closest("a") && NARROW.matches) setDrawer(false);
});
NARROW.addEventListener("change", () => setDrawer(false));

for (const button of document.querySelectorAll(".toc-fold")) {
  button.addEventListener("click", () => {
    const list = document.getElementById(button.getAttribute("aria-controls"));
    list.hidden = !list.hidden;
    button.setAttribute("aria-expanded", String(!list.hidden));
  });
}

/*===== Night Mode =====*/

const dark = window.matchMedia("(prefers-color-scheme: dark)");
document.getElementById("theme-toggle").addEventListener("click", () => {
  const showing = root.dataset.theme ?? (dark.matches ? "dark" : "light");
  root.dataset.theme = showing === "dark" ? "light" : "dark";
  store.set("manual-theme", root.dataset.theme);
});

/*===== Folded Sections =====*/

function openTarget() {
  const target = location.hash ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;
  const fold = target?.closest("details");
  if (fold && !fold.open) {
    fold.open = true;
    target.scrollIntoView();
  }
}
window.addEventListener("hashchange", openTarget);
openTarget();

/*===== Large Pictures =====*/

const zoom = document.createElement("dialog");
zoom.className = "zoom";
document.body.append(zoom);
document.addEventListener("click", (event) => {
  if (zoom.open) return zoom.close();
  const shot = event.target.closest(".shot[data-zoom]");
  if (!shot) return;
  zoom.style.setProperty("--w", shot.parentElement.style.getPropertyValue("--w"));
  zoom.replaceChildren(shot.cloneNode(true));
  zoom.showModal();
});

window.addEventListener("beforeprint", () => {
  for (const fold of document.querySelectorAll("details.fold")) fold.open = true;
});
