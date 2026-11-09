/**
 * Scenes: small looping illustrations (the ticker, the offer panels, the
 * portfolio previews), drawn in CSS and SVG.
 *
 * Markup contract: [data-scene] on the scene's root. This module only
 * tells the stylesheet when a scene may move:
 *
 *   data-playing="true"   in or near the viewport, tab visible, motion not
 *                         paused. CSS animations hang off this attribute:
 *                             [data-scene][data-playing='true'] .x { animation: … }
 *                         so a scene that's offscreen, in a hidden tab or
 *                         paused costs nothing.
 *   data-seen="true"      set once, the first time the scene is on screen,
 *                         for one-shot entrances (a line that draws in).
 *
 * The scene's DEFAULT styles are its complete, static state. Reduced
 * motion and Pause never set data-playing, so they show exactly that; so
 * does a visitor with JavaScript off. On the lite tier CSS can cap a loop
 * to one pass with `animation-iteration-count: var(--scene-iter, infinite)`
 * (base styles set --scene-iter to 1 there).
 */

import { tier, whileVisible } from './prefs';

export function initScenes(): void {
  const scenes = Array.from(document.querySelectorAll<HTMLElement>('[data-scene]'));
  for (const el of scenes) {
    if (tier === 'reduced') {
      el.dataset.seen = 'true';
    }
    whileVisible(
      el,
      () => {
        el.dataset.seen = 'true';
        if (tier !== 'reduced') el.dataset.playing = 'true';
      },
      () => {
        el.dataset.playing = 'false';
      },
      '0px',
    );
  }
}
