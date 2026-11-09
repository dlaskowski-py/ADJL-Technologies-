/**
 * Where every node of the page graph sits, in two deterministic layouts,
 * and the one projection both renderers share.
 *
 *   A  assembled   one radial tidy tree on the floor (y = 0). The head
 *                  branch takes the 70° at the back, the body the rest.
 *                  Angle by leaf count, radius R·√(depth / maxDepth).
 *   B  exploded    three stacked planes, flattened ellipses, each in the
 *                  same angular order as A:
 *                    y = +0.9R  copper  what people read (sections, headings)
 *                    y =  0     teal    what crawlers follow (links, and one
 *                                       rim node per target route)
 *                    y = −0.9R  violet  what machines parse (head, JSON-LD)
 *
 * World coordinates are (u, y, v): u runs across the screen, v runs into it
 * and y is up. The projection is orthographic isometric,
 *   x' = (x − z)·cos30°,  y' = (x + z)·sin30° − y
 * which in (u, v) is x' = √2·cos30°·u, y' = √2·sin30°·v − y. The poster SVG
 * and the WebGL shader use exactly these numbers, so the canvas lands on
 * the poster pixel for pixel when it fades in.
 *
 * Pure and seeded: no DOM, no Math.random.
 */
import { E, K, P, type Graph } from './pagegraph';

/** Plane heights, by plane index (read, link, machine). */
export const PLANE_Y = [0.9, 0, -0.9];
/** How much a plane is squashed into the screen in B. */
export const FLAT = 0.42;
/** Plane radius in B, and the ring the links sit on. */
export const RB = 0.9;
export const RL = 0.6;
/** World R = 1 → viewBox pixels. The viewBox is 600 × 600. */
export const VIEW = { size: 600, cx: 318, cy: 300, s: 205 };
export const KU = Math.SQRT2 * Math.cos(Math.PI / 6);
export const KV = Math.SQRT2 * 0.5;

/** The plane outline sits a little outside the outermost nodes. */
export const RIM = RB * 1.08;

/** Node look by kind: [diameter px, shape]. Shape 0 dot, 1 ring, 2 diamond.
 *  The shader in motion/lattice.ts reads the same table. */
export const LOOK: Record<number, [number, number]> = {
  [K.root]: [9, 1],
  [K.hub]: [9, 1],
  [K.landmark]: [5, 0],
  [K.section]: [5, 0],
  [K.heading]: [3, 0],
  [K.link]: [3, 0],
  [K.route]: [5, 1],
  [K.meta]: [3, 0],
  [K.ldjson]: [5, 0],
  [K.ld]: [7, 2],
  [K.question]: [3, 0],
};

/** Where each plane's label sits: shoulder y relative to the plane centre,
 *  and the rim angle its leader drops onto. Shared with the live overlay. */
export const LABEL = { x: 24, rise: 80, w: 166, phi: (238 / 180) * Math.PI };

const TAU = Math.PI * 2;
/** The head branch's sector in A: 70°, centred at the back (screen top). */
const HEAD_C = -Math.PI / 2;
const HEAD_W = (70 / 360) * TAU;

/** World → viewBox, no rotation. */
export function project(u: number, y: number, v: number): [number, number] {
  return [VIEW.cx + VIEW.s * KU * u, VIEW.cy + VIEW.s * (KV * v - y)];
}

/** mulberry32: small, fast, and the same everywhere. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a, for seeding from strings. */
export function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193);
  return h >>> 0;
}

export type Layout = {
  /** xyz per node, as (u, y, v). */
  a: Float32Array;
  b: Float32Array;
  /** Angle of each node in A (radians), for ordering. */
  ang: Float64Array;
  depth: Int32Array;
  /** Pin feet in B: for each pin edge index, the point under its source on
   *  the machine plane. */
  feet: Map<number, [number, number, number]>;
};

export function layout(g: Graph): Layout {
  const n = g.nodes.length;
  const kids: number[][] = Array.from({ length: n }, () => []);
  for (const nd of g.nodes) if (nd.p >= 0) kids[nd.p].push(nd.i);

  const depth = new Int32Array(n);
  const leaves = new Float64Array(n);
  let maxD = 1;
  const count = (i: number, d: number): number => {
    depth[i] = d;
    if (d > maxD) maxD = d;
    let s = 0;
    for (const c of kids[i]) s += count(c, d + 1);
    return (leaves[i] = s || 1);
  };
  count(0, 0);

  /* A: the radial tidy tree. */
  const ang = new Float64Array(n);
  const a = new Float32Array(n * 3);
  const spread = (i: number, a0: number, a1: number) => {
    ang[i] = (a0 + a1) / 2;
    let t = a0;
    for (const c of kids[i]) {
      const w = ((a1 - a0) * leaves[c]) / leaves[i];
      spread(c, t, t + w);
      t += w;
    }
  };
  const [head, body] = kids[0];
  spread(head, HEAD_C - HEAD_W / 2, HEAD_C + HEAD_W / 2);
  spread(body, HEAD_C + HEAD_W / 2, HEAD_C + TAU - HEAD_W / 2);
  ang[0] = HEAD_C;
  for (let i = 0; i < n; i++) {
    const r = Math.sqrt(depth[i] / maxD);
    a[i * 3] = r * Math.cos(ang[i]);
    a[i * 3 + 2] = r * Math.sin(ang[i]);
  }

  /* B: each plane lays its own nodes out as a radial tree over the full
     circle, around its branch's centre in A. Children keep their order,
     so the order is A's; only the weights change, because a plane counts
     its own leaves (the read plane doesn't make room for links). Links
     sit evenly on one ring of the middle plane, in document order. */
  const b = new Float32Array(n * 3);
  const bAng = new Float64Array(n);
  const headC = HEAD_C;
  const bodyC = HEAD_C + Math.PI;
  const kidsB = kids.map((cs) => cs.filter((c) => g.nodes[c].k !== K.link));
  const leavesB = new Float64Array(n);
  const countB = (i: number): number => {
    let s = 0;
    for (const c of kidsB[i]) s += countB(c);
    return (leavesB[i] = s || 1);
  };
  const spreadB = (i: number, a0: number, a1: number) => {
    bAng[i] = (a0 + a1) / 2;
    let t = a0;
    for (const c of kidsB[i]) {
      const w = ((a1 - a0) * leavesB[c]) / leavesB[i];
      spreadB(c, t, t + w);
      t += w;
    }
  };
  countB(head);
  countB(body);
  spreadB(head, headC - Math.PI, headC + Math.PI);
  spreadB(body, bodyC - Math.PI, bodyC + Math.PI);
  const links = g.nodes.filter((nd) => nd.k === K.link);
  links.forEach((nd, k) => (bAng[nd.i] = bodyC - Math.PI + ((k + 0.5) * TAU) / links.length));

  /* Depth within a plane: read counts from <body>, machine from <head>. */
  let maxRead = 1;
  let maxMach = 1;
  const pd = (i: number) => depth[i] - 1;
  for (const nd of g.nodes) {
    if (nd.k === K.route || nd.k === K.link) continue;
    if (nd.plane === P.read) maxRead = Math.max(maxRead, pd(nd.i));
    if (nd.plane === P.machine) maxMach = Math.max(maxMach, pd(nd.i));
  }
  const place = (i: number, r: number, phi: number, plane: number) => {
    bAng[i] = phi;
    b[i * 3] = r * Math.cos(phi);
    b[i * 3 + 1] = PLANE_Y[plane];
    b[i * 3 + 2] = FLAT * r * Math.sin(phi);
  };

  const routes: number[] = [];
  for (const nd of g.nodes) {
    const i = nd.i;
    if (nd.k === K.root) place(i, 0, 0, P.link);
    else if (nd.k === K.route) routes.push(i);
    else if (nd.k === K.link) place(i, RB * RL, bAng[i], P.link);
    else if (nd.plane === P.read) place(i, RB * Math.sqrt(pd(i) / maxRead), bAng[i], P.read);
    else place(i, RB * Math.sqrt(pd(i) / maxMach), bAng[i], P.machine);
  }

  /* Route nodes: on the link plane's rim, at the mean angle of the links
     that point at them, then pushed apart so none overlap. In A each one
     waits, unseen, on the first link that targets it. */
  const sum = new Map<number, [number, number, number]>();
  for (const e of g.edges) {
    if (e.t !== E.target) continue;
    const s = sum.get(e.b) ?? [0, 0, e.a];
    s[0] += Math.cos(bAng[e.a]);
    s[1] += Math.sin(bAng[e.a]);
    sum.set(e.b, s);
  }
  const order = routes
    .map((i) => {
      const s = sum.get(i) ?? [1, 0, 0];
      a.set(a.subarray(s[2] * 3, s[2] * 3 + 3), i * 3);
      return { i, phi: Math.atan2(s[1], s[0]) };
    })
    .sort((x, y) => x.phi - y.phi);
  const m = order.length;
  if (m > 1) {
    const gap = Math.min(TAU / m, (14 / 360) * TAU) * 0.92;
    for (let pass = 0; pass < 40; pass++) {
      for (let k = 0; k < m; k++) {
        const p = order[k];
        const q = order[(k + 1) % m];
        let d = q.phi - p.phi;
        if (k === m - 1) d += TAU;
        if (d < gap) {
          const push = (gap - d) / 2;
          p.phi -= push;
          q.phi += push;
        }
      }
    }
  }
  for (const o of order) place(o.i, RB, o.phi, P.link);

  /* Pins drop straight down from the element to the machine plane, then
     run along it to the entity: a vertical projection line, drafting
     style. */
  const feet = new Map<number, [number, number, number]>();
  g.edges.forEach((e, k) => {
    if (e.t === E.pin) feet.set(k, [b[e.a * 3], PLANE_Y[P.machine], b[e.a * 3 + 2]]);
  });

  return { a, b, ang, depth, feet };
}

/** Is an edge drawn in A, in B, or both? Bit 1 = A, bit 2 = B. */
export function edgeVis(g: Graph, t: number, from: number, to: number): number {
  if (t === E.target || t === E.pin) return 2;
  if (t === E.ref) return 3;
  const pa = g.nodes[from].plane;
  const pb = g.nodes[to].plane;
  if (pa === pb) return 3;
  /* The root's edges to <head> and <body> become the vertical axis. */
  return from === 0 ? 3 : 1;
}

/**
 * Word particles: N per section, N its word count (all sections together
 * capped at `cap`), in a seeded disc around the section node. The seed is
 * the route plus the section id, so each page's cloud is its own and the
 * same on every visit. Returns positions for A and B, and each particle's
 * section-relative order (0..1) for staged growth.
 */
export function words(g: Graph, L: Layout, cap = 3000): { a: Float32Array; b: Float32Array; o: Float32Array } {
  const secs = g.nodes.filter((nd) => nd.k === K.section && nd.words > 0);
  const total = secs.reduce((s, nd) => s + nd.words, 0);
  const scale = total > cap ? cap / total : 1;
  const counts = secs.map((nd) => Math.max(1, Math.floor(nd.words * scale)));
  const n = counts.reduce((s, c) => s + c, 0);
  const a = new Float32Array(n * 3);
  const b = new Float32Array(n * 3);
  const o = new Float32Array(n);
  let w = 0;
  secs.forEach((nd, si) => {
    const rnd = mulberry32(hash(g.route + '#' + nd.ref));
    const N = counts[si];
    const rho = 0.0105 * Math.sqrt(N);
    for (let k = 0; k < N; k++, w++) {
      const r = rho * Math.sqrt(rnd());
      const t = rnd() * TAU;
      const du = r * Math.cos(t);
      const dv = r * Math.sin(t);
      const j = (rnd() - 0.5) * 0.16;
      a[w * 3] = L.a[nd.i * 3] + du;
      a[w * 3 + 1] = j;
      a[w * 3 + 2] = L.a[nd.i * 3 + 2] + dv;
      b[w * 3] = L.b[nd.i * 3] + du * 0.9;
      b[w * 3 + 1] = L.b[nd.i * 3 + 1] + j * 0.25;
      b[w * 3 + 2] = L.b[nd.i * 3 + 2] + dv * FLAT * 0.9;
      o[w] = (si + k / N) / secs.length;
    }
  });
  return { a, b, o };
}

/** Leader geometry for plane `k`, in viewBox units: [dot, elbow, shoulder start]. */
export function leader(k: number, dx = 0, dy = 0): { dot: [number, number]; elbow: [number, number]; y: number } {
  const c = project(0, PLANE_Y[k], 0);
  const y = c[1] - LABEL.rise + dy;
  const u = RIM * Math.cos(LABEL.phi);
  const v = FLAT * RIM * Math.sin(LABEL.phi);
  const d = project(u, PLANE_Y[k], v);
  return { dot: [d[0] + dx, d[1] + dy], elbow: [LABEL.x + LABEL.w + dx, y], y };
}
