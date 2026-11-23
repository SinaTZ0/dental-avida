/*===== Campaign Attribution & Modal Persistence =====*/
// Client-only storage helpers so UTM entry sources survive `/` -> `/black-friday` navigation, and the entry modal
// respects user dismissal cooldown (24h) and permanent suppression after form submission (Section 5 #11).

const ATTRIBUTION_KEY = "avida:campaign-attribution";
const MODAL_DISMISSED_KEY = "avida:bf-modal-dismissed-at";
const LEAD_SUBMITTED_KEY = "avida:bf-lead-submitted";
const VIEW_TRACKED_KEY = "avida:bf-landing-viewed";
const DISMISS_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export type CampaignAttribution = {
  source: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  referrer: string;
};

const EMPTY_ATTRIBUTION: CampaignAttribution = {
  source: "direct",
  utmSource: "",
  utmMedium: "",
  utmCampaign: "",
  referrer: "",
};

function sanitize(value: string | null | undefined, max: number): string {
  return (value ?? "").trim().slice(0, max);
}

function externalReferrerHost(): string {
  if (typeof document === "undefined" || !document.referrer) return "";
  try {
    const refUrl = new URL(document.referrer);
    if (refUrl.origin === window.location.origin) return "";
    return refUrl.hostname.slice(0, 120);
  } catch {
    return "";
  }
}

/** Captures UTM parameters or external referrer once per session, updating when new UTM parameters arrive. */
export function captureCampaignAttribution(): CampaignAttribution {
  if (typeof window === "undefined") return EMPTY_ATTRIBUTION;

  const params = new URLSearchParams(window.location.search);
  const utmSource = sanitize(params.get("utm_source"), 120);
  const utmMedium = sanitize(params.get("utm_medium"), 120);
  const utmCampaign = sanitize(params.get("utm_campaign"), 120);
  const referrer = externalReferrerHost();

  const existing = readCampaignAttribution();
  const hasNewUtm = Boolean(utmSource || utmMedium || utmCampaign);

  if (!hasNewUtm && existing.source !== "direct") {
    return existing;
  }

  let source = "direct";
  if (utmSource && utmMedium) {
    source = `${utmSource} / ${utmMedium}`;
  } else if (utmSource) {
    source = utmSource;
  } else if (referrer) {
    source = referrer;
  } else if (existing.source !== "direct") {
    return existing;
  }

  const next: CampaignAttribution = {
    source: source.slice(0, 160),
    utmSource: utmSource || existing.utmSource,
    utmMedium: utmMedium || existing.utmMedium,
    utmCampaign: utmCampaign || existing.utmCampaign,
    referrer: referrer || existing.referrer,
  };

  try {
    window.sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(next));
  } catch {
    // Privacy mode may block storage; attribution still works for the current view.
  }

  return next;
}

/** Reads the attribution captured on initial site entry, or `direct`. */
export function readCampaignAttribution(): CampaignAttribution {
  if (typeof window === "undefined") return EMPTY_ATTRIBUTION;
  try {
    const raw = window.sessionStorage.getItem(ATTRIBUTION_KEY);
    if (!raw) return EMPTY_ATTRIBUTION;
    const parsed = JSON.parse(raw) as Partial<CampaignAttribution>;
    return {
      source: sanitize(parsed.source, 160) || "direct",
      utmSource: sanitize(parsed.utmSource, 120),
      utmMedium: sanitize(parsed.utmMedium, 120),
      utmCampaign: sanitize(parsed.utmCampaign, 120),
      referrer: sanitize(parsed.referrer, 300),
    };
  } catch {
    return EMPTY_ATTRIBUTION;
  }
}

/*===== Entry Modal Cooldown & Submission Flag =====*/

/** Whether the entry modal may open for this visitor right now. */
export function shouldShowCampaignModal(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (window.localStorage.getItem(LEAD_SUBMITTED_KEY) === "1") return false;
    const dismissedAt = Number(window.localStorage.getItem(MODAL_DISMISSED_KEY) ?? "0");
    if (dismissedAt > 0 && Date.now() - dismissedAt < DISMISS_COOLDOWN_MS) return false;
    return true;
  } catch {
    return true;
  }
}

/** Suppresses the entry modal for 24 hours after the visitor dismisses it. */
export function markCampaignModalDismissed(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MODAL_DISMISSED_KEY, String(Date.now()));
  } catch {
    // Ignore blocked storage.
  }
}

/** Permanently suppresses the entry modal once the visitor completes the lead form. */
export function markCampaignLeadSubmitted(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LEAD_SUBMITTED_KEY, "1");
  } catch {
    // Ignore blocked storage.
  }
}

/** Returns true on the first landing-page view of this session so we don't double-count reloads. */
export function consumeLandingViewFlag(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (window.sessionStorage.getItem(VIEW_TRACKED_KEY) === "1") return false;
    window.sessionStorage.setItem(VIEW_TRACKED_KEY, "1");
    return true;
  } catch {
    return true;
  }
}
