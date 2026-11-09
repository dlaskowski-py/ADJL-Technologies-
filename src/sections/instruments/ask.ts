/**
 * Ask This Site: retrieval over this site's own passages, in the browser.
 * Precomputed answers for each chip are injected by scripts/gen-machine.mjs
 * at the <!--ask:pre--> marker so the chips work with JavaScript off.
 *
 * OWNER: WS3. STUB until WS3 lands. Markup contract: [data-ask].
 */
import { ask } from '../../content';
import { chip, esc } from '../html';

export function renderAsk(variant: 'home' | 'full'): string {
  return `<div class="panel askp" data-ask="${variant}">
    <div class="panel-head"><span class="panel-title">${esc(ask.label)}</span>${chip('build')}</div>
    <div data-ask-pre><!--ask:pre--></div>
  </div>`;
}
