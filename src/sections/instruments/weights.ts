/**
 * Module weights: the gzip size of each motion module, measured at build.
 *
 * The rows are written by scripts/stamp-sizes.mjs from the chunks Vite
 * actually emitted (dist/assets), each against its budget from the spec, so
 * the list can't name a module that didn't ship or miss one that did. This
 * renderer only draws the frame and the rows it expects, empty, which is
 * what the dev server shows.
 *
 * OWNER: WS2. Filled at [data-weights].
 */
import { chip, esc } from '../html';
import { telemetryUi } from '../../content-instruments';

const TITLE = telemetryUi.weightsTitle;
const OVER = telemetryUi.overBudget;

/** Lazy modules and their spec budgets (gz bytes). `core` is the entry
 *  every page loads first: boot, telemetry, views, reveal and friends. */
export const WEIGHTS: { name: string; budget: number }[] = [
  { name: 'core', budget: 24 * 1024 },
  { name: 'lattice', budget: 10 * 1024 },
  { name: 'machine', budget: 5 * 1024 },
  { name: 'ask', budget: 4 * 1024 },
  { name: 'pipeline', budget: 2.5 * 1024 },
  { name: 'replay', budget: 4 * 1024 },
  { name: 'leaders', budget: 3 * 1024 },
  { name: 'headers', budget: 1 * 1024 },
  { name: 'palette', budget: 4 * 1024 },
  { name: 'view-machine', budget: 4 * 1024 },
  { name: 'view-source', budget: 4 * 1024 },
];

/** One row. `gz` undefined draws an empty slot (dev, or not built). */
export function weightRow(name: string, gz: number | undefined, budget: number): string {
  const f = gz === undefined ? 0 : Math.min(1, gz / budget);
  const v = gz === undefined ? '' : `${(gz / 1024).toFixed(1)} kB`;
  /* Over budget says so in words, not only in amber. */
  const over = gz !== undefined && gz > budget;
  return `<div class="weight" data-mod="${esc(name)}"${over ? ' data-over' : ''}><dt>${esc(
    name,
  )}</dt><dd><span class="weight-bar" aria-hidden="true"><i style="--f:${f.toFixed(3)}"></i></span><span class="num weight-v">${esc(
    v,
  )}</span><span class="weight-of">${esc(`/ ${(budget / 1024).toFixed(budget % 1024 ? 1 : 0)} kB`)}${
    over ? ` <b>${esc(OVER)}</b>` : ''
  }</span></dd></div>`;
}

export function renderWeights(): string {
  return `<div class="panel weights">
    <div class="panel-head" data-chrome><span class="panel-title">${esc(TITLE)}</span>${chip('build')}</div>
    <dl class="weights-list" data-chrome data-weights>${WEIGHTS.map((w) => weightRow(w.name, undefined, w.budget)).join(
      '',
    )}</dl>
  </div>`;
}
