/**
 * One renderer for the three original case pages (real estate, trading,
 * AI implementation). They keep their spine, and the order is an argument:
 * the situation before the system existed, then what the system does
 * stage by stage, then the decisions inside it a buyer would otherwise
 * have to ask about. The rebuild slots its new sections in around that
 * spine (the run replay after the problem, the research pipeline after
 * the build) and closes on "Built under" and contact.
 */

import type { CaseExtras, CaseFoot, Section } from '../content-types';
import { esc, eyebrow, hatch, headline, rail, rich, sectionOpen } from './html';
import { renderFlowDiagram, type Stage } from './flow';
import { renderContact, renderFooter } from './bottom';
import { renderNav } from './nav';
import { pageHero, renderCaseFoot, renderSection } from './kit';

export type CaseContent = {
  meta: { title: string; description: string; ogTitle?: string; ogDescription?: string };
  hero: {
    eyebrow: string;
    headline: string[];
    body: string;
    back?: { label: string; href: string };
    specs: { label: string; value: string }[];
    primary?: { label: string; href: string };
    secondary?: { label: string; href: string };
  };
  problem: { eyebrow: string; headline: string[]; body: string; points: string[] };
  build: { eyebrow: string; headline: string[]; intro: string; steps: Stage[] };
  detail: {
    eyebrow: string;
    headline: string[];
    /** A card with `hatch` is deliberately not shown in full: it renders
     *  hatched with that label. */
    cards: { title: string; body: string; hatch?: string }[];
  };
  /** Unused since the rebuild: every page shares the contact block. */
  cta?: unknown;
  /** Sections the rebuild adds around the original spine. */
  extras?: CaseExtras;
  /** "Built under" and "Next" links. */
  foot?: CaseFoot;
};

function renderProblem(c: CaseContent, n: number, file: string): string {
  const p = c.problem;
  return `${sectionOpen({ id: 'problem', src: `${file}#content.problem`, renderer: 'sections/case.ts#renderProblem', band: true })}
    <div class="wrap">
      ${rail(n, 'problem')}
      <div class="split split--even">
        <div class="sec-copy">
          ${eyebrow(p.eyebrow)}
          ${headline(p.headline)}
          <div class="prose sec-body" data-reveal><p>${rich(p.body)}</p></div>
        </div>
        <ul class="symptoms">
          ${p.points
            .map(
              (pt, i) => `<li class="symptom" data-reveal style="--i:${i}"><span class="symptom-mark mono" aria-hidden="true">▲</span><span>${rich(pt)}</span></li>`,
            )
            .join('')}
        </ul>
      </div>
    </div>
  </section>`;
}

function renderBuild(c: CaseContent, n: number, file: string): string {
  const b = c.build;
  return `${sectionOpen({
    id: 'build',
    src: `${file}#content.build`,
    renderer: 'sections/case.ts#renderBuild',
    ld: '#article',
    ldType: 'TechArticle',
  })}
    <div class="wrap">
      ${rail(n, 'build')}
      <div class="sec-copy">
        ${eyebrow(b.eyebrow)}
        ${headline(b.headline)}
        <div class="prose sec-body" data-reveal><p>${rich(b.intro)}</p></div>
      </div>
    </div>
    <div class="wrap flow-wrap">
      ${renderFlowDiagram(b.steps, b.headline.join(' ').replace(/\{\/?em\}/g, ''))}
    </div>
  </section>`;
}

function renderDetail(c: CaseContent, n: number, file: string): string {
  const d = c.detail;
  return `${sectionOpen({ id: 'detail', src: `${file}#content.detail`, renderer: 'sections/case.ts#renderDetail', band: n % 2 === 0 })}
    <div class="wrap">
      ${rail(n, 'detail')}
      <div class="sec-copy">
        ${eyebrow(d.eyebrow)}
        ${headline(d.headline)}
      </div>
      <div class="items" data-count="${d.cards.length}">
        ${d.cards
          .map((card, i) => {
            const inner = `<h3 class="h3">${esc(card.title)}</h3><p>${rich(card.body)}</p>`;
            return card.hatch
              ? `<article class="item item--hatch" data-reveal style="--i:${i}">${hatch(card.hatch, `<div class="hatch-inner">${inner}</div>`)}</article>`
              : `<article class="item" data-reveal style="--i:${i}"><span class="item-idx mono" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>${inner}</article>`;
          })
          .join('')}
      </div>
    </div>
  </section>`;
}

function extras(list: Section[] | undefined, start: number, file: string, key: string): { html: string; n: number } {
  let n = start;
  const html = (list ?? [])
    .map((s, i) => renderSection(s, ++n, `${file}#content.extras.${key}[${i}]`, { band: n % 2 === 0 }))
    .join('');
  return { html, n };
}

export function renderCasePage(
  c: CaseContent,
  route: string,
  file: string,
): { navHtml: string; pageHtml: string } {
  const h = c.hero;
  const parts: string[] = [
    pageHero({
      route,
      hero: {
        eyebrow: h.eyebrow,
        headline: h.headline,
        lead: h.body,
        primary: h.primary,
        secondary: h.secondary ?? { label: 'Talk to Daniel', href: '#contact' },
        specs: h.specs,
      },
      src: `${file}#content.hero`,
      renderer: 'sections/case.ts#renderCasePage',
      figure: true,
    }),
  ];
  let n = 2;
  parts.push(renderProblem(c, n, file));
  const a = extras(c.extras?.afterProblem, n, file, 'afterProblem');
  parts.push(a.html);
  n = a.n;
  parts.push(renderBuild(c, ++n, file));
  const b = extras(c.extras?.afterBuild, n, file, 'afterBuild');
  parts.push(b.html);
  n = b.n;
  parts.push(renderDetail(c, ++n, file));
  if (c.foot) parts.push(renderCaseFoot(c.foot, ++n, `${file}#content.foot`));
  parts.push(renderContact(++n), renderFooter());
  return { navHtml: renderNav(route), pageHtml: parts.join('') };
}
