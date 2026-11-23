import { useCallback, useEffect, useId, useRef } from "react";

import { cn } from "#/lib/utils";

/*===== Avida Brand Marks =====*/
// Avida carries two distinct marks:
// 1. `AvidaBrandEmblem`: the official clinic logo — a fine architectural tooth outline inside an emerald-and-gold
//    medallion, used in the header and footer brand lockups.
// 2. `AvidaSmile`: the clinic's signature calligraphic smile mascot (tapered crescent + silver star), used as
//    the hero focal mark, carved arrival reveal, and subtle editorial flourish.

export const AVIDA_SMILE_VIEWBOX = { width: 180, height: 48 } as const;

export const AVIDA_SMILE_ARC_PATH =
  "M168 9.5C146 31.5 111 40 74 36.5C47 34 27 25 18 16.5C30 28.5 52 41 82 43.2C119 45.8 153 34.2 170 11.2C171.2 9.6 169.3 8.2 168 9.5Z";

export const AVIDA_SMILE_STAR_PATH =
  "M9.5 10.1Q9.5 17.5 16.9 17.5Q9.5 17.5 9.5 24.9Q9.5 17.5 2.1 17.5Q9.5 17.5 9.5 10.1Z";

/*===== Interactive Smirk-to-Smile Geometry =====*/
// At rest, `AvidaSmile` reads as a closed calligraphic smirk. On click, the upper lip lifts slightly while a matching
// tapered lower arc sweeps downward from the same corners, revealing a clipped porcelain tooth arch. The star glides
// left-to-right along the upper lip with a synced porcelain sheen underneath, shines (scale + rotate) at the right
// corner, and zips fast back along the closing upper lip to its resting spot.

const UPPER_ARC_REST = [
  168, 9.5, 146, 31.5, 111, 40, 74, 36.5, 47, 34, 27, 25, 18, 16.5, 30, 28.5, 52, 41, 82, 43.2, 119, 45.8, 153, 34.2,
  170, 11.2, 171.2, 9.6, 169.3, 8.2, 168, 9.5,
] as const;

const UPPER_ARC_OPEN = [
  168, 9.5, 146, 27.5, 111, 35, 74, 32, 47, 29.5, 27, 22.5, 18, 16.5, 30, 25.5, 52, 35.5, 82, 37.4, 119, 39.5, 153,
  30.2, 170, 11.2, 171.2, 9.6, 169.3, 8.2, 168, 9.5,
] as const;

// Mouth opening crescent (used both as the cavity fill and the clip path for the porcelain teeth).
const MOUTH_OPENING_CLOSED = [
  168.5, 10.6, 152, 33.8, 118, 44.5, 82, 42.2, 52, 40, 30, 28, 18, 16.5, 30, 28, 52, 40, 82, 42.2, 118, 44.5, 152, 33.8,
  168.5, 10.6,
] as const;

const MOUTH_OPENING_OPEN = [
  168.5, 10.6, 152, 30, 118, 38.8, 82, 36.8, 52, 35, 30, 25.2, 18, 16.5, 32, 39, 56, 59, 88, 62, 126, 65, 156, 43.5,
  168.5, 10.6,
] as const;

// Tapered calligraphic lower lip framing the opened smile.
const LOWER_ARC_CLOSED = [
  18, 16.5, 30, 28, 52, 40, 82, 42.2, 118, 44.5, 152, 33.8, 168.5, 10.6, 152, 34.5, 118, 45.2, 82, 43, 52, 40.8, 30,
  28.6, 18, 16.5,
] as const;

const LOWER_ARC_OPEN = [
  18, 16.5, 32, 39, 56, 59, 88, 62, 126, 65, 156, 43.5, 168.5, 10.6, 157.5, 45.8, 127.5, 68.5, 88, 65.8, 54.5, 62.5,
  30.5, 41, 18, 16.5,
] as const;

// Upper porcelain tooth arch inside the clipped mouth opening (leaves a slim emerald shadow along the lower lip).
const TEETH_ARCH_PATH = "M18 16.5C50 28 122 28 169 10.5L162 34C135 54 108 56.5 85 55C60 53.2 38 43 24 27Z";

// Delicate anatomical tooth separation hairlines (central incisors, lateral incisors, canines).
const TOOTH_DIVIDERS = [
  "M51 32Q49.5 41 48 48.5",
  "M67 35Q66 44 65 53",
  "M85 36.5Q84.5 46 84 55.5",
  "M103 37Q103 46.5 103 55.5",
  "M120 36Q121 45 122 53",
  "M136 32Q138 40 139.5 47",
] as const;

const STAR_CENTER = { x: 9.5, y: 17.5 } as const;
// Right-side shine point slightly past the upper lip's right tip (168, 9.5), mirroring the left-side star offset.
const STAR_RIGHT_APEX = { x: 177.5, y: 5.5 } as const;

// Eight crisp radiating shine lines centered at (0, 0), positioned onto `STAR_RIGHT_APEX` during the shine burst.
const SHINE_RAYS = [
  { x1: 0, y1: -14.5, x2: 0, y2: -21 },
  { x1: 14.5, y1: 0, x2: 21, y2: 0 },
  { x1: 0, y1: 14.5, x2: 0, y2: 21 },
  { x1: -14.5, y1: 0, x2: -21, y2: 0 },
  { x1: 10.5, y1: -10.5, x2: 14.8, y2: -14.8 },
  { x1: 10.5, y1: 10.5, x2: 14.8, y2: 14.8 },
  { x1: -10.5, y1: 10.5, x2: -14.8, y2: 14.8 },
  { x1: -10.5, y1: -10.5, x2: -14.8, y2: -14.8 },
] as const;

const OPEN_DURATION_MS = 300;
const CLOSE_START_MS = 1000;
const CLOSE_DURATION_MS = 360;
const TOTAL_DURATION_MS = CLOSE_START_MS + CLOSE_DURATION_MS;

const STAR_TRAVEL_START_MS = 140;
const STAR_TRAVEL_END_MS = 640;
const STAR_SHINE_END_MS = 1020;
const STAR_RETURN_END_MS = 1280;

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function easeOutCubic(t: number) {
  const inv = 1 - t;
  return 1 - inv * inv * inv;
}

function easeInOutCubic(t: number) {
  if (t < 0.5) return 4 * t * t * t;
  const inv = -2 * t + 2;
  return 1 - (inv * inv * inv) / 2;
}

function evalCubicBezier(p0: number, p1: number, p2: number, p3: number, t: number) {
  const inv = 1 - t;
  return inv * inv * inv * p0 + 3 * inv * inv * t * p1 + 3 * inv * t * t * p2 + t * t * t * p3;
}

/**
 * Samples a point along the star's upper-lip path from left home (u = 0) past the right tip to `STAR_RIGHT_APEX`
 * (u = 1), tracking live `openProgress` so the star stays glued to the upper lip as the smile opens and closes.
 */
function sampleUpperLipPath(u: number, openProgress: number) {
  if (u <= 0) return { x: STAR_CENTER.x, y: STAR_CENTER.y };
  if (u >= 1) return { x: STAR_RIGHT_APEX.x, y: STAR_RIGHT_APEX.y };

  const x0 = 168;
  const y0 = 9.5;
  const c1x = lerp(UPPER_ARC_REST[2], UPPER_ARC_OPEN[2], openProgress);
  const c1y = lerp(UPPER_ARC_REST[3], UPPER_ARC_OPEN[3], openProgress);
  const c2x = lerp(UPPER_ARC_REST[4], UPPER_ARC_OPEN[4], openProgress);
  const c2y = lerp(UPPER_ARC_REST[5], UPPER_ARC_OPEN[5], openProgress);
  const mx = lerp(UPPER_ARC_REST[6], UPPER_ARC_OPEN[6], openProgress);
  const my = lerp(UPPER_ARC_REST[7], UPPER_ARC_OPEN[7], openProgress);
  const c3x = lerp(UPPER_ARC_REST[8], UPPER_ARC_OPEN[8], openProgress);
  const c3y = lerp(UPPER_ARC_REST[9], UPPER_ARC_OPEN[9], openProgress);
  const c4x = lerp(UPPER_ARC_REST[10], UPPER_ARC_OPEN[10], openProgress);
  const c4y = lerp(UPPER_ARC_REST[11], UPPER_ARC_OPEN[11], openProgress);
  const lx = 18;
  const ly = 16.5;

  // Short lead-in from the star's home onto the left tip of the upper lip.
  if (u < 0.06) {
    const t = u / 0.06;
    return { x: lerp(STAR_CENTER.x, lx, t), y: lerp(STAR_CENTER.y, ly, t) };
  }
  // Left-to-middle cubic segment along the upper lip.
  if (u < 0.4) {
    const t = (u - 0.06) / 0.34;
    return {
      x: evalCubicBezier(lx, c4x, c3x, mx, t),
      y: evalCubicBezier(ly, c4y, c3y, my, t),
    };
  }
  // Middle-to-right cubic segment up to the right tip.
  if (u < 0.92) {
    const t = (u - 0.4) / 0.52;
    return {
      x: evalCubicBezier(mx, c2x, c1x, x0, t),
      y: evalCubicBezier(my, c2y, c1y, y0, t),
    };
  }
  // Short glide slightly past the right tip into `STAR_RIGHT_APEX`.
  const t = (u - 0.92) / 0.08;
  return { x: lerp(x0, STAR_RIGHT_APEX.x, t), y: lerp(y0, STAR_RIGHT_APEX.y, t) };
}

function interpolateFiveCubicPath(rest: readonly number[], target: readonly number[], progress: number) {
  const p = rest.map((value, i) => (value + (target[i] - value) * progress).toFixed(2));
  return `M${p[0]} ${p[1]}C${p[2]} ${p[3]} ${p[4]} ${p[5]} ${p[6]} ${p[7]}C${p[8]} ${p[9]} ${p[10]} ${p[11]} ${p[12]} ${p[13]}C${p[14]} ${p[15]} ${p[16]} ${p[17]} ${p[18]} ${p[19]}C${p[20]} ${p[21]} ${p[22]} ${p[23]} ${p[24]} ${p[25]}C${p[26]} ${p[27]} ${p[28]} ${p[29]} ${p[30]} ${p[31]}Z`;
}

function interpolateFourCubicPath(rest: readonly number[], target: readonly number[], progress: number) {
  const p = rest.map((value, i) => (value + (target[i] - value) * progress).toFixed(2));
  return `M${p[0]} ${p[1]}C${p[2]} ${p[3]} ${p[4]} ${p[5]} ${p[6]} ${p[7]}C${p[8]} ${p[9]} ${p[10]} ${p[11]} ${p[12]} ${p[13]}C${p[14]} ${p[15]} ${p[16]} ${p[17]} ${p[18]} ${p[19]}C${p[20]} ${p[21]} ${p[22]} ${p[23]} ${p[24]} ${p[25]}Z`;
}

type AvidaSmileProps = {
  className?: string;
  /** Render the star in metallic silver (default) or inherit the arc's fill color. */
  accentDot?: boolean;
  /** Play a click Easter egg: smirk opens into a porcelain smile, star glides along the upper lip, shines, and zips back. */
  interactive?: boolean;
  /** Incrementing counter that programmatically triggers the smile animation when greater than 0. */
  playTrigger?: number;
};

/** Signature smile mascot: tapered calligraphic arc with silver accent star. */
export function AvidaSmile({ className, accentDot = true, interactive = false, playTrigger = 0 }: AvidaSmileProps) {
  const mouthClipId = useId();
  const teethClipId = useId();

  const upperArcRef = useRef<SVGPathElement>(null);
  const starRef = useRef<SVGPathElement>(null);
  const shineRaysRef = useRef<SVGGElement>(null);
  const smileLayerRef = useRef<SVGGElement>(null);
  const mouthClipPathRef = useRef<SVGPathElement>(null);
  const mouthCavityRef = useRef<SVGPathElement>(null);
  const mouthRimRef = useRef<SVGPathElement>(null);
  const lowerArcRef = useRef<SVGPathElement>(null);
  const sheenRef = useRef<SVGRectElement>(null);

  const animRef = useRef<{ rafId: number; active: boolean; elapsed: number; openProgress: number }>({
    rafId: 0,
    active: false,
    elapsed: 0,
    openProgress: 0,
  });

  useEffect(() => {
    const state = animRef.current;
    return () => {
      if (state.rafId) {
        window.cancelAnimationFrame(state.rafId);
        state.rafId = 0;
        state.active = false;
      }
    };
  }, []);

  const playSmile = useCallback(() => {
    if (!interactive) return;
    if (window.matchMedia(REDUCED_MOTION_QUERY).matches) return;

    const upperArc = upperArcRef.current;
    const star = starRef.current;
    const shineRays = shineRaysRef.current;
    const smileLayer = smileLayerRef.current;
    const mouthClipPath = mouthClipPathRef.current;
    const mouthCavity = mouthCavityRef.current;
    const mouthRim = mouthRimRef.current;
    const lowerArc = lowerArcRef.current;
    const sheen = sheenRef.current;
    if (
      !upperArc ||
      !star ||
      !shineRays ||
      !smileLayer ||
      !mouthClipPath ||
      !mouthCavity ||
      !mouthRim ||
      !lowerArc ||
      !sheen
    ) {
      return;
    }

    const state = animRef.current;
    // Ignore rapid clicks while opening, gliding, or shining; allow smooth re-trigger once closing.
    if (state.active && state.elapsed < CLOSE_START_MS) return;

    if (state.rafId) {
      window.cancelAnimationFrame(state.rafId);
      state.rafId = 0;
    }

    const startOpenProgress = state.active ? state.openProgress : 0;
    const startTime = performance.now();
    state.active = true;
    state.elapsed = 0;
    smileLayer.setAttribute("visibility", "visible");

    const resetToRest = () => {
      upperArc.setAttribute("d", AVIDA_SMILE_ARC_PATH);
      star.removeAttribute("transform");
      star.removeAttribute("opacity");
      shineRays.setAttribute("visibility", "hidden");
      shineRays.setAttribute("opacity", "0");
      smileLayer.setAttribute("visibility", "hidden");
      smileLayer.setAttribute("opacity", "0");
      sheen.setAttribute("opacity", "0");
      state.active = false;
      state.rafId = 0;
      state.elapsed = 0;
      state.openProgress = 0;
    };

    const tick = (now: number) => {
      const elapsed = now - startTime;
      state.elapsed = elapsed;

      if (elapsed >= TOTAL_DURATION_MS) {
        resetToRest();
        return;
      }

      /*------ Smirk to Open Smile ------*/
      let openProgress: number;
      if (elapsed < OPEN_DURATION_MS) {
        const openT = easeOutCubic(clamp01(elapsed / OPEN_DURATION_MS));
        openProgress = startOpenProgress + (1 - startOpenProgress) * openT;
      } else if (elapsed < CLOSE_START_MS) {
        openProgress = 1;
      } else {
        const closeT = easeInOutCubic(clamp01((elapsed - CLOSE_START_MS) / CLOSE_DURATION_MS));
        openProgress = 1 - closeT;
      }
      state.openProgress = openProgress;

      const mouthPath = interpolateFourCubicPath(MOUTH_OPENING_CLOSED, MOUTH_OPENING_OPEN, openProgress);
      upperArc.setAttribute("d", interpolateFiveCubicPath(UPPER_ARC_REST, UPPER_ARC_OPEN, openProgress));
      mouthClipPath.setAttribute("d", mouthPath);
      mouthCavity.setAttribute("d", mouthPath);
      mouthRim.setAttribute("d", mouthPath);
      lowerArc.setAttribute("d", interpolateFourCubicPath(LOWER_ARC_CLOSED, LOWER_ARC_OPEN, openProgress));
      // Fade the revealed smile layer cleanly in/out during the very first/last sliver of opening.
      smileLayer.setAttribute("opacity", clamp01(openProgress * 6).toFixed(3));

      /*------ Star Glide (Left → Right), Shine Burst at Right Apex, Fast Return ------*/
      // Because the 4-pointed star has 90° rotational symmetry, each 90° turn lands cleanly back on its rest shape.
      let starU = 0;
      let starScale = 1;
      let starRotate = 0;
      let shineT = 0;

      if (elapsed >= STAR_TRAVEL_START_MS && elapsed < STAR_TRAVEL_END_MS) {
        const travelT = easeInOutCubic(
          clamp01((elapsed - STAR_TRAVEL_START_MS) / (STAR_TRAVEL_END_MS - STAR_TRAVEL_START_MS)),
        );
        starU = travelT;
        starRotate = travelT * 90;
        starScale = 1 + 0.15 * travelT;
      } else if (elapsed >= STAR_TRAVEL_END_MS && elapsed < STAR_SHINE_END_MS) {
        shineT = clamp01((elapsed - STAR_TRAVEL_END_MS) / (STAR_SHINE_END_MS - STAR_TRAVEL_END_MS));
        starU = 1;
        starRotate = 90 + easeInOutCubic(shineT) * 90;
        if (shineT < 0.45) {
          starScale = 1.15 + 0.8 * easeOutCubic(shineT / 0.45);
        } else {
          starScale = 1.95 - 0.95 * easeInOutCubic((shineT - 0.45) / 0.55);
        }
      } else if (elapsed >= STAR_SHINE_END_MS && elapsed < STAR_RETURN_END_MS) {
        const returnT = easeInOutCubic(
          clamp01((elapsed - STAR_SHINE_END_MS) / (STAR_RETURN_END_MS - STAR_SHINE_END_MS)),
        );
        starU = 1 - returnT;
        starRotate = 180 + returnT * 90;
        starScale = 1 - 0.12 * Math.sin(returnT * Math.PI);
      }

      if (elapsed >= STAR_TRAVEL_START_MS && elapsed < STAR_RETURN_END_MS) {
        const pos = sampleUpperLipPath(starU, openProgress);
        star.setAttribute(
          "transform",
          `translate(${pos.x.toFixed(2)} ${pos.y.toFixed(2)}) rotate(${starRotate.toFixed(2)}) scale(${starScale.toFixed(3)}) translate(${-STAR_CENTER.x} ${-STAR_CENTER.y})`,
        );

        // Sync the porcelain gloss sheen directly beneath the star during its left → right glide.
        if (elapsed < STAR_TRAVEL_END_MS) {
          const sheenOpacity = Math.sin(starU * Math.PI) * 0.72;
          sheen.setAttribute("transform", `translate(${(pos.x - 12).toFixed(2)} 0) skewX(-24)`);
          sheen.setAttribute("opacity", sheenOpacity.toFixed(3));
        } else {
          sheen.setAttribute("opacity", "0");
        }

        // Radiating shine lines burst outward while the star rotates at the right apex.
        if (shineT > 0 && shineT < 1) {
          const rayScale = 0.55 + 0.65 * easeOutCubic(shineT);
          const rayRotate = easeInOutCubic(shineT) * 45;
          // Hold peak brightness longer so rays stay high-contrast during the burst instead of looking dim.
          const rayOpacity = clamp01(Math.sin(shineT * Math.PI) * 1.45);
          shineRays.setAttribute("visibility", "visible");
          shineRays.setAttribute(
            "transform",
            `translate(${STAR_RIGHT_APEX.x} ${STAR_RIGHT_APEX.y}) rotate(${rayRotate.toFixed(2)}) scale(${rayScale.toFixed(3)})`,
          );
          shineRays.setAttribute("opacity", rayOpacity.toFixed(3));
        } else {
          shineRays.setAttribute("visibility", "hidden");
          shineRays.setAttribute("opacity", "0");
        }
      } else {
        star.removeAttribute("transform");
        shineRays.setAttribute("visibility", "hidden");
        shineRays.setAttribute("opacity", "0");
        sheen.setAttribute("opacity", "0");
      }

      state.rafId = window.requestAnimationFrame(tick);
    };

    state.rafId = window.requestAnimationFrame(tick);
  }, [interactive]);

  useEffect(() => {
    if (playTrigger > 0) {
      playSmile();
    }
  }, [playTrigger, playSmile]);

  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${AVIDA_SMILE_VIEWBOX.width} ${AVIDA_SMILE_VIEWBOX.height}`}
      fill="none"
      onClick={interactive ? playSmile : undefined}
      className={cn("block overflow-visible ltr:-scale-x-100", interactive && "cursor-pointer select-none", className)}
    >
      {interactive && (
        <defs>
          <clipPath id={mouthClipId}>
            <path ref={mouthClipPathRef} d="" />
          </clipPath>
          <clipPath id={teethClipId}>
            <path d={TEETH_ARCH_PATH} />
          </clipPath>
        </defs>
      )}

      {interactive && (
        <g ref={smileLayerRef} visibility="hidden" opacity={0}>
          {/* Deep mouth cavity behind the teeth */}
          <path ref={mouthCavityRef} data-smile-cavity d="" className="fill-brand-surface" />

          {/* Sculpted porcelain upper teeth clipped smoothly inside the opening smile */}
          <g clipPath={`url(#${mouthClipId})`}>
            <path d={TEETH_ARCH_PATH} data-smile-teeth className="fill-brand-surface-foreground" />
            {/* Always stroke dividers with deep surface ink (not `currentColor`) so they stay legible in dark mode. */}
            <g
              data-smile-dividers
              className="stroke-brand-surface"
              strokeOpacity="0.24"
              strokeWidth="1"
              strokeLinecap="round"
            >
              {TOOTH_DIVIDERS.map((d) => (
                <path key={d} d={d} />
              ))}
            </g>
            <g clipPath={`url(#${teethClipId})`}>
              <rect ref={sheenRef} x="0" y="6" width="24" height="60" className="fill-white" opacity={0} />
            </g>
          </g>

          {/* Subtle dark inner contour separating light gold lips from bright porcelain teeth in dark mode */}
          <path
            ref={mouthRimRef}
            data-smile-rim
            d=""
            fill="none"
            className="stroke-background"
            strokeWidth="2.4"
            strokeLinejoin="round"
            strokeOpacity="0"
          />

          {/* Tapered lower lip framing the opened smile */}
          <path ref={lowerArcRef} d="" fill="currentColor" />
        </g>
      )}

      {/* Tapered organic crescent: fuller through the center of the smile, tapering cleanly to fine calligraphic tips. */}
      <path ref={upperArcRef} data-smile-arc d={AVIDA_SMILE_ARC_PATH} fill="currentColor" />

      {interactive && (
        <g
          ref={shineRaysRef}
          data-smile-rays
          visibility="hidden"
          opacity={0}
          strokeWidth="1.75"
          strokeLinecap="round"
          className={accentDot ? "stroke-brand-gold" : "stroke-current"}
        >
          {SHINE_RAYS.map((ray) => (
            <line key={`${ray.x1}-${ray.y1}`} x1={ray.x1} y1={ray.y1} x2={ray.x2} y2={ray.y2} />
          ))}
        </g>
      )}

      <path
        ref={starRef}
        data-smile-star
        d={AVIDA_SMILE_STAR_PATH}
        className={accentDot ? "fill-brand-gold" : "fill-current"}
      />
    </svg>
  );
}

/** Official Avida Dental logo: refined tooth silhouette inside the clinic's emerald-and-gold medallion. */
export function AvidaBrandEmblem({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl border border-brand-gold/50 bg-brand-surface text-brand-surface-foreground shadow-sm sm:size-12",
        className,
      )}
    >
      <svg
        viewBox="0 0 28 32"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-6 stroke-2 sm:size-7"
      >
        <path d="M14 5C11 5 8.5 1.5 5 3.5 0 6.2 2.5 14 4.5 18.5 7 24.3 6 29 9.3 29c3.3 0 1.5-9.3 4.7-9.3s1.4 9.3 4.7 9.3c3.3 0 2.3-4.7 4.8-10.5 2-4.5 4.5-12.3-.5-15C19.5 1.5 17 5 14 5Z" />
        <path d="M14 5l3.4-.9" className="stroke-brand-surface-gold" />
      </svg>
    </span>
  );
}
