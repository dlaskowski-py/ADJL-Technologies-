/* Sets the flag the reveal animations are gated on.
 *
 * The reveal styles used to hide [data-reveal] unconditionally and wait for
 * IntersectionObserver to add .is-in. With scripting off — or with the main
 * bundle simply failing to load — 58 of 59 elements on the home page stayed
 * at opacity 0. The prerendered markup was all in the DOM and none of it was
 * on the screen, which is the exact opposite of what prerendering is for.
 *
 * So hiding is opt-in now: no flag, nothing hidden. This is a classic script
 * in the head rather than part of the module bundle because module scripts
 * are deferred, and a deferred flag paints the content first and then hides
 * it — a flash of the whole page disappearing. It is ~120 bytes on the same
 * origin, and if it is the request that fails, everything is visible, which
 * is the safe direction to fail in. */
document.documentElement.className += ' js';
