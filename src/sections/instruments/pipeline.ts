/**
 * The build sequence on home #process: six steps on a copper rail, and
 * beside each one the artifact that step produces. Every artifact is
 * prerendered HTML text (mono, data-chrome), so the sequence reads in full
 * with JavaScript off, on the reduced tier and on a phone, where each step
 * is a card with its artifact under it.
 *
 * On a desktop with the full tier, CSS turns the list into a sticky stage
 * inside a tall track (6 × 90vh) at first paint, and motion/pipeline.ts
 * drives it from scroll position: `data-stage` (0–5) on the root picks the
 * artifact, `--q` (0→1 within a step) types it in. Typing is a clip-path
 * inset over mono text, so nothing reflows.
 *
 * Markup contract: [data-pipeline]. Typed elements carry `.pl-t` with an
 * inline window `--a`/`--b` (when in the step it types), and `.pl-type`
 * children carry `--n`, their length in characters.
 *
 * OWNER: WS4.
 */
import { pipeline, prov } from '../../content';
import { pipelineUi as UI, replayUi } from '../../content-instruments';
import { chip, esc, rich } from '../html';
import { GUARDS } from './guards';

/** Characters, counted the way a mono font lays them out. */
const len = (s: string) => Array.from(s).length;

/** A line that types in over the window [a, b] of its step. */
function typed(text: string, a: number, b: number, cls = '', tag = 'span'): string {
  return `<${tag} class="pl-t${cls ? ` ${cls}` : ''}" style="--a:${a};--b:${b}"><span class="pl-type" style="--n:${len(
    text,
  )}">${esc(text)}</span></${tag}>`;
}

/** Evenly spaced typing windows across [from, to]. */
function windows(n: number, from: number, to: number): [number, number][] {
  const w = (to - from) / n;
  return Array.from({ length: n }, (_, i) => [+(from + i * w).toFixed(3), +(from + (i + 1) * w).toFixed(3)]);
}

const FRICTION = new Set(['by hand', 'waits on email', 'copy and paste']);
const PICK = 'copy and paste';

/** Step 01 and 02: the process as it runs today, seven boxes on a spine.
 *  Qualitative chips only. No hours, no counts. */
function map(pick: boolean): string {
  const boxes = pipeline.artifacts.map;
  const notes = pipeline.artifacts.pickNote.split(' · ');
  const w = windows(notes.length, 0.12, 0.55);
  return `<div class="pl-map${pick ? ' pl-map--pick' : ' pl-t'}"${pick ? '' : ' style="--a:0.04;--b:0.6"'}>
    <svg class="pl-spine" viewBox="0 0 2 100" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path class="pl-spine-track" d="M1 0V100"/><path class="pl-spine-draw" d="M1 0V100" pathLength="1"/></svg>
    <ol class="pl-boxes">${boxes
      .map((b, k) => {
        const rub = FRICTION.has(b);
        const picked = pick && b === PICK;
        return `<li class="pl-box${rub ? ' pl-box--rub' : ''}${picked ? ' pl-box--pick' : ''}" style="--k:${k}">${
          rub ? '<i class="pl-glyph" aria-hidden="true">▲</i>' : ''
        }<span class="pl-box-t">${esc(b)}</span>${
          picked
            ? `<span class="pl-note">${notes.map((n, i) => typed(n, w[i][0], w[i][1], 'pl-note-l')).join('')}</span>`
            : ''
        }</li>`;
      })
      .join('')}</ol>
    ${pick ? '' : `<p class="pl-key"><i class="pl-glyph" aria-hidden="true">▲</i> ${esc(UI.mapKey)}</p>`}
  </div>`;
}

/** The evaluation table. Step 03 shows it before the build (got: not run);
 *  step 04 shows it again with the ticks filling in. Every case value is
 *  masked on a labeled hatch. */
function evalTable(built: boolean): string {
  const a = pipeline.artifacts;
  const rows = 4;
  const rw = windows(rows, 0.06, 0.4);
  const sw = windows(a.siteRows.length, 0.45, 0.7);
  /* Step 04's ticks land after the diff has typed. */
  const tick = (i: number) =>
    `<span class="pl-tick pl-t" style="--a:${(0.62 + i * 0.05).toFixed(2)};--b:${(0.64 + i * 0.05).toFixed(2)}">✓</span>`;
  const got = (i: number) =>
    built ? `<span class="pl-mask-v">••••</span>${tick(i)}` : `<span class="pl-pending">${esc(UI.notRun)}</span>`;
  return `<div class="pl-eval${built ? ' pl-eval--built' : ''}">
    <p class="pl-sub">${esc(UI.evalLabel)}</p>
    <div class="hatch pl-hatch">
      <span class="hatch-label">${esc(replayUi.withheld)}</span>
      <table class="pl-tbl">
        <thead><tr>${a.evalHead.map((h) => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead>
        <tbody>${Array.from(
          { length: rows },
          (_, i) =>
            `<tr class="${built ? '' : 'pl-t'}"${built ? '' : ` style="--a:${rw[i][0]};--b:${rw[i][1]}"`}><td><span class="pl-type" style="--n:4">••••</span></td><td><span class="pl-type" style="--n:4">••••</span></td><td>${got(
              i,
            )}</td></tr>`,
        ).join('')}</tbody>
      </table>
    </div>
    <p class="pl-sub">${esc(UI.siteLabel)}</p>
    <ul class="pl-site">${a.siteRows
      .map(
        (r, i) =>
          `<li>${built ? `<span class="pl-site-t">${esc(r)}</span>${tick(rows + i)}` : `${typed(r, sw[i][0], sw[i][1], 'pl-site-t')}<span class="pl-pending">${esc(UI.notRun)}</span>`}</li>`,
      )
      .join('')}</ul>
  </div>`;
}

function diff(): string {
  const d = pipeline.artifacts.diff;
  const w = windows(d.length, 0.05, 0.5);
  return `<pre class="pl-diff"><code><span class="pl-hunk">${esc(UI.hunk)}</span>${d
    .map((l, i) => typed(l, w[i][0], w[i][1], 'pl-add'))
    .join('')}</code></pre>
    ${evalTable(true)}`;
}

/** Step 05: a person signs off where it's expensive to be wrong, and the
 *  build fails on anything a machine can check. The terminal lists this
 *  build's guards; motion/pipeline.ts swaps in /build-report.json. */
function review(): string {
  const [needs, approved] = pipeline.artifacts.review;
  return `<div class="pl-review">
    <div class="pl-queue">
      <span class="pl-qitem">${esc(UI.reviewItem)}</span>
      <span class="pl-flag"><i aria-hidden="true">▲</i> ${esc(needs)}</span>
      <span class="pl-t pl-okrow" style="--a:0.3;--b:0.42"><span class="pl-type pl-ok" style="--n:${len(approved) + 2}"><i aria-hidden="true">✓</i> ${esc(
        approved,
      )}</span></span>
    </div>
    <div class="pl-term" data-pl-term="${esc(
      JSON.stringify({ rec: prov.recorded.label, def: prov.recorded.def, stamp: UI.termStamp, failed: UI.termFailed }),
    )}">
      <div class="pl-term-head"><span class="pl-term-title">${esc(UI.termTitle)}</span>${chip('build')}</div>
      <pre class="pl-term-body"><code><span class="pl-cmd">${esc(UI.termCmd)}</span><span class="pl-stamp-l" data-pl-stamp></span><span data-pl-lines>${GUARDS.map(
        (g, j) => `<span data-gl style="--j:${j}"><i aria-hidden="true">✓</i> ${esc(g)}</span>`,
      ).join('')}</span><span class="pl-pass">${rich(pipeline.guardFallback)}</span></code></pre>
    </div>
  </div>`;
}

/** Step 06: the repository you're handed, stamped with its owner. */
function repo(): string {
  const t = pipeline.artifacts.tree;
  const dirs = t.slice(0, -1);
  const owner = t[t.length - 1];
  const w = windows(dirs.length + 1, 0.04, 0.5);
  const root = UI.files[5];
  return `<div class="pl-repo">
    <pre class="pl-tree"><code>${typed(root, w[0][0], w[0][1], 'pl-tree-l')}${dirs
      .map(
        (d, i) =>
          `<span class="pl-t pl-tree-l" style="--a:${w[i + 1][0]};--b:${w[i + 1][1]}"><span class="pl-type" style="--n:${
            len(d) + 3
          }"><span class="pl-branch" aria-hidden="true">${i === dirs.length - 1 ? '└─' : '├─'}</span> ${esc(d)}</span></span>`,
      )
      .join('')}</code></pre>
    <p class="pl-stamp pl-t" style="--a:0.56;--b:0.6"><span>${esc(owner)}</span></p>
  </div>`;
}

const ARTIFACTS = [() => map(false), () => map(true), () => evalTable(false), diff, review, repo];

export function renderPipeline(): string {
  const p = pipeline;
  const n = p.steps.length;
  /* content.ts carries the whole chip label; chip() adds the kind. */
  const note = p.chip.replace(/^[^·]*·\s*/, '');
  return `<div class="pipeline" data-pipeline>
    <div class="pl-stage">
      <div class="pl-head" data-chrome>
        <span class="pl-title">${esc(UI.title)}</span>
        <span class="pl-count" aria-hidden="true"><b data-pl-n>01</b> / ${String(n).padStart(2, '0')}</span>
        ${chip('illustration', note)}
      </div>
      <ol class="pl-steps">${p.steps
        .map(
          (s, i) => `<li class="pl-step" style="--i:${i}">
        <h3 class="pl-h"><span class="pl-num" aria-hidden="true">${esc(s.num)}</span><span class="pl-tt">${rich(s.title)}</span></h3>
        <p class="pl-body">${rich(s.body)}</p>
        <figure class="pl-art panel" data-chrome>
          <figcaption class="pl-cap"><span>${esc(s.num)} · ${esc(s.tag)}</span><span class="pl-file">${esc(UI.files[i])}</span></figcaption>
          <div class="pl-art-body">${ARTIFACTS[i]()}</div>
        </figure>
      </li>`,
        )
        .join('')}</ol>
    </div>
  </div>`;
}
