/**
 * The parts of Machine View's readout that both sides draw: the build-time
 * renderer (machine.ts, in Node) and the live modules in the browser
 * (motion/machine.ts re-measuring a fetch, motion/views/ drawing the
 * drawer). Same function, so a value formats the same way at build and
 * live and "changed since build" compares like with like.
 *
 * CONTENT-FREE ON PURPOSE. Nothing here imports src/content*.ts: the lazy
 * chunks import this file, and a content import would drag the whole copy
 * of the site into them. Every string in the markup below is data (a type
 * name, an id, a number), never a sentence a person wrote. Copy is passed in.
 *
 * Markup here is styled by ATTRIBUTE selectors under [data-machine] or
 * [data-drawer] (machine.css), never by classes, because the live side
 * builds the same markup at runtime where check-css can't see it.
 */
import type { Heading, LdEdge, LdNode, Measure } from '../../lib/measure';

/** Escape for text and attributes alike. */
export const x = (s: string | number): string =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const fmtInt = (n: number): string => Math.round(n).toLocaleString('en-US');

/** Kilobytes the way check-budget and the status bar print them. */
export const fmtKB = (bytes: number): string => `${(bytes / 1024).toFixed(1)} kB`;

/** Path part of a URL (the canonical is absolute). */
export const pathOf = (url: string): string => {
  const m = /^[a-z]+:\/\/[^/]+(\/[^?#]*)?/i.exec(url);
  return m ? m[1] || '/' : url || '/';
};

/** The fragment of an @id, or its path when it has none. */
export const shortId = (id: string): string => {
  const h = id.indexOf('#');
  const p = pathOf(h >= 0 ? id.slice(0, h) : id);
  return h >= 0 ? (p === '/' ? '' : p) + id.slice(h) : p;
};

/* ── Outline ──────────────────────────────────────────────────────── */

/** h1–h3 numbered the way Machine view labels them: "2", "2.1", "2.1.1".
 *  The h1 is 0 (it's the page, not a chapter of it). */
export function outlineNumbers(levels: number[]): string[] {
  const c = [0, 0, 0];
  return levels.map((l) => {
    if (l <= 1) return '0';
    c[l - 1]++;
    for (let k = l; k < 3; k++) c[k] = 0;
    return c.slice(1, l).join('.');
  });
}

/** A stable signature of the outline, for "changed since build". */
export const outlineSig = (hs: Heading[]): string =>
  hs
    .filter((h) => h.level <= 3)
    .map((h) => `${h.level}${h.text}`)
    .join('|');

/** The outline as a nested <ol>: h1 → h2 → h3. */
export function outlineHtml(hs: Heading[], attrs = ''): string {
  const list = hs.filter((h) => h.level <= 3);
  const nums = outlineNumbers(list.map((h) => h.level));
  let out = `<ol data-outline${attrs}>`;
  let depth = 1;
  list.forEach((h, i) => {
    const lv = Math.max(1, h.level);
    if (i > 0) {
      if (lv > depth) out += '<ol>'.repeat(lv - depth);
      else {
        out += '</li>';
        out += '</ol></li>'.repeat(depth - lv);
      }
    }
    depth = lv;
    out += `<li><span data-tag aria-hidden="true">h${lv}</span><span data-num aria-hidden="true">${x(nums[i])}</span><span data-t>${x(
      h.text,
    )}</span>${h.id ? `<span data-id>#${x(h.id)}</span>` : ''}`;
  });
  if (list.length) {
    out += '</li>';
    out += '</ol></li>'.repeat(depth - 1);
  }
  return out + '</ol>';
}

/* ── The JSON-LD graph ─────────────────────────────────────────────── */

/** Types that hold other things up and aren't entities a reader means. */
const PLUMBING = new Set(['ImageObject', 'ListItem', 'Answer', 'OfferCatalog', 'EntryPoint', 'SearchAction', 'ReadAction']);

/** The site's own Organization: local, typed Organization, on the canonical
 *  origin when there's a choice. */
export function siteOrg(nodes: LdNode[], origin = ''): LdNode | undefined {
  const orgs = nodes.filter((n) => n.local && n.types.includes('Organization'));
  return orgs.find((n) => origin && n.id.startsWith(origin)) ?? orgs.find((n) => /\/#organization$/.test(n.id)) ?? orgs[0];
}

/** Ring 0 the site's Organization, 1 the website and its people, 2 the page,
 *  3 the rest described here, 4 what's referenced here and described on
 *  another page. */
export function ringOf(n: LdNode, org: LdNode | undefined): number {
  if (!n.local) return 4;
  if (org && n.id === org.id) return 0;
  if (n.types.includes('WebSite') || n.types.includes('Person')) return 1;
  if (n.types.includes('WebPage')) return 2;
  return 3;
}

export type Placed = { n: LdNode; ring: number; x: number; y: number; a: number };

/** Deterministic concentric layout. Each ring is ordered by where its
 *  neighbours already sit, so edges cross as little as a circle allows. */
export function ldLayout(ld: Measure['ld'], w: number, h: number, origin = ''): { placed: Placed[]; rings: number[]; r: number[] } {
  const org = siteOrg(ld.nodes, origin);
  const byRing = new Map<number, LdNode[]>();
  for (const n of ld.nodes) {
    const k = ringOf(n, org);
    if (!byRing.has(k)) byRing.set(k, []);
    byRing.get(k)!.push(n);
  }
  const rings = [...byRing.keys()].sort((a, b) => a - b);
  const cx = w / 2;
  const cy = h / 2;
  const R = Math.min(w, h) / 2 - 34;
  const outer = rings.filter((k) => k > 0).length || 1;
  const radius = new Map<number, number>();
  let i = 0;
  for (const k of rings) radius.set(k, k === 0 ? 0 : (R * ++i) / outer);

  const nb = new Map<string, string[]>();
  const link = (a: string, b: string) => {
    if (!nb.has(a)) nb.set(a, []);
    nb.get(a)!.push(b);
  };
  for (const e of ld.edges) {
    link(e.from, e.to);
    link(e.to, e.from);
  }

  const angle = new Map<string, number>();
  const placed: Placed[] = [];
  const TAU = Math.PI * 2;
  for (const k of rings) {
    const list = byRing.get(k)!.slice().sort((a, b) => (a.id < b.id ? -1 : 1));
    const r = radius.get(k)!;
    if (r === 0) {
      list.forEach((n) => {
        angle.set(n.id, -Math.PI / 2);
        placed.push({ n, ring: k, x: cx, y: cy, a: -Math.PI / 2 });
      });
      continue;
    }
    /* Target angle: circular mean of neighbours already placed. */
    const target = list.map((n, j) => {
      let sx = 0;
      let sy = 0;
      for (const m of nb.get(n.id) ?? []) {
        const a = angle.get(m);
        if (a === undefined) continue;
        const pm = placed.find((p) => p.n.id === m);
        if (pm && pm.ring === 0) continue; // the centre pulls every way at once
        sx += Math.cos(a);
        sy += Math.sin(a);
      }
      return sx || sy ? Math.atan2(sy, sx) : -Math.PI / 2 + (TAU * j) / list.length;
    });
    const order = list.map((n, j) => ({ n, t: target[j] })).sort((a, b) => a.t - b.t);
    const step = TAU / order.length;
    /* Rotate the evenly spaced slots to sit closest to the targets. */
    let sx = 0;
    let sy = 0;
    order.forEach((o, j) => {
      sx += Math.cos(o.t - j * step);
      sy += Math.sin(o.t - j * step);
    });
    const off = sx || sy ? Math.atan2(sy, sx) : -Math.PI / 2 + (k % 2) * (step / 2);
    order.forEach((o, j) => {
      const a = off + j * step;
      angle.set(o.n.id, a);
      placed.push({ n: o.n, ring: k, x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) * 0.86, a });
    });
  }
  return { placed, rings, r: rings.map((k) => radius.get(k)!) };
}

/** What a node is called in the graph: its first type (both, for a page
 *  that's also an FAQPage or a CollectionPage). */
export const typeLabel = (n: LdNode): string =>
  n.types.length ? (n.types.includes('WebPage') ? n.types.join(' + ') : n.types[0]) : shortId(n.id);

const r1 = (v: number) => Math.round(v * 10) / 10;

/** The layered graph as SVG. `label` is its accessible name (role="img");
 *  the adjacent list carries the same facts in text. */
export function ldSvg(ld: Measure['ld'], label: string, origin = ''): string {
  const W = 600;
  const H = 440;
  const { placed, r } = ldLayout(ld, W, H, origin);
  const at = new Map(placed.map((p) => [p.n.id, p]));
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${x(label)}" focusable="false" data-ld-svg>`;
  /* Rings: hairline orbits, dashed for the outer "described elsewhere". */
  for (const rad of r) {
    if (!rad) continue;
    s += `<ellipse cx="${W / 2}" cy="${H / 2}" rx="${r1(rad)}" ry="${r1(rad * 0.86)}" data-orbit/>`;
  }
  for (const e of ld.edges) {
    const a = at.get(e.from);
    const b = at.get(e.to);
    if (!a || !b) continue;
    s += `<line x1="${r1(a.x)}" y1="${r1(a.y)}" x2="${r1(b.x)}" y2="${r1(b.y)}" data-edge${b.n.local ? '' : ' data-far'}/>`;
  }
  for (const p of placed) {
    const size = p.ring === 0 ? 9 : p.ring === 4 ? 4 : p.ring === 3 ? 5 : 6;
    s += `<circle cx="${r1(p.x)}" cy="${r1(p.y)}" r="${size}" data-node="${p.ring}"/>`;
    /* Satellites: typed objects nested with no @id (an FAQ's Questions). */
    const sats = Object.entries(p.n.inline).filter(([t]) => !PLUMBING.has(t));
    let satText = '';
    for (const [t, count] of sats) {
      const k = Math.min(count, 12);
      for (let j = 0; j < k; j++) {
        const a = p.a + Math.PI + ((j - (k - 1) / 2) * 0.28);
        s += `<circle cx="${r1(p.x + Math.cos(a) * 20)}" cy="${r1(p.y + Math.sin(a) * 20)}" r="1.6" data-sat/>`;
      }
      satText += `${t} ×${count}`;
    }
    /* Label to the outside of the ring, anchored away from the centre. */
    const dx = p.x - W / 2;
    const anchor = p.ring === 0 ? 'middle' : dx > 8 ? 'start' : dx < -8 ? 'end' : 'middle';
    const lx = p.ring === 0 ? p.x : p.x + (anchor === 'start' ? 12 : anchor === 'end' ? -12 : 0);
    const ly = p.ring === 0 ? p.y + 26 : anchor === 'middle' ? p.y + (p.y > H / 2 ? 22 : -14) : p.y + 4;
    s += `<text x="${r1(lx)}" y="${r1(ly)}" text-anchor="${anchor}" data-label="${p.ring}">${x(typeLabel(p.n))}</text>`;
    if (satText) {
      s += `<text x="${r1(lx)}" y="${r1(ly + 14)}" text-anchor="${anchor}" data-label="sat">${x(satText)}</text>`;
    }
  }
  return s + '</svg>';
}

/** The same graph as a list: every entity, its type, its name and its id,
 *  local ones first. `far` labels the ones described on another page. */
export function ldList(ld: Measure['ld'], far: string, origin = ''): string {
  const org = siteOrg(ld.nodes, origin);
  const nodes = ld.nodes.slice().sort((a, b) => ringOf(a, org) - ringOf(b, org));
  return `<ul data-ld-list>${nodes
    .map((n) => {
      const sats = Object.entries(n.inline)
        .filter(([t]) => !PLUMBING.has(t))
        .map(([t, c]) => ` · ${x(t)} ×${c}`)
        .join('');
      return `<li${n.local ? '' : ' data-far'}><span data-glyph aria-hidden="true">${n.local ? '◆' : '◇'}</span><span data-type>${x(
        typeLabel(n),
      )}</span>${n.name ? `<span data-name>${x(n.name)}</span>` : ''}<span data-id>${x(shortId(n.id))}${
        n.local || !far ? '' : ` · ${x(far)}`
      }${sats}</span></li>`;
    })
    .join('')}</ul>`;
}

/** A signature of the graph, for "changed since build". */
export const ldSig = (ld: Measure['ld']): string =>
  ld.nodes.map((n) => `${n.id}:${n.types.join('+')}`).sort().join('|') + `#${ld.edges.length}`;

export type { Heading, LdEdge, LdNode, Measure };
