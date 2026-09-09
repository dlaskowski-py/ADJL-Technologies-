/**
 * Everything that runs on every page, in one place.
 *
 * Each page's entry module renders its own markup and then calls boot(). The
 * alternative — every entry listing eleven init calls — is eleven lists to
 * keep in step, and Capital's site has a scar from exactly that.
 *
 * Order matters in one respect only: initReveal() assigns the stagger indices
 * that CSS reads, so it runs before anything that could reveal an element
 * early.
 */

import './styles/fonts.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/sections.css';

import { initReveal } from './motion/reveal';
import { initScrub } from './motion/scrub';
import { initField } from './motion/field';
import { initCounters } from './motion/counters';
import { initVideo } from './motion/video';
import { initFlow } from './motion/flow';
import { initMarquee } from './motion/marquee';
import { initConsole } from './motion/typeline';
import { initWordmark } from './motion/wordmark';
import { initMagnetic, initTilt } from './motion/tilt';
import { initCopyMail, initFaq, initMenu, initNav } from './ui';

/**
 * Mount prerendered markup, or render it if the shell is empty.
 *
 * In production the build has already written the markup into the HTML, so
 * there is nothing to do — bailing out here is what keeps the first paint
 * from being thrown away and re-done.
 */
export function mount(render: () => { navHtml: string; pageHtml: string }): void {
  const nav = document.getElementById('nav-root');
  const page = document.getElementById('page');
  if (!nav || !page) return;
  if (page.children.length > 0) return;

  const { navHtml, pageHtml } = render();
  nav.innerHTML = navHtml;
  page.innerHTML = pageHtml;
}

export function boot(): void {
  initNav();
  initMenu();
  initFaq();
  initCopyMail();
  initWordmark();

  initReveal();
  initScrub();
  initCounters();
  initVideo();
  initFlow();
  initMarquee();
  initConsole();
  initTilt();
  initMagnetic();
  initField();
}
