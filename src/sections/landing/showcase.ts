/**
 * The portfolio: what we've built, one card per system, each opening with
 * an animated preview of that system doing its job. Used on the home page
 * (#systems) and on /work/ under its filter, so every card keeps data-tags
 * (ui.ts initFilter toggles `hidden` on [data-tags]).
 *
 * The cards are content.ts `systems.items`, in that order, and the first
 * one is the wide feature card. A preview is picked by the card's link, so
 * a new item without a drawing still renders as a plain card.
 *
 * A PREVIEW is a device frame (a browser window, or a stage with a phone on
 * it) around one inline SVG. Markup contract: [data-scene] on the frame;
 * motion/scenes.ts sets data-playing while it's on screen, and everything
 * that moves is CSS hanging off that (styles/landing/showcase.css).
 *
 * The drawings have NO viewBox. A card is 280px wide on a phone and 690px
 * as the feature on a desktop, and a scaled drawing would have to pick one
 * of those to be legible at. So a drawing is laid out like a page instead:
 *
 *   - x is a percentage of the frame's width ('5%'), or pixels from an
 *     anchor: at('95%', …) starts a group whose origin is that far across,
 *     and the group's own shapes are fixed-size, in pixels.
 *   - y is pixels from the frame's vertical middle, -82 … 82.
 *   - Connecting lines run in percentages and are drawn FIRST, so the
 *     opaque boxes anchored over their ends cover the slack.
 *
 * Labels stay 10px at every width and only the connections stretch.
 *
 * WHAT'S PRERENDERED IS THE FINISHED PICTURE, which is what JavaScript-off,
 * reduced motion and Pause show. Playing, a scene runs one 9s loop:
 *
 *   sc-k1 … sc-k6   appears on that step and stays (frames and captions
 *                   carry no step, so they never leave the picture)
 *   sc-dr           with a step: a line that draws (needs pathLength="1")
 *   sc-in / sc-up   with a step: slides in from the left / lands from above
 *   sc-gx           with a step: a bar that grows from its left end
 *   sc-fw           a dashed line that keeps flowing
 *   sc-tk           a readout that ticks
 *   sc-tmp          shown for a moment early in the loop, and not at rest
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

/** Pixels, or a percentage of the frame's width. */
type X = number | string;
type Anchor = '' | 'middle' | 'end';

const c = (cls: string) => (cls ? ` class="${cls}"` : '');
const rect = (cls: string, x: X, y: number, w: X, h: number, rx = 1, extra = '') =>
  `<rect${c(cls)} x="${x}" y="${y}" width="${w}" height="${h}"${rx ? ` rx="${rx}"` : ''}${extra}/>`;
const line = (cls: string, x1: X, y1: number, x2: X, y2: number, extra = '') =>
  `<line${c(cls)} x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"${extra}/>`;
const text = (cls: string, x: X, y: number, s: string, anchor: Anchor = '') =>
  `<text${c(cls)} x="${x}" y="${y}"${anchor ? ` text-anchor="${anchor}"` : ''}>${esc(s)}</text>`;
const path = (cls: string, d: string, extra = '') => `<path${c(cls)} d="${d}"${extra}/>`;
const g = (cls: string, inner: string) => `<g class="${cls}">${inner}</g>`;
/** A group whose origin is `x` across the frame. */
const at = (x: X, inner: string) => `<svg x="${x}">${inner}</svg>`;
/** A line that draws on its step: pair with sc-dr. */
const DRAW = ' pathLength="1"';
const DOTTED = ' stroke-dasharray="2 4"';
/** A check mark, 9 × 7, from its left tip. */
const tick = (cls: string, x: number, y: number) => path(cls, `M${x} ${y}l3 3 6-7`);
/** Lines of text nobody needs to read: skeleton bars, 7px apart. */
const bars = (x: number, y: number, widths: number[], cls = 'sc-sk') =>
  widths.map((w, i) => rect(cls, x, y + i * 7, w, 3)).join('');

const TONE: Record<ShowcaseTone, string> = { data: 'sc-d', model: 'sc-m', warn: 'sc-w' };

/* ── The engine: a link is pasted, a file fills in, each line sourced ── */

function sceneEngine(): string {
  const A = S['/work/real-estate-intelligence/'];
  const rows = A.rows
    .map((r, i) => {
      const y = -40 + i * 27;
      const base = y + 17;
      /* The row arrives with the file. Its flag, if it has one, a step
         after everything else: the last thing the file says. */
      const row = g(
        `sc-k${i + 2}`,
        `${text('sc-hi', '8%', base, r.name)}${text('', '42%', base, S.mask)}${
          r.flag ? '' : text(TONE[r.tone], '92%', base, r.source, 'end')
        }${line('sc-ln', '5%', y + 27, '95%', y + 27)}`,
      );
      const flag = r.flag
        ? g(
            `${TONE[r.tone]} sc-k6`,
            `${rect('', '5%', y + 1, '90%', 25, 0, ' fill-opacity=".1"')}${rect('', '5%', y + 1, 2, 25, 0)}${text(
              '',
              '92%',
              base,
              `${S.flag} ${r.source}`,
              'end',
            )}`,
          )
        : '';
      return row + flag;
    })
    .join('');

  return `${rect('sc-f', '5%', -72, '90%', 22, 3)}
    ${at('8%', `${rect('sc-c sc-tmp', -4, -68, 128, 14, 2, ' fill-opacity=".35"')}${text('sc-hi sc-k1', 0, -57, A.url)}`)}
    ${text('sc-c sc-k1', '92%', -57, A.pasted, 'end')}
    ${rows}`;
}

/* ── Trading and research: many feeds, one stream, the evening brief ── */

function sceneFeed(): string {
  const A = S['/work/trading-infrastructure/'];
  /* Raw ticks arrive unevenly (each pattern repeats every 20px, so the
     flow loops without a jump). The normalized stream is even. */
  const lanes: [number, string][] = [
    [-28, '1 5 1 9 1 3'],
    [0, '1 3 1 7 1 7'],
    [28, '1 9 1 5 1 3'],
  ];
  const feed = lanes
    .map(([y, dash]) => {
      const x2 = y ? '36%' : '46%';
      return `${line('sc-ln', '5%', y, x2, y)}${line('sc-fw', '5%', y, x2, y, ` stroke-width="7" stroke-dasharray="${dash}"`)}${
        y ? line('sc-ln', '36%', y, '46%', 0) : ''
      }`;
    })
    .join('');

  return `${text('', '5%', -60, A.feeds)}${text('', '46%', -60, A.normalize, 'middle')}${text('', '95%', -60, A.brief, 'end')}
    ${g('sc-k1', feed)}
    ${g(
      'sc-d sc-k3',
      `${line('sc-fw', '46%', 0, '95%', 0, ' stroke-width="2" stroke-dasharray="6 4"')}${text('', '64%', 18, A.stream, 'middle')}`,
    )}
    ${at('46%', g('sc-k2', `${rect('sc-f', -10, -10, 20, 20, 3)}${path('sc-o sc-d', 'M-5-4h10M-5 0h10M-5 4h10')}`))}
    ${at(
      '95%',
      `${g('sc-k4 sc-up', rect('sc-f', -50, -40, 50, 80, 3))}${g('sc-k5', `${rect('sc-c', -43, -31, 20, 4)}${bars(-43, -20, [36, 30, 34])}`)}${g(
        'sc-k6',
        bars(-43, 6, [36, 26, 32, 18]),
      )}`,
    )}`;
}

/* ── The native app: move an assumption, the answer recomputes, offline ── */

function sceneApp(): string {
  const A = S['/work/mobile-app/'];
  return at(
    '50%',
    `${g('sc-k1', `${line('sc-ln', -52, -49.5, -40, -49.5)}${text('', -56, -46, A.net, 'end')}`)}
    ${g('sc-k3', `${line('sc-ln', 40, 22.5, 52, 22.5)}${text('', 56, 26, A.done)}`)}
    ${rect('sc-f', -40, -76, 80, 152, 12)}${line('sc-ln', -7, -68, 7, -68)}${line('sc-ln', -12, 68, 12, 68)}
    ${g('sc-hi sc-k1', `${rect('sc-o', -30, -58, 60, 17, 8.5)}${text('', 0, -46, A.offline, 'middle')}`)}
    ${text('', -30, -24, A.slider)}${line('sc-ln', -30, -12, 30, -12)}
    <circle class="sc-c sc-nb" cx="8" cy="-12" r="5"/>
    ${text('', -30, 12, A.result)}${rect('sc-sk', -30, 19, 60, 7)}${rect('sc-d sc-rs', -30, 19, 46, 7)}
    ${text('sc-hi', -30, 44, S.mask)}`,
  );
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
  const request = (y: number, w: number, label: string, cls: string) =>
    `${rect('sc-f', 0, y - 9, w, 18, 9)}${text(cls, w / 2, y + 3, label, 'middle')}`;

  return `${hatch}${text('', '50%', -66, A.edge, 'middle')}${text('', '95%', -66, A.page, 'end')}
    ${line('sc-ln', '50%', -56, '50%', 56, DOTTED)}
    ${line('sc-o sc-c sc-dr sc-k1', '5%', -30, '50%', -30, DRAW)}${line('sc-o sc-d sc-dr sc-k3', '50%', -30, '95%', -30, DRAW)}
    ${line('sc-o sc-dr sc-k4', '5%', 30, '50%', 30, DRAW)}${line('sc-ln sc-k6', '50%', 30, '95%', 30, DOTTED)}
    ${at('5%', `${g('sc-k1 sc-in', request(-30, 52, A.signed, 'sc-c'))}${g('sc-k4 sc-in', request(30, 58, A.unknown, ''))}`)}
    ${at(
      '50%',
      `${rect('sc-f', -8, -38, 16, 16, 3)}${rect('sc-f', -8, 22, 16, 16, 3)}${tick('sc-o sc-d sc-k2', -5, -30)}${path(
        'sc-o sc-x sc-k5',
        'M-3 27l6 6m0-6l-6 6',
      )}`,
    )}
    ${at(
      '95%',
      `${g('sc-k3', `${rect('sc-f', -44, -56, 44, 50, 2)}${rect('sc-c', -37, -48, 16, 4)}${bars(-37, -38, [30, 24, 30, 20])}`)}${g(
        'sc-k6',
        `${rect('sc-f', -44, 8, 44, 44, 2, ' stroke-dasharray="3 3"')}<rect x="-44" y="8" width="44" height="44" rx="2" fill="url(#sc-ht)"/>`,
      )}`,
    )}
    ${text('sc-x sc-k6', '95%', 67, A.refused, 'end')}`;
}

/* ── This website: its own hero, its structure figure, its status bar ── */

function sceneSite(): string {
  const A = S['/work/this-site/'];
  /* The page's outline as a tree: the root, its sections, their parts. */
  const top: [number, number] = [-50, -30];
  const mid: [number, number][] = [
    [-80, -5],
    [-50, -5],
    [-20, -5],
  ];
  const low: [number, number][] = [
    [-88, 22],
    [-70, 22],
    [-50, 22],
    [-30, 22],
    [-12, 22],
  ];
  const parent = [0, 0, 1, 2, 2];
  const node = ([x, y]: [number, number]) => `M${x - 3} ${y - 3}h6v6h-6z`;
  const edge = ([x1, y1]: [number, number], [x2, y2]: [number, number]) => `M${x1} ${y1}L${x2} ${y2}`;
  const edges = mid.map((m) => edge(top, m)).join('') + low.map((l, i) => edge(mid[parent[i]], l)).join('');

  /* The status bar's readouts: label, then a value that ticks. The mono
     face is 6px a character at this size. */
  let x = 0;
  const readouts = A.readouts
    .map((label, i) => {
      const lx = x;
      const vx = lx + label.length * 6 + 5;
      x = vx + A.readoutMask.length * 6 + 9;
      return `${text('', lx, 72, label)}<text class="sc-hi sc-tk" x="${vx}" y="72" style="--d:${-i * 1.5}s">${esc(A.readoutMask)}</text>`;
    })
    .join('');

  return `${g(
    'sc-k1',
    `${at(
      '5%',
      `${rect('sc-hi', 0, -76, 3, 11, 0)}${rect('sc-c', 5, -76, 3, 11, 0)}${rect('sc-hi', 10, -76, 3, 11, 0)}${rect('sc-sk', 19, -72, 34, 4)}`,
    )}${at('95%', `${rect('sc-sk', -84, -72, 14, 3)}${rect('sc-sk', -64, -72, 14, 3)}${rect('sc-c', -40, -77, 40, 13, 2)}`)}${line(
      'sc-ln',
      0,
      -57,
      '100%',
      -57,
    )}`,
  )}
    ${at('5%', g('sc-k2', `${rect('sc-c', 0, -45, 10, 2, 0)}${rect('sc-sk', 14, -46, 36, 4)}`))}
    ${rect('sc-hi sc-gx sc-k2', '5%', -35, '42%', 9)}${rect('sc-hi sc-gx sc-k2', '5%', -22, '36%', 9)}${rect('sc-c sc-gx sc-k2', '5%', -9, '28%', 9)}
    ${g('sc-k3', `${rect('sc-sk', '5%', 9, '38%', 3)}${rect('sc-sk', '5%', 16, '30%', 3)}${at('5%', `${rect('sc-c', 0, 28, 46, 14, 2)}${rect('sc-ln', 52, 28, 46, 14, 2)}`)}`)}
    ${at(
      '95%',
      `${g('sc-k4', `${rect('sc-f', -100, -46, 100, 90, 3)}${path('sc-m', mid.concat(low).map(node).join(''))}${path('sc-c', node(top))}`)}${path(
        'sc-o sc-m sc-dr sc-k5',
        edges,
        `${DRAW} stroke-opacity=".6"`,
      )}`,
    )}
    ${g('sc-k6', `${line('sc-ln', 0, 56, '100%', 56)}${at('5%', readouts)}${at('95%', `${rect('sc-ln', -42, 63, 42, 12, 6)}${rect('sc-sk', -40, 65, 14, 8, 4)}`)}`)}`;
}

/* ── The AI practice: a document becomes fields, one waits for a person ── */

function sceneAi(): string {
  const A = S['/work/ai-implementation/'];
  /* A field: its key (structure, so violet) and its value (masked). */
  const field = (y: number, w: number) => `${rect('sc-f', -44, y - 9, 88, 18, 2)}${rect('sc-m', -38, y - 2, 16, 4)}${rect('sc-sk', -16, y - 2, w, 4)}`;
  const read = (y: number, w: number) => `${field(y, w)}${tick('sc-o sc-d', 27, y)}`;

  return `${text('', '5%', -64, A.doc)}${text('', '50%', -64, A.fields, 'middle')}${text('', '95%', -64, A.gate, 'end')}
    ${line('sc-o sc-m sc-dr sc-k1', '5%', 0, '50%', 0, DRAW)}${line('sc-o sc-w sc-dr sc-k4', '50%', 26, '95%', 26, DRAW)}
    ${at('5%', `${rect('sc-f', 0, -36, 40, 72, 3)}${rect('sc-hi', 7, -27, 16, 4)}${bars(7, -16, [26, 22, 26, 18, 24, 14])}`)}
    ${at(
      '50%',
      `${g('sc-k1 sc-in', read(-26, 30))}${g('sc-k2 sc-in', read(0, 24))}${g(
        'sc-w sc-k3 sc-in',
        `${field(26, 20)}${rect('sc-o', -44, 17, 88, 18, 2)}${text('', 38, 29.5, A.held, 'end')}`,
      )}`,
    )}
    ${at(
      '95%',
      `${rect('sc-f', -58, -40, 58, 84, 3)}${path('sc-o sc-c sc-k5', 'M-36-17a7 7 0 1 0 14 0a7 7 0 1 0-14 0M-43 13a14 13 0 0 1 28 0')}${g(
        'sc-c sc-k6',
        `${tick('sc-o', -17, -19)}${text('', -29, 33, A.approved, 'middle')}`,
      )}`,
    )}`;
}

/* ── Frames and cards ───────────────────────────────────────────────── */

/** A card's preview, by its link: the caption in its title bar and the
 *  drawing under it. `phone`: the frame is a stage with a phone on it, so
 *  it carries no browser dots. */
const SCENES: Record<string, { bar: string; draw: () => string; phone?: boolean }> = {
  '/work/real-estate-intelligence/': { bar: S['/work/real-estate-intelligence/'].bar, draw: sceneEngine },
  '/work/trading-infrastructure/': { bar: S['/work/trading-infrastructure/'].bar, draw: sceneFeed },
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
      <svg class="sc-art" focusable="false"><svg y="50%">${scene.draw()}</svg></svg>
    </div>`;
}

/** Reveal order within a row: the feature alone, then three, then two. */
const STAGGER = [0, 0, 1, 2, 0, 1];

function card(it: SystemCard, i: number): string {
  return `<article class="sys panel bracket sc-card${i ? '' : ' sc-feature'}" data-reveal style="--i:${
    STAGGER[i] ?? i % 3
  }" data-tags="${esc(it.tags.join(' '))}">
      ${shot(it.link.href)}
      <div class="sys-top">
        <span class="label">${esc(it.kicker)}</span>
        <span class="sys-status mono"><i aria-hidden="true">●</i> ${esc(it.status)}</span>
      </div>
      <h3 class="h3">${rich(it.title)}</h3>
      <p>${rich(it.body)}</p>
      <a class="alink sys-link" href="${esc(it.link.href)}"><span>${esc(it.link.label)}</span><span class="arw" aria-hidden="true">→</span></a>
    </article>`;
}

/** The cards alone (each page wraps them in its own section). */
export function showcaseCards(): string {
  return `<div class="sys-grid sc-grid">${systems.items.map(card).join('')}</div>`;
}
