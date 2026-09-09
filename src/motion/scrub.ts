/**
 * Scroll-linked progress. Writes a 0→1 `--p` custom property onto every
 * [data-scrub] element that is anywhere near the viewport; CSS and the flow
 * diagram do the rest. One rAF-throttled listener for the whole page.
 *
 * All layout reads happen in one pass before any writes, so this never
 * interleaves reads and writes within a frame — the classic way a
 * scroll handler turns into a layout thrash.
 */

import { tier } from './prefs';

export function initScrub(): void {
  if (tier === 'reduced') {
    // Park everything at its end state so nothing depending on --p is stuck
    // at zero and invisible.
    document
      .querySelectorAll<HTMLElement>('[data-scrub]')
      .forEach((el) => el.style.setProperty('--p', '1'));
    return;
  }

  const els = Array.from(document.querySelectorAll<HTMLElement>('[data-scrub]'));
  if (!els.length) return;

  let queued = false;

  const frame = () => {
    queued = false;
    const vh = window.innerHeight;

    // Read phase — every measurement first.
    const measured = els.map((el) => ({ el, rect: el.getBoundingClientRect() }));

    // Write phase — no reads past this line.
    for (const { el, rect } of measured) {
      if (rect.bottom < -vh || rect.top > vh * 2) continue;
      const span = rect.height + vh;
      const p = Math.min(1, Math.max(0, (vh - rect.top) / span));
      el.style.setProperty('--p', p.toFixed(4));
    }
  };

  const onScroll = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(frame);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  frame();
}
