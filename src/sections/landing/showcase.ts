/**
 * The portfolio: what we've built, one card per system, each opening with
 * an animated preview of that system doing its job. Used on the home page
 * (#systems) and on /work/ under its filter, so every card keeps data-tags
 * (ui.ts initFilter toggles `hidden` on [data-tags]).
 *
 * The cards are content.ts `systems.items`, in that order, and the first
 * one is the feature: it takes a whole row. A preview is picked by the
 * card's link, so a new item without a drawing still renders as a plain
 * card. The layout is the stylesheet's (styles/landing/showcase.css): rows
 * that wrap, and a card that turns on its side once it's wide enough.
 *
 * A PREVIEW is a device frame (a browser window, or a stage with a phone on
 * it) around one inline SVG. Markup contract: [data-scene] on the frame;
 * motion/scenes.ts sets data-playing while it's on screen, and everything
 * that moves is CSS hanging off that (styles/landing/showcase.css).
 *
 * THE DRAWINGS HAVE NO viewBox. A frame is 240px wide on a small phone and
 * 690px wide (and half as tall again) as the feature on a desktop, and a
 * scaled drawing would have to pick one of those to be legible at. So a
 * drawing is laid out like a page instead, and fills whatever frame it's
 * given:
 *
 *   - A length written '5%' is a share of the frame (of its width for x,
 *     of its height for y). A bare number is pixels.
 *   - at(x, y, …) starts a group whose origin is that point of the frame.
 *     Inside it, numbers are pixels from there, so a glyph, a pill or a
 *     phone keeps its size while the frame around it stretches. at(0, y, …)
 *     pins only the height: a table row, whose cells still spread by share.
 *   - box(x, y, w, h, …) is a region that's a share of the frame both
 *     ways (a document, a page). Shares inside it are shares of the box.
 *   - Lines that connect things run in shares and are drawn FIRST, so the
 *     opaque boxes over their ends cover the slack.
 *
 * Labels stay 11px at every width (13px in a card on its side); only the
 * layout stretches. They're centered on their y (the stylesheet sets
 * dominant-baseline), so a row's text sits at y 0. Where a size has to
 * follow the type (a plate behind a label, a run of readouts), it's
 * written in em: the mono face is 0.6em a character.
 *
 * WHAT'S PRERENDERED IS THE FINISHED PICTURE, which is what JavaScript-off,
 * reduced motion and Pause show. Playing, a scene runs one 9s loop:
 *
 *   sc-k1 … sc-k6   appears on that step and stays (frames and captions
 *                   carry no step, so they never leave the picture)
 *   sc-dr           with a step: a line that draws (needs pathLength="1")
 *   sc-sl / sc-up   with a step: slides in from the left / lands from above
 *   sc-gx           with a step: a bar that grows from its left end
 *   sc-fw           a dashed line that keeps flowing
 *   sc-tk           a readout that ticks
 *   sc-run          a bar that fills from the first step to the last
 *   sc-tmp          shown for a moment early in the loop, and not at rest
 *   sc-act          the layer holding everything with a step: it blinks
 *                   out between loops, so a loop never ends on a hard cut
 *
 * Color keeps the site's meaning: copper for people and interfaces, teal
 * for data and its paths, violet for what a model produced, amber for
 * unaudited or waiting on a person, red for refused. Values are masked.
 * The drawings are aria-hidden: the card's own title and body say the same
 * thing in words. Every label comes from content-showcase.ts.
 *
 * OWNER: WS-C (showcase).
 */
import { systems, type SystemCard } from '../../content';
import { showcase as S, type ShowcaseTone } from '../../content-showcase';
import { chip, esc, rich } from '../html';

/* ── SVG primitives ─────────────────────────────────────────────────── */

/** A length: a number is pixels, a string is as written ('5%', '1.2em'). */
type U = number | string;
type Anchor = '' | 'middle' | 'end';

const c = (cls: string) => (cls ? ` class="${cls}"` : '');
const pct = (n: number) => `${+n.toFixed(2)}%`;
const rect = (cls: string, x: U, y: U, w: U, h: U, rx = 2, extra = '') =>
  `<rect${c(cls)} x="${x}" y="${y}" width="${w}" height="${h}"${rx ? ` rx="${rx}"` : ''}${extra}/>`;
const line = (cls: string, x1: U, y1: U, x2: U, y2: U, extra = '') =>
  `<line${c(cls)} x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"${extra}/>`;
const text = (cls: string, x: U, y: U, s: string, anchor: Anchor = '', extra = '') =>
  `<text${c(cls)} x="${x}" y="${y}"${anchor ? ` text-anchor="${anchor}"` : ''}${extra}>${esc(s)}</text>`;
const path = (cls: string, d: string) => `<path${c(cls)} d="${d}"/>`;
const g = (cls: string, ...inner: string[]) => `<g class="${cls}">${inner.join('')}</g>`;
/** Pixels from this point of the frame. Pass 0 to leave an axis as it is. */
const at = (x: U, y: U, ...inner: string[]) =>
  `<svg${x ? ` x="${x}"` : ''}${y ? ` y="${y}"` : ''}>${inner.join('')}</svg>`;
/** A region of the frame. Shares inside it are shares of the region. */
const box = (x: U, y: U, w: U, h: U, ...inner: string[]) =>
  `<svg x="${x}" y="${y}" width="${w}" height="${h}">${inner.join('')}</svg>`;
/** The outline of a box(), filling it. */
const sheet = () => rect('sc-f', 0, 0, '100%', '100%', 3);
/** A line that draws on its step: pair with sc-dr. */
const DRAW = ' pathLength="1"';
const DOTTED = ' stroke-dasharray="2 4"';
/** A check mark, 9 × 7, from its left tip. */
const tick = (cls: string, x: number, y: number) => path(cls, `M${x} ${y}l3 3 6-7`);
/** Lines of text nobody needs to read: skeleton bars down a box(), each
 *  [y, width] in shares of it. */
const bars = (...rows: [number, number][]) =>
  rows.map(([y, w]) => rect('sc-sk', '15%', pct(y), pct(w), 3, 1)).join('');
/** A column head. */
const cap = (x: U, s: string, anchor: Anchor = '', y: U = '10%') => text('sc-cp', x, y, s, anchor);
/** A label that sits on a line: the text at (0, y), on a plate the color
 *  of the ground and the width of the text (the mono face is 0.6em a
 *  character), so the line stops short of it at any width. */
function tag(cls: string, y: number, s: string, anchor: 'middle' | 'end'): string {
  const w = +(s.length * 0.6 + 1).toFixed(1);
  const x = anchor === 'end' ? +(w - 0.2).toFixed(1) : w / 2;
  return rect('sc-g', `-${x}em`, y - 8, `${w}em`, 16, 0) + text(cls, 0, y, s, anchor);
}

const TONE: Record<ShowcaseTone, string> = { data: 'sc-d', model: 'sc-m', warn: 'sc-w' };

/* ── The engine: a link is pasted, a file fills in, each line sourced ── */

function sceneEngine(): string {
  const A = S['/work/real-estate-intelligence/'];
  const [name, value, source] = A.cols;
  /* The first row's middle and the distance between rows, in shares of the
     frame's height: the table stretches with the frame, a row's text doesn't. */
  const TOP = 38.5;
  const PITCH = 10.2;
  const BAR = '13%';
  const HEAD = '28%';
  /* A rule over every row. The table is ruled before anything arrives, so
     the frame is never empty. */
  const rules = A.rows.map((_, i) => {
    const y = pct(TOP + (i - 0.5) * PITCH);
    return line('sc-ln', '5%', y, '95%', y);
  });
  const rows = A.rows.map((r, i) => {
    const tone = TONE[r.tone];
    return g(
      `sc-k${r.step} sc-sl`,
      at(
        0,
        pct(TOP + i * PITCH),
        /* The unaudited row says so twice: a band in amber, and its word. */
        r.flag ? g(tone, rect('', '5%', -10, '90%', 20, 0, ' fill-opacity=".1"'), rect('', '5%', -10, 2, 20, 0)) : '',
        text('sc-hi', '8%', 0, r.name),
        text('', '37%', 0, S.mask),
        text(tone, '92%', 0, r.flag ? `${S.flag} ${r.source}` : r.source, 'end'),
      ),
    );
  });
  /* The link sits two characters in, after the prompt. The paste is a
     selection its width (the mono face is 0.6em a character), for a moment. */
  const LINK = '1.2em';
  const flash = rect('sc-c sc-tmp', '0.9em', -9, `${+(A.url.length * 0.6 + 0.6).toFixed(1)}em`, 18, 2, ' fill-opacity=".35"');

  return [
    /* The bar the link goes in, the track of the run under it, the prompt. */
    at(0, BAR, rect('sc-f', '5%', -13, '90%', 26, 4), line('sc-ln', '5%', 18, '95%', 18)),
    at('8%', BAR, text('sc-c', 0, 0, '>')),
    cap('8%', name, '', HEAD),
    cap('37%', value, '', HEAD),
    cap('92%', source, 'end', HEAD),
    ...rules,
    g(
      'sc-act',
      at('8%', BAR, flash, text('sc-hi sc-k1', LINK, 0, A.url)),
      text('sc-c sc-k1', '92%', BAR, A.pasted, 'end'),
      /* The run: the track fills while the file does. */
      at(0, BAR, rect('sc-d sc-run', '5%', 17, '90%', 2, 0)),
      ...rows,
    ),
  ].join('');
}

/* ── Loep: a pin on the map, the records on a sheet, a price confirmed ── */

function sceneLoep(): string {
  const A = S['/work/loep/'];
  /* The map and the sheet stand side by side and are as tall as each other:
     where they start and how tall they are, in shares of the frame's height. */
  const TOP = 20;
  const TALL = 69;
  const MAP = 5;
  const WIDE = 25;
  const SHEET = '35%';
  const map = (...inner: string[]) => box(pct(MAP), pct(TOP), pct(WIDE), pct(TALL), ...inner);
  const page = (...inner: string[]) => box(SHEET, pct(TOP), '60%', pct(TALL), ...inner);
  /* The sheet's five lines, evenly spaced, in shares of its height: three
     figures with a hairline under each, the box the person ticks, the run
     that waits for the tick. */
  const ROWS = [13, 31, 49];
  const CONFIRM = '67%';
  const MODEL = '85%';
  /* The pin stands level with the middle figure, so the survey's line runs
     straight from it to the middle of what it brings back. */
  const LEVEL = ROWS[1];
  const PIN_X = pct(MAP + WIDE / 2);
  const PIN_Y = pct(TOP + (LEVEL * TALL) / 100);
  const spot = (...inner: string[]) => map(at('50%', pct(LEVEL), ...inner));
  /* The ground: contours of a hill and of the corner of another, traced
     from a height field and cut off at the map's edge. Points on a
     100 × 100 grid that's stretched over the map (sc-ns keeps the strokes
     unscaled); the pin's spot is left clear. */
  const ground =
    'M45 0C42 3 37 12 30 16C22 20 5 22 0 23M29 0C27 2 23 7 19 10C14 12 3 13 0 14' +
    'M100 67C96 65 87 58 78 56C70 53 59 52 49 53C40 53 29 56 21 59C14 62 7 67 5 72C3 77 4 84 8 88C12 93 26 98 29 100' +
    'M48 60C39 61 28 65 23 69C19 74 18 81 22 85C26 90 37 94 46 95C55 97 68 95 75 93C83 90 90 83 90 79C91 74 84 67 77 64C70 61 57 60 48 60z' +
    'M48 66C41 68 31 74 31 78C30 81 40 88 47 89C54 91 69 89 73 86C78 83 78 74 74 71C70 68 55 65 48 66z';
  const rules = ROWS.map((y) => line('sc-ln', '6%', pct(y + 9), '94%', pct(y + 9)));
  const rows = A.rows.map((r, i) =>
    g(
      `sc-k${r.step} sc-sl`,
      page(
        at(
          0,
          pct(ROWS[i]),
          text('sc-hi', '6%', 0, r.name),
          text('', '36%', 0, S.mask),
          text('sc-d', '94%', 0, r.source, 'end'),
        ),
      ),
    ),
  );

  return [
    cap(pct(MAP), A.place),
    cap('95%', A.sheet, 'end'),
    map(
      rect('sc-ln', 0, 0, '100%', '100%', 3),
      `<svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">${path('sc-ns', ground)}</svg>`,
    ),
    /* Under the sheet, so the sheet covers its end; under the pin, so the
       pin covers its start. */
    g('sc-act', line('sc-o sc-d sc-dr sc-k2', PIN_X, PIN_Y, SHEET, PIN_Y, DRAW)),
    /* The sheet is ruled before anything arrives, its box unticked and its
       run not started. */
    page(
      sheet(),
      ...rules,
      at('6%', CONFIRM, rect('sc-ln', 0, -6, 12, 12, 2)),
      at(0, MODEL, text('', '6%', 0, A.model), rect('sc-sk', '36%', -3, '58%', 6, 1)),
    ),
    g(
      'sc-act',
      /* The click: the building's outline, and the pin that lands on it. */
      g('sc-c sc-k1', spot(path('sc-o', 'M-12-4L9-10 12 4-9 10z'))),
      g(
        'sc-c sc-k1 sc-up',
        spot(path('', 'M0 0C-2-6-7-8-7-13a7 7 0 1 1 14 0C7-8 2-6 0 0z'), '<circle class="sc-g" cy="-13" r="2.5"/>'),
      ),
      ...rows,
      /* The person's act, then the run it was holding back. */
      g(
        'sc-c sc-k5',
        page(at('6%', CONFIRM, rect('sc-o', 0, -6, 12, 12, 2), tick('sc-o', 1.5, 0), text('', 19, 0, A.confirmed))),
      ),
      page(at(0, MODEL, rect('sc-m sc-gx sc-k6', '36%', -3, '58%', 6, 1))),
    ),
  ].join('');
}

/* ── Trading and research: many feeds, one stream, the evening brief ── */

function sceneFeed(): string {
  const A = S['/work/trading-infrastructure/'];
  const MID = '54%';
  /* Raw ticks arrive unevenly (each pattern repeats every 20px, so the
     flow loops without a jump). The normalized stream is even. */
  const lanes: [string, string][] = [
    ['32%', '2 4 2 8 2 2'],
    [MID, '2 2 2 6 2 6'],
    ['76%', '2 8 2 4 2 2'],
  ];
  const rails = lanes.map(([y]) => line('sc-ln', '5%', y, '30%', y) + line('sc-ln', '30%', y, '40%', MID));
  const ticks = lanes.map(([y, dash]) =>
    line('sc-fw', '5%', y, '30%', y, ` stroke-width="11" stroke-dasharray="${dash}"`),
  );
  const brief = (...inner: string[]) => box('73%', '21%', '22%', '68%', ...inner);

  return [
    cap('5%', A.feeds),
    cap('40%', A.normalize, 'middle'),
    cap('95%', A.brief, 'end'),
    ...rails,
    g(
      'sc-act',
      g('sc-hi sc-k1', ...ticks),
      /* Under the node that makes it, so the node covers its start. */
      g(
        'sc-d sc-k3',
        line('sc-fw', '40%', MID, '73%', MID, ' stroke-width="2" stroke-dasharray="6 4"'),
        text('', '56.5%', '66%', A.stream, 'middle'),
      ),
      g('sc-k2', at('40%', MID, rect('sc-f', -13, -13, 26, 26, 4), path('sc-o sc-d', 'M-6-5h12M-6 0h12M-6 5h12'))),
      /* The brief lands, then writes itself: a heading and two paragraphs. */
      g('sc-k4 sc-up', brief(sheet())),
      g('sc-k5', brief(rect('sc-c', '15%', '11%', '46%', 4, 1), bars([26, 70], [36, 56], [46, 66]))),
      g('sc-k6', brief(bars([62, 70], [72, 48], [82, 60]))),
    ),
  ].join('');
}

/* ── Agentic research: a question, ideas declared, a control, a log ──── */

function sceneResearch(): string {
  const A = S['/work/agentic-research/'];
  const [idea, vs, verdict] = A.cols;
  /* The log's rows sit where the engine's file rows do: the first row's
     middle and the distance between rows, in shares of the frame's height. */
  const TOP = 38.5;
  const PITCH = 10.2;
  const BAR = '13%';
  const HEAD = '28%';
  const PAPER = '87%';
  /* The comparison column, in shares of the frame's width, and the blind
     control at its middle: one line down the whole log, because every idea
     is measured against it on the same days. Its head is centered on it,
     and at 240px it still clears the verdict's head by two characters. */
  const X0 = 30;
  const SPAN = 40;
  const CONTROL = pct(X0 + SPAN / 2);
  /* Each declared idea: how far its bar reaches, as a share of the column,
     and whether it cleared the control. Most don't. A drawing, not a
     result: the row that passes is placed, not measured. */
  const ROWS = [
    { reach: 0.3, pass: false },
    { reach: 0.44, pass: false },
    { reach: 0.9, pass: true },
    { reach: 0.2, pass: false },
  ];
  const y = (i: number) => pct(TOP + i * PITCH);
  const rules = ROWS.map((_, i) => {
    const ry = pct(TOP + (i - 0.5) * PITCH);
    return line('sc-ln', '5%', ry, '95%', ry);
  });
  const chosen = ROWS.findIndex((r) => r.pass);

  return [
    /* The bar the question goes in, with its prompt. */
    at(0, BAR, rect('sc-f', '5%', -13, '90%', 26, 4)),
    at('8%', BAR, text('sc-c', 0, 0, '>')),
    cap('8%', idea, '', HEAD),
    cap(CONTROL, vs, 'middle', HEAD),
    cap('92%', verdict, 'end', HEAD),
    ...rules,
    line('sc-ln', CONTROL, pct(TOP - 0.5 * PITCH), CONTROL, pct(TOP + (ROWS.length - 0.5) * PITCH), DOTTED),
    /* The paper ledger: ruled off under the log, its track empty until
       something is chosen for it. */
    line('sc-ln', '5%', '79%', '95%', '79%'),
    at(0, PAPER, text('sc-hi', '8%', 0, A.paper), line('sc-ln', '33%', 0, '60%', 0)),
    g(
      'sc-act',
      /* The owner's question, then the plan's ideas, declared before any
         test runs (violet: the agents wrote them), then his approval. */
      at('8%', BAR, text('sc-hi sc-k1', '1.2em', 0, `${A.question} ${S.mask}`)),
      ...ROWS.map((_, i) => g('sc-m sc-k2 sc-sl', at(0, y(i), text('', '8%', 0, S.mask)))),
      g('sc-c sc-k3', at('92%', BAR, text('', -15, 0, A.approved, 'end'), tick('sc-o', -9, 0))),
      /* The one the owner chooses for paper: copper, a band and an edge,
         under its row. */
      g(
        'sc-c sc-k6',
        at(0, y(chosen), rect('', '5%', -10, '90%', 20, 0, ' fill-opacity=".1"'), rect('', '5%', -10, 2, 20, 0)),
      ),
      /* The tests run: each idea's bar grows against the control. */
      ...ROWS.map((r, i) => at(0, y(i), rect('sc-d sc-gx sc-k4', pct(X0), -3, pct(SPAN * r.reach), 6, 1))),
      /* The verdicts, written down. A state color never stands alone: each
         says its word. */
      ...ROWS.map((r, i) =>
        g('sc-k5', at(0, y(i), text(r.pass ? 'sc-d' : 'sc-x', '92%', 0, r.pass ? A.pass : A.fail, 'end'))),
      ),
      /* On paper, after every close: the track starts to flow. */
      g(
        'sc-d sc-k6',
        at(
          0,
          PAPER,
          line('sc-fw', '33%', 0, '60%', 0, ' stroke-width="2" stroke-dasharray="6 4"'),
          text('', '92%', 0, A.close, 'end'),
        ),
      ),
    ),
  ].join('');
}

/* ── The native app: move an assumption, the answer recomputes, offline ── */

function sceneApp(): string {
  const A = S['/work/mobile-app/'];
  /* Where the phone stands. The notes run from it to the right edge. */
  const X = '30%';
  /* A note: its height on the phone (pixels from the middle), what it
     says, its color. They arrive top to bottom, a step each. */
  const notes: [number, string, string][] = [
    [-61, A.net, 'sc-hi'],
    [-13, A.moved, 'sc-c'],
    [29, A.done, 'sc-d'],
  ];
  /* Each leader starts under the phone and runs the whole way to the edge;
     its label sits on it, on a plate. */
  const leaders = notes.map(([y, , tone], i) => line(`sc-o ${tone} sc-dr sc-k${i + 1}`, X, y, '95%', y, DRAW));
  const labels = notes.map(([y, label, tone], i) => g(`sc-k${i + 1}`, tag(tone, y, label, 'end')));
  /* The screen is laid out in pixels, so its type is too: it stays 11px
     where the frame's labels go a size up. */
  const phone = [
    rect('sc-f', -50, -92, 100, 184, 14),
    line('sc-ln', -9, -82, 9, -82),
    line('sc-ln', -14, 82, 14, 82),
    g('sc-hi', rect('sc-o', -38, -72, 76, 22, 11), text('', 0, -61, A.offline, 'middle')),
    /* The slider's knob travels (sc-nb) and the result snaps (sc-rs). */
    text('', -38, -32, A.slider),
    line('sc-ln', -38, -13, 38, -13),
    '<circle class="sc-c sc-nb" cx="14" cy="-13" r="6"/>',
    text('', -38, 10, A.result),
    rect('sc-sk', -38, 25, 76, 8, 1),
    rect('sc-d sc-rs', -38, 25, 58, 8, 1),
    text('sc-hi sc-lg', -38, 56, S.mask),
  ];

  return [
    g('sc-act', at(0, '50%', ...leaders)),
    at(X, '50%', `<g font-size="11">${phone.join('')}</g>`),
    g('sc-act', at('95%', '50%', ...labels)),
  ].join('');
}

/* ── The private site: a signed request gets the page, any other doesn't ── */

function sceneEdge(): string {
  const A = S['/work/private-site/'];
  /* Hatching means one thing on this site: deliberately not shown. */
  const hatch = `<defs><pattern id="sc-ht" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">${line(
    'sc-ln',
    3,
    0,
    3,
    6,
  )}</pattern></defs>`;
  /* The two requests' lanes, and the page each one reaches. */
  const UP = '37%';
  const DOWN = '75%';
  const request = (w: number, label: string, cls: string) =>
    rect('sc-f', 0, -11, w, 22, 11) + text(cls, w / 2, 0, label, 'middle');
  const page = (y: string, ...inner: string[]) => box('72%', y, '23%', '34%', ...inner);
  const check = rect('sc-f', -11, -11, 22, 22, 4);

  return [
    hatch,
    cap('5%', A.request),
    cap('50%', A.edge, 'middle'),
    cap('95%', A.page, 'end'),
    line('sc-ln', '50%', '18%', '50%', '94%', DOTTED),
    /* Each request and its line to the edge, then the line past it: drawn
       for the signed one, dotted for the one that gets nothing. */
    g(
      'sc-act',
      line('sc-o sc-c sc-dr sc-k1', '8%', UP, '50%', UP, DRAW),
      line('sc-o sc-d sc-dr sc-k3', '50%', UP, '72%', UP, DRAW),
      line('sc-o sc-dr sc-k4', '8%', DOWN, '50%', DOWN, DRAW),
      line('sc-ln sc-k6', '50%', DOWN, '72%', DOWN, DOTTED),
      g('sc-k1 sc-sl', at('5%', UP, request(60, A.signed, 'sc-c'))),
      g('sc-k4 sc-sl', at('5%', DOWN, request(66, A.unknown, ''))),
    ),
    at('50%', UP, check),
    at('50%', DOWN, check),
    g(
      'sc-act',
      g('sc-k2', at('50%', UP, tick('sc-o sc-d', -5, 0))),
      g('sc-k5', at('50%', DOWN, path('sc-o sc-x', 'M-4-4l8 8m0-8l-8 8'))),
      g('sc-k3', page('20%', sheet(), rect('sc-c', '15%', '17%', '46%', 4, 1), bars([38, 70], [54, 54], [70, 64]))),
      g(
        'sc-k6',
        page(
          '58%',
          rect('sc-ln', 0, 0, '100%', '100%', 3, ' stroke-dasharray="3 3"'),
          '<rect width="100%" height="100%" rx="3" fill="url(#sc-ht)"/>',
          at('50%', '50%', tag('sc-x', 0, A.refused, 'middle')),
        ),
      ),
    ),
  ].join('');
}

/* ── This website: its own hero, its structure figure, its status bar ── */

function sceneSite(): string {
  const A = S['/work/this-site/'];
  const NAV = '8%';
  const STATUS = '93.5%';
  /* The page's outline as a tree: the root, its sections, their parts.
     Points on a 100 × 100 grid that's stretched over the figure's panel;
     the stylesheet keeps their strokes unscaled (sc-ns, sc-pt). */
  const top = '50 15';
  const mid = ['20 50', '50 50', '80 50'];
  const low = ['10 85', '30 85', '50 85', '70 85', '90 85'];
  const parent = [0, 0, 1, 2, 2];
  /* A point is a line too short to see, so its square cap is all of it. */
  const dots = (pts: string[]) => pts.map((p) => `M${p}h.01`).join('');
  const edges = mid.map((m) => `M${top}L${m}`).join('') + low.map((l, i) => `M${mid[parent[i]]}L${l}`).join('');
  /* The status bar's readouts: a label, then a value that ticks. Set one
     after another in em, the way the mono face sets them: 0.6em a
     character, one character between a label and its value, two between
     readouts. */
  let col = 0;
  const readouts = A.readouts.map((label, i) => {
    const x = col;
    const v = x + label.length + 1;
    col = v + A.readoutMask.length + 2;
    return (
      text('', `${+(x * 0.6).toFixed(1)}em`, 0, label) +
      text('sc-hi sc-tk', `${+(v * 0.6).toFixed(1)}em`, 0, A.readoutMask, '', ` style="--d:${-i * 1.5}s"`)
    );
  });

  return [
    /* The nav: the three-bar mark and the wordmark, two links, the button. */
    at(
      '5%',
      NAV,
      rect('sc-hi', 0, -6, 3, 12, 0),
      rect('sc-c', 5, -6, 3, 12, 0),
      rect('sc-hi', 10, -6, 3, 12, 0),
      rect('sc-sk', 20, -2, 38, 4, 1),
    ),
    at('95%', NAV, rect('sc-sk', -92, -1.5, 16, 3, 1), rect('sc-sk', -70, -1.5, 16, 3, 1), rect('sc-c', -44, -7, 44, 14)),
    line('sc-ln', 0, '16%', '100%', '16%'),
    /* The hero's eyebrow, and the panel its figure draws in. */
    at('5%', '25%', rect('sc-c', 0, -1, 10, 2, 0), rect('sc-sk', 14, -2, 40, 4, 1)),
    rect('sc-f', '62%', '22%', '33%', '58%', 3),
    /* The status bar: readouts, and the Pause motion switch. */
    line('sc-ln', 0, '87%', '100%', '87%'),
    at('5%', STATUS, ...readouts),
    at('95%', STATUS, rect('sc-ln', -36, -7, 36, 14, 7), rect('sc-sk', -33, -4, 14, 8, 4)),
    g(
      'sc-act',
      /* The headline, a line at a time, the last one in copper. */
      rect('sc-hi sc-gx sc-k1', '5%', '31%', '46%', '5.4%', 1),
      rect('sc-hi sc-gx sc-k2', '5%', '40.5%', '40%', '5.4%', 1),
      rect('sc-c sc-gx sc-k3', '5%', '50%', '30%', '5.4%', 1),
      /* The body copy and the two buttons. */
      g(
        'sc-k4',
        rect('sc-sk', '5%', '61.5%', '42%', 3, 1),
        rect('sc-sk', '5%', '67%', '34%', 3, 1),
        at('5%', '77%', rect('sc-c', 0, -8, 50, 16), rect('sc-ln', 56, -8, 50, 16)),
      ),
      /* The figure: the page's nodes, then the edges between them. */
      `<svg x="62%" y="22%" width="33%" height="58%" viewBox="0 0 100 100" preserveAspectRatio="none">${path(
        'sc-ns sc-m sc-k6',
        edges,
      )}${path('sc-pt sc-m sc-k5', dots(mid.concat(low)))}${path('sc-pt sc-c sc-k5', dots([top]))}</svg>`,
    ),
  ].join('');
}

/* ── The AI practice: a document becomes fields, one waits for a person ── */

function sceneAi(): string {
  const A = S['/work/ai-implementation/'];
  /* The three fields' rows. The document feeds each as it arrives; the
     last one is the field that's held, and it feeds the gate. */
  const ROWS = ['36%', '55%', '74%'];
  const HELD = ROWS[2];
  /* A field: its box, its key (structure, so violet) and its value (masked). */
  const field = (w: number) =>
    rect('sc-f', '31%', -12, '32%', 24) + rect('sc-m', '34%', -2, 14, 4, 1) + rect('sc-sk', '41.5%', -2, pct(w), 4, 1);
  const read = (i: number, w: number) =>
    g(`sc-k${i + 1} sc-sl`, at(0, ROWS[i], field(w), at('60%', 0, tick('sc-o sc-d', -9, 0))));
  const feeds = ROWS.map((y, i) => line(`sc-o sc-m sc-dr sc-k${i + 1}`, '24%', ROWS[1], '31%', y, DRAW));
  const gate = (...inner: string[]) => box('72%', '24%', '23%', '62%', ...inner);
  const person = 'M-10-10a10 10 0 1 0 20 0a10 10 0 1 0-20 0M-18 25a18 16 0 0 1 36 0';

  return [
    cap('5%', A.doc),
    cap('47%', A.fields, 'middle'),
    cap('95%', A.gate, 'end'),
    box(
      '5%',
      '24%',
      '19%',
      '62%',
      sheet(),
      rect('sc-hi', '15%', '10%', '42%', 4, 1),
      bars([24, 70], [35, 56], [46, 70], [57, 46], [68, 64], [79, 36]),
    ),
    gate(sheet()),
    g(
      'sc-act',
      ...feeds,
      line('sc-o sc-w sc-dr sc-k4', '63%', HELD, '72%', HELD, DRAW),
      read(0, 12),
      read(1, 9),
      /* The held field: amber, outlined, and it says so. */
      g(
        'sc-w sc-k3 sc-sl',
        at(0, HELD, field(6), rect('sc-o', '31%', -12, '32%', 24), text('', '61.5%', 0, A.held, 'end')),
      ),
      /* A person at the gate, then their decision. */
      g('sc-c sc-k5', gate(at('50%', '38%', path('sc-o', person)))),
      g('sc-c sc-k6', gate(at('50%', '38%', tick('sc-o', 15, -18)), text('', '50%', '84%', A.approved, 'middle'))),
    ),
  ].join('');
}

/* ── Frames and cards ───────────────────────────────────────────────── */

/** A card's preview, by its link: the caption in its title bar and the
 *  drawing under it. `phone`: the frame is a stage with a phone on it, so
 *  it carries no browser dots. */
const SCENES: Record<string, { bar: string; draw: () => string; phone?: boolean }> = {
  '/work/real-estate-intelligence/': { bar: S['/work/real-estate-intelligence/'].bar, draw: sceneEngine },
  '/work/loep/': { bar: S['/work/loep/'].bar, draw: sceneLoep },
  '/work/trading-infrastructure/': { bar: S['/work/trading-infrastructure/'].bar, draw: sceneFeed },
  '/work/agentic-research/': { bar: S['/work/agentic-research/'].bar, draw: sceneResearch },
  '/work/mobile-app/': { bar: S['/work/mobile-app/'].bar, draw: sceneApp, phone: true },
  '/work/private-site/': { bar: S['/work/private-site/'].bar, draw: sceneEdge },
  '/work/this-site/': { bar: S['/work/this-site/'].bar, draw: sceneSite },
  '/work/ai-implementation/': { bar: S['/work/ai-implementation/'].bar, draw: sceneAi },
};

function shot(href: string): string {
  const scene = SCENES[href];
  if (!scene) return '';
  return `<div class="sc-shot" data-scene data-chrome aria-hidden="true">
        <div class="sc-bar">${scene.phone ? '' : '<i class="sc-dots"></i>'}<span class="sc-addr">${esc(scene.bar)}</span>${chip('illustration')}</div>
        <svg class="sc-art" focusable="false">${scene.draw()}</svg>
      </div>`;
}

/** Reveal order within a row: the feature alone, then rows of three. */
const stagger = (i: number) => (i ? (i - 1) % 3 : 0);

/**
 * A card's title or its sentence, in both readings. The reading switch
 * (<html data-read="plain|technical">, set before first paint) shows one
 * and hides the other in base CSS, so both are prerendered side by side
 * and each is marked for it. Text twins, the Ask index and check-voice
 * read the technical one only. A card with no plain version prints its
 * one version, unmarked, in either reading.
 *
 * The plain one also carries data-chrome, as the {k} definitions do
 * (html.ts rich()): every reader that takes the shared exclusion set
 * (src/lib/exclude.ts) then skips it too, so Machine View's outline and
 * word count, the Ask index and the browser's own readers see each card
 * once. data-chrome changes nothing on screen.
 */
function readings(tag: 'span' | 'p', plain: string | undefined, technical: string): string {
  if (!plain || plain === technical) return tag === 'p' ? `<p>${rich(technical)}</p>` : rich(technical);
  return `<${tag} data-for="plain" data-chrome>${rich(plain)}</${tag}><${tag} data-for="technical">${rich(technical)}</${tag}>`;
}

/**
 * One card. sc-lay is what lays it out: the preview over the copy, or
 * beside it once the card itself is wide enough (a container query on the
 * card, so the feature, and any card the /work/ filter leaves alone in a
 * row, turns without a rule of its own).
 */
function card(it: SystemCard, i: number): string {
  return `<article class="sys panel bracket sc-card${i ? '' : ' sc-feature'}" data-reveal style="--i:${stagger(
    i,
  )}" data-tags="${esc(it.tags.join(' '))}">
      <div class="sc-lay">
      ${shot(it.link.href)}
      <div class="sc-copy">
        <div class="sys-top">
          <span class="label">${esc(it.kicker)}</span>
          <span class="sys-status mono"><i aria-hidden="true">●</i> ${esc(it.status)}</span>
        </div>
        <h3 class="h3">${readings('span', it.plainTitle, it.title)}</h3>
        ${readings('p', it.plain, it.body)}
        <a class="alink sys-link" href="${esc(it.link.href)}"><span>${esc(it.link.label)}</span><span class="arw" aria-hidden="true">→</span></a>
      </div>
      </div>
    </article>`;
}

/**
 * The cards alone (each page wraps them in its own section).
 *
 * Both pages print both readings of every card (plain and technical, see
 * readings()), and the reading switch picks one, so the home page and
 * /work/ read the same way. The home page (`home: true`) sits under the
 * heading "things we built", so it leaves out the practice card, which is
 * a service and not a system. After the feature that's six cards on the
 * home page (three and three, or two, two and two) and seven on /work/,
 * where the practice card closes the list: alone in its row, it grows to
 * the row's width and turns on its side like the feature.
 */
export function showcaseCards(opts: { home?: boolean } = {}): string {
  const items = opts.home ? systems.items.filter((it) => it.kind !== 'practice') : systems.items;
  return `<div class="sys-grid sc-grid">${items.map((it, i) => card(it, i)).join('')}</div>`;
}
