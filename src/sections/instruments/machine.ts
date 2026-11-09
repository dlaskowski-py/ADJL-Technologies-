/**
 * Machine View: what a crawler is handed. The BUILD readout is computed at
 * prerender from the page's own HTML (src/lib/measure.ts) and injected at
 * the <!--machine--> marker; motion/machine.ts re-fetches the page live.
 *
 * OWNER: WS2. STUB until WS2 lands. Markup contract: [data-machine].
 */
import { machineView } from '../../content';
import { chip, esc } from '../html';

export type MachineVariant = 'full' | 'parity' | 'schema' | 'surfaces';

export function renderMachine(variant: MachineVariant): string {
  return `<div class="panel machine" data-machine="${variant}">
    <div class="panel-head"><span class="panel-title">${esc(machineView.readers.crawlers)}</span>${chip('build')}</div>
    <div class="machine-body" data-chrome><!--machine:${variant}--></div>
  </div>`;
}

/** The BUILD readout, computed by scripts/prerender.mjs from the finished
 *  page and injected at the <!--machine:variant--> marker. STUB. */
export function renderMachineReadout(
  m: { title: string; description: string; h1: number; words: number },
  _variant: MachineVariant,
): string {
  return `<dl class="mr"><div><dt>title</dt><dd>${esc(m.title)}</dd></div><div><dt>description</dt><dd>${esc(
    m.description,
  )}</dd></div><div><dt>h1</dt><dd>${m.h1}</dd></div><div><dt>words</dt><dd>${m.words}</dd></div></dl>`;
}
