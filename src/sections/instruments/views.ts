/**
 * The view switch: Render · Source · Machine, as native radios in a
 * fieldset. Rendered twice (status bar and mobile menu); views.ts keeps the
 * two in sync. Hidden without JavaScript, since only a script can switch.
 *
 * OWNER: WS2 (machine and views). Markup contract: [data-views].
 */
import { status } from '../../content';
import { esc } from '../html';

export function renderViews(where: 'status' | 'menu'): string {
  const v = status.views;
  const name = `view-${where}`;
  const opt = (value: string, label: string, checked = false) =>
    `<label class="views-opt"><input type="radio" name="${name}" value="${value}"${checked ? ' checked' : ''} /><span>${esc(
      label,
    )}</span></label>`;
  return `<fieldset class="views" data-views="${where}" data-js-only data-chrome>
    <legend class="views-legend">${esc(v.legend)}</legend>
    <div class="views-track">${opt('render', v.render, true)}${opt('source', v.source)}${opt('machine', v.machine)}</div>
  </fieldset>`;
}
