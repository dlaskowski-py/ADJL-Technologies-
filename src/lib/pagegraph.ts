/**
 * pageGraph(html, route): the page's own structure, as a tree.
 *
 * The hero figure on every page is this graph. At build it's drawn as the
 * poster (lib/poster.ts); on the full tier the browser parses the page it
 * actually received (src/pristine.ts) and draws it again live
 * (motion/lattice.ts). One function does both, so the drawing can't
 * describe a page that isn't the one you're on.
 *
 *   root ─┬─ head ── title · description · canonical · og:image ·
 *         │          ld+json ── each @graph node, and every FAQ Question
 *         └─ body ── landmarks (header, nav, main, section[id], aside,
 *                    footer) ── h1–h3 ── a[href] (internal and mailto)
 *
 * Plus cross edges: each link to the route it targets (one node per unique
 * target, drawn on the link plane's rim), each `data-ld` pin from an
 * element to the JSON-LD node it names, and @id references between ld
 * nodes. Each section records its word count, with THE exclusion set
 * (lib/exclude.ts) applied, so decoration and instrument chrome never
 * count as something a person reads.
 *
 * Pure: no DOM, no Node APIs. Deterministic: the same HTML always gives the
 * same graph, in document order.
 */
import { walk, type El } from './tokenize';
import { countWords, INLINE, isExcluded } from './exclude';

/** What the live figure's click maps back to: the node's `ord` indexes
 *  `querySelectorAll(GRAPH_SELECTOR)` filtered by the exclusion predicate. */
export const GRAPH_SELECTOR = 'header,nav,main,section[id],aside,footer,h1,h2,h3,a[href]';

/** Node kinds. Numbers, because the shader reads them. */
export const K = {
  root: 0, hub: 1, landmark: 2, section: 3, heading: 4, link: 5, route: 6,
  meta: 7, ldjson: 8, ld: 9, question: 10,
} as const;

/** Planes, top to bottom: what people read, what crawlers follow, what
 *  machines parse. A node's plane is also its colour. */
export const P = { read: 0, link: 1, machine: 2 } as const;

/** Edge types. */
export const E = { tree: 0, target: 1, pin: 2, ref: 3 } as const;

export type GNode = {
  i: number;
  /** Tree parent (-1 for the root and for route nodes, which aren't in the tree). */
  p: number;
  k: number;
  plane: number;
  /** Tooltip head: `<h2>`, `section#faq`, `◆ Organization`… */
  tag: string;
  /** Tooltip body, trimmed. */
  text: string;
  /** Section id, href, or @id. */
  ref: string;
  /** Index into the filtered GRAPH_SELECTOR list, or -1. */
  ord: number;
  /** Sections: words of prose inside. */
  words: number;
  /** Children dropped by the cap. */
  more: number;
};

export type GEdge = { a: number; b: number; t: number };

export type Graph = {
  route: string;
  nodes: GNode[];
  edges: GEdge[];
  counts: { headings: number; links: number; entities: number };
  /** Leaves collapsed into a count by the cap. */
  more: number;
};

/** Structure nodes kept before overflow leaves collapse into a count. */
export const CAP = 1600;

const LANDMARK = new Set(['header', 'nav', 'main', 'aside', 'footer']);
const squash = (s: string) => s.replace(/\s+/g, ' ').trim();
const clip = (s: string, n = 64) => {
  const t = squash(s);
  return t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t;
};

type Cap = { id: number; buf: string[]; el: El };

export function pageGraph(html: string, route: string): Graph {
  const nodes: GNode[] = [];
  const edges: GEdge[] = [];
  let more = 0;

  const add = (p: number, k: number, plane: number, tag: string, text = '', ref = '', ord = -1): number => {
    /* p < 0 past the root means the parent itself was capped. */
    if (nodes.length >= CAP || (p < 0 && nodes.length)) {
      if (p >= 0) nodes[p].more++;
      more++;
      return -1;
    }
    const i = nodes.length;
    nodes.push({ i, p, k, plane, tag, text: clip(text), ref, ord, words: 0, more: 0 });
    if (p >= 0) edges.push({ a: p, b: i, t: E.tree });
    return i;
  };

  const root = add(-1, K.root, P.link, 'page', route, route);
  const head = add(root, K.hub, P.machine, '<head>');
  const body = add(root, K.hub, P.read, '<body>');

  let origin = '';
  let ord = 0;
  let inHead = false;
  /* Open containers (landmarks and sections), innermost last, each with the
     last heading seen at each level inside it. */
  const boxes: { el: El; id: number; h: number[]; words: string[] | null }[] = [];
  const caps: Cap[] = [];
  let title: string[] | null = null;
  let ld: string[] | null = null;
  const pins: [number, string][] = [];
  const targets: [number, string][] = [];
  const ldIds = new Map<string, number>();

  const box = () => boxes[boxes.length - 1];
  const gap = () => {
    for (const c of caps) c.buf.push(' ');
    for (const b of boxes) b.words?.push(' ');
  };

  walk(
    html,
    {
      open(el) {
        const n = el.name;
        const a = el.attrs;
        if (n === 'head') inHead = true;
        if (n === 'body') inHead = false;
        if (inHead) {
          if (n === 'title') title = [];
          else if (n === 'meta' && a.name === 'description') add(head, K.meta, P.machine, '<meta description>', a.content ?? '');
          else if (n === 'meta' && a.property === 'og:image') add(head, K.meta, P.machine, '<meta og:image>', a.content ?? '');
          else if (n === 'link' && /\bcanonical\b/.test(a.rel ?? '')) {
            add(head, K.meta, P.machine, '<link canonical>', a.href ?? '');
            origin = /^https?:\/\/[^/]+/.exec(a.href ?? '')?.[0] ?? '';
          } else if (n === 'script' && (a.type ?? '').trim().toLowerCase() === 'application/ld+json') ld = [];
          return;
        }
        if (el.excluded) return;
        if (!INLINE.has(n)) gap();

        const isSec = n === 'section' && !!a.id;
        const isH = n === 'h1' || n === 'h2' || n === 'h3';
        const isA = n === 'a' && 'href' in a;
        if (!(LANDMARK.has(n) || isSec || isH || isA)) return;
        const o = ord++;
        const b = box();
        const parent = b?.id ?? body;

        if (isSec || LANDMARK.has(n)) {
          const label = a['aria-label'] ? ` ${a['aria-label']}` : '';
          const id = isSec
            ? add(parent, K.section, P.read, `section#${a.id}`, '', a.id, o)
            : add(parent, K.landmark, P.read, `<${n}>${label}`, '', a.id ?? '', o);
          boxes.push({ el, id, h: [], words: isSec ? [] : null });
          if (id >= 0 && a['data-ld']) pins.push([id, a['data-ld']]);
        } else if (isH) {
          const lvl = +n[1];
          let p = parent;
          for (let l = lvl - 1; l >= 1; l--) if (b?.h[l] !== undefined && b.h[l] >= 0) { p = b.h[l]; break; }
          const id = add(p, K.heading, P.read, `<${n}>`, '', '', o);
          if (b) {
            b.h[lvl] = id;
            b.h.length = lvl + 1;
          }
          if (id >= 0) caps.push({ id, buf: [], el });
        } else {
          const href = a.href ?? '';
          const key = targetOf(href, route, origin);
          if (!key) return;
          let p = parent;
          if (b) for (let l = b.h.length - 1; l >= 1; l--) if (b.h[l] !== undefined && b.h[l] >= 0) { p = b.h[l]; break; }
          const id = add(p, K.link, P.link, '<a>', '', href, o);
          if (id >= 0) {
            caps.push({ id, buf: [], el });
            targets.push([id, key]);
          }
        }
      },
      text(t, info) {
        if (ld && info.raw && info.parent?.name === 'script') ld.push(t);
        if (info.raw) return;
        if (title && info.parent?.name === 'title') title.push(t);
        if (info.excluded || inHead) return;
        for (const c of caps) c.buf.push(t);
        for (const b of boxes) b.words?.push(t);
      },
      close(el) {
        const n = el.name;
        if (n === 'title' && title) {
          add(head, K.meta, P.machine, '<title>', title.join(''));
          title = null;
        } else if (n === 'script' && ld) {
          ldBlock(ld.join(''));
          ld = null;
        }
        if (inHead || el.excluded) return;
        if (!INLINE.has(n)) gap();
        const c = caps.findIndex((x) => x.el === el);
        if (c >= 0) {
          const cap = caps.splice(c, 1)[0];
          nodes[cap.id].text = clip(cap.buf.join(''));
        }
        const b = box();
        if (b && b.el === el) {
          boxes.pop();
          if (b.words && b.id >= 0) nodes[b.id].words = countWords(b.words.join(''));
        }
      },
    },
    { skip: (el) => isExcluded(el.name, el.attrs) },
  );

  function ldBlock(raw: string): void {
    let data: unknown;
    try {
      data = JSON.parse(raw);
    } catch {
      return;
    }
    const block = add(head, K.ldjson, P.machine, '<script ld+json>', '');
    if (block < 0 || !data || typeof data !== 'object') return;
    const d = data as Record<string, unknown>;
    const graph = (Array.isArray(d['@graph']) ? d['@graph'] : [d]) as Record<string, unknown>[];
    const made: [number, Record<string, unknown>][] = [];
    for (const g of graph) {
      if (!g || typeof g !== 'object') continue;
      const types = ([] as unknown[]).concat(g['@type'] ?? []).map(String);
      const id = String(g['@id'] ?? '');
      const n = add(block, K.ld, P.machine, `◆ ${types.join(' · ') || 'Thing'}`, String(g.name ?? g.headline ?? ''), id);
      if (n < 0) continue;
      if (id) ldIds.set(id, n);
      made.push([n, g]);
      if (types.includes('FAQPage')) {
        for (const q of ([] as unknown[]).concat(g.mainEntity ?? []) as Record<string, unknown>[]) {
          if (q && q['@type'] === 'Question') add(block, K.question, P.machine, '◆ Question', String(q.name ?? ''));
        }
      }
    }
    nodes[block].text = `${made.length} nodes`;
    /* @id references, one level down: WebPage → isPartOf → WebSite. */
    for (const [n, g] of made) {
      const seen = new Set<number>();
      for (const v of Object.values(g)) {
        for (const r of ([] as unknown[]).concat(v)) {
          const to = r && typeof r === 'object' ? ldIds.get(String((r as Record<string, unknown>)['@id'] ?? '')) : undefined;
          if (to !== undefined && to !== n && !seen.has(to)) {
            seen.add(to);
            edges.push({ a: n, b: to, t: E.ref });
          }
        }
      }
    }
  }

  /* One rim node per unique target, in order of first appearance. */
  const routes = new Map<string, number>();
  for (const [id, key] of targets) {
    let r = routes.get(key);
    if (r === undefined) {
      r = nodes.length;
      routes.set(key, r);
      nodes.push({ i: r, p: -1, k: K.route, plane: P.link, tag: '→', text: key === route ? `${key} (this page)` : key, ref: key, ord: -1, words: 0, more: 0 });
    }
    edges.push({ a: id, b: r, t: E.target });
  }

  /* Pins: data-ld="#service" → the ld node whose @id ends with it. */
  for (const [id, frag] of pins) {
    for (const [ldId, n] of ldIds) if (ldId.endsWith(frag)) {
      edges.push({ a: id, b: n, t: E.pin });
      break;
    }
  }

  let headings = 0;
  let links = 0;
  let entities = 0;
  for (const n of nodes) {
    if (n.k === K.heading) headings++;
    else if (n.k === K.link) links++;
    else if (n.k === K.ld || n.k === K.question) entities++;
  }
  return { route, nodes, edges, counts: { headings, links, entities }, more };
}

/** Where a link goes: a route ("/work/"), "mailto:…", or '' for anything
 *  that leaves the site. Fragments resolve to the page they're on. */
function targetOf(href: string, route: string, origin: string): string {
  if (href.startsWith('mailto:')) return href.split('?')[0];
  let h = href;
  if (origin && h.startsWith(origin)) h = h.slice(origin.length) || '/';
  if (h.startsWith('#')) return route;
  if (!h.startsWith('/') || h.startsWith('//')) return '';
  return h.split(/[?#]/)[0] || '/';
}
