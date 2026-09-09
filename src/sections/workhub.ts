/** /work/ — a short index over the three case pages. */

import { backdrop, esc, eyebrow, headline, rich } from './html';
import { renderCta, renderFooter } from './bottom';
import { renderNav } from './nav';

export type WorkHubContent = {
  meta: { title: string; description: string; ogTitle?: string; ogDescription?: string };
  hero: { eyebrow: string; headline: string[]; body: string; back: { label: string; href: string } };
  items: {
    num: string;
    kicker: string;
    title: string[];
    sub: string;
    body: string;
    points: string[];
    linkLabel: string;
    href: string;
  }[];
  refuse: { eyebrow: string; headline: string[]; body: string; items: string[] };
  cta: {
    eyebrow: string;
    headline: string[];
    body: string;
    button: { label: string; href: string };
    email: string;
  };
};

/** Which film belongs to which case page. Keyed by route so the hub and the
 *  case page itself cannot end up showing different films for the same work. */
export const CASE_MEDIA: Record<string, string> = {
  '/work/real-estate-intelligence/': 'survey',
  '/work/trading-infrastructure/': 'latency',
  '/work/ai-implementation/': 'mesh',
};

export function renderWorkHubPage(c: WorkHubContent): { navHtml: string; pageHtml: string } {
  const h = c.hero;
  const r = c.refuse;

  const hero = `<section class="chero is-clear" id="top" data-scrub>
    ${backdrop('bloom')}
    <div class="wrap chero-inner">
      <a class="backlink" href="${esc(h.back.href)}"><span class="arw">&larr;</span><span>${esc(
        h.back.label,
      )}</span></a>
      <p class="eyebrow" data-reveal>${esc(h.eyebrow)}</p>
      <h1 class="display" data-reveal="mask">${h.headline
        .map((l, i) => `<span style="--i:${i}"><span>${rich(l)}</span></span>`)
        .join('')}</h1>
      <p class="chero-body" data-reveal style="--i:3">${rich(h.body)}</p>
    </div>
  </section>`;

  const list = `<section class="hublist sec-line" id="work">
    <div class="hub-wrap">
      ${c.items
        .map(
          (it, i) => `<article class="hcard" data-reveal style="--n:${i}">
        <a class="hcard-link" href="${esc(it.href)}">
          <div class="hcard-film">
            ${backdrop(CASE_MEDIA[it.href] ?? 'mesh', 'backdrop--plate')}
          </div>
          <div class="hcard-body">
            <div class="hcard-head">
              <span class="hcard-num num">${esc(it.num)}</span>
              <span class="label hcard-kicker">${esc(it.kicker)}</span>
            </div>
            <h2 class="hcard-title">${it.title.map((t) => `<span>${rich(t)}</span>`).join('')}</h2>
            <p class="hcard-sub">${esc(it.sub)}</p>
            <p class="hcard-text">${rich(it.body)}</p>
            <ul class="checks">
              ${it.points
                .map(
                  (p) =>
                    `<li><span class="check" aria-hidden="true"></span><span>${rich(p)}</span></li>`,
                )
                .join('')}
            </ul>
            <span class="hcard-cta"><span>${esc(it.linkLabel)}</span><span class="arw">&rarr;</span></span>
          </div>
        </a>
      </article>`,
        )
        .join('')}
    </div>
  </section>`;

  /* The refusals get the same treatment as a case page's limits: a full
     section, not a footnote. It is the most trust-building block on the
     page and it should look like it was meant. */
  const refuse = `<section class="limits sec-line sec-tint" id="refuse">
    <div class="wrap wrap--narrow">
      ${eyebrow(r.eyebrow)}
      ${headline(r.headline)}
      <p class="lede" data-reveal style="--i:1">${rich(r.body)}</p>
      <ul class="limit-list" data-stagger>
        ${r.items
          .map(
            (it) =>
              `<li class="limit" data-reveal><span class="limit-mark" aria-hidden="true"></span><span>${rich(
                it,
              )}</span></li>`,
          )
          .join('')}
      </ul>
    </div>
  </section>`;

  return {
    navHtml: renderNav('/work/'),
    pageHtml: [hero, list, refuse, renderCta(c.cta), renderFooter()].join(''),
  };
}
