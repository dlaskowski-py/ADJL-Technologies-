/**
 * A streaming tag tokenizer for the HTML this site's own build emits.
 *
 * Every reader of "the words on the page" goes through this file: the voice
 * and claims guards, the markdown twins and llms-full.txt, the Machine View
 * readout (at build and live), the hero graph and the parity meter. They
 * used to each carry a regex of their own, and they disagreed. A regex
 * can't match nested elements of the same name, so `<div aria-hidden>`
 * holding another `<div>` ended at the inner close tag and leaked the rest
 * of the decoration into the prose count. Here a depth stack tracks every
 * element, so "this subtree" means the same thing to all of them.
 *
 * It isn't a general HTML parser and doesn't try to be. It handles what our
 * renderers produce, plus the cases that break naive regexes:
 *
 *   - quoted attribute values that contain `>` or the other quote
 *   - void elements (`<br>`, `<img>`, `<meta>`) and `/>` self-closing tags
 *   - raw-text elements (`script`, `style`) whose content is never tags,
 *     and RCDATA (`title`, `textarea`) whose content is text with entities
 *   - comments, doctype and CDATA
 *   - a close tag with no matching open (ignored) and an open tag left
 *     unclosed (closed implicitly when its parent closes)
 *
 * What it doesn't do is the HTML5 "implied end tag" dance (`<p>` closing
 * when a `<div>` opens, `<li>` closing the previous `<li>`). Every renderer
 * here closes what it opens, and guessing would be worse than being exact.
 *
 * Pure: no DOM, no Node APIs. It runs in the build and in the browser.
 */

export type Attrs = Record<string, string>;

/** Elements with no content and no close tag. */
export const VOID: ReadonlySet<string> = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta',
  'param', 'source', 'track', 'wbr',
]);

/** Content is raw text, not markup, and entities aren't decoded. */
const RAW_TEXT: ReadonlySet<string> = new Set(['script', 'style']);
/** Content is text (no tags), but entities are decoded. */
const RCDATA: ReadonlySet<string> = new Set(['title', 'textarea']);

export type Token =
  | { kind: 'open'; name: string; attrs: Attrs; selfClosing: boolean; start: number; end: number }
  | { kind: 'close'; name: string; start: number; end: number }
  | { kind: 'text'; start: number; end: number; raw: boolean; rcdata: boolean }
  | { kind: 'comment'; start: number; end: number };

/* ── Entities ──────────────────────────────────────────────────────── */

const ENT: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', sbquo: '‚', bdquo: '„',
  mdash: '—', ndash: '–', hellip: '…', middot: '·', bull: '•', minus: '−',
  rarr: '→', larr: '←', uarr: '↑', darr: '↓', harr: '↔', rArr: '⇒',
  times: '×', divide: '÷', plusmn: '±', le: '≤', ge: '≥', ne: '≠', asymp: '≈',
  deg: '°', prime: '′', Prime: '″', para: '¶', sect: '§', laquo: '«', raquo: '»',
  copy: '©', reg: '®', trade: '™', euro: '€', pound: '£', cent: '¢', yen: '¥',
  frac12: '½', frac14: '¼', frac34: '¾', thinsp: ' ', ensp: ' ',
  emsp: ' ', zwj: '‍', zwnj: '‌', shy: '­', check: '✓',
  cross: '✗', lowast: '∗', sup2: '²', sup3: '³', micro: 'µ',
};

/** Decode named and numeric character references. Unknown names stay as
 *  written, the way a browser shows an ampersand it doesn't recognize. */
export function decodeEntities(s: string): string {
  if (s.indexOf('&') < 0) return s;
  return s.replace(/&(#[xX][0-9a-fA-F]+|#\d+|[a-zA-Z][a-zA-Z0-9]*);/g, (m, e: string) => {
    if (e[0] === '#') {
      const n = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(n) && n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : m;
    }
    return ENT[e] ?? ENT[e.toLowerCase()] ?? m;
  });
}

/* ── Tokens ────────────────────────────────────────────────────────── */

const isNameStart = (c: number) => (c >= 65 && c <= 90) || (c >= 97 && c <= 122);
const isSpace = (c: number) => c === 32 || c === 9 || c === 10 || c === 12 || c === 13;

/** Parse one open tag starting at `<` (html[i] === '<'). Returns null when
 *  it isn't a tag after all, so the `<` is text. */
function openTag(html: string, i: number): Extract<Token, { kind: 'open' }> | null {
  let j = i + 1;
  const n = html.length;
  const nameStart = j;
  while (j < n && !isSpace(html.charCodeAt(j)) && html[j] !== '>' && html[j] !== '/') j++;
  const name = html.slice(nameStart, j).toLowerCase();
  if (!name) return null;
  const attrs: Attrs = {};
  let selfClosing = false;
  while (j < n) {
    while (j < n && isSpace(html.charCodeAt(j))) j++;
    if (j >= n) break;
    const c = html[j];
    if (c === '>') return { kind: 'open', name, attrs, selfClosing, start: i, end: j + 1 };
    if (c === '/') {
      if (html[j + 1] === '>') {
        selfClosing = true;
        return { kind: 'open', name, attrs, selfClosing, start: i, end: j + 2 };
      }
      j++;
      continue;
    }
    // Attribute name.
    const an = j;
    while (j < n && !isSpace(html.charCodeAt(j)) && html[j] !== '=' && html[j] !== '>' && !(html[j] === '/' && html[j + 1] === '>')) j++;
    const attrName = html.slice(an, j).toLowerCase();
    while (j < n && isSpace(html.charCodeAt(j))) j++;
    let value = '';
    if (html[j] === '=') {
      j++;
      while (j < n && isSpace(html.charCodeAt(j))) j++;
      const q = html[j];
      if (q === '"' || q === "'") {
        const close = html.indexOf(q, j + 1);
        const stop = close < 0 ? n : close;
        value = html.slice(j + 1, stop);
        j = stop + 1;
      } else {
        const vs = j;
        while (j < n && !isSpace(html.charCodeAt(j)) && html[j] !== '>') j++;
        value = html.slice(vs, j);
      }
    }
    if (attrName && !(attrName in attrs)) attrs[attrName] = decodeEntities(value);
  }
  return { kind: 'open', name, attrs, selfClosing, start: i, end: n };
}

/** Every token in document order. Text tokens carry offsets only; decode
 *  with `decodeEntities(html.slice(t.start, t.end))` unless `raw`. */
export function* tokens(html: string): Generator<Token> {
  const n = html.length;
  let i = 0;
  let text = 0; // start of the pending text run

  const flush = function* (upTo: number): Generator<Token> {
    if (upTo > text) yield { kind: 'text', start: text, end: upTo, raw: false, rcdata: false };
  };

  while (i < n) {
    const lt = html.indexOf('<', i);
    if (lt < 0) break;
    const c = html.charCodeAt(lt + 1);

    // Comment, doctype, CDATA, processing instruction.
    if (html.startsWith('<!--', lt)) {
      yield* flush(lt);
      const close = html.indexOf('-->', lt + 4);
      const end = close < 0 ? n : close + 3;
      yield { kind: 'comment', start: lt, end };
      i = text = end;
      continue;
    }
    if (html.startsWith('<![CDATA[', lt)) {
      yield* flush(lt);
      const close = html.indexOf(']]>', lt + 9);
      const stop = close < 0 ? n : close;
      yield { kind: 'text', start: lt + 9, end: stop, raw: true, rcdata: false };
      i = text = close < 0 ? n : close + 3;
      continue;
    }
    if (c === 33 /* ! */ || c === 63 /* ? */) {
      yield* flush(lt);
      const close = html.indexOf('>', lt);
      const end = close < 0 ? n : close + 1;
      yield { kind: 'comment', start: lt, end };
      i = text = end;
      continue;
    }

    // Close tag.
    if (c === 47 /* / */ && isNameStart(html.charCodeAt(lt + 2))) {
      yield* flush(lt);
      const close = html.indexOf('>', lt);
      const end = close < 0 ? n : close + 1;
      const name = html.slice(lt + 2, close < 0 ? n : close).trim().split(/\s/)[0].toLowerCase();
      yield { kind: 'close', name, start: lt, end };
      i = text = end;
      continue;
    }

    // Open tag.
    if (isNameStart(c)) {
      const tag = openTag(html, lt);
      if (!tag) {
        i = lt + 1;
        continue;
      }
      yield* flush(lt);
      yield tag;
      i = text = tag.end;

      // Raw text and RCDATA: everything up to the matching close is text.
      if (!tag.selfClosing && (RAW_TEXT.has(tag.name) || RCDATA.has(tag.name))) {
        const re = new RegExp(`</${tag.name}(?=[\\s/>])`, 'gi');
        re.lastIndex = i;
        const m = re.exec(html);
        const stop = m ? m.index : n;
        if (stop > i) {
          yield { kind: 'text', start: i, end: stop, raw: RAW_TEXT.has(tag.name), rcdata: RCDATA.has(tag.name) };
        }
        if (m) {
          const close = html.indexOf('>', stop);
          const end = close < 0 ? n : close + 1;
          yield { kind: 'close', name: tag.name, start: stop, end };
          i = text = end;
        } else {
          i = text = n;
        }
      }
      continue;
    }

    // A lone '<' is just text.
    i = lt + 1;
  }
  yield* flush(n);
}

/* ── Tree walk ─────────────────────────────────────────────────────── */

export interface El {
  name: string;
  attrs: Attrs;
  /** Offset of the `<` of the open tag. */
  start: number;
  /** Offset just past the open tag's `>`. */
  openEnd: number;
  /** Offset just past the close tag (or the open tag, for a void element).
   *  -1 until the element closes. */
  end: number;
  parent: El | null;
  depth: number;
  /** This element, or an ancestor, matched the walk's `skip` predicate. */
  excluded: boolean;
}

export interface TextInfo {
  /** The element the text sits directly inside (null at the top level). */
  parent: El | null;
  /** Inside an excluded subtree. */
  excluded: boolean;
  /** Raw text of a script or style element: not decoded, not prose. */
  raw: boolean;
  start: number;
  end: number;
}

export interface Visitor {
  open?(el: El, stack: readonly El[]): void;
  close?(el: El, stack: readonly El[]): void;
  /** Decoded text (raw for script/style content). */
  text?(text: string, info: TextInfo): void;
}

export interface WalkOptions {
  /** Return true to mark this element's whole subtree excluded. The walk
   *  still visits it (so a caller can count what it drops); every El and
   *  text inside carries `excluded: true`. */
  skip?: (el: El) => boolean;
}

/** Walk the document as a tree. Unclosed elements close when an ancestor
 *  closes or the input ends; stray close tags are ignored. */
export function walk(html: string, visitor: Visitor, opts: WalkOptions = {}): void {
  const stack: El[] = [];
  const top = () => stack[stack.length - 1] ?? null;

  const closeTo = (index: number, at: number) => {
    while (stack.length > index) {
      const el = stack.pop()!;
      if (el.end < 0) el.end = at;
      visitor.close?.(el, stack);
    }
  };

  for (const t of tokens(html)) {
    if (t.kind === 'open') {
      const parent = top();
      const el: El = {
        name: t.name,
        attrs: t.attrs,
        start: t.start,
        openEnd: t.end,
        end: -1,
        parent,
        depth: stack.length,
        excluded: false,
      };
      el.excluded = (parent?.excluded ?? false) || (opts.skip ? opts.skip(el) : false);
      stack.push(el);
      visitor.open?.(el, stack);
      if (t.selfClosing || VOID.has(t.name)) {
        stack.pop();
        el.end = t.end;
        visitor.close?.(el, stack);
      }
    } else if (t.kind === 'close') {
      if (VOID.has(t.name)) continue; // `</br>` and friends: nothing to close
      for (let k = stack.length - 1; k >= 0; k--) {
        if (stack[k].name === t.name) {
          stack[k].end = t.end;
          closeTo(k, t.start);
          break;
        }
      }
    } else if (t.kind === 'text') {
      if (!visitor.text) continue;
      const parent = top();
      const slice = html.slice(t.start, t.end);
      visitor.text(t.raw ? slice : decodeEntities(slice), {
        parent,
        excluded: parent?.excluded ?? false,
        raw: t.raw,
        start: t.start,
        end: t.end,
      });
    }
  }
  closeTo(0, html.length);
}

/** Every element, flattened, with its offsets resolved. Handy for "find
 *  the elements matching X and look at their subtree" without a visitor. */
export function elements(html: string, opts: WalkOptions = {}): El[] {
  const out: El[] = [];
  walk(html, { open: (el) => void out.push(el) }, opts);
  return out;
}

/** The class list of an element, split. */
export const classes = (el: { attrs: Attrs }): string[] =>
  (el.attrs.class ?? '').split(/\s+/).filter(Boolean);

/** Is `el` inside (or equal to) an element matching `test`? */
export function within(el: El | null, test: (e: El) => boolean): El | null {
  for (let e = el; e; e = e.parent) if (test(e)) return e;
  return null;
}
