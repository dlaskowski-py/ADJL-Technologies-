/**
 * "What we do", in plain words: one panel per practice, each with a small
 * animated scene that shows the thing happening, and one closing strip (a
 * sentence, the code written for it, the page that comes out). Replaces
 * the practice panels on the home page; the services hub keeps those.
 *
 * Each scene is one inline SVG on a 360 × 240 grid, drawn for a phone's
 * width and scaled up on a desktop, so its labels stay readable on both
 * without a second drawing. Markup contract: [data-scene] on the scene's
 * box (motion/scenes.ts sets data-playing while it's on screen).
 *
 * WHAT'S PRERENDERED IS THE FINISHED PICTURE, which is what JavaScript-off,
 * reduced motion and Pause show. Playing, a scene runs one 9 s loop in five
 * beats, and all of it is CSS (styles/landing/landing.css):
 *
 *   lp-k1 … lp-k5   appears on that beat and stays. --d delays it within
 *                   the beat (keep it under 0.8 s), --x/--y is where it
 *                   slides in from.
 *   lp-ty           with a beat: types on (a stepped clip) instead of fading
 *   lp-dr           with a beat: a line that draws (needs pathLength="1")
 *   lp-tmp          shown for about two seconds from --d, and not at rest
 *   lp-pk           a packet that rides its offset-path once, from --d
 *   lp-act          the layer holding everything above: it blinks out
 *                   between loops, so the frames and labels outside it
 *                   never leave the picture
 *
 * Color keeps the site's meaning: copper for people and interfaces, teal
 * for data and its paths, violet for structure, amber for waiting on a
 * person. The drawings are aria-hidden; the copy beside each one says the
 * same thing in words. Every label comes from content-landing.ts.
 *
 * OWNER: WS-B (landing).
 */
import { landing, type Offer, type OfferKey } from '../../content-landing';
import { checklist, chip, esc, eyebrow, headline, rail, rich, sectionOpen } from '../html';

/* ── SVG primitives ─────────────────────────────────────────────────── */

/** Seconds into the loop that each beat starts (landing.css, lp-k1…5). */
const BEAT = [0, 0.9, 2.16, 3.42, 4.68, 5.94];

const c = (cls: string) => ` class="${cls}"`;
/** Class and timing for something that appears on `beat`. */
function on(beat: number, cls = '', d = 0, x = 0, y = 0): string {
  const st = [d ? `--d:${d}s` : '', x ? `--x:${x}px` : '', y ? `--y:${y}px` : ''].filter(Boolean).join(';');
  return ` class="${`${cls} lp-k${beat}`.trim()}"${st ? ` style="${st}"` : ''}`;
}
const rect = (a: string, x: number, y: number, w: number, h: number, rx = 2) =>
  `<rect${a} x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}"/>`;
const text = (a: string, x: number, y: number, s: string, end = false) =>
  `<text${a} x="${x}" y="${y}"${end ? ' text-anchor="end"' : ''}>${esc(s)}</text>`;
const path = (a: string, d: string) => `<path${a} d="${d}"/>`;
/** A line that draws on its beat. */
const draw = (beat: number, cls: string, d: string, delay = 0) =>
  `<path${on(beat, `${cls} lp-dr`, delay)} d="${d}" pathLength="1"/>`;
/** A check mark, 9 × 7, from its left tip. */
const tick = (a: string, x: number, y: number) => path(a, `M${x} ${y}l3 3 6-7`);
/** A packet that rides `d` once, starting `at` seconds into the loop. */
const packet = (d: string, at: number, cls = 'lp-pk') =>
  `<circle class="${cls}" r="3" style="offset-path:path('${d}');--d:${+at.toFixed(2)}s"/>`;
/** A caption: small caps, in the mono face. */
const cap = (x: number, y: number, s: string, end = false) => text(c('lp-cap'), x, y, s, end);

/* ── AI Engineering: documents in, fields out, one held for a person ── */

function sceneAi(): string {
  const A = landing.art.ai;
  const rows = [67, 105, 143, 181];
  const held = 2;
  const sheet = (x: number, y: number, d: number, bars = '') =>
    `<g${on(1, '', d, -28)}>${rect(c('lp-f'), x, y, 52, 66, 3)}${bars}</g>`;
  const bars = [36, 28, 34, 22, 30].map((w, i) => rect(c('lp-sk'), 40, 108 + i * 10, w, 4, 1)).join('');
  const flow = 'M88 124H120';
  /* "held" shows from just after the field is flagged until the approval. */
  const HELD = 3.6;

  return `${cap(16, 22, A.docs)}${cap(120, 22, A.fields)}${cap(272, 22, A.gate)}
    ${rect(c('lp-f'), 120, 34, 132, 172, 4)}${rect(c('lp-f'), 272, 96, 74, 94, 4)}
    ${path(c('lp-ln'), 'M120 86h132M120 124h132M120 162h132')}${path(c('lp-st'), `${flow}M115 120l5 4-5 4`)}
    ${rows.map((y, i) => text('', 132, y + 3, A.keys[i])).join('')}
    <g class="lp-act">
      ${sheet(16, 74, 0)}${sheet(24, 86, 0.15)}${sheet(32, 98, 0.3, bars)}
      ${[0, 0.3, 0.6].map((d) => packet(flow, BEAT[2] - 1 + d)).join('')}
      ${rows.map((y, i) => rect(on(2, 'lp-fl lp-d', i * 0.2, -10), 176, y - 4, [44, 34, 40, 28][i], 8)).join('')}
      ${rows.map((y, i) => (i === held ? '' : tick(on(3, 'lp-st lp-ok', i * 0.15), 232, y))).join('')}
      ${rect(on(3, 'lp-st lp-w', 0.2), 125, rows[held] - 15, 122, 30, 3)}
      ${draw(3, 'lp-st lp-w', `M252 ${rows[held]}H272`, 0.3)}
      ${rect(` class="lp-st lp-w lp-tmp" style="--d:${HELD}s"`, 272, 96, 74, 94, 4)}
      <text class="lp-w lp-tmp" x="309" y="178" text-anchor="middle" style="--d:${HELD}s">${esc(A.held)}</text>
      ${path(on(4, 'lp-st lp-c'), 'M300 124a9 9 0 1 0 18 0a9 9 0 1 0-18 0M293 156a16 15 0 0 1 32 0')}
      <text${on(5, 'lp-c')} x="309" y="178" text-anchor="middle">${esc(A.approved)}</text>
      ${tick(on(5, 'lp-st lp-c', 0.3), 232, rows[held])}
    </g>`;
}

/* ── SEO & AI Search: one page, read by two kinds of reader ────────── */

function sceneSeo(): string {
  const S = landing.art.seo;
  const up = 'M166 104C204 104 192 76 230 76';
  const down = 'M166 136C204 136 192 164 230 164';
  /* A tag lights: its outline and its name, in the structure color. */
  const tag = (beat: number, y: number, h: number, label: string) =>
    `<g${on(beat, 'lp-m')}>${rect(c('lp-st'), 24, y, 134, h, 3)}${text('', 32, y + 15, label)}</g>`;
  /* A reader's box (always there) and what it received (on the last beat). */
  const reader = (y: number, name: string, icon: string) =>
    `${rect(c('lp-f'), 230, y, 116, 64, 4)}${path(c('lp-st lp-hi'), icon)}${text(c('lp-hi'), 262, y + 23, name)}`;
  const got = (y: number, d: number) =>
    `<g${on(5, '', d, -8)}>${[0, 1, 2].map((i) => rect(c('lp-fl lp-m'), 242 + i * 28, y + 40, 22, 7)).join('')}${tick(
      c('lp-st lp-ok'),
      327,
      y + 44,
    )}</g>`;

  return `${cap(16, 22, S.page)}
    ${rect(c('lp-f'), 16, 34, 150, 186, 4)}
    ${path(c('lp-ln'), 'M16 52h150')}
    ${reader(44, S.readers[0], 'M241 63a5 5 0 1 0 10 0a5 5 0 1 0-10 0M250 67l4 4')}
    ${reader(132, S.readers[1], 'M240 146h13v10h-8l-3 3v-3h-2z')}
    ${path(c('lp-sk'), 'M25 41h5v5h-5zM34 41h5v5h-5zM43 41h5v5h-5zM86 68h62v8h-62zM74 100h74v12h-74zM32 132h118v5h-118zM32 143h104v5h-104zM32 154h112v5h-112zM96 180h52v6h-52zM32 194h80v6h-80z')}
    <g class="lp-act">
      ${tag(1, 61, 22, S.tags[0])}${tag(2, 93, 26, S.tags[1])}${tag(3, 170, 38, S.tags[2])}
      ${draw(4, 'lp-st lp-d', `${up}M225 72l5 4-5 4`)}${draw(4, 'lp-st lp-d', `${down}M225 160l5 4-5 4`, 0.15)}
      ${[0, 0.3, 0.6].map((d) => packet(up, BEAT[4] + d) + packet(down, BEAT[4] + 0.15 + d)).join('')}
      ${got(44, 0)}${got(132, 0.3)}
    </g>`;
}

/* ── Websites & Apps: one codebase, a phone app and a website ──────── */

function sceneWeb(): string {
  const W = landing.art.web;
  const hue = ['', 'lp-hi', 'lp-d', 'lp-c', ''];
  /* Lines type one after another: three on the first beat, two on the next. */
  const code = W.code
    .map((line, i) => {
      const indent = line.length - line.trimStart().length;
      return text(
        on(i < 3 ? 1 : 2, `lp-ty ${hue[i]}`.trim(), i < 3 ? i * 0.4 : (i - 3) * 0.4),
        24 + indent * 6,
        84 + i * 20,
        line.trim(),
      );
    })
    .join('');
  /* The same three blocks, laid out for each screen. */
  const bars = (x: number, base: number) =>
    [14, 22, 17, 28].map((h, i) => `M${x + i * 10} ${base - h}h7v${h}h-7z`).join('');

  return `${cap(14, 22, W.source)}${cap(184, 196, W.phone)}${cap(254, 174, W.site)}
    ${rect(c('lp-f'), 14, 34, 132, 172, 4)}${rect(c('lp-f'), 184, 62, 54, 118, 8)}${rect(c('lp-f'), 254, 84, 92, 72, 4)}
    ${path(c('lp-ln'), 'M14 58h132M254 97h92')}
    ${path(c('lp-sk'), 'M203 67h16v4h-16zM260 89h4v4h-4zM267 89h4v4h-4zM274 89h4v4h-4z')}
    ${text('', 24, 50, W.file)}
    <g class="lp-act">
      ${code}
      ${draw(3, 'lp-st lp-c', 'M146 121H184M179 117l5 4-5 4')}${draw(3, 'lp-st lp-c', 'M165 121V46H300V84M296 79l4 5 4-5')}
      ${packet('M146 121H184', BEAT[3] + 0.2, 'lp-pk lp-c')}${packet('M165 121V46H300V84', BEAT[3] + 0.2, 'lp-pk lp-c')}
      ${rect(on(4, 'lp-fl lp-hi', 0, 0, 6), 190, 78, 42, 9)}${rect(on(4, 'lp-fl lp-hi', 0, 0, 6), 260, 103, 80, 8)}
      ${path(on(4, 'lp-fl lp-d', 0.3, 0, 6), bars(192, 130))}${path(on(4, 'lp-fl lp-d', 0.3, 0, 6), bars(262, 148))}
      ${rect(on(4, 'lp-fl lp-c', 0.6, 0, 6), 190, 142, 42, 14, 4)}${rect(on(4, 'lp-fl lp-c', 0.6, 0, 6), 306, 134, 34, 14, 4)}
      <g${on(5)}>${tick(c('lp-st lp-ok'), 254, 214)}${text(c('lp-hi'), 270, 218, W.same)}</g>
    </g>`;
}

/* ── Systems we run: a listing link in, a sourced file out ─────────── */

function sceneSys(): string {
  const Y = landing.art.sys;
  const rows = [122, 150, 178];
  const row = (beat: number, y: number, key: string, source: string, hue: string, d = 0) =>
    `<g${on(beat, '', d, -10)}>${text(c('lp-hi'), 162, y + 3, key)}${text(c(hue), 212, y + 3, Y.mask)}${rect(
      c(`lp-fl ${hue}`),
      250,
      y - 3,
      6,
      6,
      1,
    )}${text('', 262, y + 3, source)}</g>`;

  return `${rect(c('lp-f'), 14, 30, 332, 28, 4)}${rect(c('lp-f'), 14, 96, 92, 104, 4)}${rect(c('lp-f'), 150, 74, 196, 148, 4)}
    ${cap(336, 48, Y.in, true)}${cap(24, 110, Y.engine)}${cap(162, 92, Y.file)}
    ${path(c('lp-ln'), 'M150 100h196')}${path(c('lp-st'), rows.map((y) => `M106 ${y}H150M145 ${y - 4}l5 4-5 4`).join(''))}
    ${path(c('lp-sk'), 'M24 119h56v6h-56zM24 147h44v6h-44zM24 175h50v6h-50z')}
    ${text(c('lp-c'), 24, 48, '>')}
    <g class="lp-act">
      ${text(on(1, 'lp-ty lp-hi'), 38, 48, Y.link)}
      ${draw(2, 'lp-st lp-c', 'M60 58V96M56 91l4 5 4-5')}
      ${rows.map((y, i) => packet(`M106 ${y}H150`, BEAT[i + 3] - 1) + row(i + 3, y, Y.rows[i].key, Y.rows[i].source, 'lp-d')).join('')}
      ${row(5, 206, Y.flag.key, Y.flag.source, 'lp-w', 0.5)}
    </g>`;
}

const SCENES: Record<OfferKey, () => string> = { ai: sceneAi, seo: sceneSeo, web: sceneWeb, sys: sceneSys };

/* ── The panels ─────────────────────────────────────────────────────── */

function panel(o: Offer, getLabel: string): string {
  return `<article class="lp-offer panel bracket" data-reveal>
        <div class="lp-scene" data-scene="${o.key}">
          <svg class="lp-art" viewBox="0 0 360 240" aria-hidden="true" focusable="false">${SCENES[o.key]()}</svg>
          ${chip('illustration')}
        </div>
        <div class="lp-offer-copy">
          <p class="label">${esc(o.name)}</p>
          <h3 class="lp-offer-h">${rich(o.title)}</h3>
          <p>${rich(o.body)}</p>
          <p class="label lp-get">${esc(o.getLabel ?? getLabel)}</p>
          ${checklist(o.points)}
          <a class="alink" href="${esc(o.link.href)}"><span>${esc(o.link.label)}</span><span class="arw" aria-hidden="true">→</span></a>
        </div>
      </article>`;
}

/* ── The closing strip: a sentence, the code, the page ─────────────── */

/**
 * One wide panel in three steps, on the same five beats as the scenes: the
 * request arrives a word at a time, the code types, the page assembles.
 * The request is real text, in a paragraph and not a blockquote: it's a
 * made-up example, and a text reader would take a quote for a customer's
 * words. The code and the little page are decoration, each with one
 * sr-only line saying what it is; the figcaption says it's an example.
 */
function buildStrip(): string {
  const B = landing.offers.build;
  const hue = ['', 'lp-d', 'lp-c', ''];
  const step = (i: number) =>
    `<span class="label"><b class="lp-step-n" aria-hidden="true">0${i + 1}</b> ${esc(B.steps[i])}</span>`;
  const words = B.say
    .split(' ')
    .map((w, i) => `<span${on(1, '', +(i * 0.09).toFixed(2))}>${esc(w)}</span>`)
    .join(' ');
  const code = B.code
    .map((line, i) => `<span${on(i < 2 ? 2 : 3, `lp-ty ${hue[i]}`.trim(), (i % 2) * 0.45)}>${esc(line)}</span>`)
    .join('');
  /* Two weeks of days, one of them picked. */
  const days = Array.from({ length: 14 }, (_, i) => `M${14 + (i % 7) * 18} ${50 + Math.floor(i / 7) * 18}h14v14h-14z`);
  const picked = days.splice(10, 1)[0];

  return `<figure class="lp-build panel" data-scene="build" data-reveal>
        <div class="lp-build-col">
          ${step(0)}
          <p class="lp-build-say"><span class="lp-act">${words}</span></p>
        </div>
        <div class="lp-build-col">
          ${step(1)}
          <p class="sr-only">${esc(B.wrote)}</p>
          <div class="lp-code" aria-hidden="true" data-chrome><div class="lp-act">${code}</div></div>
        </div>
        <div class="lp-build-col">
          ${step(2)}
          <p class="sr-only">${esc(B.got)}</p>
          <svg class="lp-art lp-ui" viewBox="0 0 220 138" aria-hidden="true" focusable="false">
            ${rect(c('lp-f'), 1, 1, 218, 136, 6)}${path(c('lp-ln'), 'M1 20h218')}${path(c('lp-sk'), 'M12 8h5v5h-5zM21 8h5v5h-5zM30 8h5v5h-5z')}
            <g class="lp-act">
              ${text(on(4, 'lp-hi'), 14, 40, B.ui.title)}
              ${path(on(4, 'lp-sk', 0.2, 0, 6), days.join(''))}${path(on(4, 'lp-fl lp-d', 0.45), picked)}
              <g${on(4, '', 0.7, 0, 6)}>${rect(c('lp-fl lp-c'), 14, 96, 122, 26, 4)}<text class="lp-on" x="75" y="113" text-anchor="middle">${esc(
                B.ui.button,
              )}</text></g>
              <g${on(5)}>${tick(c('lp-st lp-ok'), 152, 109)}${text(c('lp-hi'), 168, 113, B.ui.ready)}</g>
            </g>
          </svg>
        </div>
        <figcaption class="lp-build-cap"><span>${rich(B.caption)}</span>${chip('illustration')}</figcaption>
      </figure>`;
}

export function renderOffers(n: number): string {
  const o = landing.offers;
  return `${sectionOpen({ id: 'offers', src: 'content-landing.ts#landing.offers', renderer: 'sections/landing/offers.ts#renderOffers' })}
    <div class="wrap">
      ${rail(n, 'offers')}
      <div class="sec-copy">
        ${eyebrow(o.eyebrow)}
        ${headline(o.headline)}
        <p class="lead sec-intro" data-reveal>${rich(o.intro)}</p>
      </div>
      <div class="lp-offers">
        ${o.items.map((it) => panel(it, o.getLabel)).join('')}
        ${buildStrip()}
      </div>
    </div>
  </section>`;
}
