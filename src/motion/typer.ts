/**
 * Typed text: the hero's "now building" line.
 *
 * Markup contract: [data-typer="phrase|phrase|…"] with one
 * [data-typer-text] inside it, prerendered holding the first phrase.
 *
 * The phrase is always in the DOM in full. Typing and deleting only count
 * --n (characters shown) up and down on the phrase's box; the stylesheet
 * turns that into a clip-path on the text and a transform on the caret.
 * The text node itself changes once per phrase, while it's clipped to
 * nothing. So no element moves or resizes and the line can't cause a
 * layout shift, which matters because it's above the fold.
 *
 * It runs through whileVisible: offscreen, in a hidden tab or on Pause the
 * timer is cleared and the current phrase is shown whole. Reduced motion
 * never starts it, and the prerendered first phrase stays as it was.
 * data-on (set while it runs) is what the caret's blink hangs off.
 *
 * OWNER: WS-B.
 */
import { tier, whileVisible } from './prefs';

const TYPE_MS = 42;
const ERASE_MS = 18;
const HOLD_MS = 1900;
const GAP_MS = 320;

export function initTyper(): void {
  document.querySelectorAll<HTMLElement>('[data-typer]').forEach((root) => {
    const text = root.querySelector<HTMLElement>('[data-typer-text]');
    const box = text?.parentElement;
    const list = (root.dataset.typer ?? '').split('|').filter(Boolean);
    if (!text || !box || list.length < 2) return;

    let i = 0;
    let n = list[0].length;
    let dir = -1;
    let timer = 0;

    const show = () => box.style.setProperty('--n', String(n));
    const step = () => {
      let wait = dir > 0 ? TYPE_MS : ERASE_MS;
      if (dir < 0 && n === 0) {
        /* Clipped to nothing: swap the phrase, then type it. */
        i = (i + 1) % list.length;
        text.textContent = list[i];
        dir = 1;
        wait = GAP_MS;
      } else if (dir > 0 && n === list[i].length) {
        dir = -1;
        wait = HOLD_MS;
      } else {
        n += dir;
        show();
      }
      timer = window.setTimeout(step, wait);
    };

    whileVisible(
      root,
      () => {
        if (timer || tier === 'reduced') return;
        root.dataset.on = '';
        timer = window.setTimeout(step, HOLD_MS);
      },
      () => {
        window.clearTimeout(timer);
        timer = 0;
        delete root.dataset.on;
        /* At rest the line always reads as a whole phrase. */
        n = list[i].length;
        dir = -1;
        show();
      },
      '0px',
    );
  });
}
