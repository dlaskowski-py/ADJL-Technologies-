/**
 * The motion tier, read from <html data-motion>.
 *
 * public/js-on.js resolves the tier in the head before first paint, so CSS
 * and every module agree from frame one. This module only reads it (and
 * re-detects if the head script didn't run, which in practice means the dev
 * shell in an unusual browser).
 *
 *   reduced  prefers-reduced-motion, or Pause motion pressed: nothing moves
 *            on its own, everything is visible immediately.
 *   lite     coarse pointer, low memory, data saver: one-shot reveals and
 *            short transitions, no continuously running canvas, no pointer
 *            effects.
 *   full     everything.
 *
 * The tier can CHANGE during a visit: Pause motion drops it to 'reduced'
 * and pressing it again restores what was detected. Every module with a
 * loop subscribes through onMotionChange() and renders its static state.
 */

export type Tier = 'reduced' | 'lite' | 'full';

const root = typeof document !== 'undefined' ? document.documentElement : null;

function detect(): Tier {
  if (typeof window === 'undefined') return 'reduced';
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'reduced';
  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
    deviceMemory?: number;
  };
  const c = nav.connection;
  if (c?.saveData || (c?.effectiveType && /(^|-)(2g|slow-2g)$/.test(c.effectiveType))) return 'lite';
  if (typeof nav.deviceMemory === 'number' && nav.deviceMemory < 4) return 'lite';
  if (window.matchMedia('(pointer: coarse)').matches) return 'lite';
  return 'full';
}

function read(): Tier {
  const v = root?.dataset.motion;
  if (v === 'reduced' || v === 'lite' || v === 'full') return v;
  const t = detect();
  if (root) {
    root.dataset.motion = t;
    root.dataset.motionDetected = t;
  }
  return t;
}

/** The tier at load. Modules that only decide once (reveal, decode) read
 *  this; modules with loops also subscribe to onMotionChange. */
export let tier: Tier = read();
export let allowCanvas = tier === 'full';
export let allowReveal = tier !== 'reduced';
export let allowPointer = tier === 'full';
export const allowVideo = false;

const subs: ((t: Tier) => void)[] = [];

/** Called whenever Pause motion changes the tier. */
export function onMotionChange(fn: (t: Tier) => void): void {
  subs.push(fn);
}

export function isPaused(): boolean {
  return root?.dataset.paused === 'true';
}

/** Pause or resume everything. Persists in localStorage (try/catch: it can
 *  be unavailable or throw), and the privacy page says so. */
export function setPaused(paused: boolean): void {
  if (!root) return;
  try {
    if (paused) localStorage.setItem('adjl:motion', 'off');
    else localStorage.removeItem('adjl:motion');
  } catch {
    /* Storage unavailable: the choice holds for this page only. */
  }
  const detected = (root.dataset.motionDetected as Tier) || detect();
  tier = paused ? 'reduced' : detected;
  allowCanvas = tier === 'full';
  allowReveal = tier !== 'reduced';
  allowPointer = tier === 'full';
  root.dataset.motion = tier;
  if (paused) root.dataset.paused = 'true';
  else delete root.dataset.paused;
  document.querySelectorAll<HTMLButtonElement>('[data-pause]').forEach((b) => {
    b.setAttribute('aria-pressed', String(paused));
  });
  for (const fn of subs) fn(tier);
  window.dispatchEvent(new CustomEvent('adjl:motion', { detail: { tier, paused } }));
}

/**
 * Run `fn` only while `el` is anywhere near the viewport, the tab is
 * visible, and motion isn't paused. Every continuous animation on the site
 * goes through this, so adding one can't quietly add a permanent rAF loop.
 */
export function whileVisible(
  el: Element,
  start: () => void,
  stop: () => void,
  margin = '200px',
): void {
  let onScreen = false;
  let hidden = document.hidden;
  const sync = () => {
    if (onScreen && !hidden && !isPaused()) start();
    else stop();
  };
  new IntersectionObserver(
    (entries) => {
      for (const e of entries) onScreen = e.isIntersecting;
      sync();
    },
    { rootMargin: margin },
  ).observe(el);
  document.addEventListener('visibilitychange', () => {
    hidden = document.hidden;
    sync();
  });
  onMotionChange(sync);
}

/**
 * Lazy-load a module the first time any element matching `selector` comes
 * within `margin` of the viewport. Fires once. Pages without the selector
 * never download the chunk.
 */
export function lazyOn(selector: string, load: () => Promise<unknown>, margin = '600px'): void {
  const els = Array.from(document.querySelectorAll(selector));
  if (!els.length) return;
  let fired = false;
  const io = new IntersectionObserver(
    (entries) => {
      if (fired || !entries.some((e) => e.isIntersecting)) return;
      fired = true;
      io.disconnect();
      void load();
    },
    { rootMargin: margin },
  );
  els.forEach((el) => io.observe(el));
}

/**
 * Run `fn` once the opening sequence has handed the page over, or now if
 * it isn't playing. The sequence covers the page (html[data-intro="play"],
 * home only, first visit of a session); effects meant to be SEEN, like the
 * headline's compile pass, start at its hand-off.
 *
 * The hand-off is an event dispatched by motion/intro.ts, and that module
 * is a separate chunk. If it never loads, the CSS timeline still opens the
 * page on its own, so the timeout makes sure nothing waits forever on an
 * event that won't come.
 */
export function afterIntro(fn: () => void): void {
  if (document.documentElement.dataset.intro !== 'play') {
    fn();
    return;
  }
  let done = false;
  const go = () => {
    if (done) return;
    done = true;
    fn();
  };
  window.addEventListener('adjl:intro-done', go, { once: true });
  window.setTimeout(() => {
    /* No hand-off came. By now the CSS timeline has opened the page by
       itself, so say so; callers that re-check the attribute then proceed. */
    if (document.documentElement.dataset.intro === 'play') document.documentElement.dataset.intro = 'done';
    go();
  }, 8000);
}
