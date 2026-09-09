/**
 * THE nav bar. One of them, for every page.
 *
 * Capital's site ran four hand-written copies of its bar and they had
 * already drifted — the same label pointing at two different URLs on two
 * different pages, which is not a decision anyone made, it is what four
 * copies do on their own. So there is one here, and the only thing that
 * varies is `here`: the page's own route, which picks the wordmark's target
 * and marks the current link.
 *
 * The current page keeps its link rather than dropping out of the bar.
 * Dropping it changes the bar's width from page to page and throws away the
 * "you are here" signal to do it — a reader who cannot see where they are is
 * worse off than one offered a link they do not need.
 */

import { nav as siteNav } from '../content';
import { esc } from './html';

/** The mark: three bars, the middle one copper. Capital's favicon geometry,
 *  given something to do on hover — see motion/wordmark.ts. */
function markSvg(): string {
  return `<span class="wm-mark" aria-hidden="true">
    <i class="wm-bar"></i><i class="wm-bar wm-bar--signal"></i><i class="wm-bar"></i>
  </span>`;
}

export function renderNav(here: string): string {
  const { wordmark, links, cta } = siteNav;
  const home = here === '/';

  const items = links
    .map(
      (l) =>
        `<a href="${l.href}"${
          l.href === here || (here.startsWith(l.href) && l.href !== '/') ? ' aria-current="page"' : ''
        }>${esc(l.label)}</a>`,
    )
    .join('');

  return `<header class="nav" id="nav">
    <div class="nav-inner">
      <a class="wordmark" href="${home ? '#top' : '/'}" aria-label="ADJL Technologies, ${
        home ? 'back to top' : 'home'
      }">
        ${markSvg()}
        <span class="wm-text"><span>${esc(wordmark.lead)}</span> <b>${esc(wordmark.tail)}</b></span>
      </a>
      <nav class="nav-links" aria-label="Primary">${items}</nav>
      <a class="nav-cta" href="${cta.href}">${esc(cta.label)}</a>
      <button class="nav-burger" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-menu">
        <span></span><span></span>
      </button>
    </div>
    <div class="nav-progress" aria-hidden="true"><i></i></div>
    <div class="mobile-menu" id="mobile-menu" hidden>
      ${items}
      <a class="mobile-cta" href="${cta.href}">${esc(cta.label)}</a>
    </div>
  </header>`;
}
