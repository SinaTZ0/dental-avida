import type { ReviewTheme } from "#/orpc/review/constants";

/*===== Theme =====*/
// The theme lives on <html> (`.dark` class + `color-scheme`). With no saved choice it follows the
// system setting, live. Once the user picks one with the toggle, that choice wins from then on.
// Browser-only except `THEME_INIT_SCRIPT`, which __root.tsx inlines into the server-rendered <head>.

export type Theme = "light" | "dark";

const STORAGE_KEY = "app-theme";
const DARK_QUERY = "(prefers-color-scheme: dark)";
// Notifies other components in this tab; the `storage` event only fires in other tabs.
const CHANGE_EVENT = "app:theme-change";
// Notifies an embedded preview iframe when `/review` switches style/theme, and notifies `/review` when the iframe's own
// header ThemeToggle is clicked while previewing Normal Light/Dark style.
const REVIEW_PREVIEW_EVENT = "app:review-preview-theme-change";
const REVIEW_IFRAME_TOGGLE_EVENT = "app:review-iframe-theme-toggle";
const REVIEW_STUDIO_PATH = "/review";

/*===== First Paint =====*/
/**
 * Runs before the page paints, so neither theme flashes. The server can't know the system
 * preference, so this has to happen in the browser. Mirrors `resolveTheme`, `applyTheme`, and `/review` preview sync.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var r=document.documentElement;var p=location.pathname;if(p===${JSON.stringify(REVIEW_STUDIO_PATH)}){var qt=new URLSearchParams(location.search).get("theme");if(qt==="black-friday"){r.dataset.reviewTheme=qt;r.dataset.campaign="black-friday";r.classList.add("dark");r.style.colorScheme="dark";return}if(qt==="light"||qt==="dark"){r.dataset.reviewTheme=qt;delete r.dataset.campaign;r.classList.toggle("dark",qt==="dark");r.style.colorScheme=qt;return}if(r.dataset.campaign==="black-friday"){r.dataset.reviewTheme="black-friday";r.classList.add("dark");r.style.colorScheme="dark";return}}if(window.parent!==window){try{if(window.parent.location.pathname===${JSON.stringify(REVIEW_STUDIO_PATH)}){var rt=window.parent.document.documentElement.dataset.reviewTheme||new URLSearchParams(window.parent.location.search).get("theme");if(rt==="black-friday"){r.dataset.reviewPreview=rt;r.dataset.campaign="black-friday";r.classList.add("dark");r.style.colorScheme="dark";return}if(rt==="light"||rt==="dark"){r.dataset.reviewPreview=rt;delete r.dataset.campaign;r.classList.toggle("dark",rt==="dark");r.style.colorScheme=rt;return}}}catch(e){}}if(r.dataset.campaign==="black-friday"){r.classList.add("dark");r.style.colorScheme="dark";return}var s=localStorage.getItem(${JSON.stringify(STORAGE_KEY)});var d=s==="dark"||(s!=="light"&&matchMedia(${JSON.stringify(DARK_QUERY)}).matches);r.classList.toggle("dark",d);r.style.colorScheme=d?"dark":"light"}catch(e){}})()`;

/*===== Helpers =====*/
function isReviewTheme(value: string | null | undefined): value is ReviewTheme {
  return value === "light" || value === "dark" || value === "black-friday";
}

function readSavedTheme(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    // Storage can be blocked (privacy modes); fall back to the system theme.
    return null;
  }
}

function resolveTheme(): Theme {
  return readSavedTheme() ?? (matchMedia(DARK_QUERY).matches ? "dark" : "light");
}

function applyThemeToRoot(root: HTMLElement, theme: Theme) {
  root.classList.toggle("dark", theme === "dark");
  // Native controls, scrollbars, and autofill follow `color-scheme`.
  root.style.colorScheme = theme;
}

function applyTheme(theme: Theme) {
  applyThemeToRoot(document.documentElement, theme);
}

function applyReviewThemeToRoot(root: HTMLElement, theme: ReviewTheme) {
  if (theme === "black-friday") {
    root.dataset.campaign = "black-friday";
    applyThemeToRoot(root, "dark");
    return;
  }
  delete root.dataset.campaign;
  applyThemeToRoot(root, theme);
}

/**
 * When this window is embedded inside the same-origin `/review` studio iframe, returns the studio's active preview
 * theme (`"light" | "dark" | "black-friday"`). Always returns `null` for regular visitors outside `/review`.
 */
export function getReviewPreviewTheme(): ReviewTheme | null {
  if (typeof window === "undefined" || window.parent === window) return null;
  try {
    if (window.parent.location.pathname !== REVIEW_STUDIO_PATH) return null;
    const localPreview = document.documentElement.dataset.reviewPreview;
    if (isReviewTheme(localPreview)) return localPreview;
    const attr = window.parent.document.documentElement.dataset.reviewTheme;
    if (isReviewTheme(attr)) return attr;
    const param = new URLSearchParams(window.parent.location.search).get("theme");
    return isReviewTheme(param) ? param : null;
  } catch {
    return null;
  }
}

/*===== Store =====*/
/** The theme currently applied to the document. */
export function getTheme(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

/** Applies and saves the user's choice; from now on it overrides the system setting. */
export function setTheme(theme: Theme) {
  // Inside the `/review` preview iframe, toggle only the review session instead of overwriting global `localStorage`.
  if (getReviewPreviewTheme() !== null) {
    applyReviewPreviewTheme(theme);
    try {
      window.parent.dispatchEvent(new CustomEvent<Theme>(REVIEW_IFRAME_TOGGLE_EVENT, { detail: theme }));
    } catch {
      // Ignore if parent window is unreachable.
    }
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Not saved, but still applied for this page view.
  }
  applyTheme(theme);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/**
 * Syncs the reversible Black Friday campaign theme attribute on `<html>`. While active, forces `.dark` without
 * overwriting the user's saved `localStorage` preference; once inactive, restores the saved or system theme.
 */
export function syncCampaignTheme(active: boolean) {
  const root = document.documentElement;
  delete root.dataset.reviewPreview;
  if (active) {
    root.dataset.campaign = "black-friday";
    applyTheme("dark");
  } else {
    delete root.dataset.campaign;
    applyTheme(resolveTheme());
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** Applies a `/review` preview override to the current embedded document (`<html>`). */
export function applyReviewPreviewTheme(theme: ReviewTheme) {
  const root = document.documentElement;
  root.dataset.reviewPreview = theme;
  applyReviewThemeToRoot(root, theme);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** Applies the active preview theme on the `/review` studio document so its toolbar and sidebar match the artboard. */
export function applyReviewStudioTheme(theme: ReviewTheme) {
  const root = document.documentElement;
  root.dataset.reviewTheme = theme;
  applyReviewThemeToRoot(root, theme);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** Clears the `/review` studio attribute when leaving `/review`. */
export function clearReviewStudioTheme() {
  delete document.documentElement.dataset.reviewTheme;
}

/** Pushes the `/review` studio's active theme straight into the same-origin preview iframe without reloading it. */
export function syncIframeReviewTheme(frameWindow: Window | null, theme: ReviewTheme) {
  if (!frameWindow) return;
  try {
    const root = frameWindow.document.documentElement;
    root.dataset.reviewPreview = theme;
    applyReviewThemeToRoot(root, theme);
    frameWindow.dispatchEvent(new Event(REVIEW_PREVIEW_EVENT));
    frameWindow.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    // Ignore if iframe document is not yet ready or cross-origin.
  }
}

/** Subscribes to `/review` preview theme pushes inside an embedded iframe. Shaped for `useSyncExternalStore`. */
export function subscribeToReviewPreviewTheme(onChange: () => void): () => void {
  window.addEventListener(REVIEW_PREVIEW_EVENT, onChange);
  return () => window.removeEventListener(REVIEW_PREVIEW_EVENT, onChange);
}

/** Listens on the `/review` parent window for light/dark toggles clicked inside the previewed site header. */
export function subscribeToReviewIframeThemeToggle(onTheme: (theme: Theme) => void): () => void {
  const handler = (event: Event) => {
    const detail = (event as CustomEvent<Theme>).detail;
    if (detail === "light" || detail === "dark") {
      onTheme(detail);
    }
  };
  window.addEventListener(REVIEW_IFRAME_TOGGLE_EVENT, handler);
  return () => window.removeEventListener(REVIEW_IFRAME_TOGGLE_EVENT, handler);
}

/**
 * Subscribes to theme changes: the toggle, a system change (only while no choice is saved), and
 * a choice made in another tab. Shaped for `useSyncExternalStore`.
 */
export function subscribeToTheme(onChange: () => void): () => void {
  const media = matchMedia(DARK_QUERY);

  const handleSystemChange = () => {
    if (getReviewPreviewTheme() !== null) return;
    if (document.documentElement.dataset.campaign === "black-friday") return;
    if (readSavedTheme()) return;
    applyTheme(resolveTheme());
    onChange();
  };
  const handleStorage = (event: StorageEvent) => {
    if (getReviewPreviewTheme() !== null) return;
    if (document.documentElement.dataset.campaign === "black-friday") return;
    if (event.key !== STORAGE_KEY) return;
    applyTheme(resolveTheme());
    onChange();
  };

  media.addEventListener("change", handleSystemChange);
  window.addEventListener("storage", handleStorage);
  window.addEventListener(CHANGE_EVENT, onChange);

  return () => {
    media.removeEventListener("change", handleSystemChange);
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}
