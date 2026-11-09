/**
 * Leader-line diagrams (parity, seal, pit, clocks) and the two-readers
 * diagram. Each is a prerendered SVG, drawn twice: a wide layout and a
 * narrow one, so the labels stay at reading size on a phone instead of
 * shrinking with the drawing (CSS picks one by the panel's width). The
 * drawing is aria-hidden; the adjacent <ol> says the same facts as prose,
 * and that list is what a screen reader, a crawler and JS-off read.
 *
 * Markup contract: [data-leaders="parity|seal|pit|clocks|readers"].
 * motion/leaders.ts animates them by attribute only: data-pre (lines not
 * drawn yet), data-row/data-on (parity's sweep), data-net (the phone's
 * network), data-run (packets moving), data-surv (survivors only).
 * Everything prerendered here is the final state, which is what reduced
 * motion and JS-off show.
 *
 * OWNER: WS4.
 */
import { leadersUi as L, readersUi as R } from '../../content-instruments';
import { chip, esc, rich } from '../html';

export type LeaderKind = 'parity' | 'seal' | 'pit' | 'clocks';
type Layout = 'w' | 'n';

/* ── SVG primitives ─────────────────────────────────────────────────── */

const n1 = (v: number) => +v.toFixed(1);
const rect = (x: number, y: number, w: number, h: number, cls: string, rx = 2, extra = '') =>
  `<rect class="${cls}" x="${n1(x)}" y="${n1(y)}" width="${n1(w)}" height="${n1(h)}" rx="${rx}"${extra}/>`;
const text = (x: number, y: number, s: string, cls = 'ld-t', anchor: '' | 'middle' | 'end' = '') =>
  `<text class="${cls}" x="${n1(x)}" y="${n1(y)}"${anchor ? ` text-anchor="${anchor}"` : ''}>${esc(s)}</text>`;
/** A line that draws on reveal (stroke-dashoffset over pathLength 1). */
const line = (d: string, cls = 'ld-line', extra = '') => `<path class="${cls} ld-draw" d="${d}" pathLength="1"${extra}/>`;
const arrow = (x: number, y: number, dir: 'r' | 'd' = 'r', cls = 'ld-arrow') =>
  `<path class="${cls}" d="${dir === 'r' ? `M${x - 5} ${y - 3.5}L${x} ${y}L${x - 5} ${y + 3.5}` : `M${x - 3.5} ${y - 5}L${x} ${y}L${x + 3.5} ${y - 5}`}"/>`;
/** The 3px leader dot. */
const dot = (x: number, y: number, cls = 'ld-dot') => `<circle class="${cls}" cx="${n1(x)}" cy="${n1(y)}" r="1.5"/>`;
/** A packet riding a CSS offset-path. `at` is where it rests when nothing
 *  moves; `dl` its delay in the running loop. */
const packet = (path: string, at: number, dl: number, cls = 'ld-pk') =>
  `<circle class="${cls}" r="3.5" style="offset-path:path('${path}');offset-distance:${at}%;--dl:${dl}s"/>`;
const hatchDef = (id: string) =>
  `<defs><pattern id="${id}" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="7"/></pattern></defs>`;

function svg(layout: Layout, w: number, h: number, body: string): string {
  return `<svg class="ld-svg ld-svg--${layout}" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true" focusable="false" data-layout="${layout}">${body}</svg>`;
}

/** Text in the mono face is 0.6em a character. */
const span = (s: string, size = 11) => Array.from(s).length * size * 0.6;

/* ── parity: one engine, two platforms ─────────────────────────────── */

function parity(layout: Layout): string {
  const P = L.parity;
  const wide = layout === 'w';
  const W = wide ? 640 : 340;
  const fw = wide ? 150 : 58;
  const bw = wide ? 220 : 198;
  const bx = (W - bw) / 2;
  const top = 26;
  const r0 = top + 40;
  const rh = 28;
  const n = P.modules.length;
  const fh = n * rh + 54;
  const H = top + fh + 34;
  const chipT = P.chip.toUpperCase();
  const chipW = span(chipT, 8) + 12;
  const px = W - fw;

  const rows = P.modules
    .map((m, i) => {
      const cy = r0 + i * rh + 11;
      const tickW = wide ? fw - 20 : fw / 2;
      const tickP = wide ? W - 20 : W - fw / 2;
      return `<g class="ld-row" data-row="${i}" style="--i:${i}">${
        wide ? rect(14, cy - 3, fw - 54, 6, 'ld-skel') + rect(px + 14, cy - 3, fw - 54, 6, 'ld-skel') : ''
      }${line(`M${fw} ${cy}H${bx}`, 'ld-link')}${line(`M${bx + bw} ${cy}H${px}`, 'ld-link')}${rect(bx, cy - 11, bw, 22, 'ld-block')}${text(
        bx + 10,
        cy + 4,
        m,
      )}${rect(bx + bw - chipW - 6, cy - 7, chipW, 14, 'ld-chip', 2)}${text(bx + bw - chipW / 2 - 6, cy + 3, chipT, 'ld-chip-t', 'middle')}${text(
        tickW,
        cy + 4,
        '✓',
        'ld-tick',
        'middle',
      )}${text(tickP, cy + 4, '✓', 'ld-tick ld-tick--ph', 'middle')}</g>`;
    })
    .join('');

  /* The phone's network: three bars, struck through when offline. */
  const nx = px + 10;
  const ny = top + 21;
  const net = `<g>${[4, 7, 10].map((h, k) => rect(nx + k * 5, ny - h, 3, h, 'ld-bar', 0.5)).join('')}<path class="ld-net-x" d="M${nx - 2} ${
    ny - 11
  }L${nx + 15} ${ny + 1}"/></g>`;

  const body = `${text(0, top - 10, P.web, 'ld-t3')}<text class="ld-t3" x="${W}" y="${top - 10}" text-anchor="end">${esc(
    P.phone,
  )}<tspan class="ld-on"> · ${esc(P.online)}</tspan><tspan class="ld-off"> · ${esc(P.offline)}</tspan></text>
    ${rect(0.5, top, fw, fh, 'ld-frame', 6)}${[10, 18, 26].map((x) => `<circle class="ld-fdot" cx="${x}" cy="${top + 14}" r="2.5"/>`).join('')}
    <path class="ld-rule" d="M0.5 ${top + 28}H${fw + 0.5}"/>
    ${rect(px - 0.5, top, fw, fh, 'ld-frame', 14)}${rect(px + fw / 2 - 12, top + 7, 24, 5, 'ld-notch', 2.5)}${net}
    <path class="ld-rule" d="M${px - 0.5} ${top + 28}H${W - 0.5}"/>
    ${rows}
    ${text(0, H - 6, '✓', 'ld-tick')}${text(14, H - 6, P.golden, 'ld-t2')}
    ${text(W, H - 6, P.recompute, 'ld-recomp', 'end')}`;
  return svg(layout, W, H, body);
}

/* ── seal: build lock and edge check ───────────────────────────────── */

function seal(layout: Layout): string {
  const S = L.seal;
  const wide = layout === 'w';
  const W = wide ? 640 : 340;
  const fs = wide ? 11 : 10.5;
  const lx = wide ? 140 : 108; // where the lanes start
  const ex = wide ? 226 : 122; // the edge column
  const ew = wide ? 88 : 30;
  const ox = wide ? 420 : 170; // the outcome boxes
  const ow = W - ox;
  const ys = wide ? [76, 146, 252] : [80, 146, 246];
  const H = ys[2] + 40;
  const two = (x: number, y: number, ls: string[], cls = 'ld-t2') =>
    `<text class="${cls}" x="${x}" y="${y - 3}">${ls
      .map((l, k) => `<tspan x="${x}"${k ? ` dy="${fs + 3}"` : ''}>${esc(l)}</tspan>`)
      .join('')}</text>`;
  const [l1, l2, l3] = S.lanes;
  /* The edge function: a narrow gate across the two request lanes, with
     its verdict on each. */
  const gw = wide ? 40 : 28;
  const gx = ex + (ew - gw) / 2;
  const edgeTop = ys[0] - 30;
  const edgeH = ys[1] - ys[0] + 60;

  const lanes = [
    /* Signed: through the edge to the page. */
    `${two(0, ys[0], l1.from)}${dot(lx, ys[0])}${line(`M${lx} ${ys[0]}H${gx}`)}${text(gx + gw / 2, ys[0] + 4, '✓', 'ld-okg', 'middle')}${line(
      `M${gx + gw} ${ys[0]}H${ox}`,
      'ld-line ld-line--ok',
    )}${arrow(ox, ys[0], 'r', 'ld-arrow ld-arrow--ok')}
     ${rect(ox, ys[0] - 20, ow - 0.5, 40, 'ld-box ld-box--ok')}${two(ox + 12, ys[0] - 1, l1.to, 'ld-t')}`,
    /* Unverified: stops at the edge. What comes back is a refusal. */
    `${two(0, ys[1], l2.from)}${dot(lx, ys[1])}${line(`M${lx} ${ys[1]}H${gx}`)}${text(gx + gw / 2, ys[1] + 4, '✕', 'ld-fail', 'middle')}${line(
      `M${gx + gw} ${ys[1]}H${ox}`,
      'ld-line ld-line--fail',
    )}
     ${rect(ox, ys[1] - 20, ow - 0.5, 40, 'ld-refuse')}${two(ox + 12, ys[1] - 1, l2.to, 'ld-t')}`,
    /* No lock in the build: the pages aren't in the files at all. */
    `${two(0, ys[2], l3.from)}${dot(lx, ys[2])}${line(`M${lx} ${ys[2]}H${ex}`)}${
      wide ? rect(ex, ys[2] - 16, ew, 32, 'ld-box') + text(ex + ew / 2, ys[2] + 4, S.build, 'ld-t', 'middle') : rect(ex + ew / 2 - 8, ys[2] - 8, 16, 16, 'ld-box', 1)
    }${line(`M${wide ? ex + ew : ex + ew / 2 + 8} ${ys[2]}H${ox}`)}${rect(ox, ys[2] - 20, ow - 0.5, 40, 'ld-absent')}${two(ox + 12, ys[2] - 1, l3.to, 'ld-t3n')}`,
  ].join('');

  const caption = wide
    ? text(ex + ew / 2, ys[2] + 32, S.sealed, 'ld-t3n', 'middle')
    : text(0, ys[2] - 30, `${S.build} · ${S.sealed}`, 'ld-t3n');

  const pk = (y: number, end: number, at: number, dl: number, cls = 'ld-pk') => packet(`M${lx} ${y}H${end}`, at, dl, cls);
  const packets = `<g class="ld-pks">${pk(ys[0], ox - 6, 72, 0)}${pk(ys[0], ox - 6, 22, 1.2)}${pk(ys[1], gx - 5, 92, 0.5, 'ld-pk ld-pk--stop')}${pk(
    ys[1],
    gx - 5,
    40,
    1.7,
    'ld-pk ld-pk--stop',
  )}</g>`;

  const body = `${hatchDef(`ld-h-seal-${layout}`)}
    ${text(ex + ew / 2, 18, S.edge, 'ld-t', 'middle')}${text(ex + ew / 2, 31, S.edgeSub, 'ld-t3n', 'middle')}
    ${packets}${rect(gx, edgeTop, gw, edgeH, 'ld-edge', 3)}
    <path class="ld-rule ld-rule--dash" d="M0 ${ys[1] + (ys[2] - ys[1]) / 2 + (wide ? 4 : -4)}H${W}"/>
    ${lanes}${caption}`;
  return svg(layout, W, H, body);
}

/* ── pit: point-in-time membership ─────────────────────────────────── */

const COLS = 30;
const ROWS = 10;
/** Who held each index slot over the dates. Deterministic, anonymous and
 *  drawn: a slot is always filled, and when a company leaves another joins
 *  the same day. The last run in each row is still a member at the end. */
function pitRuns(): { r: number; a: number; b: number; left: boolean }[] {
  let s = 20240611;
  const rnd = () => (s = (s * 48271) % 2147483647) / 2147483647;
  const out: { r: number; a: number; b: number; left: boolean }[] = [];
  for (let r = 0; r < ROWS; r++) {
    let a = 0;
    while (a < COLS) {
      const b = Math.min(COLS - 1, a + 3 + Math.floor(rnd() * 14));
      out.push({ r, a, b, left: b < COLS - 1 });
      a = b + 1;
    }
  }
  return out;
}

function pit(): string {
  const P = L.pit;
  const cw = 16;
  const ch = 12;
  const g = 3;
  const W = COLS * (cw + g) - g;
  const H = ROWS * (ch + g) - g;
  const runs = pitRuns();
  const cells = runs
    .map((run, j) =>
      Array.from({ length: run.b - run.a + 1 }, (_, k) => {
        const c = run.a + k;
        /* Alternate shades, so two companies in a row read as two. */
        const shade = j % 2 ? ';--k:.72' : '';
        return rect(c * (cw + g), run.r * (ch + g), cw, ch, `ld-cell${run.left ? ' ld-cell--left' : ''}`, 1.5, ` style="--c:${c}${shade}"`);
      }).join(''),
    )
    .join('');
  const gaps = runs
    .filter((run) => run.left)
    .map((run) => rect(run.a * (cw + g), run.r * (ch + g), (run.b - run.a + 1) * (cw + g) - g, ch, 'ld-gap', 2))
    .join('');
  const grid = `<svg class="ld-svg ld-svg--pit" viewBox="-1 -1 ${W + 2} ${H + 2}" width="${W}" height="${H}" aria-hidden="true" focusable="false">${hatchDef(
    'ld-h-pit',
  )}<g>${gaps}</g><g>${cells}</g></svg>`;
  return `<div class="ld-pit">
      <div class="ld-pit-bar" data-chrome>
        <button class="ld-toggle" type="button" aria-pressed="false" data-js-only><span class="ld-sw" aria-hidden="true"></span>${esc(P.toggle)}</button>
        <ul class="ld-key" aria-hidden="true"><li class="ld-key-m">${esc(P.member)}</li><li class="ld-key-l">${esc(P.left)}</li></ul>
      </div>
      <div class="ld-pit-plot" aria-hidden="true" data-chrome>
        <span class="ld-axis ld-axis--y">${esc(P.slots)}</span>
        ${grid}
        <span class="ld-axis ld-axis--x">${esc(P.dates)} →</span>
        <span class="ld-hides"><span class="hatch-swatch" aria-hidden="true"></span>${esc(P.hides)}</span>
      </div>
    </div>`;
}

/* ── clocks: one path, two clock sources ───────────────────────────── */

function clocks(layout: Layout): string {
  const C = L.clocks;
  const wide = layout === 'w';
  const srcs = [
    { k: 'replay', ...C.replay },
    { k: 'live', ...C.live },
  ];
  /* Bursts from a recording, a steady stream from the market. Rest
     positions show the same difference when nothing moves. */
  const rest = { replay: [70, 73.5, 77, 30, 33.5, 37], live: [8, 24, 40, 56, 72, 88] };
  const delay = { replay: [0, 0.14, 0.28, 1.6, 1.74, 1.88], live: [0, 0.53, 1.07, 1.6, 2.13, 2.67] };
  /* Drawn under the boxes: a packet inside a stage is being handled. */
  const pks = (paths: string[]) =>
    srcs
      .map((s, i) => `<g class="ld-pks" data-src="${s.k}">${rest[s.k as 'replay'].map((at, j) => packet(paths[i], at, delay[s.k as 'replay'][j])).join('')}</g>`)
      .join('');
  if (wide) {
    const W = 640;
    const H = 186;
    const sw = 184;
    const mid = 84;
    const pv = 214; // the switch's pivot
    const bx0 = 244;
    const bw = 68;
    const gap = (W - bx0 - 5 * bw) / 4;
    const boxes = C.path
      .map((p, i) => {
        const x = bx0 + i * (bw + gap);
        return `${rect(x, mid - 15, bw, 30, 'ld-box ld-step')}${text(x + bw / 2, mid + 4, p, 'ld-t', 'middle')}`;
      })
      .join('');
    const ys = [34, 134];
    const paths = ys.map((y) => `M${sw} ${y}L${pv} ${mid}H${W}`);
    const body = `${srcs
      .map(
        (s, i) =>
          `<g class="ld-src" data-src="${s.k}">${rect(0.5, ys[i] - 26, sw - 0.5, 52, 'ld-box ld-clock')}${text(12, ys[i] - 5, s.label)}${text(
            12,
            ys[i] + 13,
            s.sub,
            'ld-t3n',
          )}${line(`M${sw} ${ys[i]}L${pv} ${mid}`, 'ld-arm')}</g>`,
      )
      .join('')}<circle class="ld-pivot" cx="${pv}" cy="${mid}" r="3"/>${line(`M${pv} ${mid}H${W}`, 'ld-line ld-line--path')}${pks(paths)}${boxes}
      <path class="ld-bracket" d="M${bx0} ${mid + 26}v6H${W - 0.5}v-6"/>${text((bx0 + W) / 2, mid + 50, C.same, 'ld-t3n', 'middle')}`;
    return svg(layout, W, H, body);
  }
  const W = 340;
  const sh = 64;
  const sw = 164;
  const pv = 96;
  const cx = W / 2;
  const by0 = 120;
  const pitch = 42;
  const bw = 150;
  const end = by0 + 4 * pitch + 28;
  const H = end + 34;
  const xs = [sw / 2, W - sw / 2];
  const boxes = C.path
    .map((p, i) => `${rect(cx - bw / 2, by0 + i * pitch, bw, 28, 'ld-box ld-step')}${text(cx, by0 + i * pitch + 18, p, 'ld-t', 'middle')}`)
    .join('');
  const paths = srcs.map((_, i) => `M${xs[i]} ${sh}L${cx} ${pv}V${end}`);
  const body = `${srcs
    .map((s, i) => {
      const x0 = i ? W - sw - 0.5 : 0.5;
      const [a, b] = s.sub.includes(', ') ? [s.sub.slice(0, s.sub.indexOf(', ') + 1), s.sub.slice(s.sub.indexOf(', ') + 2)] : [s.sub, ''];
      return `<g class="ld-src" data-src="${s.k}">${rect(x0, 0.5, sw, sh - 0.5, 'ld-box ld-clock')}${text(x0 + 10, 20, s.label)}${text(
        x0 + 10,
        38,
        a,
        'ld-t3n',
      )}${b ? text(x0 + 10, 52, b, 'ld-t3n') : ''}${line(`M${xs[i]} ${sh}L${cx} ${pv}`, 'ld-arm')}</g>`;
    })
    .join('')}<circle class="ld-pivot" cx="${cx}" cy="${pv}" r="3"/>${line(`M${cx} ${pv}V${end}`, 'ld-line ld-line--path')}${pks(paths)}${boxes}
    ${text(cx, H - 6, C.same, 'ld-t3n', 'middle')}`;
  return svg(layout, W, H, body);
}

/* ── readers: one document, two readers ────────────────────────────── */

function readers(layout: Layout): string {
  const wide = layout === 'w';
  const doc = (x: number, y: number, w: number, h: number) =>
    `<path class="ld-doc" d="M${x} ${y}H${x + w - 12}L${x + w} ${y + 12}V${y + h}H${x}Z"/><path class="ld-fold" d="M${x + w - 12} ${y}V${y + 12}H${x + w}"/>`;
  if (wide) {
    const W = 640;
    const H = 214;
    const ys = [52, 162];
    const mid = (ys[0] + ys[1]) / 2;
    const xs = [208, 318, 428];
    const bw = 84;
    const body = `${doc(0.5, mid - 36, 134, 72)}${text(12, mid - 6, R.doc)}${text(12, mid + 14, R.docSub, 'ld-t3n')}
      ${R.lanes
        .map((ln, i) => {
          const y = ys[i];
          const k = i ? 'm' : 'd';
          return `<g class="ld-lane" data-k="${k}">${text(xs[0], y - 24, ln.name.toUpperCase(), 'ld-t3')}${dot(135, mid + (i ? 8 : -8))}${line(
            `M135 ${mid + (i ? 8 : -8)}H156C176 ${mid + (i ? 8 : -8)} 172 ${y} 192 ${y}H${xs[0]}`,
            'ld-line ld-lane-l',
          )}${ln.steps
            .map(
              (s, j) =>
                `${rect(xs[j], y - 15, bw, 30, 'ld-box ld-lane-b')}${text(xs[j] + bw / 2, y + 4, s, 'ld-t', 'middle')}${
                  j < 2 ? line(`M${xs[j] + bw} ${y}H${xs[j + 1] - 1}`, 'ld-line ld-lane-l') + arrow(xs[j + 1] - 1, y, 'r', 'ld-arrow ld-lane-a') : ''
                }`,
            )
            .join('')}${line(`M${xs[2] + bw} ${y}H${xs[2] + bw + 28}`, 'ld-line ld-lane-l')}${arrow(xs[2] + bw + 28, y, 'r', 'ld-arrow ld-lane-a')}${text(
            xs[2] + bw + 36,
            y + 4,
            ln.out,
            'ld-t2',
          )}</g>`;
        })
        .join('')}`;
    return svg(layout, W, H, body);
  }
  const W = 340;
  const xs = [84, 256];
  const bw = 124;
  const y0 = 128;
  const pitch = 48;
  const outY = y0 + 2 * pitch + 30 + 34;
  const H = outY + 8;
  const body = `${doc(W / 2 - 70, 0.5, 140, 58)}${text(W / 2 - 58, 25, R.doc)}${text(W / 2 - 58, 44, R.docSub, 'ld-t3n')}
    ${R.lanes
      .map((ln, i) => {
        const x = xs[i];
        const k = i ? 'm' : 'd';
        return `<g class="ld-lane" data-k="${k}">${dot(W / 2 + (i ? 8 : -8), 59)}${line(
          `M${W / 2 + (i ? 8 : -8)} 59V70C${W / 2 + (i ? 8 : -8)} 86 ${x} 78 ${x} 94V${y0 - 1}`,
          'ld-line ld-lane-l',
        )}${arrow(x, y0 - 1, 'd', 'ld-arrow ld-lane-a')}${ln.steps
          .map(
            (s, j) =>
              `${rect(x - bw / 2, y0 + j * pitch, bw, 30, 'ld-box ld-lane-b')}${text(x, y0 + j * pitch + 19, s, 'ld-t', 'middle')}${
                j < 2
                  ? line(`M${x} ${y0 + j * pitch + 30}V${y0 + (j + 1) * pitch - 1}`, 'ld-line ld-lane-l') +
                    arrow(x, y0 + (j + 1) * pitch - 1, 'd', 'ld-arrow ld-lane-a')
                  : ''
              }`,
          )
          .join('')}${line(`M${x} ${y0 + 2 * pitch + 30}V${outY - 16}`, 'ld-line ld-lane-l')}${text(x, outY, ln.out, 'ld-t2', 'middle')}${text(
          i ? x + 7 : x - 7,
          y0 - 12,
          ln.name.toUpperCase(),
          'ld-t3',
          i ? '' : 'end',
        )}</g>`;
      })
      .join('')}`;
  return svg(layout, W, H, body);
}

/* ── The figure ────────────────────────────────────────────────────── */

function figure(kind: string, title: string, drawing: string, facts: string[], extra = ''): string {
  return `<figure class="panel leaders" data-leaders="${kind}">
    <figcaption class="panel-head" data-chrome><span class="panel-title">${esc(title)}</span>${chip('illustration')}</figcaption>
    ${extra}<div class="ld-draw-area">${drawing}</div>
    <ol class="ld-facts">${facts.map((f) => `<li>${rich(f)}</li>`).join('')}</ol>
  </figure>`;
}

function clockSwitch(): string {
  const C = L.clocks;
  return `<fieldset class="ld-clock-src" data-chrome>
      <legend class="ld-legend">${esc(C.legend)}</legend>
      ${(['replay', 'live'] as const)
        .map(
          (k, i) =>
            `<label class="ld-opt"><input type="radio" name="ld-clock" value="${k}"${i === 0 ? ' checked' : ''} /><span>${esc(C[k].label)}</span></label>`,
        )
        .join('')}
    </fieldset>`;
}

export function renderLeaders(kind: LeaderKind): string {
  switch (kind) {
    case 'parity':
      return figure(kind, L.parity.title, parity('w') + parity('n'), L.parity.facts);
    case 'seal':
      return figure(kind, L.seal.title, seal('w') + seal('n'), L.seal.facts);
    case 'pit':
      return figure(kind, L.pit.title, pit(), L.pit.facts);
    case 'clocks':
      return figure(kind, L.clocks.title, clocks('w') + clocks('n'), L.clocks.facts, clockSwitch());
  }
}

export function renderReaders(): string {
  return figure('readers', R.title, readers('w') + readers('n'), R.facts);
}
