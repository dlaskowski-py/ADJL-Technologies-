/**
 * Decode: text that resolves out of noise.
 *
 * Markup contract: [data-decode] on any element holding text (a heading, a
 * label, a line of a headline). Optional data-decode-delay="ms".
 *
 * The prerendered text is the real text and stays the real text: crawlers,
 * no-JS visitors and the reduced tier never see a scrambled glyph. On the
 * other tiers, when the element first enters the viewport its characters
 * are swapped for random glyphs that settle left to right into the original.
 *
 * Two things make this safe to put on a headline:
 *
 *   NO LAYOUT SHIFT. A scrambled "W" is wider than an "i", so swapping
 *   glyphs in a proportional face reflows the line on every frame, and a
 *   heading that reflows is CLS. Each character is measured first and its
 *   box is locked to that width while it scrambles, and words are wrapped
 *   nowrap so a line can't break mid-word between two locked boxes. When
 *   the decode finishes, the original DOM is put back exactly as it was.
 *
 *   THE NAME NEVER SCRAMBLES. For the second or so that the glyphs are
 *   noise, the element carries an aria-label with its real text, so a
 *   screen reader that lands on it mid-animation reads the words, not the
 *   noise. The label is removed when the text is whole again.
 */

import { tier } from './prefs';

const GLYPHS = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789<>/\\{}[]=+*#%&$_';
const STEP_MS = 28; // per character, left to right
const SPIN_MS = 360; // how long each character stays noise after its turn starts

type Cell = { span: HTMLSpanElement; ch: string; at: number };

function lockAndSplit(el: HTMLElement): { cells: Cell[]; restore: () => void } {
  const original = Array.from(el.childNodes).map((n) => n.cloneNode(true));
  const cells: Cell[] = [];

  /* Walk text nodes in document order, so an <em> inside the headline keeps
     its colour while its own letters decode. */
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const texts: Text[] = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) texts.push(n as Text);

  let idx = 0;
  for (const t of texts) {
    const frag = document.createDocumentFragment();
    const parts = (t.data ?? '').split(/(\s+)/);
    for (const part of parts) {
      if (!part) continue;
      if (/^\s+$/.test(part)) {
        frag.appendChild(document.createTextNode(part));
        continue;
      }
      const word = document.createElement('span');
      word.style.whiteSpace = 'nowrap';
      for (const ch of Array.from(part)) {
        const s = document.createElement('span');
        s.textContent = ch;
        s.style.display = 'inline-block';
        word.appendChild(s);
        cells.push({ span: s, ch, at: idx++ * STEP_MS });
      }
      frag.appendChild(word);
    }
    t.parentNode?.replaceChild(frag, t);
  }

  /* Measure every box in one pass, then lock in a second — interleaving
     reads and writes would force a layout per character. */
  const widths = cells.map((c) => c.span.getBoundingClientRect().width);
  cells.forEach((c, i) => {
    c.span.style.width = `${widths[i]}px`;
    c.span.style.textAlign = 'center';
    c.span.style.overflow = 'visible';
  });

  return {
    cells,
    restore: () => {
      el.replaceChildren(...original);
    },
  };
}

function run(el: HTMLElement): void {
  const label = (el.textContent ?? '').replace(/\s+/g, ' ').trim();
  const hadLabel = el.hasAttribute('aria-label');
  if (!hadLabel) el.setAttribute('aria-label', label);

  const { cells, restore } = lockAndSplit(el);
  const delay = Number(el.dataset.decodeDelay ?? 0) || 0;
  const start = performance.now() + delay;
  let last = 0;

  const frame = (now: number) => {
    const t = now - start;
    // Throttle glyph swaps to ~30fps: faster reads as flicker, not decoding.
    const swap = now - last > 32;
    if (swap) last = now;

    let pending = 0;
    for (const c of cells) {
      if (t >= c.at + SPIN_MS) {
        if (c.span.textContent !== c.ch) c.span.textContent = c.ch;
        continue;
      }
      pending++;
      if (swap && t >= 0) {
        c.span.textContent = GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
    }

    if (pending) requestAnimationFrame(frame);
    else {
      restore();
      if (!hadLabel) el.removeAttribute('aria-label');
      el.classList.add('is-decoded');
    }
  };

  /* Scramble immediately so the first painted frame after entry is noise,
     not the finished word flashing and then breaking apart. */
  for (const c of cells) c.span.textContent = GLYPHS[(Math.random() * GLYPHS.length) | 0];
  requestAnimationFrame(frame);
}

export function initDecode(): void {
  const els = Array.from(document.querySelectorAll<HTMLElement>('[data-decode]'));
  if (!els.length) return;

  if (tier === 'reduced') {
    els.forEach((el) => el.classList.add('is-decoded'));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        io.unobserve(e.target);
        run(e.target as HTMLElement);
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.2 },
  );
  els.forEach((el) => io.observe(el));
}
