/**
 * Module weights: gz size of each motion module, measured at build by
 * scripts/stamp-sizes.mjs.
 *
 * OWNER: WS2. STUB until WS2 lands.
 */
import { chip } from '../html';

export function renderWeights(): string {
  return `<div class="panel weights"><div class="panel-head"><span class="panel-title">module weights</span>${chip(
    'build',
  )}</div><dl class="weights-list" data-chrome data-weights><!--weights--></dl></div>`;
}
