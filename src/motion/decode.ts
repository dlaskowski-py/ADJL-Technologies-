/**
 * Decode: h2 lines that resolve out of noise.
 *
 * Markup contract: [data-decode] on each .hl-line of every h2 (headline()).
 * Never on the h1, which is the LCP and never animates in. Full tier only,
 * once per line, on first entry, after `document.fonts.ready` so the
 * widths it measures are the widths of the real face.
 *
 * The prerendered text is the real text and stays the real text: crawlers,
 * no-JS visitors and the lite and reduced tiers never see a scrambled glyph.
 *
 *   NO LAYOUT SHIFT. A scrambled "W" is wider than an "i", so each
 *   character is measured where it already sits (a Range over the original
 *   text, kerning included) BEFORE anything changes, then boxed and locked
 *   to exactly that width, words held together nowrap. The boxes add up to
 *   the line as it was, so nothing wraps differently and nothing below
 *   moves. Resolved characters sit left in their box, where the glyph was;
 *   when the line is whole the original DOM goes back unchanged.
 *
 *   THE NAME NEVER SCRAMBLES. While any of its lines is noise, the h2
 *   carries an aria-label with its real text.
 *
 * Pause motion mid-decode resolves everything at once.
 */
import { onMotionChange, tier } from './prefs';

const GLYPHS = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789<>/\\{}[]=+*#%&$_';
const STEP_MS = 28;
const SPIN_MS = 360;
const noise = () => GLYPHS[(Math.random() * GLYPHS.length) | 0];

const labelled = new Map<Element, number>();
const running = new Set<() => void>();

export function initDecode(): void {
  if (tier !== 'full') return;
  const pending = new Set(
    Array.from(document.querySelectorAll<HTMLElement>('[data-decode]')).filter((el) => !el.closest('h1')),
  );
  if (!pending.size) return;
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        io.unobserve(e.target);
        pending.delete(e.target as HTMLElement);
        run(e.target as HTMLElement);
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.2 },
  );
  const watch = () => pending.forEach((el) => io.observe(el));
  void document.fonts.ready.then(() => tier === 'full' && watch());
  onMotionChange((t) => {
    io.disconnect();
    if (t === 'full') watch();
    else running.forEach((f) => f());
  });
}

function run(el: HTMLElement): void {
  const head = el.closest('h2') ?? el;
  const original = Array.from(el.childNodes).map((n) => n.cloneNode(true));

  /* 1. Read: every character's box, where it sits now. */
  const texts: Text[] = [];
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) texts.push(n as Text);
  const range = document.createRange();
  const widths = texts.map((t) => {
    const w: number[] = [];
    for (let i = 0; i < t.data.length; ) {
      const len = (t.data.codePointAt(i) ?? 0) > 0xffff ? 2 : 1;
      range.setStart(t, i);
      range.setEnd(t, i + len);
      w.push(range.getBoundingClientRect().width);
      i += len;
    }
    return w;
  });

  /* The heading's name, taken while every line of it is still real text. */
  const n = labelled.get(head);
  if (n) labelled.set(head, n + 1);
  else if (!head.hasAttribute('aria-label')) {
    head.setAttribute('aria-label', (head.textContent ?? '').replace(/\s+/g, ' ').trim());
    labelled.set(head, 1);
  }

  /* 2. Write: words nowrap, characters locked to their widths. */
  type Cell = { s: HTMLSpanElement; ch: string; at: number; done: boolean };
  const cells: Cell[] = [];
  texts.forEach((t, ti) => {
    const frag = document.createDocumentFragment();
    let k = 0;
    for (const part of t.data.split(/(\s+)/)) {
      if (!part) continue;
      const chars = Array.from(part);
      if (/^\s+$/.test(part)) {
        frag.appendChild(document.createTextNode(part));
        k += chars.length;
        continue;
      }
      const word = frag.appendChild(document.createElement('span'));
      word.style.whiteSpace = 'nowrap';
      for (const ch of chars) {
        const s = word.appendChild(document.createElement('span'));
        s.style.cssText = `display:inline-block;width:${widths[ti][k++]}px;text-align:center`;
        s.textContent = noise();
        cells.push({ s, ch, at: cells.length * STEP_MS, done: false });
      }
    }
    t.replaceWith(frag);
  });

  const start = performance.now();
  let last = 0;
  let raf = 0;
  const finish = () => {
    cancelAnimationFrame(raf);
    running.delete(finish);
    el.replaceChildren(...original);
    const left = (labelled.get(head) ?? 0) - 1;
    if (left > 0) labelled.set(head, left);
    else if (labelled.delete(head)) head.removeAttribute('aria-label');
  };
  running.add(finish);

  const frame = (now: number) => {
    const t = now - start;
    const swap = now - last > 32;
    if (swap) last = now;
    let pending = 0;
    for (const c of cells) {
      if (c.done) continue;
      if (t >= c.at + SPIN_MS) {
        c.done = true;
        c.s.textContent = c.ch;
        c.s.style.textAlign = 'left';
        continue;
      }
      pending++;
      if (swap) c.s.textContent = noise();
    }
    if (pending) raf = requestAnimationFrame(frame);
    else finish();
  };
  raf = requestAnimationFrame(frame);
}
