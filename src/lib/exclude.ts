/**
 * THE exclusion set: which parts of a page are not prose.
 *
 * One predicate, used by every reader of the site's words, so they can't
 * disagree about what "the words on the page" means:
 *
 *   check-voice        register density (plus code panes, below)
 *   gen-llms           the markdown twins and llms-full.txt
 *   measure.ts         Machine View's "words readable without JavaScript"
 *   pagegraph.ts       the hero graph's per-section word counts
 *   machine.ts         the live side of the parity meter (via domText)
 *   verify.mjs         JS-off vs JS-on text parity
 *
 * Skipped TAGS, with their whole subtree:
 *   script   data and code, never prose. JSON-LD is read separately by
 *            jsonScripts() and checked by check-seo and check-claims.
 *   style, svg, template, noscript
 *
 * Skipped SUBTREES, by attribute on any element:
 *   aria-hidden="true"   decoration, by definition not read
 *   data-chrome          instrument chrome: readouts, chips, rails, labels
 *   data-machine         the Machine View panel (it reads the page; it
 *                        isn't the page)
 *   data-ask-pre         the precomputed Ask answers, which quote passages
 *                        that are already counted where they live
 *   data-source-sheet    Source view's sheets
 *
 * check-voice ALSO skips pre, code, samp and kbd: a line of code has no
 * sentence in it. Everywhere else they count, because a reader still reads
 * them.
 *
 * This is a list of NAMED containers, deliberately. It can't become a
 * loophole for copy that fails the voice check, because check-voice prints
 * how many words it dropped and fails when that passes 25% of the site, and
 * check-claims and check-usage still read everything, excluded or not.
 *
 * Pure: no DOM globals. domText() takes anything shaped like a DOM node, so
 * the browser passes a real element and nothing here touches `document`.
 */
import { walk, type Attrs, type El } from './tokenize';

export const SKIP_TAGS: ReadonlySet<string> = new Set(['script', 'style', 'svg', 'template', 'noscript']);
export const VOICE_SKIP_TAGS: ReadonlySet<string> = new Set(['pre', 'code', 'samp', 'kbd']);
export const SKIP_ATTRS: readonly string[] = ['data-chrome', 'data-machine', 'data-ask-pre', 'data-source-sheet'];

export type ExcludeOptions = {
  /** check-voice's stricter set: also drop pre, code, samp, kbd. */
  voice?: boolean;
};

/** Something we can read attributes from: a parsed Attrs record or a DOM
 *  element (anything with getAttribute). */
export type AttrSource = Attrs | { getAttribute(name: string): string | null };

const get = (a: AttrSource, name: string): string | null => {
  if (typeof (a as { getAttribute?: unknown }).getAttribute === 'function') {
    return (a as { getAttribute(name: string): string | null }).getAttribute(name);
  }
  const v = (a as Attrs)[name];
  return v === undefined ? null : v;
};

/** Why an element is excluded, or null when it isn't. The reason is a short
 *  label ("data-chrome", "aria-hidden", "<pre>") for diagnostics. */
export function exclusionReason(tag: string, attrs: AttrSource, opts: ExcludeOptions = {}): string | null {
  const t = tag.toLowerCase();
  if (SKIP_TAGS.has(t)) return `<${t}>`;
  if (opts.voice && VOICE_SKIP_TAGS.has(t)) return `<${t}>`;
  const hidden = get(attrs, 'aria-hidden');
  if (hidden !== null && hidden.trim().toLowerCase() === 'true') return 'aria-hidden';
  for (const a of SKIP_ATTRS) if (get(attrs, a) !== null) return a;
  return null;
}

/** THE predicate. */
export function isExcluded(tag: string, attrs: AttrSource, opts: ExcludeOptions = {}): boolean {
  return exclusionReason(tag, attrs, opts) !== null;
}

/** Phrasing elements that don't break a word in two. Every other element
 *  boundary counts as whitespace: the h1's `.hl-line` spans are display:
 *  block, so "SEO,</span><span>built" is two words on screen. Text inside
 *  these stays glued to its neighbors, the way it renders. */
export const INLINE: ReadonlySet<string> = new Set([
  'a', 'abbr', 'b', 'bdi', 'bdo', 'cite', 'code', 'data', 'dfn', 'em', 'i', 'kbd',
  'mark', 'q', 's', 'samp', 'small', 'strong', 'sub', 'sup', 'time', 'u', 'var', 'wbr',
]);

/** Words, counted one way everywhere: whitespace-separated tokens that
 *  carry at least one letter or digit ("·" and "→" aren't words). */
export function countWords(s: string): number {
  let n = 0;
  for (const w of s.split(/\s+/)) if (w && /[\p{L}\p{N}]/u.test(w)) n++;
  return n;
}

const squash = (s: string) => s.replace(/\s+/g, ' ').trim();

export type Scope = 'document' | 'body' | 'main';

export type TextOptions = ExcludeOptions & {
  /** Which part of the document to read. 'document' (the default) is the
   *  title plus the body; 'main' is only what's inside <main>. */
  scope?: Scope;
};

export type TextSplit = {
  /** The prose, whitespace collapsed. */
  text: string;
  /** Text the exclusion set dropped (not counting script/style contents,
   *  which are data and were never words on the page). */
  excludedText: string;
  words: number;
  excludedWords: number;
  /** Excluded words by reason: { 'data-chrome': 412, 'aria-hidden': 37 }. */
  byReason: Record<string, number>;
};

/** Read a page's words and the words the exclusion set dropped. */
export function splitText(html: string, opts: TextOptions = {}): TextSplit {
  const scope = opts.scope ?? 'document';
  const kept: string[] = [];
  const dropped: Map<string, string[]> = new Map();
  /* The reason recorded on the outermost excluded element applies to its
     whole subtree. */
  const reasonOf = new WeakMap<El, string>();
  const inScope = (el: El | null): boolean => {
    if (scope === 'document') {
      // Head content other than <title> isn't text (meta/link are void,
      // script/style are excluded), so the whole document is fine.
      return true;
    }
    const want = scope;
    for (let e = el; e; e = e.parent) if (e.name === want) return true;
    return false;
  };

  walk(
    html,
    {
      open(el) {
        if (!INLINE.has(el.name)) (el.excluded ? bucket(reasonFor(el)) : kept).push(' ');
      },
      close(el) {
        if (!INLINE.has(el.name)) (el.excluded ? bucket(reasonFor(el)) : kept).push(' ');
      },
      text(t, info) {
        if (info.raw) return; // script/style source: not words
        if (!inScope(info.parent)) return;
        if (!info.excluded) kept.push(t);
        else bucket(reasonFor(info.parent)).push(t);
      },
    },
    {
      skip(el) {
        if (el.parent?.excluded) return true;
        const r = exclusionReason(el.name, el.attrs, opts);
        if (r) reasonOf.set(el, r);
        return r !== null;
      },
    },
  );

  /** Only the outermost excluded element records a reason, and it covers
   *  its whole subtree. */
  function reasonFor(el: El | null): string {
    for (let e = el; e; e = e.parent) {
      const r = reasonOf.get(e);
      if (r) return r;
    }
    return '';
  }

  function bucket(reason: string): string[] {
    let b = dropped.get(reason);
    if (!b) dropped.set(reason, (b = []));
    return b;
  }

  const text = squash(kept.join(''));
  const byReason: Record<string, number> = {};
  const all: string[] = [];
  for (const [reason, parts] of dropped) {
    const s = squash(parts.join(''));
    if (!s) continue;
    const n = countWords(s);
    if (n) byReason[reason || 'excluded'] = n;
    all.push(s);
  }
  const excludedText = all.join(' ');
  return {
    text,
    excludedText,
    words: countWords(text),
    excludedWords: Object.values(byReason).reduce((a, b) => a + b, 0),
    byReason,
  };
}

/** The prose of a page (or of its <main>) as one whitespace-collapsed
 *  string, with the exclusion set applied. */
export function textOf(html: string, opts: TextOptions = {}): string {
  return splitText(html, opts).text;
}

/** Words of prose, with the exclusion set applied. */
export function wordsOf(html: string, opts: TextOptions = {}): number {
  return splitText(html, opts).words;
}

/* ── The same reading over a live DOM ──────────────────────────────── */

/** The parts of a DOM node domText needs. A real Node satisfies it; so does
 *  a test double. No DOM global is referenced, so this file still runs in
 *  Node. */
export interface NodeLike {
  nodeType: number;
  nodeName: string;
  nodeValue: string | null;
  childNodes: ArrayLike<NodeLike>;
  getAttribute?(name: string): string | null;
}

/** Text of a live subtree, read exactly the way textOf reads HTML: same
 *  exclusion set, same word boundaries. Use it for the JS-on side of every
 *  "readable without JavaScript" comparison. `textContent` and `innerText`
 *  both disagree with the HTML reading (one glues block boundaries, the
 *  other follows CSS visibility), so neither is used. */
export function domText(root: NodeLike, opts: ExcludeOptions = {}): string {
  const out: string[] = [];
  const visit = (n: NodeLike) => {
    if (n.nodeType === 3) {
      out.push(n.nodeValue ?? '');
      return;
    }
    if (n.nodeType !== 1 && n.nodeType !== 11 && n.nodeType !== 9) return;
    if (n.nodeType === 1) {
      const name = n.nodeName.toLowerCase();
      if (n.getAttribute && isExcluded(name, n as AttrSource, opts)) return;
      const block = !INLINE.has(name);
      if (block) out.push(' ');
      for (let i = 0; i < n.childNodes.length; i++) visit(n.childNodes[i]);
      if (block) out.push(' ');
      return;
    }
    for (let i = 0; i < n.childNodes.length; i++) visit(n.childNodes[i]);
  };
  visit(root);
  return squash(out.join(''));
}

/* ── JSON in script tags ───────────────────────────────────────────── */

export type JsonScript = { attrs: Attrs; raw: string; data: unknown; ok: boolean };

/** Every `<script type="…">` of the given type (default: both JSON
 *  types), parsed. `ok` is false when the content doesn't parse. */
export function jsonScripts(
  html: string,
  types: readonly string[] = ['application/ld+json', 'application/json'],
): JsonScript[] {
  const out: JsonScript[] = [];
  let current: Attrs | null = null;
  walk(html, {
    open(el) {
      if (el.name === 'script') {
        const type = (el.attrs.type ?? '').trim().toLowerCase();
        current = types.includes(type) ? el.attrs : null;
        if (current) out.push({ attrs: current, raw: '', data: undefined, ok: false });
      }
    },
    text(t, info) {
      if (current && info.raw && info.parent?.name === 'script') out[out.length - 1].raw += t;
    },
    close(el) {
      if (el.name === 'script') current = null;
    },
  });
  for (const s of out) {
    try {
      s.data = JSON.parse(s.raw);
      s.ok = true;
    } catch {
      s.ok = false;
    }
  }
  return out;
}

/** Every string value inside a parsed JSON value, depth first. Keys are
 *  left out: they're field names, not copy. */
export function jsonStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) for (const v of value) jsonStrings(v, out);
  else if (value && typeof value === 'object') for (const v of Object.values(value)) jsonStrings(v, out);
  return out;
}

/** The JSON-LD nodes of a page: every block's @graph (or the block itself),
 *  flattened. Unparseable blocks contribute nothing; check-seo reports them. */
export function ldNodes(html: string): Record<string, unknown>[] {
  const nodes: Record<string, unknown>[] = [];
  for (const s of jsonScripts(html, ['application/ld+json'])) {
    if (!s.ok || !s.data || typeof s.data !== 'object') continue;
    const d = s.data as Record<string, unknown>;
    const graph = Array.isArray(d['@graph']) ? (d['@graph'] as Record<string, unknown>[]) : [d];
    nodes.push(...graph);
  }
  return nodes;
}

/** A node's @type as a list (it may be a string or an array). */
export const typesOf = (n: Record<string, unknown>): string[] => {
  const t = n['@type'];
  return Array.isArray(t) ? (t as string[]) : typeof t === 'string' ? [t] : [];
};
