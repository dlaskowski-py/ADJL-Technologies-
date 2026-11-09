/** The practices: four panels, each with a glyph built from the mark. */

import { practices } from '../content';
import { checklist, esc, eyebrow, headline, rail, rich, sectionOpen, specRail } from './html';

/**
 * Practice glyphs, all built from the three-bar mark so they read as one
 * family and none of them is a stock icon:
 *   ai        three bars converging on a point
 *   seo       bars of falling length: a ranking
 *   software  bars stacked into layers
 *   systems   three bars with a node on the middle one
 */
export function glyph(kind: string): string {
  const s = (inner: string) =>
    `<svg class="glyph" viewBox="0 0 40 40" width="40" height="40" aria-hidden="true" focusable="false">${inner}</svg>`;
  switch (kind) {
    case 'ai':
      return s(
        `<path d="M8 8 L20 30" class="g-bar"/><path d="M20 6 L20 30" class="g-bar g-sig"/><path d="M32 8 L20 30" class="g-bar"/><circle cx="20" cy="33" r="2.5" class="g-dot"/>`,
      );
    case 'seo':
      return s(
        `<path d="M8 10 H32" class="g-bar g-sig"/><path d="M8 18 H26" class="g-bar"/><path d="M8 26 H20" class="g-bar"/><path d="M8 34 H14" class="g-bar"/>`,
      );
    case 'software':
      return s(
        `<rect x="7" y="7" width="26" height="6" rx="1" class="g-box"/><rect x="7" y="17" width="26" height="6" rx="1" class="g-box g-sig-box"/><rect x="7" y="27" width="26" height="6" rx="1" class="g-box"/>`,
      );
    default:
      return s(
        `<path d="M10 8 V32" class="g-bar"/><path d="M20 8 V32" class="g-bar g-sig"/><path d="M30 8 V32" class="g-bar"/><circle cx="20" cy="20" r="4" class="g-node"/>`,
      );
  }
}

/** The practice panels. `rails` adds a spec rail to each (services hub). */
export function renderPractices(
  n: number,
  opts: {
    src?: string;
    rails?: Record<string, { label: string; value: string }[]>;
    copy?: { eyebrow: string; headline: string[]; intro?: string; body?: string[] };
    id?: string;
  } = {},
): string {
  const p = practices;
  const copy = opts.copy ?? { eyebrow: p.eyebrow, headline: p.headline, intro: p.intro };
  const id = opts.id ?? 'practices';
  const intro = copy.intro ?? copy.body?.join(' ') ?? '';
  return `${sectionOpen({
    id,
    src: opts.src ?? 'content.ts#practices',
    renderer: 'sections/top.ts#renderPractices',
    band: true,
  })}
    <div class="wrap">
      ${rail(n, id)}
      <div class="sec-copy">
        ${eyebrow(copy.eyebrow)}
        ${headline(copy.headline)}
        ${intro ? `<p class="lead sec-intro" data-reveal>${rich(intro)}</p>` : ''}
      </div>
      <div class="practice-grid">
        ${p.items
          .map(
            (it, i) => `<article class="practice panel bracket" data-reveal style="--i:${i}">
          <div class="practice-top">
            ${glyph(it.glyph)}
            <span class="practice-num mono" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
          </div>
          <h3 class="h3">${esc(it.title)}</h3>
          <p class="practice-sub label">${esc(it.sub)}</p>
          <p class="practice-body">${rich(it.body)}</p>
          ${checklist(it.points)}
          ${opts.rails?.[it.glyph] ? specRail(opts.rails[it.glyph], 'specs practice-specs') : ''}
          <a class="alink practice-link" href="${esc(it.link.href)}"><span>${esc(it.link.label)}</span><span class="arw" aria-hidden="true">→</span></a>
        </article>`,
          )
          .join('')}
      </div>
    </div>
  </section>`;
}
