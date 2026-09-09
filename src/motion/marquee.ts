/**
 * The stack marquee — a continuous horizontal scroll of the technologies the
 * work actually uses.
 *
 * The track is duplicated once and translated by exactly -50%, which is what
 * makes the loop seamless: at -50% the second copy sits precisely where the
 * first started, so the reset is invisible. Duplicating in JS rather than in
 * the markup keeps the copy out of the accessibility tree and out of the
 * prerendered HTML, where a screen reader would otherwise read the whole
 * list twice.
 *
 * The animation itself is CSS. This module only builds the second copy, sets
 * the duration from the measured width so every row moves at the same
 * PIXELS per second regardless of how many items it holds, and stops the
 * whole thing when it is off screen.
 */

import { tier, whileVisible } from './prefs';

/** Pixels per second. Slow enough to read a word as it passes. */
const SPEED = 42;

export function initMarquee(): void {
  const rows = Array.from(document.querySelectorAll<HTMLElement>('[data-marquee]'));
  if (!rows.length) return;

  for (const row of rows) {
    const track = row.querySelector<HTMLElement>('.mq-track');
    if (!track) continue;

    if (tier === 'reduced') {
      // No infinite motion. The row becomes an ordinary scrollable strip,
      // which is the honest static equivalent of a marquee.
      row.classList.add('is-static');
      continue;
    }

    const width = track.scrollWidth;
    if (width < 40) continue;

    const clone = track.cloneNode(true) as HTMLElement;
    clone.setAttribute('aria-hidden', 'true');
    track.after(clone);

    row.style.setProperty('--mq-dur', `${(width / SPEED).toFixed(1)}s`);
    row.classList.add('is-running');

    whileVisible(
      row,
      () => row.classList.remove('is-paused'),
      () => row.classList.add('is-paused'),
    );
  }
}
