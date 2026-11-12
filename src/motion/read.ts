/**
 * The reading switch: Plain or Technical, for the whole site.
 *
 * public/js-on.js puts the reading on <html data-read> before first paint,
 * from local storage ('adjl:read', default plain), and keeps it current
 * when a page comes back from the back/forward cache or another tab
 * switches. Base CSS shows whichever of each pair of alternatives
 * ([data-for="plain"], [data-for="technical"]) the reading calls for. So
 * the page is already right before this module loads; this wires the
 * buttons, remembers a new choice, keeps aria-pressed true to the
 * attribute and tells a screen reader what changed.
 *
 * Markup contract: [data-read-toggle] (the nav bar and the phone menu,
 * src/sections/nav.ts), with buttons [data-read-set="plain|technical"],
 * and one polite live region [data-read-say] carrying the words to say
 * (data-say-plain, data-say-technical), so this module imports no copy.
 * boot.ts loads it with lazyOn() when the switch nears the viewport; the
 * ⌘K palette imports setRead() to switch from there.
 *
 * Switching shows or hides words above where the reader is looking, so
 * the first line under the nav bar is held where it was. The browser's own
 * scroll anchoring is switched off for that one change, because it picks
 * badly here: on a phone it held the wrong element, and the text under the
 * reader still slid by a line or more. The line held here is the highest
 * block of text that starts on screen, never one inside a sticky or fixed
 * panel (it doesn't move with the text) or a figure (it may sit centered
 * beside the text, and move by half as much).
 */

export type Reading = 'plain' | 'technical';

const KEY = 'adjl:read';
const root = document.documentElement;
let wired = false;

/** The reading the page is showing. */
export function getRead(): Reading {
  return root.dataset.read === 'technical' ? 'technical' : 'plain';
}

/** aria-pressed on every switch on the page follows the attribute. */
function sync(): void {
  const r = getRead();
  document.querySelectorAll<HTMLElement>('[data-read-toggle] [data-read-set]').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.readSet === r));
  });
}

/** Inside something that stays put while the page scrolls. */
function pinned(el: Element): boolean {
  for (let e: Element | null = el; e && e.tagName !== 'MAIN'; e = e.parentElement) {
    const p = getComputedStyle(e).position;
    if (p === 'sticky' || p === 'fixed') return true;
  }
  return false;
}

/** The line the reader is at: the highest block of text that starts on
 *  screen under the nav bar (or, when one long block fills the screen,
 *  the first one showing), and where it sits. */
function anchor(): { el: Element; top: number } | null {
  const navH = document.querySelector('.nav')?.getBoundingClientRect().bottom ?? 0;
  let best: { el: Element; top: number } | null = null;
  let cut: { el: Element; top: number } | null = null;
  for (const el of document.querySelectorAll('main :is(h1, h2, h3, p, li, dt, dd, summary, pre)')) {
    const r = el.getBoundingClientRect();
    if (!r.height || r.bottom <= navH || r.top >= window.innerHeight) continue;
    if (el.closest('figure') || pinned(el)) continue;
    if (r.top < navH - 1) cut ??= { el, top: r.top };
    else if (!best || r.top < best.top) best = { el, top: r.top };
  }
  return best ?? cut;
}

/** Switch the whole site's reading. Safe to call with the current one. */
export function setRead(r: Reading): void {
  if (r !== getRead()) {
    const a = window.scrollY > 0 ? anchor() : null;
    root.style.overflowAnchor = 'none';
    root.dataset.read = r;
    try {
      localStorage.setItem(KEY, r);
    } catch {
      /* Storage blocked: this page switches, the next one reads plain. */
    }
    if (a) {
      const moved = Math.round(a.el.getBoundingClientRect().top - a.top);
      if (moved) window.scrollBy({ top: moved, behavior: 'instant' });
    }
    root.style.overflowAnchor = '';
    const say = document.querySelector<HTMLElement>('[data-read-say]');
    const words = say?.getAttribute(`data-say-${r}`);
    if (say && words) {
      say.textContent = '';
      window.setTimeout(() => (say.textContent = words), 60);
    }
    document.dispatchEvent(new CustomEvent('adjl:read', { detail: r }));
  }
  sync();
}

export function initRead(): void {
  if (wired) return;
  wired = true;
  document.querySelectorAll<HTMLElement>('[data-read-toggle] [data-read-set]').forEach((b) =>
    b.addEventListener('click', () => setRead(b.dataset.readSet === 'technical' ? 'technical' : 'plain')),
  );
  /* js-on.js changes the attribute on its own after a back/forward
     restore or a switch in another tab. */
  new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ['data-read'] });
  sync();
}
