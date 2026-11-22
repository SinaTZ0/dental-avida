import { useEffect, useState } from "react";

const DESKTOP_QUERY = "(min-width: 48rem)";
const SCROLL_THRESHOLD = 8;
const SCROLLED_OFFSET = 24;

/**
 * Tracks header scroll state:
 * - `hidden`: hides the desktop header on downward scroll and reveals it on upward scroll or at the top of the page.
 * - `scrolled`: becomes true once the page moves past the top edge, so floating frameless chrome can add glass backing.
 */
export function useDesktopHeaderHidden() {
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const desktop = window.matchMedia(DESKTOP_QUERY);
    let previousY = Math.max(0, window.scrollY);

    function reset() {
      const y = Math.max(0, window.scrollY);
      previousY = y;
      setHidden(false);
      setScrolled(y > SCROLLED_OFFSET);
    }

    function onScroll() {
      const y = Math.max(0, window.scrollY);
      setScrolled(y > SCROLLED_OFFSET);

      if (!desktop.matches) {
        setHidden(false);
        previousY = y;
        return;
      }

      const delta = y - previousY;
      // Accumulate small movements so sub-pixel scrolling and trackpad jitter don't keep flipping the header.
      if (y > SCROLL_THRESHOLD && Math.abs(delta) < SCROLL_THRESHOLD) return;

      previousY = y;
      setHidden(y > SCROLL_THRESHOLD && delta > 0);
    }

    reset();
    window.addEventListener("scroll", onScroll, { passive: true });
    desktop.addEventListener("change", reset);
    return () => {
      window.removeEventListener("scroll", onScroll);
      desktop.removeEventListener("change", reset);
    };
  }, []);

  return { hidden, scrolled };
}
