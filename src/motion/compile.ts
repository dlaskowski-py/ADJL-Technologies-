/**
 * Compile: the h1 shows its own markup for a moment, then builds.
 *
 * Markup contract: [data-compile] on every h1 (displayHeadline()). Full and
 * lite tiers, once, after `load`, `document.fonts.ready` and one frame (on
 * the home page, after the opening sequence has handed off), so the h1 has
 * painted as the LCP long before anything here touches it:
 *
 *   0ms     the em loses its copper (colour only: no reflow, no new LCP
 *           entry) and `{em}` / `{/em}` appear in the line gap, above-left
 *           of where the emphasis starts and above-right of where it ends
 *           (not right after the opening sequence: the visitor has just
 *           watched code being typed, and two more labels on the finished
 *           headline read as a leftover; the caret and the copper still run)
 *   120ms   a 2px copper caret sweeps each line once, 120ms apart
 *   360ms   the markers fold toward the em's edges as it turns copper again
 *   1.6s    the overlay and the attribute are gone
 *
 * The overlay is aria-hidden and built with textContent; the markers never
 * exist in HTML. Reduced and JS off: the plain h1, em in copper. Pause
 * motion mid-effect ends it at once.
 */
import { afterIntro, onMotionChange, tier } from './prefs';

const ATTR = 'data-compiling';

export function initCompile(): void {
  const h1 = document.querySelector<HTMLElement>('h1[data-compile]');
  if (!h1 || tier === 'reduced') return;
  const go = () => void document.fonts.ready.then(() => requestAnimationFrame(() => run(h1)));
  /* While the opening sequence covers the page, wait for its hand-off, so
     the effect plays where the visitor can see it (prefs.ts afterIntro). */
  if (document.documentElement.dataset.intro === 'play') afterIntro(go);
  else if (document.readyState === 'complete') go();
  else window.addEventListener('load', go, { once: true });
}

function run(h1: HTMLElement): void {
  const box = h1.getBoundingClientRect();
  if (tier === 'reduced' || box.bottom < 0 || box.top > window.innerHeight) return;
  const fs = parseFloat(getComputedStyle(h1).fontSize) || 48;
  const layer = document.createElement('span');
  layer.setAttribute('data-compile-layer', '');
  layer.setAttribute('aria-hidden', 'true');
  const put = (el: HTMLElement, x: number, y: number) => {
    el.style.left = `${x.toFixed(1)}px`;
    el.style.top = `${y.toFixed(1)}px`;
    return layer.appendChild(el);
  };
  const ease = 'cubic-bezier(.16,1,.3,1)';

  /* The markers: the content box of a line starts above the glyphs, so
     0.2em down from its top is the gap between this line's ascenders and
     the line above. Each is kept inside the h1, so nothing overflows. */
  const em = h1.querySelector('em');
  const rects = em ? em.getClientRects() : [];
  if (rects.length && document.documentElement.dataset.intro !== 'done') {
    const first = rects[0];
    const last = rects[rects.length - 1];
    const ch = 0.26 * 0.6 * fs;
    const mark = (text: string, x: number, y: number) => {
      const m = document.createElement('span');
      m.setAttribute('data-mark', text[1] === '/' ? 'close' : 'open');
      m.textContent = text;
      put(m, Math.max(0, Math.min(x, box.width - text.length * ch)), y).animate(
        [
          { opacity: 0, transform: 'scaleX(1)' },
          { opacity: 1, offset: 0.2 },
          { opacity: 1, transform: 'scaleX(1)', offset: 0.6, easing: ease },
          { opacity: 1, transform: 'scaleX(0)' },
        ],
        { duration: 600, fill: 'forwards' },
      );
    };
    mark('{em}', first.left - box.left - 4 * ch, first.top - box.top + 0.2 * fs);
    mark('{/em}', last.right - box.left, last.top - box.top + 0.2 * fs);
  }

  /* The caret: one pass per line, lines found from a Range over each text
     node (over the h1 itself, it would also return the block boxes). */
  const range = document.createRange();
  const lines: [number, number, number][] = [];
  const walker = document.createTreeWalker(h1, NodeFilter.SHOW_TEXT);
  const rs: DOMRect[] = [];
  for (let t = walker.nextNode(); t; t = walker.nextNode()) {
    range.selectNodeContents(t);
    rs.push(...Array.from(range.getClientRects()));
  }
  for (const r of rs) {
    if (r.width < 1) continue;
    const l = lines.find((x) => Math.abs(x[0] - r.top) < fs * 0.3);
    if (l) {
      l[1] = Math.min(l[1], r.left);
      l[2] = Math.max(l[2], r.right);
    } else lines.push([r.top, r.left, r.right]);
  }
  lines.forEach(([top, left, right], i) => {
    const c = document.createElement('span');
    c.setAttribute('data-caret', '');
    c.style.height = `${(0.9 * fs).toFixed(1)}px`;
    put(c, left - box.left, top - box.top + 0.3 * fs).animate(
      [
        { opacity: 0, transform: 'translateX(0)' },
        { opacity: 1, offset: 0.06 },
        { opacity: 1, offset: 0.9 },
        { opacity: 0, transform: `translateX(${(right - left).toFixed(1)}px)` },
      ],
      { duration: 480, delay: 120 + i * 120, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'both' },
    );
  });

  h1.setAttribute(ATTR, 'in');
  h1.appendChild(layer);
  const timers = [
    window.setTimeout(() => h1.setAttribute(ATTR, 'out'), 360),
    window.setTimeout(() => end(), 1600),
  ];
  const end = () => {
    timers.forEach((t) => window.clearTimeout(t));
    layer.remove();
    h1.removeAttribute(ATTR);
  };
  onMotionChange((t) => {
    if (t === 'reduced') end();
  });
}
