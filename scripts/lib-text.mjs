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
 */
import { loadTs } from './lib/ts.mjs';

const tokenize = await loadTs('src/lib/tokenize.ts');
const exclude = await loadTs('src/lib/exclude.ts');

export const { walk, tokens, elements, decodeEntities, classes, within, VOID } = tokenize;
export const {
  isExcluded,
  exclusionReason,
  splitText,
  textOf,
  wordsOf,
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

/** check-voice's reading of a whole page. */
export const proseText = (html) => textOf(html, { voice: true });

/** Attributes a person reads or hears: a screen reader speaks aria-label,
 *  alt and title, and a search result shows the meta description. */
const SPOKEN = new Set(['aria-label', 'alt', 'title', 'placeholder', 'aria-valuetext']);
const META = new Set(['description', 'og:title', 'og:description', 'twitter:title', 'twitter:description', 'og:image:alt']);

/** Everything a visitor could read, excluded or not. */
export function readableText(html) {
  const parts = [];
  walk(html, {
    open(el) {
      if (!INLINE.has(el.name)) parts.push(' ');
      for (const [k, v] of Object.entries(el.attrs)) if (SPOKEN.has(k) && v) parts.push(` ${v} `);
      if (el.name === 'meta') {
        const key = el.attrs.name ?? el.attrs.property ?? '';
        if (META.has(key) && el.attrs.content) parts.push(` ${el.attrs.content} `);
      }
    },
    close(el) {
      if (!INLINE.has(el.name)) parts.push(' ');
    },
    text(t, info) {
      if (!info.raw) parts.push(t);
    },
  });
  const json = jsonScripts(html).flatMap((s) => (s.ok ? jsonStrings(s.data) : [s.raw]));
  return (parts.join('') + ' \n ' + json.join(' \n ')).replace(/[ \t]+/g, ' ');
}
