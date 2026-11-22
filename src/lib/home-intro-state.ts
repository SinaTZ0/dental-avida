/*===== Home Intro Navigation State =====*/
// In-memory client flag: resets on every hard page load or refresh of `/` so the carved smile intro plays on fresh
// arrivals, while any prior visit or client-side navigation from another route skips it.

let homeIntroConsumed = false;

export function canPlayHomeIntro() {
  return !homeIntroConsumed;
}

export function markHomeIntroConsumed() {
  homeIntroConsumed = true;
}
