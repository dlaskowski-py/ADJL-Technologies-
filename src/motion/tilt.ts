/**
 * Two pointer effects on cards, both opt-in through markup.
 *
 *   [data-tilt]      the card leans a couple of degrees toward the pointer
 *   [data-spotlight] a soft light follows the pointer across the card
 *
 * Both are `full` tier only. On a touch screen there is no hovering pointer
 * to respond to, and a tilt that only fires on tap is a glitch rather than
 * an effect.
 *
 * The rotation is deliberately small — 4 degrees at the corners. The version
 * of this that everyone has seen goes to 15 and turns a page of cards into a
 * funhouse; at 4 it reads as the card being made of something rather than as
 * an effect that has been applied to it.
 */

import { allowPointer } from './prefs';

const MAX_DEG = 4;

export function initTilt(): void {
  if (!allowPointer) return;

  document.querySelectorAll<HTMLElement>('[data-tilt]').forEach((el) => {
    let raf = 0;

    el.addEventListener(
      'pointermove',
      (e) => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = 0;
          const r = el.getBoundingClientRect();
          const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
          const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
          el.style.setProperty('--rx', `${(-dy * MAX_DEG).toFixed(2)}deg`);
          el.style.setProperty('--ry', `${(dx * MAX_DEG).toFixed(2)}deg`);
        });
      },
      { passive: true },
    );

    el.addEventListener('pointerleave', () => {
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    });
  });

  document.querySelectorAll<HTMLElement>('[data-spotlight]').forEach((el) => {
    let raf = 0;

    el.addEventListener(
      'pointermove',
      (e) => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = 0;
          const r = el.getBoundingClientRect();
          el.style.setProperty('--mx', `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`);
          el.style.setProperty('--my', `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`);
        });
      },
      { passive: true },
    );
  });
}

/** Buttons lean very slightly toward the pointer. Same argument as the tilt:
 *  8px, not 30. */
export function initMagnetic(): void {
  if (!allowPointer) return;

  document.querySelectorAll<HTMLElement>('.btn, .mail').forEach((el) => {
    el.addEventListener(
      'pointermove',
      (e) => {
        const r = el.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
        const dy = (e.clientY - (r.top + r.height / 2)) / r.height;
        el.style.transform = `translate(${(dx * 7).toFixed(2)}px, ${(dy * 4).toFixed(2)}px)`;
      },
      { passive: true },
    );
    el.addEventListener('pointerleave', () => {
      el.style.transform = '';
    });
  });
}
