/**
 * Tiny markup helpers shared by every section module.
 *
 * Sections build HTML strings, not DOM nodes: a pure string function runs
 * in Node, which is what lets scripts/prerender.mjs emit the whole site as
 * static HTML at build time. Nothing in this file may touch `document`.
 */

import { prov as PROV } from '../content';

/** Escape interpolated text (attributes and anything that isn't copy). */
export function esc(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Escape, then render BOTH authoring markers: {em}…{/em} to the copper
 * emphasis, {k}…{/k} to the keyword span. ONE function for all human-
 * readable text; esc() is for attributes. scripts/check-markers.mjs fails
 * the build if a marker ever reaches dist/ as literal braces.
 */
export function rich(s: string): string {
  return esc(s)
    .replace(/\{em\}(.+?)\{\/em\}/g, '<em>$1</em>')
    .replace(/\{k\}(.+?)\{\/k\}/g, '<span class="kwd">$1</span>');
}

/** Strip the markers for plain-text uses (aria-labels, meta). */
export function plain(s: string): string {
  return s.replace(/\{\/?(em|k)\}/g, '');
}

/** h2: each authored line its own block, each line decoding on entry. */
export function headline(lines: string[], cls = 'h2'): string {
  return `<h2 class="${cls}" data-reveal>${lines
    .map((l) => `<span class="hl-line" data-decode>${rich(l)}</span>`)
    .join('')}</h2>`;
}

/** The page's one h1. Never animates in: it's the LCP and it paints at
 *  once on every tier. data-compile lets compile.ts play its marker effect
 *  over the already-painted text. */
export function displayHeadline(lines: string[]): string {
  return `<h1 class="display" data-compile>${lines
    .map((l) => `<span class="hl-line">${rich(l)}</span>`)
    .join('')}</h1>`;
}

export function eyebrow(text: string, reveal = true): string {
  return `<p class="eyebrow"${reveal ? ' data-reveal' : ''}>${esc(text)}</p>`;
}

export type ProvKind = 'live' | 'build' | 'recorded' | 'illustration';

const GLYPH: Record<ProvKind, string> = {
  live: '●',
  build: '◆',
  recorded: '■',
  illustration: '○',
};

/** A provenance chip. `note` extends the label, e.g. "names simplified". */
export function chip(kind: ProvKind, note = ''): string {
  const p = PROV[kind];
  const label = note ? `${p.label} · ${note}` : p.label;
  return `<span class="prov" data-prov="${kind}" data-chrome title="${esc(p.def)}"><i aria-hidden="true">${
    GLYPH[kind]
  }</i> ${esc(label)}</span>`;
}

/** The section head rail: §03 · /machine ───── [chip]. */
export function rail(n: number, id: string, provChip = ''): string {
  return `<div class="rail" data-reveal data-chrome><span class="rail-num" aria-hidden="true">§${String(n).padStart(
    2,
    '0',
  )}</span><span class="rail-path" aria-hidden="true">/${esc(id)}</span><span class="rail-line" aria-hidden="true"></span>${provChip}</div>`;
}

/** Hatched block: deliberately not shown, always labeled. */
export function hatch(label: string, inner = ''): string {
  return `<div class="hatch hatch-block"><span class="hatch-label">${esc(label)}</span>${inner}</div>`;
}

export function checklist(points: string[]): string {
  return `<ul class="checks">${points
    .map((p) => `<li><span class="check" aria-hidden="true">✓</span><span>${rich(p)}</span></li>`)
    .join('')}</ul>`;
}

/** Paragraphs of body copy. */
export function prose(paras: string[] | string | undefined, cls = 'prose'): string {
  if (!paras) return '';
  const list = Array.isArray(paras) ? paras : [paras];
  if (!list.length) return '';
  return `<div class="${cls}" data-reveal>${list.map((p) => `<p>${rich(p)}</p>`).join('')}</div>`;
}

/** A row of descriptive links ("Built under", "Proof", "Next"). */
export function linkRow(links: { label: string; href: string }[] | undefined, cls = 'linkrow'): string {
  if (!links?.length) return '';
  return `<ul class="${cls}" data-reveal>${links
    .map(
      (l) =>
        `<li><a class="alink" href="${esc(l.href)}"><span>${esc(l.label)}</span><span class="arw" aria-hidden="true">→</span></a></li>`,
    )
    .join('')}</ul>`;
}

/** A spec rail: the label/value pairs under a hero or on a practice panel. */
export function specRail(specs: { label: string; value: string }[] | undefined, cls = 'specs'): string {
  if (!specs?.length) return '';
  return `<dl class="${cls}">${specs
    .map((s) => `<div class="spec"><dt>${esc(s.label)}</dt><dd>${rich(s.value)}</dd></div>`)
    .join('')}</dl>`;
}

export type SectionAttrs = {
  id: string;
  /** content module path and export, e.g. "content.ts#hero". */
  src: string;
  /** renderer file and function, e.g. "sections/top.ts#renderHero". */
  renderer: string;
  band?: boolean;
  /** JSON-LD node this section is described by: '#service', '#webpage'… */
  ld?: string;
  ldType?: string;
  cls?: string;
  extra?: string;
};

/** Open a <section> carrying everything Source and Machine view read. */
export function sectionOpen(a: SectionAttrs): string {
  const cls = ['sec', a.band ? 'sec--band' : '', a.cls ?? ''].filter(Boolean).join(' ');
  return `<section class="${cls}" id="${esc(a.id)}" data-src="${esc(a.src)}" data-renderer="${esc(
    a.renderer,
  )}"${a.ld ? ` data-ld="${esc(a.ld)}"` : ''}${a.ldType ? ` data-ld-type="${esc(a.ldType)}"` : ''}${
    a.extra ? ` ${a.extra}` : ''
  }>`;
}
