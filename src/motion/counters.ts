/**
 * Number readouts that count up once, when they first enter view.
 *
 * Markup contract: [data-count="70"], with optional [data-suffix],
 * [data-prefix] and [data-decimals]. The element's text is replaced during
 * the tween, so its authored content is only ever the resting placeholder.
 */

import { allowReveal } from './prefs';

const DURATION = 1400;

const easeOut = (t: number): number => 1 - Math.pow(1 - t, 3);

function format(el: HTMLElement, v: number): string {
  const decimals = Number(el.dataset.decimals ?? '0');
  const body = decimals > 0 ? v.toFixed(decimals) : Math.round(v).toLocaleString('en-US');
  return `${el.dataset.prefix ?? ''}${body}${el.dataset.suffix ?? ''}`;
}

function run(el: HTMLElement): void {
  const target = Number(el.dataset.count ?? '0');
  const start = performance.now();

  const step = (now: number) => {
    const t = Math.min(1, (now - start) / DURATION);
    el.textContent = format(el, target * easeOut(t));
    if (t < 1) requestAnimationFrame(step);
  };

  requestAnimationFrame(step);
}

export function initCounters(): void {
  const els = Array.from(document.querySelectorAll<HTMLElement>('[data-count]'));
  if (!els.length) return;

  if (!allowReveal) {
    els.forEach((el) => {
      el.textContent = format(el, Number(el.dataset.count ?? '0'));
    });
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        run(entry.target as HTMLElement);
        io.unobserve(entry.target);
      }
    },
    { threshold: 0.5 },
  );

  els.forEach((el) => io.observe(el));
}
