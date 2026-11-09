/**
 * Ask This Site: the panel, as a pure string.
 *
 *   home   a prompt, four chips and the staged pipeline
 *   full   the same prompt, the confidence floor, and "Break the input":
 *          four labeled questions with what each must do, checked at build
 *
 * What's prerendered, and why:
 *
 *   - Every chip is an <a href="#ask-q{n}">. scripts/gen-machine.mjs fills
 *     the <!--ask:pre--> marker with one <article id="ask-q{n}"> per chip,
 *     answered at build by the same src/lib/bm25.ts the browser runs, so
 *     with JavaScript off a chip still takes you to its cited answer.
 *   - The prompt, slider and stage panes are data-js-only. They're in the
 *     HTML from the first frame (html.js is set in the head), resting in
 *     an idle state, so nothing moves when the module arrives.
 *   - Everything that isn't prose sits under data-chrome, so the words a
 *     crawler reads here are the questions and nothing else.
 *   - The strings the module prints live in a JSON block next to the
 *     panel, not in the script, so the copy ships once, in the HTML.
 *
 * OWNER: WS3. Contract: [data-ask="home|full"], [data-ask-pre].
 */
import { ask, CONTACT, prov } from '../../content';
import { askUi } from '../../content-instruments';
import { FLOOR, FLOOR_MAX, FLOOR_MIN, FLOOR_STEP, TOP, fmt } from '../../lib/bm25';
import { chip, esc } from '../html';

export type AskVariant = 'home' | 'full';

const pct = (v: number) => String(Math.round(v * 100));
export const floorText = (v: number): string =>
  ask.floor.valuetext.replace('{v}', fmt(v)).replace('{pct}', pct(v));

/** One idle pane: its number, its name, what it will do. */
function pane(n: number, key: 'query' | 'retrieve' | 'gate' | 'answer', body = ''): string {
  return `<div class="askp-pane" data-pane="${key}">
      <div class="askp-pane-head"><span class="askp-pane-n">${String(n).padStart(2, '0')}</span><span class="askp-pane-name">${esc(
        ask.stages[n - 1],
      )}</span><span class="askp-pane-read" data-read></span></div>
      <div class="askp-pane-body" data-body>${body || `<p class="askp-idle">${esc(askUi.idle[key])}</p>`}</div>
    </div>`;
}

/** RETRIEVE at rest: the eight slots and the floor line, empty. */
function skeleton(): string {
  const rows = Array.from(
    { length: TOP },
    (_, i) =>
      `<li data-hit="empty"><span data-k="rank">${String(i + 1).padStart(2, '0')}</span><span data-k="where"></span><span data-k="bar"><i></i></span><span data-k="conf"></span></li>`,
  ).join('');
  return `<div class="askp-hits" data-hits>
      <div class="askp-hits-head"><span>#</span><span>${esc(askUi.cols.passage)}</span><span>${esc(askUi.cols.conf)}</span><span></span></div>
      <ol class="askp-hit-list">${rows}</ol>
      <div class="askp-gate" aria-hidden="true"><span class="askp-gate-line"></span><span class="askp-gate-tag" data-gate-tag>${esc(
        askUi.floorAt.replace('{v}', fmt(FLOOR)),
      )}</span></div>
      <div class="askp-axis" aria-hidden="true"><span>0</span><span>.25</span><span>.50</span><span>.75</span><span>1</span></div>
    </div>`;
}

function chipList(qs: string[]): string {
  return `<div class="askp-chips">
      <p class="label askp-try" data-chrome>${esc(askUi.tryLabel)}</p>
      <ul class="askp-chip-list">${qs
        .map((q, i) => `<li><a href="#ask-q${i + 1}" data-chip="${i + 1}">${esc(q)}</a></li>`)
        .join('')}</ul>
    </div>`;
}

/** "Break the input": the demo's own evaluation set, as a table you can
 *  run. Each row's verdict is "checked at build" until the index loads,
 *  then it's re-run live at whatever floor the slider is on. */
function cases(id: string): string {
  const g = ask.groups;
  return `<div class="askp-cases" role="group" aria-labelledby="${id}-cases">
      <p class="label askp-cases-title" id="${id}-cases" data-chrome>${esc(g.legend)}</p>
      <ol class="askp-case-list">${g.items
        .map(
          (c, i) => `<li class="askp-case">
          <span class="askp-case-label" data-chrome>${esc(c.label)}</span>
          <a href="#ask-q${i + 1}" data-chip="${i + 1}" data-expect="${esc(c.expect)}">${esc(c.q)}</a>
          <span class="askp-case-expect" data-chrome>${esc(askUi.expect[c.expect])}</span>
          <span class="askp-case-verdict" data-chrome data-verdict="build"><i aria-hidden="true">✓</i> <span>${esc(
            askUi.verdict.build,
          )}</span></span>
        </li>`,
        )
        .join('')}</ol>
    </div>`;
}

function floorControl(id: string): string {
  return `<div class="askp-floor" data-js-only data-chrome>
      <div class="askp-floor-head">
        <label class="label" for="${id}-floor">${esc(ask.floor.label)}</label>
        <output class="askp-floor-out num" for="${id}-floor" data-floor-out>${fmt(FLOOR)}</output>
      </div>
      <input class="askp-range" type="range" id="${id}-floor" min="${FLOOR_MIN}" max="${FLOOR_MAX}" step="${FLOOR_STEP}" value="${FLOOR}" aria-valuetext="${esc(
        floorText(FLOOR),
      )}" data-floor>
      <div class="askp-scale" aria-hidden="true"><span>${fmt(FLOOR_MIN)} · ${esc(askUi.floorScale.low)}</span><span>${esc(
        askUi.floorScale.high,
      )} · ${fmt(FLOOR_MAX)}</span></div>
      <p class="askp-hint">${esc(ask.floor.hint)}</p>
    </div>`;
}

/** Everything the module prints, in one place in the page. Kept outside
 *  the panel so the panel's text is only what a reader sees. */
function copyBlock(variant: AskVariant): string {
  const data = {
    variant,
    floor: FLOOR,
    valuetext: ask.floor.valuetext,
    announce: ask.announce,
    abstain: ask.abstain,
    contact: CONTACT,
    ui: askUi,
    live: { label: prov.live.label, def: prov.live.def },
  };
  /* JSON inside <script> only needs "</" escaped. */
  return `<script type="application/json" data-ask-copy="${variant}">${JSON.stringify(data).replace(/<\//g, '<\\/')}</script>`;
}

export function renderAsk(variant: AskVariant): string {
  const id = `ask-${variant}`;
  const full = variant === 'full';
  return `<div class="panel askp" data-ask="${variant}" data-stage="0">
    <div class="panel-head askp-head" data-chrome>
      <span class="panel-title">${esc(askUi.title)}</span>
      <span class="askp-index" data-js-only data-index="idle">${esc(askUi.index.idle)}</span>
      ${chip('build')}
    </div>
    <div class="askp-ctl">
      <div class="askp-ask" data-js-only>
        <label class="askp-label" for="${id}-q">${esc(ask.label)}</label>
        <div class="askp-field">
          <span class="askp-prompt" aria-hidden="true">›</span>
          <input class="askp-input" type="search" id="${id}-q" placeholder="${esc(ask.placeholder)}" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="search" maxlength="200" data-q>
          <button class="btn btn--primary askp-go" type="button" data-go>${esc(ask.button)}</button>
        </div>
      </div>
      ${
        full
          ? `<div class="askp-tools">${cases(id)}${floorControl(id)}</div>`
          : chipList(ask.chips)
      }
    </div>
    <div class="askp-run" data-js-only data-chrome data-run style="--floor:${FLOOR}">
      <ol class="askp-stages" aria-hidden="true">${ask.stages
        .map((s, i) => `<li class="askp-stage" data-n="${i + 1}"><span>${String(i + 1).padStart(2, '0')}</span> ${esc(s)}</li>`)
        .join('')}</ol>
      <div class="askp-body">
        <div class="askp-mech">
          ${pane(1, 'query')}
          ${pane(2, 'retrieve', skeleton())}
          ${pane(3, 'gate')}
        </div>
        <div class="askp-out">${pane(4, 'answer')}</div>
      </div>
    </div>
    <p class="sr-only" role="status" aria-live="polite" data-chrome data-live></p>
    <div class="askp-pre-wrap" data-ask-pre>
      <p class="askp-pre-note">${esc(askUi.preNote)}</p>
      <!--ask:pre-->
    </div>
  </div>${copyBlock(variant)}`;
}
