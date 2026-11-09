/**
 * Telemetry markup: the status-bar readouts and the large panel.
 * Sizes (html, css, js, 3rd-party) are written at build by
 * scripts/stamp-sizes.mjs into [data-metric]; the rest prerender as
 * "needs JS" and motion/telemetry.ts swaps in live values.
 *
 * OWNER: WS2. STUB until WS2 lands. Markup contract: [data-telemetry].
 */
import { status } from '../../content';
import { chip, esc } from '../html';

const KEYS = ['html', 'css', 'js', 'thirdparty', 'lcp', 'cls', 'inp', 'tier'] as const;
const BUILD = new Set(['html', 'css', 'js', 'thirdparty']);

function slots(): string {
  const m = status.metrics as Record<string, string>;
  return KEYS.map(
    (k) =>
      `<div class="tm"><dt>${esc(m[k])}</dt><dd class="num" data-metric="${k}" data-chrome${
        BUILD.has(k) ? '' : ` title="${esc('Measured when JavaScript runs.')}"`
      }>${BUILD.has(k) ? '' : esc(status.needsJs)}</dd></div>`,
  ).join('');
}

export function renderStatusReadouts(): string {
  return `<dl class="status-readouts" data-chrome>${slots()}</dl>${chip('build')}`;
}

export function renderTelemetryPanel(): string {
  return `<div class="panel tm-panel" data-telemetry="panel">
    <div class="panel-head"><span class="panel-title">${esc(status.label)}</span>${chip('build')}</div>
    <dl class="tm-grid" data-chrome>${slots()}</dl>
  </div>`;
}
