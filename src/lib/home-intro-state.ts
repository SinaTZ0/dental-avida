/*===== Home Intro Navigation State =====*/
// In-memory client flag: resets on every hard page load or refresh of `/` so the carved smile intro plays on fresh
// arrivals, while any prior visit or client-side navigation from another route skips it.

let homeIntroConsumed = false;
const completionListeners = new Set<() => void>();

export function canPlayHomeIntro() {
  return !homeIntroConsumed;
}

export function markHomeIntroConsumed() {
  homeIntroConsumed = true;
}

/** Notify subscribers that the full-screen carved smile load intro has completed normally. */
export function notifyHomeIntroCompleted() {
  for (const listener of completionListeners) {
    listener();
  }
}

/** Subscribe to normal completion of the homepage load intro. Returns an unsubscribe function. */
export function onHomeIntroCompleted(listener: () => void) {
  completionListeners.add(listener);
  return () => {
    completionListeners.delete(listener);
  };
}
