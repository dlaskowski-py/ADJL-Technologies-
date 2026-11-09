/**
 * The opening sequence: code types itself, the build runs, the page
 * assembles as a wireframe, the wireframe resolves into the mark, and the
 * overlay splits open on the real page.
 *
 * Markup contract: [data-intro-overlay], first thing in <main>. It's
 * display:none unless <html data-intro="play">, which public/js-on.js sets
 * in the head on the first page view of a session (home only). So with
 * scripting off, under reduced motion and on every later visit, this markup
 * is inert and the page under it is simply the page.
 *
 * The whole timeline is CSS (src/styles/landing/intro.css). This renderer
 * only hands it counts, as custom properties:
 *   --n    characters in a typed line
 *   --c    characters "typed" before this element starts (lines, the
 *          command and the build's ticks share one clock)
 *   --end  that clock's last value, on the root: when the build is done
 *   --i    order within the wireframe
 * motion/intro.ts adds Skip, the scroll lock and the hand-off; if it never
 * loads, the CSS still ends with the overlay hidden and click-through.
 *
 * One drawing, 360 units wide, scaled by CSS: a phone shows it at about
 * 1:1. All of its text is SVG <text>, which is never a candidate for
 * largest contentful paint, so the hero's h1 under the overlay stays the
 * LCP. The drawing is aria-hidden; the root is data-chrome.
 *
 * OWNER: WS-A.
 */
import { nav } from '../../content';
import { intro as I } from '../../content-intro';
import { guards } from '../../content-case-this-site';
import { SITE_PAGES } from '../../site-pages';
import { chip, esc } from '../html';

const n1 = (v: number) => +v.toFixed(1);

/* ── Geometry, in viewBox units ─────────────────────────────────────── */
const W = 360;
const HEAD = 27; // the pane's title strip; the body's own viewport starts under it
const BODY = 308;
const H = W + 12; // the pane, plus the beat rail under it
const PAD = 16;
const CW = 6.9; // 11.5px mono: every advance is 0.6em
const LH = 15;
/* The clock, in characters: a pause after each line, after the code, and
   between ticks. intro.css turns characters into time (--cps). */
const LINE_GAP = 2;
const RUN_GAP = 24;
const TICK = 9;
/* The guards' three columns: the first is the widest, for check-provenance. */
const COLS = [0, 118, 230];

/* ── The typed code: keywords, strings and comments get a color ─────── */
const TOKEN = /(\/\/.*$)|('[^']*')|\b(export|function|return|true)\b/g;
function color(src: string): string {
  let out = '';
  let at = 0;
  for (const m of src.matchAll(TOKEN)) {
    out += `${esc(src.slice(at, m.index))}<tspan class="intro-${m[1] ? 'c' : m[2] ? 's' : 'k'}">${esc(m[0])}</tspan>`;
    at = m.index + m[0].length;
  }
  return out + esc(src.slice(at));
}

/* ── The wireframe: this home page at 1440 wide, a quarter size ─────────
   [color class, stroke width, order, path]. Everything is a stroke, so one
   animation draws it all: hairlines are outlines, and thick strokes are
   the blocks that fill them (the headline's two lines, the copper
   buttons). The colors mean what they mean on the page: copper for what a
   visitor acts on, teal and violet for the figure's graph. */
const WIRE: [string, number, number, string][] = [
  /* nav: its rule and the ⌘K box, the links, the call to action */
  ['', 1, 0, 'M0 16.5H360M264 3.5h27v9h-27z'],
  ['intro-3', 2, 1, 'M33 8h31M116 8h25M148 8h28M183 8h29M219 8h11M237 8h17'],
  ['intro-cu', 10, 2, 'M294 8h41'],
  /* hero: eyebrow, headline, lead, the two buttons */
  ['intro-cu', 1.5, 3, 'M25 74.5h5'],
  ['intro-3', 2, 3, 'M33 74.5h54M25 127h176M25 135h174M25 143h58'],
  ['intro-fg', 12, 4, 'M25 92h172M25 109h61'],
  ['intro-cu', 12, 5, 'M89 109h91'],
  ['intro-cu', 11, 7, 'M25 161h54'],
  /* the figure's frame and the second button; then the graph */
  ['', 1, 4, 'M208.5 38.5h127v126h-127zM83.5 155.5h34v11h-34z'],
  ['intro-te', 1, 6, 'M221 101a51 30 0 1 0 102 0a51 30 0 1 0-102 0'],
  ['intro-cu', 1, 8, 'M274 116l-37-18M274 116l-30-5M274 116l31-26M274 116l35-12M274 116l-14 12M274 116l12 11'],
  ['intro-vi', 1, 8, 'M272 102v-11l-9-5M272 91l9-5'],
  ['intro-3', 2, 8, 'M208 172h94M208 179h122M208 185h21'],
  /* below the fold: the status bar, a section head, the four offers */
  ['', 1, 9, 'M0 217.5H360M25.5 262.5h71v46h-71zM105 262.5h71v46h-71zM184.5 262.5h71v46h-71zM264 262.5h71v46h-71z'],
  ['intro-3', 2, 10, 'M25 225h70M110 225h40M25 247h96M34 273h30M113.5 273h30M193 273h30M272.5 273h30'],
];

export function renderIntro(): string {
  let c = 0; // the clock

  /* A typed line: the text, then a cover the color of the pane that steps
     off it one character at a time. Its left edge is the caret. */
  const type = (line: string, y: number, pre = 0) => {
    const text = line.trimStart();
    const x = n1(PAD + (line.length - text.length + pre) * CW);
    const at = c;
    c += text.length + LINE_GAP;
    return `<text x="${x}" y="${y}">${color(text)}</text><rect x="${x}" y="${y - 11}" style="--n:${text.length};--c:${at}"/>`;
  };
  /* A build step that ticks off: ✓ and its name, at once. */
  const tick = (label: string, x: number, y: number) => {
    const at = c;
    c += TICK;
    return `<text x="${n1(x)}" y="${y}" style="--c:${at}"><tspan>✓</tspan> ${esc(label)}</text>`;
  };

  const code = I.code.lines.map((l, i) => type(l, 21 + i * LH)).join('');
  c += RUN_GAP;

  /* The terminal: the command types, then every step of the build. */
  const ty = 21 + I.code.lines.length * LH + 14;
  const runAt = c;
  const run = `<path class="intro-rule" d="M0 ${ty - 17.5}H${W}"/><text class="intro-c" x="${PAD}" y="${ty}">$</text>${type(I.build.command, ty, 2)}`;
  c += TICK;
  let sx = PAD;
  const steps = I.build.steps.map((s) => {
    const label = s.replace('{n}', String(SITE_PAGES.length));
    const t = tick(label, sx, ty + 18);
    sx += (label.length + 4) * 6;
    return t;
  });
  const checks = guards.map((g, i) => tick(g.name, PAD + (COLS[i % COLS.length] ?? 0), ty + 36 + Math.floor(i / COLS.length) * 14));

  const wire = WIRE.map(
    ([cls, sw, i, d]) =>
      `<path${cls ? ` class="${cls}"` : ''} d="${d}" pathLength="1"${sw === 1 || sw === 2 ? '' : ` stroke-width="${sw}"`} style="--i:${i}"/>`,
  ).join('');

  /* The beat rail under the pane: three names, lit in turn by the CSS.
     The middle one starts with the command, so it carries that moment. */
  const beats = I.beats
    .map((b, i) => `<text x="${n1(1 + (i * (W - 2)) / (I.beats.length - 1))}" y="${H - 6}"${i === 1 ? ` style="--c:${runAt}"` : ''}>${esc(b)}</text>`)
    .join('');

  /* The mark's bars. The copper one is drawn last: the other two fold in
     behind it when it becomes the seam. */
  const bar = (x: number, fold: string, cls = '') =>
    `<rect class="intro-b${cls}"${x ? ` x="${x}"` : ''} width="5" height="19" rx="1.5"${fold ? ` style="--x:${fold}"` : ''}/>`;

  /* `hidden` keeps the markup out of sight even if the stylesheet never
     arrives; the play rule in intro.css overrides it. */
  return `<div class="intro" hidden data-intro-overlay data-chrome style="--end:${c}">
<svg class="intro-svg" viewBox="0 0 ${W} ${H}" aria-hidden="true">
<g class="intro-pane"><rect class="intro-box" x=".5" y=".5" width="${W - 1}" height="${HEAD + BODY + 1}" rx="6"/><path class="intro-rule" d="M.5 ${HEAD - 0.5}H${W - 0.5}"/><text class="intro-file" x="${PAD}" y="17">${esc(I.code.file)}</text><text class="intro-dist" x="${PAD}" y="17">${esc(I.build.out)}</text>
<svg y="${HEAD}" width="${W - 2}" height="${BODY}"><g class="intro-code">${code}${run}</g><g class="intro-oks">${steps.join('')}${checks.join('')}</g><rect class="intro-wipe" width="${W}" height="${BODY}"/><g class="intro-wire">${wire}</g></svg>
<path class="intro-reg" d="M6 12V6h6M${W - 12} 6h6v6M${W - 6} ${HEAD + BODY - 10}v6h-6M12 ${HEAD + BODY - 4}H6v-6"/><g class="intro-beats">${beats}</g></g>
<g class="intro-mk">${bar(0, '7.5px')}${bar(15, '-7.5px')}${bar(7.5, '', ' intro-b2')}</g>
<g class="intro-lk"><text class="intro-nm" x="180" y="222">${esc(nav.wordmark.lead)}<tspan class="intro-nm2"> ${esc(nav.wordmark.tail)}</tspan></text><rect class="intro-nc" x="50" y="194" width="260" height="38"/><text class="intro-tg" x="180" y="250">${esc(I.tagline)}</text></g>
</svg>
<div class="intro-foot">${chip('illustration')}<button class="intro-skip" type="button" data-intro-skip>${esc(I.skip)}</button></div>
</div>`;
}
