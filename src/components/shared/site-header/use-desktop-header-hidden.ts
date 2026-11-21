import { useEffect, useState } from "react";

const DESKTOP_QUERY = "(min-width: 48rem)";
const SCROLL_THRESHOLD = 8;

/** Hides the desktop header on downward scroll and reveals it on upward scroll or at the top of the page. */
export function useDesktopHeaderHidden() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const desktop = window.matchMedia(DESKTOP_QUERY);
    let previousY = Math.max(0, window.scrollY);

    function reset() {
      previousY = Math.max(0, window.scrollY);
      setHidden(false);
    }

    function onScroll() {
      if (!desktop.matches) return;

      const y = Math.max(0, window.scrollY);
      const delta = y - previousY;
      // Accumulate small movements so sub-pixel scrolling and trackpad jitter don't keep flipping the header.
      if (y > SCROLL_THRESHOLD && Math.abs(delta) < SCROLL_THRESHOLD) return;

      previousY = y;
      setHidden(y > SCROLL_THRESHOLD && delta > 0);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    desktop.addEventListener("change", reset);
    return () => {
      window.removeEventListener("scroll", onScroll);
      desktop.removeEventListener("change", reset);
    };
  }, []);

  return hidden;
}
