/**
 * Resolves ONE capability tier for the whole page. Every other motion module
 * reads this rather than sniffing the environment for itself — otherwise
 * eleven modules each answer "should I run?" slightly differently, and the
 * reduced-motion promise holds in ten of them.
 *
 *   reduced — prefers-reduced-motion: no film, no canvas, nothing that moves
 *             on its own. Everything is visible immediately.
 *   lite    — coarse pointer, low memory, data saver: film and reveals, but
 *             no continuously-running canvas.
 *   full    — everything.
 */

export type Tier = 'reduced' | 'lite' | 'full';

type Conn = { saveData?: boolean; effectiveType?: string };

function detect(): Tier {
  if (typeof window === 'undefined') return 'reduced';
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'reduced';

  const nav = navigator as Navigator & { connection?: Conn; deviceMemory?: number };
  const conn = nav.connection;

  if (conn?.saveData) return 'lite';
  if (conn?.effectiveType && /(^|-)(2g|slow-2g)$/.test(conn.effectiveType)) return 'lite';
  if (typeof nav.deviceMemory === 'number' && nav.deviceMemory < 4) return 'lite';
  if (window.matchMedia('(pointer: coarse)').matches) return 'lite';

  return 'full';
}

export const tier: Tier = detect();

export const allowVideo = tier !== 'reduced';
export const allowCanvas = tier === 'full';
export const allowReveal = tier !== 'reduced';
export const allowPointer = tier === 'full';

document.documentElement.dataset.motion = tier;

/**
 * Run `fn` only while `el` is anywhere near the viewport, and stop it the
 * moment it leaves or the tab is hidden.
 *
 * Nine of the animations on this site are continuous — canvases, marquees,
 * counters, the flow diagram. Left alone they all run at once, forever,
 * including the six that are four screens below the fold. On a laptop that
 * is a warm fan; on a phone it is the battery. This is the one place that
 * gets decided, so adding an animation cannot quietly add a permanent
 * rAF loop.
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
    if (onScreen && !hidden) start();
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
}
