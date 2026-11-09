/**
 * Build-time passes over a page's finished HTML, run by
 * scripts/prerender.mjs after the head is written. Each fills a marker the
 * renderers left in the markup:
 *
 *   <!--poster-->           the hero's structure drawing (lib/poster.ts)
 *   <!--counts-->           "42 headings · 118 links · 11 entities"
 *   <!--machine:variant-->  Machine View's BUILD readout (measure.ts)
 *
 * They run on the finished page so the drawing and the readout describe
 * exactly what ships, head and structured data included. Pure string in,
 * string out: this runs in Node.
 */
import { hero } from '../content';
import { measureHtml } from './measure';
import { renderPoster } from './poster';
import { renderMachineReadout, type MachineVariant } from '../sections/instruments/machine';

export function afterRender(html: string, route: string, origin: string): string {
  let out = html;

  if (out.includes('<!--poster-->')) {
    const p = renderPoster(out, route);
    const counts = hero.figure.counts
      .replace('{h}', String(p.counts.headings))
      .replace('{l}', String(p.counts.links))
      .replace('{e}', String(p.counts.entities));
    out = out.replace('<!--poster-->', p.svg).replace('<!--counts-->', counts);
  }

  if (out.includes('<!--machine:')) {
    /* Measured once, on the page as it will ship. The readout panels are
       in the exclusion set, so a page doesn't count its own readout. */
    const m = measureHtml(out, origin);
    out = out.replace(/<!--machine:(full|parity|schema|surfaces)-->/g, (_s, v: MachineVariant) =>
      renderMachineReadout(m, v),
    );
  }

  return out;
}
