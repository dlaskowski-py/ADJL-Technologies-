/**
 * The parts every page is assembled from: breadcrumbs, the page hero with
 * its structure figure, and one generic renderer for a content Section.
 *
 * A Section renders its fields in a fixed order (body, items, list, table,
 * definition list, instrument, links), so a content module describes WHAT
 * a section says and never how it's laid out.
 */

import type { CaseFoot, Hero, Instrument, Section } from '../content-types';
import { SITE_PAGES } from '../site-pages';
import {
  chip,
  displayHeadline,
  esc,
  eyebrow,
  hatch,
  headline,
  linkRow,
  prose,
  rail,
  rich,
  sectionOpen,
  specRail,
  type ProvKind,
} from './html';
import { renderHeroFigure } from './instruments/figure';
import { renderMachine } from './instruments/machine';
import { renderAsk } from './instruments/ask';
import { renderReplay } from './instruments/replay';
import { renderTelemetryPanel } from './instruments/telemetry';
import { renderLeaders, renderReaders } from './instruments/leaders';
import { renderHeaders } from './instruments/headers';
import { renderGuards } from './instruments/guards';
import { renderWeights } from './instruments/weights';

const CRUMBS: Record<string, { label: string; parent?: string }> = Object.fromEntries(
  SITE_PAGES.map((p) => [p.route, { label: p.label, parent: p.parent }]),
);

export function breadcrumbs(route: string): string {
  const trail: { href: string; label: string }[] = [];
  for (let r: string | undefined = route; r; r = CRUMBS[r]?.parent) {
    trail.unshift({ href: r, label: CRUMBS[r]?.label ?? r });
  }
  if (trail.length < 2) return '';
  return `<nav class="crumbs" aria-label="Breadcrumb" data-ld="#breadcrumb" data-ld-type="BreadcrumbList"><ol>${trail
    .map((t, i) =>
      i === trail.length - 1
        ? `<li><span aria-current="page">${esc(t.label)}</span></li>`
        : `<li><a href="${esc(t.href)}">${esc(t.label)}</a></li>`,
    )
    .join('')}</ol></nav>`;
}

export type HeroOpts = {
  route: string;
  hero: Hero;
  src: string;
  renderer?: string;
  /** The structure figure. Every page but legal. */
  figure?: boolean;
  /** JSON-LD the hero is described by (service pages: '#service'). */
  ld?: string;
  ldType?: string;
};

/**
 * The page hero. The h1 and lead paint at first frame on every tier: no
 * data-reveal anywhere in the text block, because the h1 is the LCP.
 */
export function pageHero(o: HeroOpts): string {
  const h = o.hero;
  return `${sectionOpen({
    id: 'top',
    src: o.src,
    renderer: o.renderer ?? 'sections/kit.ts#pageHero',
    cls: `hero${o.figure ? ' hero--fig' : ''}`,
    ld: o.ld,
    ldType: o.ldType,
  })}
    <div class="wrap hero-grid">
      <div class="hero-text">
        ${o.route === '/' ? '' : breadcrumbs(o.route)}
        ${eyebrow(h.eyebrow, false)}
        ${displayHeadline(h.headline)}
        <p class="lead hero-lead">${rich(h.lead)}</p>
        ${
          h.primary || h.secondary
            ? `<div class="actions">
          ${h.primary ? `<a class="btn btn--primary" href="${esc(h.primary.href)}"><span>${esc(h.primary.label)}</span><span class="arw" aria-hidden="true">→</span></a>` : ''}
          ${h.secondary ? `<a class="btn btn--ghost" href="${esc(h.secondary.href)}"><span>${esc(h.secondary.label)}</span></a>` : ''}
        </div>`
            : ''
        }
        ${specRail(h.specs, 'specs hero-specs')}
      </div>
      ${o.figure ? renderHeroFigure() : ''}
    </div>
  </section>`;
}

/** Page-specific data an instrument needs beyond the shared copy. */
export type InstrumentCtx = {
  csp?: { directive: string; note: string }[];
};

/** The provenance an instrument section's rail shows. */
const RAIL_CHIP: Partial<Record<Instrument, ProvKind>> = {
  'machine-full': 'build',
  'machine-parity': 'build',
  'machine-schema': 'build',
  'machine-surfaces': 'build',
  telemetry: 'build',
  headers: 'build',
  guards: 'build',
  weights: 'build',
};

export function renderInstrument(name: Instrument, ctx: InstrumentCtx = {}): string {
  switch (name) {
    case 'machine-full':
      return renderMachine('full');
    case 'machine-parity':
      return renderMachine('parity');
    case 'machine-schema':
      return renderMachine('schema');
    case 'machine-surfaces':
      return renderMachine('surfaces');
    case 'ask-home':
      return renderAsk('home');
    case 'ask-full':
      return renderAsk('full');
    case 'replay-full':
      return renderReplay('full');
    case 'replay-compact':
      return renderReplay('compact');
    case 'telemetry':
      return renderTelemetryPanel();
    case 'leaders-parity':
      return renderLeaders('parity');
    case 'leaders-seal':
      return renderLeaders('seal');
    case 'leaders-pit':
      return renderLeaders('pit');
    case 'leaders-clocks':
      return renderLeaders('clocks');
    case 'readers':
      return renderReaders();
    case 'headers':
      return renderHeaders(ctx.csp ?? []);
    case 'guards':
      return renderGuards();
    case 'weights':
      return renderWeights();
  }
}

/** Instruments wide enough to take the full row under the copy, instead
 *  of the right-hand column beside it. */
const WIDE = new Set<Instrument>(['replay-full', 'replay-compact', 'ask-full', 'ask-home', 'machine-full']);

function items(list: Section['items']): string {
  if (!list?.length) return '';
  return `<div class="items" data-count="${list.length}">${list
    .map(
      (it, i) => `<article class="item" data-reveal style="--i:${i}">
      <span class="item-idx mono" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
      <h3 class="h3">${rich(it.title)}</h3>
      <p>${rich(it.body)}</p>
    </article>`,
    )
    .join('')}</div>`;
}

function bullets(list: string[] | undefined): string {
  if (!list?.length) return '';
  return `<ul class="bullets" data-reveal>${list.map((l) => `<li>${rich(l)}</li>`).join('')}</ul>`;
}

function table(t: Section['table']): string {
  if (!t) return '';
  return `<div class="tbl-wrap" data-reveal><table class="tbl">
    <thead><tr>${t.head.map((h) => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead>
    <tbody>${t.rows
      .map((r) => `<tr>${r.map((c, i) => (i === 0 ? `<th scope="row">${rich(c)}</th>` : `<td>${rich(c)}</td>`)).join('')}</tr>`)
      .join('')}</tbody>
  </table></div>`;
}

function defs(dl: Section['dl'], label?: string): string {
  if (!dl?.length) return '';
  return `${label ? `<p class="label defs-label" data-reveal>${esc(label)}</p>` : ''}<dl class="defs" data-reveal>${dl
    .map((d) => `<div class="def"><dt>${rich(d.label)}</dt><dd>${rich(d.value)}</dd></div>`)
    .join('')}</dl>`;
}

/**
 * One content Section. `n` is its § number on the page (the hero is §01).
 * `src` is the content module path ("content-service-seo.ts#sections.fix").
 */
export function renderSection(
  s: Section,
  n: number,
  src: string,
  opts: { band?: boolean; ctx?: InstrumentCtx; ld?: string; ldType?: string } = {},
): string {
  const inst = s.instrument;
  const instChip = inst && RAIL_CHIP[inst] ? chip(RAIL_CHIP[inst]!) : '';
  const instHtml = inst ? renderInstrument(inst, opts.ctx) : '';
  const wide = !inst || WIDE.has(inst) || Boolean(s.items?.length || s.table);

  /* A section that is only words reads as an editorial spread: the
     headline on the left, the argument on the right. Anything with an
     instrument, a grid or a table keeps the stacked layout it needs. */
  const textOnly = !inst && !s.items?.length && !s.table && !s.hatch;
  const copy = textOnly
    ? `<div class="sec-copy sec-copy--split">
      <div class="sec-head">
        ${eyebrow(s.eyebrow)}
        ${headline(s.headline)}
      </div>
      <div class="sec-main">
        ${prose(s.body, 'prose')}
        ${bullets(s.list)}
        ${defs(s.dl, s.dlLabel)}
        ${linkRow(s.links)}
      </div>
    </div>`
    : `<div class="sec-copy">
      ${eyebrow(s.eyebrow)}
      ${headline(s.headline)}
      ${prose(s.body, 'prose sec-body')}
      ${bullets(s.list)}
      ${defs(s.dl, s.dlLabel)}
    </div>`;

  const extras = `${items(s.items)}${table(s.table)}`;
  const body = s.hatch ? hatch(s.hatch, `<div class="hatch-inner">${copy}</div>`) : copy;

  const layout =
    inst && !wide
      ? `<div class="split">${body}<div class="sec-inst" data-reveal>${instHtml}</div></div>${extras}`
      : `${body}${extras}${inst ? `<div class="sec-inst sec-inst--wide" data-reveal>${instHtml}</div>` : ''}`;

  return `${sectionOpen({
    id: s.id,
    src,
    renderer: 'sections/kit.ts#renderSection',
    band: opts.band,
    ld: opts.ld,
    ldType: opts.ldType,
  })}
    <div class="wrap">
      ${rail(n, s.id, instChip)}
      ${layout}
      ${textOnly ? '' : linkRow(s.links)}
    </div>
  </section>`;
}

/** "Built under" and "Next" at the foot of every case page. */
export function renderCaseFoot(f: CaseFoot | undefined, n: number, src: string): string {
  if (!f) return '';
  return `${sectionOpen({ id: 'built-under', src, renderer: 'sections/kit.ts#renderCaseFoot', cls: 'casefoot' })}
    <div class="wrap">
      ${rail(n, 'built-under')}
      <div class="casefoot-grid">
        <div>
          <p class="label">Built under</p>
          ${linkRow(f.builtUnder)}
        </div>
        <div>
          <p class="label">Next</p>
          ${linkRow([f.next])}
        </div>
      </div>
    </div>
  </section>`;
}
