/**
 * Leader-line diagrams (parity, seal, pit, clocks) and the two-readers
 * diagram. Prerendered SVG plus an adjacent <ol> with the same facts.
 *
 * OWNER: WS4. STUB until WS4 lands. Markup contract: [data-leaders].
 */
import { chip } from '../html';

export type LeaderKind = 'parity' | 'seal' | 'pit' | 'clocks';

export function renderLeaders(kind: LeaderKind): string {
  return `<figure class="panel leaders" data-leaders="${kind}">
    <div class="panel-head"><span class="panel-title">${kind}</span>${chip('illustration')}</div>
  </figure>`;
}

export function renderReaders(): string {
  return `<figure class="panel leaders" data-leaders="readers">
    <div class="panel-head"><span class="panel-title">two readers</span>${chip('illustration')}</div>
  </figure>`;
}
