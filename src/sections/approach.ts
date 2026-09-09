/** /approach/ — the principles, the engagement shapes, and who owns what. */

import { backdrop, em, esc, eyebrow, headline, kw } from './html';
import { renderCta, renderFooter } from './bottom';
import { renderNav } from './nav';

export type ApproachContent = {
  meta: { title: string; description: string; ogTitle?: string; ogDescription?: string };
  hero: { eyebrow: string; headline: string[]; body: string; back: { label: string; href: string } };
  principles: {
    eyebrow: string;
    headline: string[];
    intro: string;
    items: { num: string; title: string; body: string }[];
  };
  engage: {
    eyebrow: string;
    headline: string[];
    intro: string;
    items: { tag: string; title: string; body: string; points: string[]; best: string }[];
  };
  ownership: { eyebrow: string; headline: string[]; body: string; points: string[] };
  cta: {
    eyebrow: string;
    headline: string[];
    body: string;
    button: { label: string; href: string };
    email: string;
  };
};

export function renderApproachPage(c: ApproachContent): { navHtml: string; pageHtml: string } {
  const h = c.hero;
  const p = c.principles;
  const e = c.engage;
  const o = c.ownership;

  const hero = `<section class="chero is-clear" id="top" data-scrub>
    ${backdrop('weave')}
    <div class="wrap chero-inner">
      <a class="backlink" href="${esc(h.back.href)}"><span class="arw">&larr;</span><span>${esc(
        h.back.label,
      )}</span></a>
      <p class="eyebrow" data-reveal>${esc(h.eyebrow)}</p>
      <h1 class="display" data-reveal="mask">${h.headline
        .map((l, i) => `<span style="--i:${i}"><span>${em(l)}</span></span>`)
        .join('')}</h1>
      <p class="chero-body" data-reveal style="--i:3">${kw(h.body)}</p>
    </div>
  </section>`;

  /* The principles are numbered and full-width rather than gridded into
     cards. Each one is an argument several sentences long, and three of
     those side by side in equal columns is a wall nobody reads. */
  const principles = `<section class="principles sec-line" id="principles">
    <div class="wrap">
      ${eyebrow(p.eyebrow)}
      ${headline(p.headline)}
      <p class="lede" data-reveal style="--i:1">${em(p.intro)}</p>
      <ol class="prin-list" data-stagger>
        ${p.items
          .map(
            (it) => `<li class="prin" data-reveal>
          <span class="prin-num num">${esc(it.num)}</span>
          <div class="prin-body">
            <h3 class="prin-title h3">${esc(it.title)}</h3>
            <p>${kw(it.body)}</p>
          </div>
        </li>`,
          )
          .join('')}
      </ol>
    </div>
  </section>`;

  const engage = `<section class="engage sec-line sec-tint" id="engage">
    <div class="wrap">
      ${eyebrow(e.eyebrow)}
      ${headline(e.headline)}
      <p class="lede" data-reveal style="--i:1">${em(e.intro)}</p>
      <div class="engage-grid" data-stagger>
        ${e.items
          .map(
            (it) => `<article class="engage-card" data-reveal data-spotlight>
          <span class="engage-tag label">${esc(it.tag)}</span>
          <h3 class="engage-title h3">${esc(it.title)}</h3>
          <p class="engage-body">${kw(it.body)}</p>
          <ul class="engage-points">
            ${it.points.map((pt) => `<li>${kw(pt)}</li>`).join('')}
          </ul>
          <p class="engage-best"><span class="label">Suits</span>${esc(it.best)}</p>
        </article>`,
          )
          .join('')}
      </div>
    </div>
  </section>`;

  const ownership = `<section class="ownership sec-line" id="ownership">
    <div class="wrap wrap--narrow">
      ${eyebrow(o.eyebrow)}
      ${headline(o.headline)}
      <p class="lede" data-reveal style="--i:1">${kw(o.body)}</p>
      <ul class="own-list" data-stagger>
        ${o.points
          .map(
            (pt) => `<li class="own" data-reveal>
          <span class="check" aria-hidden="true"></span><span>${kw(pt)}</span>
        </li>`,
          )
          .join('')}
      </ul>
    </div>
  </section>`;

  return {
    navHtml: renderNav('/approach/'),
    pageHtml: [hero, principles, engage, ownership, renderCta(c.cta), renderFooter()].join(''),
  };
}
