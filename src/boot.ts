/**
 * Everything that runs on every page, in one place.
 *
 * Statically imported (small, needed at once): interaction, reveal, scroll
 * progress, the wordmark, the h1 compile effect, h2 decode, telemetry and
 * the view switch. Everything heavier loads lazily, only on pages that
 * carry its markup and only when that markup nears the viewport.
 */

import './styles/fonts.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/chrome.css';
import './styles/sections.css';
import './styles/pages.css';
import './styles/instruments/index.css';

import { capturePristine } from './pristine';
import { allowCanvas, lazyOn } from './motion/prefs';
import { initReveal } from './motion/reveal';
import { initScrub } from './motion/scrub';
import { initFlow } from './motion/flow';
import { initWordmark } from './motion/wordmark';
import { initCompile } from './motion/compile';
import { initDecode } from './motion/decode';
import { initTelemetry } from './motion/telemetry';
import { initViews } from './motion/views';
import { initScenes } from './motion/scenes';
import { initCopyMail, initFaq, initFilter, initMenu, initNav, initPause } from './ui';

type Render = () => { navHtml: string; pageHtml: string };

/**
 * Mount the page if the shell is empty (the dev server). In production the
 * build has already written the markup into the HTML, so there's nothing to
 * do, and bailing out is what keeps first paint from being thrown away.
 */
export function mount(render: Render): void {
  const nav = document.getElementById('nav-root');
  const page = document.getElementById('page');
  if (!nav || !page || page.children.length > 0) return;
  const { navHtml, pageHtml } = render();
  nav.innerHTML = navHtml;
  page.innerHTML = pageHtml;
}

function idle(fn: () => void, timeout = 1500): void {
  const ric = (window as Window & { requestIdleCallback?: (cb: () => void, o?: object) => number })
    .requestIdleCallback;
  if (ric) ric(fn, { timeout });
  else window.setTimeout(fn, 300);
}

export function boot(): void {
  /* FIRST, before any module touches the DOM: the lattice draws the page
     as it arrived, not the page after decode and reveals have run. */
  capturePristine();

  initNav();
  initMenu();
  initFaq();
  initCopyMail();
  initPause();
  initFilter();
  initWordmark();

  initReveal();
  initScrub();
  initFlow();
  initCompile();
  initDecode();
  initTelemetry();
  initViews();

  initScenes();
  /* The opening sequence (home only, first visit of a session): its CSS
     timeline is already running; this adds Skip and the hand-off. */
  if (document.querySelector('[data-intro-overlay]')) {
    void import('./motion/intro').then((m) => m.initIntro());
  }
  lazyOn('[data-typer]', () => import('./motion/typer').then((m) => m.initTyper()), '200px');
  lazyOn('[data-machine]', () => import('./motion/machine').then((m) => m.initMachine()), '400px');
  lazyOn('[data-ask]', () => import('./motion/ask').then((m) => m.initAsk()));
  lazyOn('[data-pipeline]', () => import('./motion/pipeline').then((m) => m.initPipeline()));
  lazyOn('[data-replay]', () => import('./motion/replay').then((m) => m.initReplay()));
  lazyOn('[data-leaders]', () => import('./motion/leaders').then((m) => m.initLeaders()));
  lazyOn('[data-headers]', () => import('./motion/headers').then((m) => m.initHeaders()));
  lazyOn('[data-scan]', () => import('./motion/scan').then((m) => m.initScan()));
  lazyOn('[data-assistant]', () => import('./motion/assistant').then((m) => m.initAssistant()));
  /* The reading switch sits in the nav, so it's in view at once on every
     page and this loads straight away. */
  lazyOn('[data-read-toggle]', () => import('./motion/read').then((m) => m.initRead()));

  /* The hero graph: full tier only, after load and at idle, so the h1
     paints and settles as the LCP before a shader compiles. */
  if (allowCanvas && document.querySelector('[data-lattice]')) {
    const go = () => idle(() => void import('./motion/lattice').then((m) => m.initLattice()));
    if (document.readyState === 'complete') go();
    else window.addEventListener('load', go, { once: true });
  }

  /* Smooth in-page scrolling, but only once the page has arrived (see
     base.css): a #fragment in the URL should land, not fly. */
  const smooth = () => {
    /* The browser re-applies the fragment scroll while layout settles, so
       land on the target ourselves, instantly, then turn smoothing on a
       beat later for clicks the visitor makes. */
    const target = location.hash.length > 1 ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;
    target?.scrollIntoView({ behavior: 'instant', block: 'start' });
    window.setTimeout(() => (document.documentElement.dataset.scroll = 'smooth'), 400);
  };
  if (document.readyState === 'complete') smooth();
  else window.addEventListener('load', smooth, { once: true });

  /* ⌘K / Ctrl K, and the nav button: the palette chunk loads on first use. */
  const openPalette = () => void import('./motion/palette').then((m) => m.initPalette());
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      openPalette();
    }
  });
  document.querySelectorAll('[data-palette]').forEach((b) => b.addEventListener('click', openPalette));
}

/** Entry point: mount in dev (empty shell) or go straight to boot. */
export async function start(load?: () => Promise<{ render: Render }>): Promise<void> {
  const page = document.getElementById('page');
  if (load && page && page.children.length === 0) {
    const m = await load();
    mount(m.render);
  }
  boot();
}
