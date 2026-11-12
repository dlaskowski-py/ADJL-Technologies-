/**
 * The Node door to the site's one way of reading text.
 *
 * Guards and generators import from here instead of carrying a regex each.
 * Everything below comes from src/lib/tokenize.ts and src/lib/exclude.ts,
 * the same files the browser runs, so a guard and the Machine View on the
 * page can't disagree about which words a page has.
 *
 *   proseText(html)     check-voice's reading: the exclusion set plus code
 *                       panes (pre, code, samp, kbd). The <title> counts.
 *   readableText(html)  check-claims's reading: EVERYTHING a visitor could
 *                       read, chrome and decoration included, plus spoken
 *                       attributes and the string values of every JSON
 *                       script. A demo that types "8.4% yield" into a
 *                       console makes that claim even though the words live
 *                       in a <script>.
 *
 * The reading switch (BUILD2): a page may carry the same words twice, side
 * by side, marked data-for="plain" and data-for="technical", and base CSS
 * shows the one the reader chose. A machine reads ONE version, the
 * technical one, so nothing is said twice. Every reading here except
 * readableText drops [data-for="plain"] subtrees: isExcluded() (the
 * markdown twins, and any reader that takes its predicate from here) and
 * splitText / textOf / wordsOf (check-voice). The
 * dropped words aren't counted as excluded either: they're a second copy
 * of words the technical version already counts, not chrome. check-claims
 * and check-usage still read both versions, every word.
 *
 * A {k} term's inline definition (src/sections/html.ts rich()) is both
 * data-for="plain" and data-chrome, so the shared exclusion set already
 * drops it everywhere, the browser's readers included.
 */
import { loadTs } from './lib/ts.mjs';

const tokenize = await loadTs('src/lib/tokenize.ts');
const exclude = await loadTs('src/lib/exclude.ts');

export const { walk, tokens, elements, decodeEntities, classes, within, VOID } = tokenize;
export const {
  countWords,
  jsonScripts,
  jsonStrings,
  ldNodes,
  typesOf,
  SKIP_TAGS,
  SKIP_ATTRS,
  VOICE_SKIP_TAGS,
  INLINE,
} = exclude;

/** The plain alternative of a pair: its words are read in the technical one. */
export const isPlainAlternative = (attrs) =>
  (typeof attrs?.getAttribute === 'function' ? attrs.getAttribute('data-for') : attrs?.['data-for']) === 'plain';

/** THE predicate (src/lib/exclude.ts), plus the plain alternatives. */
export const isExcluded = (tag, attrs, opts) => isPlainAlternative(attrs) || exclude.isExcluded(tag, attrs, opts);
export const exclusionReason = (tag, attrs, opts) =>
  isPlainAlternative(attrs) ? 'data-for="plain"' : exclude.exclusionReason(tag, attrs, opts);

/** The page with every [data-for="plain"] subtree cut out: what a machine
 *  reads. Pages without the switch's markup come back untouched. */
export function technicalOnly(html) {
  if (!/\sdata-for=["']?plain/.test(html)) return html;
  const cuts = [];
  walk(
    html,
    {
      close(el) {
        if (el.excluded && !el.parent?.excluded) cuts.push([el.start, el.end]);
      },
    },
    { skip: (el) => isPlainAlternative(el.attrs) },
  );
  let out = '';
  let at = 0;
  for (const [a, b] of cuts) {
    out += html.slice(at, a);
    at = b;
  }
  return out + html.slice(at);
}

export const splitText = (html, opts) => exclude.splitText(technicalOnly(html), opts);
export const textOf = (html, opts) => exclude.textOf(technicalOnly(html), opts);
export const wordsOf = (html, opts) => exclude.wordsOf(technicalOnly(html), opts);

/** check-voice's reading of a whole page. */
export const proseText = (html) => textOf(html, { voice: true });

/** Attributes a person reads or hears: a screen reader speaks aria-label,
 *  alt and title, and a search result shows the meta description. */
const SPOKEN = new Set(['aria-label', 'alt', 'title', 'placeholder', 'aria-valuetext']);
const META = new Set(['description', 'og:title', 'og:description', 'twitter:title', 'twitter:description', 'og:image:alt']);

/** Marks the edge of a block in readableText. It isn't whitespace, so a
 *  pattern like /\d+\s+systems/ can't reach from a decorative "04" in one
 *  element to the "Systems" heading in the next, while a phrase inside one
 *  paragraph still matches across its inline tags. */
export const BLOCK = ' \u241e ';

/** Everything a visitor could read, excluded or not. Inline tags (and
 *  spans, which carry inline keywords) join their neighbors with a space;
 *  every other element boundary, attribute value and JSON string is
 *  separated by BLOCK. */
export function readableText(html) {
  const parts = [];
  const edge = (el) => parts.push(el.name === 'span' ? ' ' : INLINE.has(el.name) ? '' : BLOCK);
  walk(html, {
    open(el) {
      edge(el);
      for (const [k, v] of Object.entries(el.attrs)) if (SPOKEN.has(k) && v) parts.push(`${BLOCK}${v}${BLOCK}`);
      if (el.name === 'meta') {
        const key = el.attrs.name ?? el.attrs.property ?? '';
        if (META.has(key) && el.attrs.content) parts.push(`${BLOCK}${el.attrs.content}${BLOCK}`);
      }
    },
    close: edge,
    text(t, info) {
      if (!info.raw) parts.push(t);
    },
  });
  const json = jsonScripts(html).flatMap((s) => (s.ok ? jsonStrings(s.data) : [s.raw]));
  return (parts.join('') + BLOCK + json.join(BLOCK)).replace(/[ \t\n]+/g, ' ');
}
