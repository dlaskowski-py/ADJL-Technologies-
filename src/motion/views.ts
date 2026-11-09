/**
 * [data-views]: Render / Source / Machine, the three ways to look at a page.
 *
 * The switch is a fieldset of native radios, rendered twice (the status bar
 * and the mobile menu). This core is in every page's first load and stays
 * small: it keeps both copies in sync, puts the state on <html data-view>,
 * announces each change once in the status bar's polite region and plays
 * the transition. The modes themselves load on first use:
 *
 *   machine  ./views/view-machine.ts  outline numbers, the drawer
 *   source   ./views/view-source.ts   a sheet per section from /source/*.json
 *
 * Machine view is mostly CSS under html[data-view=machine] (views.css):
 * this file stamps the heading numbers it labels before the chunk arrives,
 * so the labels appear with the scanline, not after a fetch.
 *
 * State resets to Render on every load. Nothing is stored: a view is a way
 * of reading this page, not a preference.
 *
 * Transition by tier: full sweeps a copper scanline down the viewport and
 * lets annotations appear as it passes; lite crossfades in 150 ms; reduced
 * switches instantly.
 */
import { tier } from './prefs';

export type View = 'render' | 'source' | 'machine';

type Mode = { enter(): void | Promise<void>; leave(): void };

const root = document.documentElement;
let current: View = 'render';
const modes: Partial<Record<View, Promise<Mode>>> = {};

function mode(v: View): Promise<Mode> | null {
  if (v === 'render') return null;
  if (!modes[v]) {
    modes[v] = (v === 'machine' ? import('./views/view-machine') : import('./views/view-source')).then(
      (m) => m.default as Mode,
    );
  }
  return modes[v]!;
}

/** Heading outline numbers for Machine view's CSS labels: h1 is 0, then
 *  2, 2.1, 2.1.1. (machine-kit.ts has the same rule for the readout; this
 *  copy keeps the first-load bundle free of it.) Headings inside the
 *  exclusion set (lib/exclude.ts) aren't in the outline a crawler reads,
 *  so they aren't numbered: the labels match the drawer's outline. */
const SKIP = '[aria-hidden="true"],[data-chrome],[data-machine],[data-ask-pre],[data-source-sheet]';
function stampHeadings(): void {
  const c = [0, 0, 0];
  document.querySelectorAll<HTMLElement>('main h1, main h2, main h3').forEach((h) => {
    if (h.closest(SKIP)) return;
    const l = Number(h.tagName[1]);
    if (l === 1) {
      h.dataset.x = '0';
      return;
    }
    c[l - 1]++;
    for (let k = l; k < 3; k++) c[k] = 0;
    h.dataset.x = c.slice(1, l).join('.');
  });
}

/** Where each section's top sits in the viewport (0 top, 1 bottom), so an
 *  annotation can wait until the scanline reaches it. */
function stampSweep(): void {
  const vh = window.innerHeight || 1;
  document.querySelectorAll<HTMLElement>('main > section[id], body > header, body > footer, main > [data-src]').forEach((s) => {
    const t = s.getBoundingClientRect().top / vh;
    s.style.setProperty('--sy', String(Math.min(1, Math.max(0, t)).toFixed(3)));
  });
}

function play(): void {
  if (tier === 'reduced' || root.dataset.motion === 'reduced') return;
  const full = root.dataset.motion === 'full';
  root.dataset.viewAnim = full ? 'scan' : 'fade';
  if (full) {
    stampSweep();
    const line = document.createElement('div');
    line.dataset.scan = '';
    line.setAttribute('aria-hidden', 'true');
    document.body.append(line);
    line.addEventListener('animationend', () => line.remove(), { once: true });
    window.setTimeout(() => line.remove(), 900);
  }
  window.setTimeout(() => {
    if (root.dataset.viewAnim) delete root.dataset.viewAnim;
  }, full ? 700 : 260);
}

/** Switch the page to a view. Safe to call with the current view. */
export function setView(v: View): void {
  document.querySelectorAll<HTMLInputElement>('[data-views] input[type="radio"]').forEach((i) => {
    i.checked = i.value === v;
  });
  if (v === current) return;
  const prev = current;
  current = v;

  if (v === 'machine') stampHeadings();
  play();
  root.dataset.view = v;

  const say = document.querySelector<HTMLElement>('[data-views="status"]')?.getAttribute(`data-say-${v}`);
  const region = document.querySelector<HTMLElement>('[data-views-announce]');
  if (region && say) {
    region.textContent = '';
    window.setTimeout(() => (region.textContent = say), 60);
  }

  const out = mode(prev);
  if (out) void out.then((m) => current !== prev && m.leave());
  const into = mode(v);
  if (into) void into.then((m) => current === v && m.enter());
}

export function initViews(): void {
  const sets = document.querySelectorAll<HTMLElement>('[data-views]');
  if (!sets.length) return;
  root.dataset.view = 'render';

  /* The one decorative label Machine view's CSS draws comes from the
     content module, via the markup, as a CSS string. */
  const hidden = document.querySelector<HTMLElement>('[data-views="status"]')?.dataset.hiddenLabel;
  if (hidden) root.style.setProperty('--x-hidden', JSON.stringify(hidden));

  sets.forEach((fs) => {
    fs.addEventListener('change', (e) => {
      const t = e.target as HTMLInputElement;
      if (t.type !== 'radio') return;
      setView(t.value as View);
      /* Chosen from the mobile menu: close it, so the page it changed is
         what's on screen. */
      if (fs.dataset.views === 'menu') {
        document.querySelector<HTMLButtonElement>('.nav-burger[aria-expanded="true"]')?.click();
      }
    });
  });

  /* "See the whole page as a crawler does": in Machine View panels and the
     hero figure. Delegated, so it works before their modules load. */
  document.addEventListener('click', (e) => {
    const b = (e.target as Element | null)?.closest?.('[data-open-machine]');
    if (b) setView('machine');
  });
}
