/**
 * The portfolio: what we've built, one card per system, each with an
 * animated preview. Used on the home page (#systems) and on /work/.
 * Cards keep data-tags so the /work/ filter (ui.ts initFilter) still works.
 *
 * OWNER: WS-C (showcase). STUB: the plain cards, until that workstream
 * lands its animated previews.
 */
import { systems } from '../../content';
import { esc, rich } from '../html';

/** The cards alone (each page wraps them in its own section). */
export function showcaseCards(): string {
  return `<div class="sys-grid">${systems.items
    .map(
      (it, i) => `<article class="sys panel bracket" data-reveal style="--i:${i % 3}" data-tags="${esc(it.tags.join(' '))}">
      <div class="sys-top">
        <span class="label">${esc(it.kicker)}</span>
        <span class="sys-status mono"><i aria-hidden="true">●</i> ${esc(it.status)}</span>
      </div>
      <h3 class="h3">${rich(it.title)}</h3>
      <p>${rich(it.body)}</p>
      <a class="alink sys-link" href="${esc(it.link.href)}"><span>${esc(it.link.label)}</span><span class="arw" aria-hidden="true">→</span></a>
    </article>`,
    )
    .join('')}</div>`;
}
