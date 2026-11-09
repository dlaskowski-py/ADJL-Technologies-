/**
 * The capability ticker under the hero: one moving line of what we build.
 * A [data-scene="ticker"] (motion/scenes.ts plays it only while visible).
 *
 * The line is a real list, written once. A second copy follows it so the
 * loop has no seam; that copy is aria-hidden and, wherever the line isn't
 * going to move (JavaScript off, reduced motion, Pause), it isn't shown and
 * the one list wraps, centered. Which of the two layouts applies is decided
 * from <html data-motion>, which is set before first paint, so the band is
 * the same height before and after scenes.ts starts it.
 *
 * Nothing in it is a link: a link that slides out from under a keyboard
 * focus is worse than no link, and the panels right below carry them.
 *
 * It's data-chrome: a strip of labels, not prose. A screen reader still
 * reads the list, but the text twins, the voice guard and Ask's index skip
 * it, because the hero's summary sentence and the panels below already say
 * all of it in sentences, and an eight-word label is nothing to cite.
 *
 * OWNER: WS-B (landing).
 */
import { landing } from '../../content-landing';
import { esc } from '../html';

export function renderTicker(): string {
  /* The copper mark's three bars, as the divider after every item. */
  const items = landing.ticker.items
    .map((t) => `<li class="lp-tick-item">${esc(t)}<i class="lp-tick-mark" aria-hidden="true"></i></li>`)
    .join('');
  return `<div class="lp-tick" data-scene="ticker" data-chrome>
    <div class="lp-tick-run">
      <ul class="lp-tick-track">${items}</ul>
      <ul class="lp-tick-track lp-tick-track--twin" aria-hidden="true">${items}</ul>
    </div>
  </div>`;
}
