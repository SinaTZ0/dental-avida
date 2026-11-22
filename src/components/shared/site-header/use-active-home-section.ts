import { useEffect, useState } from "react";

/**
 * Tracks which homepage section is currently in the main reading band so navigation tabs highlight smoothly as the
 * visitor scrolls. Returns `null` when not on the homepage or while near the top of the hero.
 */
export function useActiveHomeSection(sectionIds: readonly string[], enabled: boolean) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);

    if (elements.length === 0) return;

    const visibleRatios = new Map<string, number>();

    const updateActive = () => {
      if (window.scrollY < 160) {
        setActiveId(null);
        return;
      }

      let bestId: string | null = null;
      let bestRatio = 0;
      for (const [id, ratio] of visibleRatios) {
        if (ratio > bestRatio) {
          bestRatio = ratio;
          bestId = id;
        }
      }

      if (bestId) {
        setActiveId(bestId);
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visibleRatios.set(entry.target.id, entry.intersectionRatio);
          } else {
            visibleRatios.delete(entry.target.id);
          }
        }
        updateActive();
      },
      {
        rootMargin: "-18% 0px -48% 0px",
        threshold: [0, 0.15, 0.35, 0.6],
      },
    );

    for (const element of elements) {
      observer.observe(element);
    }

    const onScrollTopCheck = () => {
      if (window.scrollY < 160) {
        setActiveId(null);
      }
    };

    window.addEventListener("scroll", onScrollTopCheck, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScrollTopCheck);
    };
  }, [enabled, sectionIds]);

  return enabled ? activeId : null;
}
