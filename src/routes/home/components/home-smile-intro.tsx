import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";

import {
  AVIDA_SMILE_ARC_PATH,
  AVIDA_SMILE_STAR_PATH,
  AVIDA_SMILE_VIEWBOX,
} from "#/components/shared/avida-smile/avida-smile";
import { canPlayHomeIntro, markHomeIntroConsumed } from "#/lib/home-intro-state";
import { getLocale, getTextDirection } from "#/paraglide/runtime";

/*===== Intro Geometry & Timing =====*/
// SSR renders the carved smile already prominently framed at the center of a 1000×1000 reference square (`xMidYMid
// meet` with an oversized veil rect covering every aspect ratio). When JS takes over on frame 0, it computes the exact
// same screen-pixel size and center so there is zero full-page flash and zero jump before shrinking into the hero slot.
const REF_VIEWBOX_SIZE = 1000;
const INITIAL_WIDTH_RATIO = 0.72;
const INITIAL_CENTER_Y_OFFSET = -20; // Slightly above geometric center (480 / 1000) for optical balance.
const LOGO_CENTER = { x: AVIDA_SMILE_VIEWBOX.width / 2, y: AVIDA_SMILE_VIEWBOX.height / 2 } as const;
const SSR_SCALE = (REF_VIEWBOX_SIZE * INITIAL_WIDTH_RATIO) / AVIDA_SMILE_VIEWBOX.width;

// Snappy ~0.72s choreography starting directly from the carved state:
// 0 → 700ms:   carved smile shrinks & glides smoothly onto the exact hero smile bounding box.
// 0 → 640ms:   porcelain/dark veil fades from frame 0 along a steep ease-in curve (t^6 — holds nearly solid early,
//              then whips away very fast so the fade is mostly complete before the smile finishes seating).
// 520 → 700ms: real emerald & gold hero smile blooms into full color as the veil clears.
const SHRINK_DURATION_MS = 700;
const VEIL_FADE_DURATION_MS = 640;
const FILL_START_MS = 520;
const FILL_DURATION_MS = 180;
const TOTAL_DURATION_MS = 720;
const VEIL_FADE_EXPONENT = 6;

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

/** Smooth cubic ease-in-out for gliding the carved smile from center stage straight into its hero seat. */
function easeInOutCubic(t: number) {
  if (t < 0.5) {
    return 4 * t * t * t;
  }
  const inv = -2 * t + 2;
  return 1 - (inv * inv * inv) / 2;
}

/** Crisp ease-out for the brand color bloom on dock. */
function easeOutCubic(t: number) {
  const inv = 1 - t;
  return 1 - inv * inv * inv;
}

/** Steep ease-in curve: holds the veil nearly solid at first, then drops away very fast at the end. */
function easeInVeilFade(t: number) {
  return Math.pow(t, VEIL_FADE_EXPONENT);
}

/*===== Component =====*/

/**
 * Full-screen carved-smile arrival reveal on fresh homepage loads and refreshes.
 * Opens immediately on the porcelain/dark veil with a large centered Avida Smile cutout (zero full-page flash or
 * perceived lag), shrinks and docks pixel-for-pixel onto the hero smile, fills with emerald & champagne gold, and
 * dissolves the veil immediately.
 */
export function HomeSmileIntro() {
  const maskId = useId();
  const isLtrInitial = getTextDirection(getLocale()) === "ltr";
  // On SSR and initial hydration `canPlayHomeIntro()` is always true; after internal navigation it is false so the
  // overlay never mounts when returning to `/`.
  const [active, setActive] = useState(canPlayHomeIntro);

  const overlayRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const maskRef = useRef<SVGMaskElement>(null);
  const maskBgRef = useRef<SVGRectElement>(null);
  const veilRef = useRef<SVGRectElement>(null);
  const cutoutRef = useRef<SVGGElement>(null);

  useIsomorphicLayoutEffect(() => {
    if (!active) return;

    let rafId = 0;
    const overlay = overlayRef.current;

    const scheduleDismiss = () => {
      if (overlay) overlay.style.display = "none";
      markHomeIntroConsumed();
      rafId = window.requestAnimationFrame(() => setActive(false));
    };

    if (
      !canPlayHomeIntro() ||
      window.matchMedia(REDUCED_MOTION_QUERY).matches ||
      // Skip when landing on a hash anchor or restored mid-page scroll where the hero mark isn't in view.
      Boolean(window.location.hash) ||
      window.scrollY > 40
    ) {
      scheduleDismiss();
      return () => window.cancelAnimationFrame(rafId);
    }

    const smileWrap = document.querySelector<HTMLElement>("[data-home-hero-smile-wrap]");
    const smileSvg = smileWrap?.querySelector<SVGSVGElement>(".home-hero-smile");
    const svg = svgRef.current;
    const mask = maskRef.current;
    const maskBg = maskBgRef.current;
    const veil = veilRef.current;
    const cutout = cutoutRef.current;

    if (!smileWrap || !smileSvg || !overlay || !svg || !mask || !maskBg || !veil || !cutout) {
      scheduleDismiss();
      return () => window.cancelAnimationFrame(rafId);
    }

    const initialRect = smileSvg.getBoundingClientRect();
    if (
      initialRect.width <= 0 ||
      initialRect.height <= 0 ||
      initialRect.bottom < 0 ||
      initialRect.top > window.innerHeight
    ) {
      scheduleDismiss();
      return () => window.cancelAnimationFrame(rafId);
    }

    // Hide the real hero smile synchronously before paint while the veil covers it so the carved cutout stays purely
    // transparent until it seats and blooms with brand color.
    smileWrap.style.opacity = "0";

    let startTime = 0;
    let started = false;
    let cachedVw = 0;
    let cachedVh = 0;

    const restoreHeroSmile = () => {
      smileWrap.style.opacity = "";
    };

    const syncViewportAttributes = (vw: number, vh: number) => {
      if (vw === cachedVw && vh === cachedVh) return;
      cachedVw = vw;
      cachedVh = vh;
      const w = String(vw);
      const h = String(vh);
      svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
      svg.setAttribute("preserveAspectRatio", "none");
      mask.setAttribute("x", "0");
      mask.setAttribute("y", "0");
      mask.setAttribute("width", w);
      mask.setAttribute("height", h);
      maskBg.setAttribute("x", "0");
      maskBg.setAttribute("y", "0");
      maskBg.setAttribute("width", w);
      maskBg.setAttribute("height", h);
      veil.setAttribute("x", "0");
      veil.setAttribute("y", "0");
      veil.setAttribute("width", w);
      veil.setAttribute("height", h);
    };

    const applyFrame = (now: number) => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const rect = smileSvg.getBoundingClientRect();

      // If the visitor scrolled the hero smile out of view mid-intro, gracefully finish immediately.
      if (rect.width <= 0 || rect.bottom < 0 || rect.top > vh) {
        restoreHeroSmile();
        markHomeIntroConsumed();
        setActive(false);
        return false;
      }

      syncViewportAttributes(vw, vh);

      const elapsed = now - startTime;
      const isLtr = document.documentElement.dir === "ltr";
      const unitPx = Math.min(vw, vh) / REF_VIEWBOX_SIZE;

      // Exact screen-pixel continuation from the SSR initial frame.
      const startPxPerVb = SSR_SCALE * unitPx;
      const targetPxPerVb = rect.width / AVIDA_SMILE_VIEWBOX.width;
      const startCx = vw * 0.5;
      const startCy = vh * 0.5 + INITIAL_CENTER_Y_OFFSET * unitPx;
      const targetCx = rect.left + rect.width * 0.5;
      const targetCy = rect.top + rect.height * 0.5;

      /*------ Shrink & Glide to Hero Slot ------*/
      const shrinkT = clamp01(elapsed / SHRINK_DURATION_MS);
      const ease = easeInOutCubic(shrinkT);
      const currentPxPerVb = startPxPerVb * Math.pow(targetPxPerVb / startPxPerVb, ease);
      const cx = startCx + (targetCx - startCx) * ease;
      const cy = startCy + (targetCy - startCy) * ease;

      const scaleX = isLtr ? -currentPxPerVb : currentPxPerVb;
      cutout.setAttribute(
        "transform",
        `translate(${cx.toFixed(2)} ${cy.toFixed(2)}) scale(${scaleX.toFixed(4)} ${currentPxPerVb.toFixed(4)}) translate(${-LOGO_CENTER.x} ${-LOGO_CENTER.y})`,
      );

      /*------ Brand Color Fill on Dock ------*/
      if (elapsed < FILL_START_MS) {
        smileWrap.style.opacity = "0";
      } else {
        const fillProgress = easeOutCubic(clamp01((elapsed - FILL_START_MS) / FILL_DURATION_MS));
        smileWrap.style.opacity = String(fillProgress);
      }

      /*------ Continuous Ease-In Veil Fade (Slow Start, Very Fast Finish Before Dock) ------*/
      const fadeProgress = easeInVeilFade(clamp01(elapsed / VEIL_FADE_DURATION_MS));
      overlay.style.opacity = String(1 - fadeProgress);

      if (elapsed >= TOTAL_DURATION_MS) {
        restoreHeroSmile();
        markHomeIntroConsumed();
        setActive(false);
        return false;
      }

      return true;
    };

    const tick = (now: number) => {
      if (!started) {
        started = true;
        startTime = now;
      } else if (now - startTime > 120) {
        // Mark consumed once real frames have run so React StrictMode's initial mount/cleanup doesn't abort it.
        markHomeIntroConsumed();
      }

      if (applyFrame(now)) {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    startTime = performance.now();
    applyFrame(startTime);
    rafId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(rafId);
      restoreHeroSmile();
    };
  }, [active]);

  if (!active) return null;

  const ssrScaleX = isLtrInitial ? -SSR_SCALE : SSR_SCALE;
  const ssrTransform = `translate(500 ${500 + INITIAL_CENTER_Y_OFFSET}) scale(${ssrScaleX.toFixed(4)} ${SSR_SCALE.toFixed(4)}) translate(${-LOGO_CENTER.x} ${-LOGO_CENTER.y})`;

  return (
    <div ref={overlayRef} aria-hidden className="home-smile-intro" data-home-smile-intro="">
      <svg ref={svgRef} viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid meet" className="home-smile-intro-svg">
        <defs>
          <mask ref={maskRef} id={maskId} maskUnits="userSpaceOnUse" x="-3000" y="-3000" width="7000" height="7000">
            <rect ref={maskBgRef} x="-3000" y="-3000" width="7000" height="7000" className="home-smile-intro-mask-bg" />
            <g ref={cutoutRef} transform={ssrTransform} className="home-smile-intro-mask-cutout">
              <path d={AVIDA_SMILE_ARC_PATH} />
              <path d={AVIDA_SMILE_STAR_PATH} />
            </g>
          </mask>
        </defs>
        <rect
          ref={veilRef}
          x="-3000"
          y="-3000"
          width="7000"
          height="7000"
          mask={`url(#${maskId})`}
          className="home-smile-intro-veil"
        />
      </svg>
    </div>
  );
}
