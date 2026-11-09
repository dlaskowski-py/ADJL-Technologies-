/**
 * Run Replay: the underwriting engine's real stage order, values withheld,
 * with "Break the input" branches.
 *
 * Markup contract: [data-replay="full|compact"]. Everything the module
 * needs is in the page: the trace as a JSON block
 * (<script type="application/json" data-replay-data>), and the whole
 * interactive panel prerendered in its finished state (the clean run,
 * complete) so loading the module never moves a line:
 *
 *   inputs     a native radiogroup, "Try a different input"
 *   outcome    the five outcome sentences stacked in one grid cell, so
 *              the line is as tall as the longest from first paint
 *   trace      a radiogroup of spans (arrow keys pick the one to inspect)
 *              over an SVG timeline, bars not to scale, with a playhead
 *   inspector  the picked span's fields: label, masked value on a labeled
 *              hatch, and where the value comes from. In the full variant
 *              a leader line runs from each field to its source column.
 *   controls   play/pause, step, restart and a scrubber
 *
 * The interactive panel is data-js-only. With JavaScript off the same
 * trace reads as nested <details>, one per span, plus the four "When the
 * input is wrong" outcomes as prose.
 *
 * OWNER: WS4.
 */
import { replayUi as UI } from '../../content-instruments';
import { chip, esc, rich } from '../html';

type Span = (typeof UI.spans)[number] & { f?: string[][]; x?: string };
type SrcKey = keyof typeof UI.sources;
type State = keyof typeof UI.states;

const SPANS = UI.spans as Span[];
/* Which step each span belongs to: the root is 0, top-level stages count
   1…14, and the three fetches share their parent's step. */
const STEP: number[] = [];
{
  let c = 0;
  SPANS.forEach((s, i) => (STEP[i] = s.d === 0 ? 0 : s.d === 1 ? ++c : c));
}
const TOTAL = Math.max(...STEP);
const ROW = 28;

/** A status glyph never travels without its word. Held at a person is the
 *  copper diamond gone amber; held anywhere else, a triangle. */
export const GLYPH: Record<State, string> = {
  done: '✓',
  gate: '◆',
  stop: '✕',
  held: '▲',
  flag: '▲',
  skip: '–',
  idle: '○',
  run: '▸',
};
const glyph = (st: State, k: string) => (st === 'held' && k === 'p' ? '◆' : GLYPH[st]);

/** The clean run's end state for each span. */
const finalState = (s: Span): State => (s.k === 'p' ? 'gate' : 'done');

/** Every field, in run order, with the span it comes from. */
const ALL_FIELDS = SPANS.flatMap((s) => (s.f ?? []).map((f) => [f[0], f[1]] as [string, SrcKey]));

const SRC_ORDER = Object.keys(UI.sources) as SrcKey[];

function srcBadge(k: SrcKey): string {
  const label = UI.sources[k];
  return `<span data-fs="${k}">${k === 'unaudited' ? `<i aria-hidden="true">▲</i> ` : ''}${esc(label)}</span>`;
}

/** The inspector's rows for one span, in the clean run's finished state.
 *  Attribute-styled, because the module rebuilds them. */
function fieldRows(fields: [string, SrcKey][]): string {
  return fields
    .map(
      ([label, src]) =>
        `<li data-f data-v="mask"><span data-fl>${esc(label)}</span><span data-fv>••••</span>${srcBadge(src)}</li>`,
    )
    .join('');
}

/** Sources in the order of the fields that use them (the mean row), so
 *  the leader lines cross as little as they can. */
function sourcesColumn(fields: [string, SrcKey][]): string {
  const mean = (k: SrcKey) => {
    const r = fields.flatMap((f, j) => (f[1] === k ? [j] : []));
    return r.reduce((a, b) => a + b, 0) / r.length;
  };
  const used = SRC_ORDER.filter((k) => fields.some((f) => f[1] === k)).sort((a, b) => mean(a) - mean(b));
  return used.map((k) => `<li data-src="${k}">${srcBadge(k)}</li>`).join('');
}

function inspector(variant: 'full' | 'compact'): string {
  const s = SPANS[0];
  return `<div class="rp-insp" data-rp-insp>
      <p class="rp-i-head"><span class="rp-i-stage" data-rp-i="stage">${esc(UI.inspector.whole)}</span><span class="rp-i-name" data-rp-i="name">${esc(
        s.name,
      )}</span><span class="rp-i-state" data-rp-i="state" data-s="done"><i aria-hidden="true">${GLYPH.done}</i> ${esc(UI.states.done)}</span></p>
      <p class="rp-i-note" data-rp-i="note">${esc(s.n)}</p>
      <div class="hatch rp-fields" data-rp-i="box">
        <span class="hatch-label">${esc(UI.withheld)}</span>
        <div class="rp-fgrid">
          <div class="rp-fcol">
            <p class="rp-i-sub">${esc(UI.inspector.fields)}</p>
            <ol class="rp-fl" data-rp-i="fields">${fieldRows(ALL_FIELDS)}</ol>
          </div>${
            variant === 'full'
              ? `
          <svg class="rp-leads" data-rp-i="leads" aria-hidden="true" focusable="false"></svg>
          <div class="rp-scol">
            <p class="rp-i-sub">${esc(UI.inspector.sources)}</p>
            <ul class="rp-srcs" data-rp-i="srcs">${sourcesColumn(ALL_FIELDS)}</ul>
          </div>`
              : ''
          }
        </div>
      </div>
      <p class="rp-i-extra" data-rp-i="extra" hidden></p>
    </div>`;
}

/** Tree prefix: box-drawing, the way a trace prints. */
function prefix(i: number): string {
  const s = SPANS[i];
  if (s.d === 0) return '';
  const lastAt = (d: number, from: number) => {
    for (let j = from + 1; j < SPANS.length; j++) {
      if (SPANS[j].d < d) return true;
      if (SPANS[j].d === d) return false;
    }
    return true;
  };
  if (s.d === 1) return lastAt(1, i) ? '└─ ' : '├─ ';
  return `│  ${lastAt(2, i) ? '└─ ' : '├─ '}`;
}

function kindBadge(k: string): string {
  if (k !== 'p' && k !== 'm') return '';
  return `<span class="rp-kind" data-k="${k}"><i aria-hidden="true">${k === 'p' ? '◆' : '◇'}</i><span class="rp-kw"> ${esc(
    UI.kinds[k],
  )}</span></span>`;
}

function rows(variant: string): string {
  return SPANS.map((s, i) => {
    const st = finalState(s);
    return `<label class="rp-row" data-s="${st}" style="--d:${s.d}"><input class="rp-pick" type="radio" name="rp-span-${variant}" value="${i}"${
      i === 0 ? ' checked' : ''
    } /><span class="rp-tr" aria-hidden="true">${prefix(i)}</span><span class="rp-g" aria-hidden="true">${glyph(
      st,
      s.k,
    )}</span><span class="rp-name">${esc(s.name)}</span>${kindBadge(s.k)}<span class="rp-sw">${esc(UI.states[st])}</span></label>`;
  }).join('');
}

/** The timeline: one row per span, aligned with the tree, bars of equal
 *  width per step because the timings aren't to scale. */
function timeline(variant: string): string {
  const pct = (n: number) => `${+((n / TOTAL) * 100).toFixed(3)}%`;
  const grid = Array.from({ length: TOTAL + 1 }, (_, k) => `<line x1="${pct(k)}" x2="${pct(k)}" y1="0" y2="100%"/>`).join('');
  const bars = SPANS.map((s, i) => {
    const y = i * ROW;
    const st = finalState(s);
    if (i === 0) {
      return `<rect class="rp-bar rp-bar--run" x="0" y="${y + 10}" width="100%" height="8" rx="2"/><rect class="rp-runfill" data-bar="0" data-s="${st}" x="0" y="${
        y + 10
      }" width="100%" height="8" rx="2" style="--p:1"/>`;
    }
    const a = STEP[i] - 1;
    /* CSS geometry insets each bar 2px from the grid; the attributes are
       the fallback where CSS can't place SVG. */
    const bar = `<rect class="rp-bar" data-bar="${i}" data-s="${st}" data-k="${s.k}" x="${pct(a)}" y="${y + 9}" width="${pct(
      1,
    )}" height="10" rx="2" style="x:calc(${pct(a)} + 2px);width:calc(${pct(1)} - 4px)"/>`;
    const mark =
      s.k === 'p' || s.k === 'm'
        ? `<svg class="rp-mark" data-bar="${i}" data-s="${st}" data-k="${s.k}" x="${pct(a + 0.5)}" y="${y + 14}" overflow="visible"><path d="M0 -7L7 0L0 7L-7 0Z"/></svg>`
        : '';
    return bar + mark;
  }).join('');
  return `<div class="rp-tl" aria-hidden="true">
      <svg class="rp-svg" width="100%" height="${SPANS.length * ROW}" focusable="false"><defs><pattern id="rp-hatch-${variant}" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6"/></pattern></defs><g class="rp-grid">${grid}</g>${bars}</svg>
      <span class="rp-head" style="--at:${TOTAL}"></span>
    </div>`;
}

const OUT_GLYPH: Record<string, string> = { clean: '✓', search: '✕', unknown: '▲', skip: '◆', water: '▲' };

function interactive(variant: 'full' | 'compact'): string {
  const c = UI.controls;
  const total = String(TOTAL);
  const lastName = SPANS[STEP.lastIndexOf(TOTAL)].name;
  return `<div class="rp-ui" data-js-only data-chrome>
    <fieldset class="rp-inputs">
      <legend class="rp-legend">${esc(UI.inputsLegend)}</legend>
      <div class="rp-opts">${UI.inputs
        .map(
          (inp, i) =>
            `<label class="rp-opt"><input type="radio" name="rp-input-${variant}" value="${inp.id}"${i === 0 ? ' checked' : ''} /><span>${esc(
              inp.label,
            )}</span></label>`,
        )
        .join('')}</div>
    </fieldset>
    <div class="rp-out" data-rp-out="clean">${UI.inputs
      .map(
        (inp) =>
          `<p class="rp-out-l" data-out="${inp.id}"><i aria-hidden="true">${OUT_GLYPH[inp.id]}</i> <span>${esc(inp.out)}</span></p>`,
      )
      .join('')}<p class="rp-out-l" data-out="" data-rp-wait><i aria-hidden="true">${GLYPH.run}</i> <span>${esc(UI.states.run)}</span></p></div>
    <div class="rp-main">
      <div class="rp-trace">
        <p class="rp-cols" aria-hidden="true"><span>${esc(UI.cols.span)}</span><span>${esc(UI.timeline)}</span></p>
        <div class="rp-body">
          <fieldset class="rp-rows"><legend class="sr-only">${esc(UI.spansLegend)}</legend>${rows(variant)}</fieldset>
          ${timeline(variant)}
        </div>
      </div>
      ${inspector(variant)}
    </div>
    <div class="rp-ctl" role="group" aria-label="${esc(c.label)}">
      <button class="rp-btn rp-play" type="button" data-rp="play"><i aria-hidden="true">▶</i> <span>${esc(c.play)}</span></button>
      <button class="rp-btn" type="button" data-rp="step"><i aria-hidden="true">⇥</i> ${esc(c.step)}</button>
      <button class="rp-btn" type="button" data-rp="restart"><i aria-hidden="true">↺</i> ${esc(c.restart)}</button>
      <label class="rp-scrub"><span class="sr-only">${esc(c.scrub)}</span><input class="rp-range" type="range" min="0" max="${total}" step="1" value="${total}" aria-valuetext="${esc(
        c.at.replace('{n}', total).replace('{total}', total).replace('{name}', lastName),
      )}" style="--v:1" /></label>
      <span class="rp-read" aria-hidden="true">${esc(`${total} / ${total}`)}</span>
    </div>
    <p class="sr-only" role="status" aria-live="polite" data-rp-live></p>
  </div>`;
}

/** JavaScript off: the clean run as nested details, one per span. */
function staticTrace(): string {
  const node = (i: number): string => {
    const s = SPANS[i];
    const st = finalState(s);
    const kids: number[] = [];
    for (let j = i + 1; j < SPANS.length && SPANS[j].d > s.d; j++) if (SPANS[j].d === s.d + 1) kids.push(j);
    const fields = (s.f ?? []) as [string, SrcKey][];
    const body = fields.length
      ? `<div class="hatch rp-d-f"><span class="hatch-label">${esc(UI.withheld)}</span><dl class="rp-d-dl">${fields
          .map(([l, k]) => `<div class="rp-d-row"><dt>${esc(l)}</dt><dd><span class="rp-mask">••••</span>${srcBadge(k)}</dd></div>`)
          .join('')}</dl></div>`
      : kids.length
        ? ''
        : `<p class="rp-d-none">${esc(s.x === 'derived' ? UI.inspector.derived : UI.inspector.none)}</p>`;
    return `<details class="rp-d"${i === 0 ? ' open' : ''}><summary class="rp-d-s"><span class="rp-d-g" data-s="${st}" aria-hidden="true">${glyph(
      st,
      s.k,
    )}</span><span class="rp-d-n">${esc(s.name)}</span>${kindBadge(s.k)}<span class="rp-d-note">${esc(s.n)}</span></summary>${body}${
      kids.length ? `<div class="rp-d-kids">${kids.map(node).join('')}</div>` : ''
    }</details>`;
  };
  return `<div class="rp-static">
    <p class="rp-st-title" data-chrome>${esc(UI.staticTitle)}</p>
    <div class="rp-d-tree" data-chrome>${node(0)}</div>
    <p class="rp-st-title" data-chrome>${esc(UI.wrongTitle)}</p>
    <ul class="rp-wrong">${UI.inputs
      .slice(1)
      .map((inp) => `<li><span class="rp-wrong-in" data-chrome>${esc(inp.label)}.</span> ${rich(inp.out)}</li>`)
      .join('')}</ul>
  </div>`;
}

/** What the module reads: the trace and the words it writes. JSON with
 *  "<" escaped, so nothing in it can close the script element. */
function data(): string {
  const d = {
    spans: SPANS.map((s) => [s.id, s.name, s.d, s.k, s.n, s.f ?? 0, s.x ?? 0]),
    inputs: UI.inputs.map(({ out: _out, label: _label, ...rest }) => rest),
    states: UI.states,
    sources: UI.sources,
    i: UI.inspector,
    c: { play: UI.controls.play, pause: UI.controls.pause, at: UI.controls.at, start: UI.controls.start },
  };
  return JSON.stringify(d).replace(/</g, '\\u003c');
}

export function renderReplay(variant: 'full' | 'compact'): string {
  return `<div class="panel replay" data-replay="${variant}">
    <div class="panel-head" data-chrome><span class="panel-title">${esc(UI.title)}<span class="rp-sub"> · ${esc(
      UI.sub,
    )}</span></span>${chip('illustration', UI.chip)}</div>
    ${interactive(variant)}
    ${staticTrace()}
    <script type="application/json" data-replay-data>${data()}</script>
  </div>`;
}
