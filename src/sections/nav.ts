/**
 * THE nav bar. One of them, for every page; the only thing that varies is
 * `here`, the page's own route, which marks the current link and decides
 * where the wordmark points.
 *
 * Desktop: wordmark · the three practices, Work, Approach · the reading
 * switch and Jump to ⌘K (both script-only) · the CTA. Under 1160px: a
 * burger and a menu holding the same links plus the reading switch, the
 * view switch and Pause motion.
 */

import { nav as siteNav, status } from '../content';
import { reading as R } from '../content-glossary';
import { esc } from './html';
import { renderViews } from './instruments/views';

/** Three bars, the middle one copper. Capital's favicon geometry. */
export function markSvg(): string {
  return `<span class="wm-mark" aria-hidden="true"><i class="wm-bar"></i><i class="wm-bar wm-bar--signal"></i><i class="wm-bar"></i></span>`;
}

function current(href: string, here: string): boolean {
  return href === here || (href !== '/' && here.startsWith(href));
}

/**
 * The reading switch: Plain or Technical (content-glossary.ts). Two
 * buttons with aria-pressed in a labeled group; motion/read.ts wires them,
 * keeps aria-pressed true to <html data-read> and remembers the choice.
 * The highlight is drawn from html[data-read] in CSS, not from
 * aria-pressed, so a stored Technical shows on the first frame, before
 * any module has loaded. Script-only: without JavaScript the site reads
 * plain and there's nothing to switch. Rendered twice, in the bar (wide
 * screens) and in the phone menu, where it carries a visible label.
 */
function readSwitch(where: 'bar' | 'menu'): string {
  const opt = (mode: 'plain' | 'technical') =>
    `<button class="read-opt" type="button" data-read-set="${mode}" aria-pressed="${mode === 'plain'}">${esc(
      R[mode],
    )}</button>`;
  const name =
    where === 'menu'
      ? `aria-labelledby="read-label-menu"><span class="read-label" id="read-label-menu">${esc(R.label)}</span>`
      : `aria-label="${esc(R.label)}" title="${esc(R.hint)}">`;
  return `<div class="read-switch" role="group" data-read-toggle="${where}" data-js-only data-chrome ${name}<span class="read-track">${opt(
    'plain',
  )}${opt('technical')}</span></div>`;
}

export function renderNav(here: string): string {
  const { wordmark, links, cta } = siteNav;
  const home = here === '/';

  const items = links
    .map(
      (l) =>
        `<a class="nav-link" href="${esc(l.href)}"${current(l.href, here) ? ' aria-current="page"' : ''}>${esc(
          l.label,
        )}</a>`,
    )
    .join('');
  /* On /start/ itself the CTA is the page you're on. */
  const ctaCurrent = here === cta.href ? ' aria-current="page"' : '';

  return `<header class="nav" id="nav">
    <div class="nav-inner">
      <a class="wordmark" href="${home ? '#top' : '/'}" aria-label="ADJL Technology, ${home ? 'back to top' : 'home'}">
        ${markSvg()}
        <span class="wm-text"><span>${esc(wordmark.lead)}</span> <b>${esc(wordmark.tail)}</b></span>
      </a>
      <nav class="nav-links" aria-label="Primary">${items}</nav>
      <div class="nav-end">
        ${readSwitch('bar')}
        <button class="nav-jump" type="button" data-palette data-js-only aria-haspopup="dialog" aria-keyshortcuts="Meta+K Control+K">
          <span>${esc(siteNav.jump)}</span><kbd aria-hidden="true">⌘K</kbd>
        </button>
        <a class="btn btn--primary nav-cta" href="${esc(cta.href)}"${ctaCurrent}>${esc(cta.label)}</a>
        <button class="nav-burger" type="button" aria-label="${esc(siteNav.menu.open)}" aria-expanded="false" aria-controls="mobile-menu" data-label-open="${esc(
          siteNav.menu.open,
        )}" data-label-close="${esc(siteNav.menu.close)}">
          <span></span><span></span>
        </button>
      </div>
    </div>
    <div class="nav-progress" aria-hidden="true"><i></i></div>
    <span class="sr-only" data-read-say aria-live="polite" data-say-plain="${esc(R.say.plain)}" data-say-technical="${esc(
      R.say.technical,
    )}"></span>
    <div class="mobile-menu" id="mobile-menu" hidden>
      <nav class="mobile-links" aria-label="Primary, mobile">${items}</nav>
      <div class="mobile-tools" data-js-only>
        ${readSwitch('menu')}
        ${renderViews('menu')}
        <button class="pause-btn" type="button" data-pause aria-pressed="false">${esc(status.pause)}</button>
      </div>
      <a class="btn btn--primary mobile-cta" href="${esc(cta.href)}"${ctaCurrent}>${esc(cta.label)}</a>
    </div>
  </header>`;
}
