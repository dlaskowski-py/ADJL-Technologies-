/**
 * The mark.
 *
 * ADJL Capital's favicon is three vertical bars — two ink, one copper —
 * which is the firm's initial reduced to a shape. The technology arm keeps
 * the geometry and gives the bars something to do: on load, and whenever the
 * pointer crosses the wordmark, they stagger upward and the centre bar runs
 * through the three spectrum colours.
 *
 * The whole effect is CSS. This module exists only to retrigger it, which
 * cannot be done by re-adding a class in the same frame the old one was
 * removed — the browser coalesces both into no change at all. Forcing a
 * reflow between the two is the standard fix and the reason it is written
 * out so explicitly here.
 */

import { afterIntro, tier } from './prefs';

export function initWordmark(): void {
  if (tier === 'reduced') return;

  const marks = Array.from(document.querySelectorAll<HTMLElement>('.wm-mark'));
  if (!marks.length) return;

  /* When the opening sequence hands over, its big mark has just folded
     away: pulse the nav's mark once, so it reads as the same mark landing. */
  const nav = document.querySelector<HTMLElement>('.nav .wm-mark');
  if (nav && document.documentElement.dataset.intro === 'play') {
    afterIntro(() => nav.classList.add('is-pulsing'));
  }

  for (const mark of marks) {
    const host = mark.closest('a, button') ?? mark;

    host.addEventListener('pointerenter', () => {
      mark.classList.remove('is-pulsing');
      // Read a layout property to flush the class removal. Without this the
      // remove and the add land in one style recalculation and the animation
      // never restarts.
      void mark.offsetWidth;
      mark.classList.add('is-pulsing');
    });

    mark.addEventListener('animationend', () => mark.classList.remove('is-pulsing'));
  }
}
