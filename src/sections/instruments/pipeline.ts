/**
 * The build sequence: six steps on a rail, six artifacts that change as
 * you scroll. Every artifact is prerendered HTML text.
 *
 * OWNER: WS4. STUB until WS4 lands. Markup contract: [data-pipeline].
 */
import { pipeline } from '../../content';
import { chip, esc, rich } from '../html';

export function renderPipeline(): string {
  const p = pipeline;
  return `<div class="pipeline" data-pipeline>
    <ol class="pl-steps">${p.steps
      .map((s) => `<li class="pl-step"><span class="numeral" aria-hidden="true">${esc(s.num)}</span><h3 class="h3">${esc(
        s.title,
      )}</h3><p>${rich(s.body)}</p></li>`)
      .join('')}</ol>
    ${chip('illustration')}
  </div>`;
}
