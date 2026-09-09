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

/** House headline device: {em}word{/em} becomes the copper emphasis span. */
export function em(s: string): string {
  return esc(s).replace(/\{em\}(.+?)\{\/em\}/g, '<em>$1</em>');
}

/** Inline code/keyword device for body copy: {k}word{/k}. */
export function kw(s: string): string {
  return em(s).replace(/\{k\}(.+?)\{\/k\}/g, '<span class="kwd">$1</span>');
}

/** Multi-line headline — each entry is its own line. */
export function headline(lines: string[], cls = 'h2'): string {
  return `<h2 class="${cls}">${lines.map((l) => `<span class="hl-line">${em(l)}</span>`).join('')}</h2>`;
}

export function displayHeadline(lines: string[]): string {
  return `<h1 class="display" data-reveal="mask">${lines
    .map((l, i) => `<span style="--i:${i}"><span>${em(l)}</span></span>`)
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
        `<li data-reveal><span class="check" aria-hidden="true"></span><span>${kw(p)}</span></li>`,
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
export function backdrop(name: string, variant = ''): string {
  return `<div class="backdrop ${variant}" data-video="${esc(name)}"${
    HAS_WEBM.has(name) ? ' data-webm="true"' : ''
  } aria-hidden="true">
      <img class="bd-poster" src="/media/${esc(name)}.jpg" alt="" loading="lazy" decoding="async" />
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
