/**
 * Run Replay: the underwriting engine's real stage order, values withheld,
 * with "Break the input" branches.
 *
 * OWNER: WS4. STUB until WS4 lands. Markup contract: [data-replay].
 */
import { chip } from '../html';

export function renderReplay(variant: 'full' | 'compact'): string {
  return `<div class="panel replay" data-replay="${variant}">
    <div class="panel-head"><span class="panel-title">run replay</span>${chip('illustration')}</div>
  </div>`;
}
