/**
 * One renderer for all three case pages.
 *
 * They differ only in which content module they carry, so there is one
 * renderer and three entry points rather than three near-identical files
 * that drift. Each page supplies a film name for its hero.
 *
 * Every case page has the same spine, and the order is an argument: the
 * situation before the system existed, then what the system actually does,
 * then the decisions inside it that a buyer would otherwise have to ask
 * about.
 */

import { backdrop, esc, eyebrow, headline, rich } from './html';
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
    ${backdrop(media, '', true)}
    <div class="wrap chero-inner">
      <a class="backlink" href="${esc(h.back.href)}"><span class="arw">&larr;</span><span>${esc(
        h.back.label,
      )}</span></a>
      <p class="eyebrow" data-reveal>${esc(h.eyebrow)}</p>
      <h1 class="display" data-reveal="mask">${h.headline
        .map((l, i) => `<span style="--i:${i}"><span>${rich(l)}</span></span>`)
        .join('')}</h1>
      <p class="chero-body" data-reveal style="--i:3">${rich(h.body)}</p>
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
        <p class="lede" data-reveal style="--i:1">${rich(p.body)}</p>
      </div>
      <ul class="symptoms" data-stagger>
        ${p.points
          .map(
            (pt) => `<li class="symptom" data-reveal>
          <span class="symptom-bar" aria-hidden="true"></span>
          <span>${rich(pt)}</span>
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
      <p class="lede" data-reveal style="--i:1">${rich(b.intro)}</p>
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
          <p>${rich(card.body)}</p>
        </article>`,
          )
          .join('')}
      </div>
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
      renderCta(c.cta),
      renderFooter(),
    ].join(''),
  };
}
