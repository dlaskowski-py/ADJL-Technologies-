/**
 * The opening sequence's controller.
 *
 * Markup contract: [data-intro-overlay] (sections/landing/intro.ts), shown
 * only while <html data-intro="play">, which public/js-on.js sets in the
 * head. The sequence itself is a CSS timeline (styles/landing/intro.css)
 * that has been running since the first frame and ends with the overlay
 * hidden and click-through on its own. This module adds what CSS can't:
 *
 *   Skip      the button, and Escape. data-skip on the overlay parts the
 *             curtain at once (200ms), then the hand-off below.
 *   Lock      the page under the curtain can't scroll while it's up: wheel,
 *             touch and the scroll keys are swallowed, and Tab lands on
 *             Skip. No overflow is toggled, so no scrollbar comes or goes
 *             and nothing under the overlay shifts.
 *   Hand-off  when the timeline's last animation finishes (or Skip, or
 *             Pause motion): remove the overlay, set
 *             <html data-intro="done"> and dispatch `adjl:intro-done` on
 *             window. compile.ts and lattice.ts wait for that event, so
 *             their entrances play where the visitor can see them.
 *
 * It loads late or not at all without harm: if the timeline has already
 * finished, the hand-off happens at once.
 */
import { onMotionChange } from './prefs';

/** Keys that scroll a page. Space still presses Skip when it has focus. */
const SCROLLS = /^( |Page|Arrow|Home|End)/;

export function initIntro(): void {
  const html = document.documentElement;
  const root = document.querySelector<HTMLElement>('[data-intro-overlay]');
  if (!root || html.dataset.intro !== 'play') return;
  const btn = root.querySelector<HTMLButtonElement>('[data-intro-skip]');

  /* Once per session. The head script wrote this when it chose to play;
     repeated here so the rule holds whichever copy of it a cache served. */
  try {
    sessionStorage.setItem('adjl:intro', 'seen');
  } catch {
    /* Storage unavailable: the head script wouldn't have played at all. */
  }

  let over = false;
  const done = () => {
    if (over) return;
    over = true;
    window.removeEventListener('keydown', onKey, true);
    root.remove();
    html.dataset.intro = 'done';
    window.dispatchEvent(new Event('adjl:intro-done'));
  };
  const skip = () => {
    /* Once the timeline has hidden the button, the curtain is already
       opening: restarting that from closed would be a flash, so let it. */
    if (over || root.dataset.skip || (btn && getComputedStyle(btn).visibility === 'hidden')) return;
    root.dataset.skip = 'true';
    window.setTimeout(done, 200);
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') skip();
    else if (e.key === 'Tab') {
      e.preventDefault();
      btn?.focus();
    } else if (SCROLLS.test(e.key) && e.target !== btn) e.preventDefault();
  };
  const hold = (e: Event) => e.preventDefault();

  root.addEventListener('wheel', hold, { passive: false });
  root.addEventListener('touchmove', hold, { passive: false });
  window.addEventListener('keydown', onKey, true);
  btn?.addEventListener('click', skip);
  onMotionChange((t) => {
    if (t === 'reduced') done();
  });

  /* The overlay's own animation is the timeline's last keyframe. With no
     animation on it (Pause was pressed before this loaded, so the CSS has
     already hidden it), there's nothing to wait for. */
  const end = root.getAnimations?.()[0];
  if (end) end.finished.then(done, () => {});
  else done();
  /* A watchdog, for an engine that never settles that promise. */
  window.setTimeout(done, 6000);
}
