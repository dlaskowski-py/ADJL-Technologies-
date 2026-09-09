/**
 * One renderer for all three case pages.
 *
 * They differ only in which content module they carry, so there is one
 * renderer and three entry points rather than three near-identical files
 * that drift. Each page supplies a film name for its hero.
 *
 * Every case page has the same spine, and the order is an argument: the
 * situation before the system existed, then what the system actually does,
 * then the decisions inside it, then WHAT IT DOES BADLY. That last section
 * is not a disclaimer at the bottom — it is a full section with the same
 * weight as the others, because a system described only by its wins is not
 * being described.
 */

import { backdrop, em, esc, eyebrow, headline, kw } from './html';
import { renderFlowDiagram, type Stage } from './flow';
import { renderCta, renderFooter } from './bottom';
import { renderNav } from './nav';

export type CaseContent = {
  meta: { title: string; description: string; ogTitle?: string; ogDescription?: string };
  hero: {
    eyebrow: string;
    headline: string[];
    body: string;
    back: { label: string; href: string };
    specs: { label: string; value: string }[];
  };
  problem: { eyebrow: string; headline: string[]; body: string; points: string[] };
  build: { eyebrow: string; headline: string[]; intro: string; steps: Stage[] };
  detail: { eyebrow: string; headline: string[]; cards: { title: string; body: string }[] };
  limits: { eyebrow: string; headline: string[]; body: string; items: string[] };
  cta: {
    eyebrow: string;
    headline: string[];
    body: string;
    button: { label: string; href: string };
    email: string;
  };
};

function renderHero(c: CaseContent, media: string): string {
  const h = c.hero;
  return `<section class="chero is-clear" id="top" data-scrub>
    ${backdrop(media)}
    <div class="wrap chero-inner">
      <a class="backlink" href="${esc(h.back.href)}"><span class="arw">&larr;</span><span>${esc(
        h.back.label,
      )}</span></a>
      <p class="eyebrow" data-reveal>${esc(h.eyebrow)}</p>
      <h1 class="display" data-reveal="mask">${h.headline
        .map((l, i) => `<span style="--i:${i}"><span>${em(l)}</span></span>`)
        .join('')}</h1>
      <p class="chero-body" data-reveal style="--i:3">${kw(h.body)}</p>
      <dl class="specs" data-stagger>
        ${h.specs
          .map(
            (s) => `<div class="spec" data-reveal>
          <dt class="label">${esc(s.label)}</dt>
          <dd>${esc(s.value)}</dd>
        </div>`,
          )
          .join('')}
      </dl>
    </div>
  </section>`;
}

function renderProblem(c: CaseContent): string {
  const p = c.problem;
  return `<section class="problem sec-line" id="problem">
    <div class="wrap problem-inner">
      <div class="problem-copy">
        ${eyebrow(p.eyebrow)}
        ${headline(p.headline)}
        <p class="lede" data-reveal style="--i:1">${kw(p.body)}</p>
      </div>
      <ul class="symptoms" data-stagger>
        ${p.points
          .map(
            (pt) => `<li class="symptom" data-reveal>
          <span class="symptom-bar" aria-hidden="true"></span>
          <span>${kw(pt)}</span>
        </li>`,
          )
          .join('')}
      </ul>
    </div>
  </section>`;
}

function renderBuild(c: CaseContent): string {
  const b = c.build;
  return `<section class="buildsec sec-line sec-tint" id="build">
    <div class="wrap">
      ${eyebrow(b.eyebrow)}
      ${headline(b.headline)}
      <p class="lede" data-reveal style="--i:1">${kw(b.intro)}</p>
    </div>
    <div class="wrap flow-wrap">
      ${renderFlowDiagram(b.steps, b.headline.join(' ').replace(/\{\/?em\}/g, ''))}
    </div>
  </section>`;
}

function renderDetail(c: CaseContent): string {
  const d = c.detail;
  return `<section class="detail sec-line" id="detail">
    <div class="wrap">
      ${eyebrow(d.eyebrow)}
      ${headline(d.headline)}
      <div class="detail-grid" data-stagger>
        ${d.cards
          .map(
            (card) => `<article class="detail-card" data-reveal data-spotlight>
          <h3 class="h3">${esc(card.title)}</h3>
          <p>${kw(card.body)}</p>
        </article>`,
          )
          .join('')}
      </div>
    </div>
  </section>`;
}

/**
 * The limits section.
 *
 * Deliberately given the loudest treatment on the page — a tinted band, an
 * accent rule, and the same headline weight as everything else. A page that
 * buries its caveats in eight-point grey at the bottom has technically said
 * them; this one is trying to actually be read.
 */
function renderLimits(c: CaseContent): string {
  const l = c.limits;
  return `<section class="limits sec-line" id="limits">
    <div class="wrap wrap--narrow">
      ${eyebrow(l.eyebrow)}
      ${headline(l.headline)}
      <p class="lede" data-reveal style="--i:1">${em(l.body)}</p>
      <ul class="limit-list" data-stagger>
        ${l.items
          .map(
            (it) => `<li class="limit" data-reveal>
          <span class="limit-mark" aria-hidden="true"></span>
          <span>${kw(it)}</span>
        </li>`,
          )
          .join('')}
      </ul>
    </div>
  </section>`;
}

export function renderCasePage(
  c: CaseContent,
  route: string,
  media: string,
): { navHtml: string; pageHtml: string } {
  return {
    navHtml: renderNav(route),
    pageHtml: [
      renderHero(c, media),
      renderProblem(c),
      renderBuild(c),
      renderDetail(c),
      renderLimits(c),
      renderCta(c.cta),
      renderFooter(),
    ].join(''),
  };
}
