/**
 * What a crawler is handed: one pure function over an HTML STRING.
 *
 * It runs in three places and has to agree with itself in all of them:
 *
 *   BUILD    scripts/prerender.mjs (and again scripts/stamp-sizes.mjs, on
 *            the page exactly as it ships) measures each page and the
 *            Machine View readout ships prerendered with those values, so
 *            the panel is true with scripting off.
 *   LIVE     src/motion/machine.ts re-fetches the page with no script run
 *            and the cache bypassed, and measures the bytes the server sent.
 *   DRAWER   Machine view's drawer measures the live document the same way.
 *
 * So it can't use DOMParser or any other browser API. It reads the page
 * through the site's one tokenizer (lib/tokenize.ts) and counts words with
 * the site's one exclusion predicate (lib/exclude.ts), the same reading
 * check-voice, gen-llms and the hero graph use. That's what makes "words
 * readable without JavaScript: N of M" a like-for-like comparison: N is
 * this function over the raw HTML, M is `domWords()` over the live <main>,
 * and both drop exactly the same subtrees.
 *
 * The readout panels carry `data-machine`, which is in the exclusion set,
 * and the structure reading below skips them too: a page never counts its
 * own readout.
 */
import { walk, type El } from './tokenize';
import {
  countWords as countWordsIn,
  domText,
  INLINE,
  jsonScripts,
  typesOf,
  wordsOf,
  type NodeLike,
} from './exclude';

export type Heading = {
  level: number;
  text: string;
  /** The id of the nearest element that has one (the heading's section). */
  id: string;
};

/** A JSON-LD entity: anything carrying both @id and @type, at any depth,
 *  plus every @id the page refers to but defines elsewhere (local: false). */
export type LdNode = {
  id: string;
  types: string[];
  name: string;
  local: boolean;
  /** Typed objects nested in this node with no @id: { Question: 9 }. */
  inline: Record<string, number>;
};

export type LdEdge = { from: string; to: string; prop: string };

export type Measure = {
  /** UTF-8 bytes of the HTML string as measured. */
  bytes: number;
  title: string;
  description: string;
  canonical: string;
  /** The robots meta as written; '' when the page has none (which means
   *  "index, follow" by default). */
  robots: string;
  lang: string;
  ogImage: string;
  /** The markdown twin: <link rel="alternate" type="text/markdown">. */
  twin: string;
  h1: number;
  /** h1–h6 in <main>, in document order. The outline shows h1–h3. */
  headings: Heading[];
  /** Words of prose in <main>, with the exclusion set applied. */
  words: number;
  links: { internal: number; external: number; mailto: number; targets: number };
  images: { total: number; missingAlt: number };
  jsonLdTypes: string[];
  jsonLdBlocks: number;
  jsonLdValid: boolean;
  ld: { nodes: LdNode[]; edges: LdEdge[] };
};

/** Subtrees the structure reading skips: what isn't markup a crawler acts
 *  on (script, style, svg, template, noscript), and the instrument panels
 *  that read the page rather than being it. */
const SKIP_TAGS = new Set(['script', 'style', 'svg', 'template', 'noscript']);
const SKIP_ATTRS = ['data-machine', 'data-drawer', 'data-source-sheet'];
const skip = (el: El): boolean => SKIP_TAGS.has(el.name) || SKIP_ATTRS.some((a) => a in el.attrs);

const squash = (s: string) => s.replace(/\s+/g, ' ').trim();

/** Text inside a heading that no reader gets: under aria-hidden or
 *  instrument chrome (an effect's overlay, a label). The heading's text is
 *  what's left, as a screen reader or a crawler's text model has it. */
const unread = (from: El | null, heading: El): boolean => {
  for (let e = from; e; e = e.parent) {
    if (e.attrs['aria-hidden'] === 'true' || 'data-chrome' in e.attrs) return true;
    if (e === heading) break;
  }
  return false;
};

/** Words, counted one way everywhere (re-exported for callers that only
 *  have a string). */
export function countWords(s: string): number {
  return countWordsIn(s);
}

/** Words in a live DOM subtree, read exactly the way measureHtml reads the
 *  raw HTML: same exclusion set, same word boundaries. */
export function domWords(root: NodeLike): number {
  return countWordsIn(domText(root));
}

/** Path of an internal href, without query or fragment ('' if external). */
function internalPath(href: string, origin: string, here: string): string | null {
  if (/^(mailto|tel|javascript|data):/i.test(href)) return null;
  if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('//')) {
    if (!origin) return null;
    const o = origin.replace(/\/$/, '');
    if (!(href === o || href.startsWith(o + '/') || href.startsWith(o + '#'))) return null;
    href = href.slice(o.length) || '/';
  }
  const path = href.split(/[?#]/)[0];
  return path || here;
}

export function measureHtml(html: string, origin = ''): Measure {
  let title = '';
  let lang = '';
  const metas: Record<string, string> = {};
  let canonical = '';
  let twin = '';
  let h1 = 0;
  const headings: Heading[] = [];
  const links = { internal: 0, external: 0, mailto: 0, targets: 0 };
  const targets = new Set<string>();
  const images = { total: 0, missingAlt: 0 };

  /* Heading text is gathered while the heading is open. Block boundaries
     inside it are spaces, inline ones glue (exclude.ts's INLINE). */
  let open: { el: El; parts: string[] } | null = null;
  let inTitle = false;
  let mainDepth = 0;
  const pending: { href: string }[] = [];

  walk(
    html,
    {
      open(el) {
        if (el.excluded) return;
        const a = el.attrs;
        switch (el.name) {
          case 'html':
            lang = a.lang ?? '';
            break;
          case 'title':
            inTitle = true;
            break;
          case 'meta': {
            const key = (a.name ?? a.property ?? '').toLowerCase();
            if (key && !(key in metas)) metas[key] = a.content ?? '';
            break;
          }
          case 'link': {
            const rel = (a.rel ?? '').toLowerCase().split(/\s+/);
            if (rel.includes('canonical') && !canonical) canonical = a.href ?? '';
            if (rel.includes('alternate') && (a.type ?? '').toLowerCase() === 'text/markdown' && !twin)
              twin = a.href ?? '';
            break;
          }
          case 'main':
            mainDepth++;
            break;
          case 'a':
            if (a.href !== undefined) pending.push({ href: a.href });
            break;
          case 'img':
            images.total++;
            if (a.alt === undefined) images.missingAlt++;
            break;
        }
        if (/^h[1-6]$/.test(el.name)) {
          if (el.name === 'h1') h1++;
          if (mainDepth > 0 && !open) open = { el, parts: [] };
        } else if (open && !INLINE.has(el.name)) open.parts.push(' ');
      },
      close(el) {
        if (el.excluded) return;
        if (el.name === 'title') inTitle = false;
        else if (el.name === 'main') mainDepth = Math.max(0, mainDepth - 1);
        if (open && el === open.el) {
          let id = '';
          for (let e: El | null = el; e; e = e.parent) {
            if (e.attrs.id) {
              id = e.attrs.id;
              break;
            }
          }
          headings.push({ level: Number(el.name[1]), text: squash(open.parts.join('')), id });
          open = null;
        } else if (open && !INLINE.has(el.name)) open.parts.push(' ');
      },
      text(t, info) {
        if (info.excluded || info.raw) return;
        if (inTitle) title += t;
        if (open && !unread(info.parent, open.el)) open.parts.push(t);
      },
    },
    { skip },
  );

  /* Links, now the page's own path is known (a bare "#faq" targets this
     page). Mailto and other origins counted apart. "Internal" means the
     page's own canonical origin or the origin it was fetched from, so a
     preview server and production count the same links the same way. */
  const home = /^https?:\/\/[^/]+/i.exec(canonical)?.[0] ?? '';
  const here = internalPath(canonical || '/', home || origin, '/') ?? '/';
  for (const { href } of pending) {
    if (!href) continue;
    if (/^mailto:/i.test(href)) {
      links.mailto++;
      continue;
    }
    const p = internalPath(href, origin, here) ?? (home && home !== origin ? internalPath(href, home, here) : null);
    if (p === null) links.external++;
    else {
      links.internal++;
      targets.add(p);
    }
  }
  links.targets = targets.size;

  const blocks = jsonScripts(html, ['application/ld+json']);
  const ld = ldGraph(blocks.filter((b) => b.ok).map((b) => b.data));
  const jsonLdTypes: string[] = [];
  for (const b of blocks) {
    if (!b.ok || !b.data || typeof b.data !== 'object') continue;
    const d = b.data as Record<string, unknown>;
    const top = Array.isArray(d['@graph']) ? (d['@graph'] as Record<string, unknown>[]) : [d];
    for (const n of top) jsonLdTypes.push(...typesOf(n));
  }

  return {
    bytes: new TextEncoder().encode(html).length,
    title: squash(title),
    description: metas.description ?? '',
    canonical,
    robots: metas.robots ?? '',
    lang,
    ogImage: metas['og:image'] ?? '',
    twin,
    h1,
    headings,
    words: wordsOf(html, { scope: 'main' }),
    links,
    images,
    jsonLdTypes,
    jsonLdBlocks: blocks.length,
    jsonLdValid: blocks.length > 0 && blocks.every((b) => b.ok),
    ld,
  };
}

/**
 * The JSON-LD as a graph. A node is any object with both @id and @type; an
 * edge is a property whose value is a node or a bare {"@id"} reference. An
 * @id the page refers to without describing (another page's #service) is
 * still a node, marked local: false, because joining pages by stable IDs is
 * the whole point of the IDs.
 */
export function ldGraph(blocks: unknown[]): Measure['ld'] {
  const nodes = new Map<string, LdNode>();
  const edges: LdEdge[] = [];
  const seen = new Set<string>();
  const node = (id: string): LdNode => {
    let n = nodes.get(id);
    if (!n) nodes.set(id, (n = { id, types: [], name: '', local: false, inline: {} }));
    return n;
  };
  const edge = (from: string | null, to: string, prop: string) => {
    if (!from || from === to) return;
    const k = `${from} ${prop} ${to}`;
    if (seen.has(k)) return;
    seen.add(k);
    edges.push({ from, to, prop });
  };

  const visit = (v: unknown, owner: string | null, prop: string): void => {
    if (Array.isArray(v)) {
      for (const x of v) visit(x, owner, prop);
      return;
    }
    if (!v || typeof v !== 'object') return;
    const o = v as Record<string, unknown>;
    const id = typeof o['@id'] === 'string' ? (o['@id'] as string) : '';
    const keys = Object.keys(o);
    if (id && keys.every((k) => k === '@id')) {
      node(id);
      edge(owner, id, prop);
      return;
    }
    const types = typesOf(o);
    let me = owner;
    if (id && types.length) {
      const n = node(id);
      n.local = true;
      if (!n.types.length) n.types = types;
      const nm = o.name ?? o.headline;
      if (!n.name && typeof nm === 'string') n.name = nm;
      edge(owner, id, prop);
      me = id;
    } else if (types.length && owner) {
      const n = node(owner);
      n.inline[types[0]] = (n.inline[types[0]] ?? 0) + 1;
    }
    for (const k of keys) if (k[0] !== '@') visit(o[k], me, k);
  };

  for (const b of blocks) {
    if (!b || typeof b !== 'object') continue;
    const d = b as Record<string, unknown>;
    visit(Array.isArray(d['@graph']) ? d['@graph'] : d, null, '');
  }
  return { nodes: [...nodes.values()], edges };
}
