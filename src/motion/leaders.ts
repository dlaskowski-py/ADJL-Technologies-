/**
 * [data-leaders]: the leader-line diagrams (parity, seal, pit, clocks) and
 * the two-readers diagram.
 *
 * Each arrives drawn in its final state; this module only sets attributes
 * on the figure (see leaders.css):
 *
 *   every kind  lines draw in the first time the figure is in view
 *               (data-pre until then). Not on the reduced tier.
 *   parity      full: the check sweep pairs each module, the phone drops
 *               its network and recomputes, then again, while in view.
 *               Lite: one pass.
 *   seal/clocks packets ride their paths: in a loop while in view on full,
 *               one pass on lite, never on reduced.
 *   pit         the dates fill in once; "Survivors only" toggles on every
 *               tier, because it's an answer and not an animation.
 *
 * Every loop goes through whileVisible, so it stops offscreen, in a hidden
 * tab and on Pause. drawLeader() is also used by the replay inspector.
 */
import { onMotionChange, tier, whileVisible } from './prefs';

const NS = 'http://www.w3.org/2000/svg';

/**
 * Draw one leader line inside `svg`: a 3px dot at `fromEl`'s right edge, a
 * short horizontal shoulder, a run to `toEl`'s row, and a shoulder into its
 * left edge. Coordinates are read from the boxes as laid out now, so call
 * it after layout and again on resize. Returns the path (pathLength 1, so
 * CSS can draw it with stroke-dashoffset).
 */
export function drawLeader(fromEl: Element, toEl: Element, svg: SVGSVGElement): SVGPathElement {
  const o = svg.getBoundingClientRect();
  const a = fromEl.getBoundingClientRect();
  const b = toEl.getBoundingClientRect();
  const x1 = a.right - o.left + 6;
  const y1 = a.top + a.height / 2 - o.top;
  const x2 = b.left - o.left - 6;
  const y2 = b.top + b.height / 2 - o.top;
  const s = Math.max(4, Math.min(14, (x2 - x1) / 4));
  const f = (n: number) => n.toFixed(1);
  const p = document.createElementNS(NS, 'path');
  p.setAttribute('d', `M${f(x1)} ${f(y1)}H${f(x1 + s)}L${f(x2 - s)} ${f(y2)}H${f(x2)}`);
  p.setAttribute('pathLength', '1');
  p.setAttribute('data-leader', '');
  const dot = document.createElementNS(NS, 'circle');
  dot.setAttribute('cx', f(x1));
  dot.setAttribute('cy', f(y1));
  dot.setAttribute('r', '1.5');
  dot.setAttribute('data-leader-dot', '');
  svg.append(p, dot);
  return p;
}

const wait = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

/** The first time `el` is in view. */
function onView(el: Element, fn: () => void): void {
  const io = new IntersectionObserver(
    (es) => {
      if (!es.some((e) => e.isIntersecting)) return;
      io.disconnect();
      fn();
    },
    { threshold: 0.3 },
  );
  io.observe(el);
}

/** parity: pair each module, drop the phone's network, recompute. */
function parity(fig: HTMLElement, loop: boolean): void {
  const rows = Array.from(fig.querySelectorAll<SVGGElement>('.ld-svg--w .ld-row, .ld-svg--n .ld-row'));
  const n = rows.length / 2;
  let run = 0;
  const final = () => {
    run++;
    delete fig.dataset.sweep;
    delete fig.dataset.net;
    rows.forEach((r) => r.removeAttribute('data-on'));
  };
  const cycle = async (id: number) => {
    const live = () => id === run;
    fig.dataset.sweep = '';
    fig.dataset.net = 'on';
    rows.forEach((r) => r.removeAttribute('data-on'));
    await wait(500);
    for (let i = 0; i < n && live(); i++) {
      for (const r of [rows[i], rows[i + n]]) r.setAttribute('data-on', 'now');
      if (i) for (const r of [rows[i - 1], rows[i - 1 + n]]) r.setAttribute('data-on', '');
      await wait(220);
    }
    if (!live()) return;
    for (const r of rows) r.setAttribute('data-on', '');
    await wait(700);
    if (!live()) return;
    fig.dataset.net = 're';
    await wait(1600);
    if (!live()) return;
    delete fig.dataset.net;
    if (loop) {
      await wait(2600);
      if (live()) void cycle(id);
    }
  };
  if (loop) whileVisible(fig, () => void cycle(++run), final);
  else onView(fig, () => void cycle(++run));
  onMotionChange((t) => t === 'reduced' && final());
}

/** seal, clocks: packets along their paths. */
function packets(fig: HTMLElement, loop: boolean): void {
  if (loop) {
    whileVisible(
      fig,
      () => (fig.dataset.run = 'loop'),
      () => delete fig.dataset.run,
    );
  } else {
    onView(fig, () => (fig.dataset.run = 'once'));
  }
  onMotionChange((t) => t === 'reduced' && delete fig.dataset.run);
}

function pit(fig: HTMLElement): void {
  const btn = fig.querySelector<HTMLButtonElement>('.ld-toggle');
  btn?.addEventListener('click', () => {
    const on = btn.getAttribute('aria-pressed') !== 'true';
    btn.setAttribute('aria-pressed', String(on));
    if (on) fig.dataset.surv = '';
    else delete fig.dataset.surv;
  });
}

export function initLeaders(): void {
  document.querySelectorAll<HTMLElement>('[data-leaders]').forEach((fig) => {
    const kind = fig.dataset.leaders;
    if (kind === 'pit') pit(fig);
    if (tier === 'reduced') return;
    /* Undrawn until it's seen, then everything draws in. */
    fig.dataset.pre = '';
    onView(fig, () => requestAnimationFrame(() => delete fig.dataset.pre));
    onMotionChange((t) => t === 'reduced' && delete fig.dataset.pre);
    const loop = tier === 'full';
    if (kind === 'parity') parity(fig, loop);
    else if (kind === 'seal' || kind === 'clocks') packets(fig, loop);
  });
}
