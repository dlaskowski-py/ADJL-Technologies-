/**
 * The hero figure: this page's own structure, drawn at build from its HTML
 * (the poster SVG, injected by scripts/prerender.mjs at the <!--poster-->
 * marker, with the counts at <!--counts-->), and redrawn live by
 * motion/lattice.ts on the full tier.
 *
 * Markup contract: [data-lattice]. The figcaption carries the meaning in
 * text, so the drawing itself is aria-hidden. It prerenders neutral, as
 * BUILD: the caption says the drawing was made at build, and only the live
 * module, once it has actually parsed the page and drawn it, swaps in the
 * LIVE caption with the real parse time. The live strings ride along as
 * data attributes, so the lazy chunk doesn't have to ship the copy module.
 */
import { hero, prov, status } from '../../content';
import { chip, esc } from '../html';

export function renderHeroFigure(): string {
  const f = hero.figure;
  return `<figure class="hero-fig" data-lattice data-scrub data-live-caption="${esc(f.captionLive)}" data-live-counts="${esc(
    f.counts,
  )}" data-live-chip="${esc(prov.live.label)}" data-live-title="${esc(prov.live.def)}">
    <div class="hero-fig-art" aria-hidden="true"><!--poster--></div>
    <button class="pause-btn hero-pause" type="button" data-pause data-js-only aria-pressed="false">${esc(status.pause)}</button>
    <figcaption class="hero-fig-cap">
      <p class="hero-fig-caption" data-graph-caption data-chrome>${esc(f.captionBuild)}</p>
      <p class="hero-fig-layers">${esc(f.layers)}</p>
      <p class="hero-fig-counts" data-chrome data-graph-counts><!--counts--></p>
      ${chip('build')}
    </figcaption>
  </figure>`;
}
