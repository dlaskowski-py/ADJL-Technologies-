/**
 * The view switch: Render · Source · Machine, as native radios in a
 * fieldset. Rendered twice (status bar and mobile menu); motion/views.ts
 * keeps the two in sync and puts the state on <html data-view>. Hidden
 * without JavaScript, since only a script can switch.
 *
 * The status-bar copy also carries two inert <template>s: the Machine view
 * drawer and the Source view sheet. The modes that fill them load lazily
 * and import no copy of their own, so every label they show is written
 * here, from src/content.ts, at build.
 *
 * OWNER: WS2 (machine and views). Markup contract: [data-views].
 */
import { cta, machineView as MV, status } from '../../content';
import { viewsUi } from '../../content-instruments';
import { esc } from '../html';

/* The drawer's and the sheets' own labels. */
const L = viewsUi;

function drawerTemplate(): string {
  const row = (k: string, label: string) => `<div><dt>${esc(label)}</dt><dd data-d="${k}"></dd></div>`;
  return `<template data-drawer-tpl><aside data-drawer aria-label="${esc(L.drawer)}" data-chrome>
    <div data-dh><p data-dt>${esc(L.drawer)}</p><button type="button" data-drawer-toggle aria-expanded="true" aria-controls="machine-drawer-body" data-show="${esc(
      L.show,
    )}" data-hide="${esc(L.hide)}">${esc(L.hide)}</button></div>
    <div data-dbody id="machine-drawer-body">
      <p data-d="req"></p>
      <dl data-totals>${row('headings', L.headings)}${row('links', MV.rows.links)}${row('words', L.words)}${row(
        'entities',
        L.entities,
      )}</dl>
      <p data-l>${esc(MV.rows.outline)}</p>
      <div data-d="outline"></div>
      <p data-l>${esc(MV.rows.graph)}</p>
      <div data-d="ld"></div>
      <p data-dkey><span data-swatch aria-hidden="true"></span>${esc(L.hidden)}</p>
      <p data-dfoot><button type="button" data-copy-json data-done="${esc(cta.copied)}">${esc(
        L.copyJson,
      )}</button><span data-copied aria-live="polite"></span></p>
    </div>
  </aside></template>`;
}

function sheetTemplate(): string {
  const row = (k: string, label: string) => `<div><dt>${esc(label)}</dt><dd data-s="${k}"></dd></div>`;
  return `<template data-source-tpl><aside data-source-sheet aria-label="${esc(L.sheet)}" data-chrome>
    <p data-sh><span data-st>${esc(status.views.source)}</span><code data-s="id"></code></p>
    <dl>${row('src', L.content)}${row('renderer', L.renderer)}${row('contracts', L.motion)}${row('bytes', L.bytes)}</dl>
    <pre data-s="content" tabindex="0"></pre>
    <p data-s="missing" hidden>${esc(L.notBuilt)}</p>
  </aside></template>`;
}

export function renderViews(where: 'status' | 'menu'): string {
  const v = status.views;
  const say = status.announce;
  const name = `view-${where}`;
  const opt = (value: string, label: string, checked = false) =>
    `<label class="views-opt"><input type="radio" name="${name}" value="${value}"${checked ? ' checked' : ''} /><span>${esc(
      label,
    )}</span></label>`;
  const strings =
    where === 'status'
      ? ` data-say-render="${esc(say.render)}" data-say-source="${esc(say.source)}" data-say-machine="${esc(
          say.machine,
        )}" data-hidden-label="${esc(L.hidden)}" data-none="${esc(L.none)}"`
      : '';
  return `<fieldset class="views" data-views="${where}" data-js-only data-chrome${strings}>
    <legend class="views-legend">${esc(v.legend)}</legend>
    <div class="views-track">${opt('render', v.render, true)}${opt('source', v.source)}${opt('machine', v.machine)}</div>
  </fieldset>${where === 'status' ? drawerTemplate() + sheetTemplate() : ''}`;
}
