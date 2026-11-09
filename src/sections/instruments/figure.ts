/**
 * The hero figure: this page's own structure, drawn at build from its HTML
 * (the poster SVG, injected by scripts/prerender.mjs at the <!--poster-->
 * marker), and redrawn live by motion/lattice.ts on the full tier.
 *
 * OWNER: WS1 (hero). STUB until WS1 lands. Markup contract: [data-lattice].
 */
import { hero, status } from '../../content';
import { chip, esc } from '../html';

export function renderHeroFigure(): string {
  const f = hero.figure;
  return `<figure class="hero-fig" data-lattice data-scrub>
    <div class="hero-fig-art" aria-hidden="true"><!--poster--></div>
    <button class="pause-btn hero-pause" type="button" data-pause data-js-only aria-pressed="false">${esc(status.pause)}</button>
    <figcaption class="hero-fig-cap">
      <p class="hero-fig-caption" data-graph-caption>${esc(f.captionBuild)}</p>
      <p class="hero-fig-layers">${esc(f.layers)}</p>
      <p class="hero-fig-counts" data-chrome data-graph-counts><!--counts--></p>
      ${chip('build')}
    </figcaption>
  </figure>`;
}
