/**
 * Telemetry markup: the status-bar readouts and the large panel.
 *
 * Sizes (html, css, js, 3rd-party) are BUILD values: scripts/stamp-sizes.mjs
 * writes them into [data-metric] once the page is final. Everything else is
 * measured in the visitor's browser, so it prerenders as "needs JS" and
 * motion/telemetry.ts swaps in the reading when the browser reports one,
 * flipping that metric's chip to Live. Every value sits in a fixed-width
 * slot (telemetry.css), so a reading landing never moves anything.
 *
 * A slot says where its value came from with data-reading="build|live"
 * (data-prov belongs to the .prov chips alone), and why it has none with
 * data-state="nojs|nr|none".
 *
 * OWNER: WS2. Markup contract: [data-telemetry].
 */
import { prov, status } from '../../content';
import { telemetryUi } from '../../content-instruments';
import { chip, esc } from '../html';

type Key = keyof typeof status.metrics;

/** Measured at build (stamp-sizes). 3rd-party also has a live reading. */
const BUILD = new Set<Key>(['html', 'css', 'js', 'thirdparty']);

/** The status bar: the spec's eight, in its order. `pri` decides which
 *  ones the fixed bar can drop when it runs out of room (telemetry.css);
 *  every one is always in the large panel and in Machine View. */
const STATUS: [Key, number][] = [
  ['html', 1],
  ['css', 2],
  ['js', 1],
  ['thirdparty', 2],
  ['lcp', 1],
  ['cls', 1],
  ['inp', 3],
  ['tier', 3],
];

/** The large panel: sizes, then the timings, then the page itself. */
const PANEL: Key[] = ['html', 'css', 'js', 'thirdparty', 'lcp', 'cls', 'inp', 'ttfb', 'transfer', 'requests', 'dom', 'cookies', 'tier'];

/* What a metric that needs an interaction says before there's been one. */
const NONE = { label: telemetryUi.none, title: telemetryUi.noneTitle };

/** Strings the live module needs, carried in the markup so the main bundle
 *  never imports the site's copy. One JSON attribute per readout group. */
export function telemetryCopy(): string {
  return esc(
    JSON.stringify({
      needs: status.needsJs,
      needsTitle: status.needsJsTitle,
      nr: status.notReported,
      nrTitle: status.notReportedTitle,
      cached: status.cached,
      rate: status.ratings,
      live: prov.live.label,
      liveDef: prov.live.def,
      none: NONE.label,
      noneTitle: NONE.title,
    }),
  );
}

/** One value slot. BUILD ones are empty until stamp-sizes fills them. */
function slot(k: Key): string {
  return BUILD.has(k)
    ? `<dd class="num" data-metric="${k}" data-chrome data-reading="build" title="${esc(prov.build.def)}"></dd>`
    : `<dd class="num" data-metric="${k}" data-chrome data-state="nojs" title="${esc(status.needsJsTitle)}">${esc(
        status.needsJs,
      )}</dd>`;
}

export function renderStatusReadouts(): string {
  const m = status.metrics;
  return `<dl class="status-readouts" data-chrome data-copy="${telemetryCopy()}">${STATUS.map(
    ([k, pri]) => `<div class="tm" data-pri="${pri}"><dt>${esc(m[k])}</dt>${slot(k)}</div>`,
  ).join('')}</dl>${chip('build')}`;
}

export function renderTelemetryPanel(): string {
  const m = status.metrics;
  return `<div class="panel tm-panel" data-telemetry="panel">
    <div class="panel-head" data-chrome><span class="panel-title">${esc(status.label)}</span>${chip('build')}</div>
    <dl class="tm-grid" data-chrome data-copy="${telemetryCopy()}">${PANEL.map(
      (k) => `<div class="tm-tile" data-key="${k}">
        <dt><span>${esc(m[k])}</span><span class="tm-chip" data-tchip>${BUILD.has(k) ? chip('build') : ''}</span></dt>
        ${slot(k)}
      </div>`,
    ).join('')}</dl>
  </div>`;
}
