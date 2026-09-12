/**
 * Tiny markup helpers shared by every section module.
 *
 * Sections build HTML strings rather than DOM nodes: the page is static, one
 * innerHTML write beats hundreds of createElement calls, and — the reason that
 * actually matters — a pure string function runs in Node, which is what lets
 * scripts/prerender.mjs emit the whole site as static HTML at build time.
 *
 * Nothing in this file may touch `document`.
 */

import { HAS_WEBM } from '../media-manifest';

/** Escape interpolated text. */
export function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Escape, then render BOTH authoring markers: {em}…{/em} to the copper
 * emphasis span, {k}…{/k} to the keyword span.
 *
 * ONE function on purpose. This was two — em() for headlines and kw() for
 * body copy — and the split was a trap rather than a distinction: every
 * renderer had to remember which of two nearly identical helpers its field
 * needed, and getting it wrong produced no error, no broken markup and no
 * failing guard. It simply shipped the braces as visible text.
 *
 * It fired twice. Once in workhub.ts, which reached for esc() and printed
 * "{em}underwriting.{/em}" inside the main heading of /work/. Once in
 * flow.ts, which used em() on step bodies that contain {k} and printed those
 * braces on two case pages. Both files used the right helper immediately
 * above and below the wrong one.
 *
 * So there is now one call for all human-readable text, esc() is for
 * attributes, and scripts/check-markers.mjs fails the build if a marker ever
 * reaches dist/ again.
 */
export function rich(s: string): string {
  return esc(s)
    .replace(/\{em\}(.+?)\{\/em\}/g, '<em>$1</em>')
    .replace(/\{k\}(.+?)\{\/k\}/g, '<span class="kwd">$1</span>');
}

/** Multi-line headline — each entry is its own line. */
export function headline(lines: string[], cls = 'h2'): string {
  return `<h2 class="${cls}">${lines.map((l) => `<span class="hl-line">${rich(l)}</span>`).join('')}</h2>`;
}

export function displayHeadline(lines: string[]): string {
  return `<h1 class="display" data-reveal="mask">${lines
    .map((l, i) => `<span style="--i:${i}"><span>${rich(l)}</span></span>`)
    .join('')}</h1>`;
}

export function eyebrow(text: string): string {
  return `<p class="eyebrow" data-reveal>${esc(text)}</p>`;
}

/** Checklist, used across the practice and case pages. */
export function checklist(points: string[]): string {
  return `<ul class="checks" data-stagger>${points
    .map(
      (p) =>
        `<li data-reveal><span class="check" aria-hidden="true"></span><span>${rich(p)}</span></li>`,
    )
    .join('')}</ul>`;
}

/**
 * A film.
 *
 * `variant` decides whether it is a ground or an object. Full-bleed film with
 * copy on top takes the hero veil; film inside a frame with no text on it
 * takes the plate veil and keeps almost all of its light.
 */
export function backdrop(name: string, variant = '', eager = false): string {
  /* THE FIRST BACKDROP ON A PAGE IS THE LCP ELEMENT. It used to be emitted
     `loading="lazy"` like every other one, which defers the single image the
     score is measured on — and on the home page it silently cancelled the
     `<link rel=preload fetchpriority=high>` in the shell, because the
     browser preloaded the file at high priority and then the lazy attribute
     made the element wait for layout anyway. Heroes pass eager; the plates
     below the fold stay lazy, which is what lazy is for. */
  const loading = eager
    ? 'loading="eager" fetchpriority="high"'
    : 'loading="lazy" decoding="async"';
  return `<div class="backdrop ${variant}" data-video="${esc(name)}"${
    HAS_WEBM.has(name) ? ' data-webm="true"' : ''
  } aria-hidden="true">
      <img class="bd-poster" src="/media/${esc(name)}.jpg" alt="" ${loading} />
    </div>`;
}

/** Film shown as a framed object, with a caption underneath. */
export function filmPlate(name: string, caption: string, cls = ''): string {
  return `<figure class="plate ${cls}" data-reveal>
    <div class="plate-frame">
      ${backdrop(name, 'backdrop--plate')}
      <span class="plate-grid" aria-hidden="true"></span>
    </div>
    <figcaption class="plate-cap label">${esc(caption)}</figcaption>
  </figure>`;
}
