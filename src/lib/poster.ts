/**
 * The hero poster: this page's structure graph, drawn at build time as a
 * static SVG in the exploded layout (B), and the counts line under it.
 *
 * It's what the lite and reduced tiers, JavaScript-off visitors and every
 * share card see, so it has to stand on its own as a drawing: three
 * labeled planes, each with its own nodes and edges, the pins that join
 * the page to its structured data, and the vertical axis through them.
 * On the full tier the WebGL canvas fades in over it on an identical first
 * frame (same layout, same projection, same sizes and colours), and the
 * frame group (corner ticks, plane labels) stays on top of the canvas.
 *
 * Budget: ≤300 nodes, ≤9 KB raw, coordinates to one decimal. No <image>,
 * so it's never an LCP candidate. aria-hidden: the figcaption carries the
 * meaning in text.
 *
 * Every class here is styled in styles/instruments/lattice.css with the
 * site's tokens. Dots are zero-length round-capped subpaths with a
 * non-scaling stroke, so a 3px node is 3 CSS px at any size, which is also
 * what the shader draws.
 */
import { hero } from '../content';
import { E, K, P, pageGraph, type Graph } from './pagegraph';
import { edgeVis, FLAT, LABEL, layout, leader, LOOK, PLANE_Y, project, RIM, VIEW, type Layout } from './layout';

export type PosterResult = { svg: string; counts: { headings: number; links: number; entities: number } };

export const POSTER_MAX_NODES = 300;
export const POSTER_MAX_BYTES = 9 * 1024;

const f = (x: number) => {
  const r = Math.round(x * 10) / 10;
  return String(r === 0 ? 0 : r);
};
const pt = (p: [number, number]) => `${f(p[0])} ${f(p[1])}`;

/** The nodes the poster keeps: everything but the deepest leaves when the
 *  page has more than POSTER_MAX_NODES. Pure function of the graph. */
export function posterNodes(g: Graph, L: Layout): Set<number> {
  const keep = new Set<number>();
  const order = g.nodes.map((n) => n.i).sort((x, y) => L.depth[x] - L.depth[y] || x - y);
  for (const i of order) {
    if (keep.size >= POSTER_MAX_NODES) break;
    keep.add(i);
  }
  return keep;
}

export function renderPoster(html: string, route: string): PosterResult {
  const g = pageGraph(html, route);
  const L = layout(g);
  let keep = posterNodes(g, L);
  let svg = draw(g, L, keep);
  /* Over budget: drop nodes from the deep end until it fits. */
  while (svg.length > POSTER_MAX_BYTES && keep.size > 40) {
    keep = new Set([...keep].slice(0, Math.floor(keep.size * 0.9)));
    svg = draw(g, L, keep);
  }
  return { svg, counts: g.counts };
}

function draw(g: Graph, L: Layout, keep: Set<number>): string {
  const B = (i: number) => project(L.b[i * 3], L.b[i * 3 + 1], L.b[i * 3 + 2]);
  const out: string[] = [];

  /* Planes, bottom first so the upper ones sit over them. */
  const ex = VIEW.s * Math.SQRT2 * Math.cos(Math.PI / 6) * RIM;
  const ey = VIEW.s * Math.SQRT2 * 0.5 * FLAT * RIM;
  for (const k of [P.machine, P.link, P.read]) {
    const [cx, cy] = project(0, PLANE_Y[k], 0);
    out.push(
      `<ellipse class="pg-pl pg-p${k}" cx="${f(cx)}" cy="${f(cy)}" rx="${f(ex)}" ry="${f(ey)}"/>`,
    );
  }

  /* Edges, grouped by look. Edges that share an end are chained through it
     (M a L hub L b) to keep the file small. */
  const groups = new Map<string, [number, number][]>();
  const push = (cls: string, a: number, b: number) => {
    const list = groups.get(cls) ?? [];
    list.push([a, b]);
    groups.set(cls, list);
  };
  const pins: string[] = [];
  g.edges.forEach((e, idx) => {
    if (!keep.has(e.a) || !keep.has(e.b) || !(edgeVis(g, e.t, e.a, e.b) & 2)) return;
    if (e.t === E.pin) {
      const foot = L.feet.get(idx)!;
      pins.push(`M${pt(B(e.a))}L${pt(project(foot[0], foot[1], foot[2]))}L${pt(B(e.b))}`);
      return;
    }
    if (e.t === E.tree && e.a === 0) push('pg-ax', e.b, e.a);
    else if (e.t === E.target) push('pg-e1', e.b, e.a);
    else if (e.t === E.ref) push('pg-e3', e.a, e.b);
    else push(`pg-e${g.nodes[e.a].plane}`, e.a, e.b);
  });
  for (const [cls, list] of groups) {
    const byHub = new Map<number, number[]>();
    for (const [h, c] of list) byHub.set(h, [...(byHub.get(h) ?? []), c]);
    let d = '';
    for (const [h, cs] of byHub) {
      const hp = pt(B(h));
      for (let k = 0; k < cs.length; k += 2) {
        d += k + 1 < cs.length ? `M${pt(B(cs[k]))}L${hp}L${pt(B(cs[k + 1]))}` : `M${hp}L${pt(B(cs[k]))}`;
      }
    }
    out.push(`<path class="${cls}" d="${d}"/>`);
  }
  if (pins.length) out.push(`<path class="pg-pin" d="${pins.join('')}"/>`);

  /* Nodes: one path per (size, colour); rings get a ground-coloured core;
     diamonds are drawn shapes. */
  const dots = new Map<string, string>();
  const cores = new Map<number, string>();
  let diamonds = '';
  for (const i of keep) {
    const nd = g.nodes[i];
    const [size, shape] = LOOK[nd.k];
    const p = B(i);
    if (shape === 2) {
      const r = size / 2;
      diamonds += `M${f(p[0] - r)} ${f(p[1])}l${r} ${-r} ${r} ${r} ${-r} ${r}z`;
      continue;
    }
    const tone = nd.k === K.landmark || nd.k === K.root ? 'n' : String(nd.plane);
    const key = `pg-d${size} pg-c${tone}`;
    dots.set(key, (dots.get(key) ?? '') + `M${pt(p)}h0`);
    if (shape === 1) cores.set(size, (cores.get(size) ?? '') + `M${pt(p)}h0`);
  }
  for (const [cls, d] of dots) out.push(`<path class="${cls}" d="${d}"/>`);
  for (const [size, d] of cores) out.push(`<path class="pg-k${size}" d="${d}"/>`);
  if (diamonds) out.push(`<path class="pg-dia" d="${diamonds}"/>`);

  return `<svg class="pg" viewBox="0 0 ${VIEW.size} ${VIEW.size}" aria-hidden="true" focusable="false"><g class="pg-graph">${out.join(
    '',
  )}</g>${frame(g)}</svg>`;
}

/** The frame group: corner ticks and the three plane callouts. It stays
 *  visible above the live canvas, which moves the callouts with the planes. */
function frame(g: Graph): string {
  const t = 10;
  const m = 14;
  const z = VIEW.size - m;
  const ticks = `<path class="pg-tick" d="M${m} ${m + t}V${m}H${m + t}M${z - t} ${m}H${z}V${m + t}M${z} ${z - t}V${z}H${z - t}M${m + t} ${z}H${m}V${z - t}"/>`;
  const names = hero.figure.planes;
  const counts = hero.figure.counts.split(' · ');
  const rows: [string, string][] = [
    [names.read, counts[0].replace('{h}', String(g.counts.headings))],
    [names.link, counts[1].replace('{l}', String(g.counts.links))],
    [names.machine, counts[2].replace('{e}', String(g.counts.entities))],
  ];
  const labels = rows
    .map(([name, count], k) => {
      const { dot, elbow, y } = leader(k);
      return `<g class="pg-lb" data-plane="${k}"><path class="pg-ld" d="M${LABEL.x} ${f(y)}H${f(elbow[0])}L${pt(dot)}"/><path class="pg-d3 pg-c${k}" d="M${pt(dot)}h0"/><text class="pg-t" x="${LABEL.x}" y="${f(y - 7)}">${esc(
        name.toUpperCase(),
      )}</text><text class="pg-t pg-tc pg-t${k}" x="${LABEL.x}" y="${f(y + 15)}">${esc(count)}</text></g>`;
    })
    .join('');
  return `<g class="pg-frame">${ticks}${labels}</g>`;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
