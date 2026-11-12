/**
 * No authoring marker may survive into the built HTML.
 *
 * Copy is written with {em}…{/em} and {k}…{/k}, and a renderer turns them
 * into markup. A renderer that reaches for esc() instead of em() escapes the
 * braces rather than interpreting them, and the page then ships the marker as
 * literal text — visible in the heading, and read out character by character
 * by a screen reader.
 *
 * That is precisely what happened on /work/, in one of eight renderers, in a
 * file that used em() correctly two functions above and two functions below.
 * It was invisible to every other guard: the markup was well-formed, the link
 * resolved, the class was styled, the words were on the page.
 *
 * It also checks the copy itself, before any renderer touches it: every
 * headline array in every content module carries exactly one {em}, and no
 * headline carries {k}. That's the convention content-types.ts states, and
 * the Compile effect on every h1 depends on there being one emphasis to
 * draw markers around.
 *
 * And the reading switch's promise: Plain, the default, explains every
 * technical term where it appears. So every {k}…{/k} term in every content
 * module needs a plain definition in src/content-glossary.ts, each
 * definition has to fit inside a sentence (at most 12 words, no full stop,
 * no parentheses of its own), and every keyword span in the built pages
 * has to arrive with its definition beside it, which is how a renderer
 * that formats {k} without rich() gets caught.
 */
import { readFileSync } from 'node:fs';
import { PAGES } from './pages.mjs';
import { contentFiles, headlineProblems, loadTs } from './lib/ts.mjs';
import { pass } from './lib/report.mjs';

const MARKERS = /\{\/?(em|k)\}/g;
let bad = 0;

for (const page of PAGES) {
  const html = readFileSync(page.out, 'utf8');
  // Strip script contents: JSON data blocks (the replay data, Source view's
  // content objects) legitimately carry the raw markers.
  const visible = html.replace(/<script[\s\S]*?<\/script>/g, '');

  const hits = [...visible.matchAll(MARKERS)];
  if (!hits.length) continue;

  for (const h of hits.slice(0, 4)) {
    const around = visible.slice(Math.max(0, h.index - 60), h.index + 60).replace(/\s+/g, ' ');
    console.error(`check-markers: ${page.route} ships a literal "${h[0]}" — …${around}…`);
  }
  bad += hits.length;
}

if (bad) {
  console.error(`\ncheck-markers: ${bad} unrendered marker(s). A renderer is using esc() where it needs rich().`);
}

const headlines = await headlineProblems();
for (const h of headlines) console.error(`check-markers: ${h}`);

/* ── The reading switch: every {k} term has a plain definition ─────── */

const { glossary } = await loadTs('src/content-glossary.ts');
const { termKey, definitionOf } = await loadTs('src/sections/html.ts');
const MAX_DEF_WORDS = 12;
const glossaryProblems = [];

/** Every {k} term in every string every content module exports. */
const K = /\{k\}(.+?)\{\/k\}/g;
const terms = new Map(); // key -> { term, where }
for (const file of contentFiles()) {
  let mod;
  try {
    mod = await loadTs(file);
  } catch {
    continue; // headlineProblems() has already reported it
  }
  const seen = new Set();
  const visit = (v, path) => {
    if (typeof v === 'string') {
      for (const m of v.matchAll(K)) {
        const key = termKey(m[1]);
        if (!terms.has(key)) terms.set(key, { term: m[1], where: `${file} ${path}` });
      }
      return;
    }
    if (!v || typeof v !== 'object' || seen.has(v)) return;
    seen.add(v);
    for (const [k, val] of Object.entries(v)) visit(val, `${path}.${k}`);
  };
  for (const [name, value] of Object.entries(mod)) visit(value, name);
}

for (const [key, { term, where }] of terms) {
  if (!definitionOf(term)) {
    glossaryProblems.push(
      `${where} marks {k}${term}{/k}, which has no plain definition. Add '${key}' to src/content-glossary.ts (at most ${MAX_DEF_WORDS} plain words).`,
    );
  }
}

for (const [key, def] of Object.entries(glossary)) {
  const words = def.split(/\s+/).filter(Boolean).length;
  if (key !== termKey(key)) glossaryProblems.push(`content-glossary.ts: the key '${key}' should be written '${termKey(key)}'.`);
  if (!words) glossaryProblems.push(`content-glossary.ts: '${key}' has an empty definition.`);
  if (words > MAX_DEF_WORDS)
    glossaryProblems.push(`content-glossary.ts: '${key}' is defined in ${words} words; keep it to ${MAX_DEF_WORDS}: "${def}"`);
  if (/[{}()]/.test(def) || /[.!?]$/.test(def.trim()))
    glossaryProblems.push(
      `content-glossary.ts: '${key}' has to sit inside parentheses mid-sentence: no markers, no brackets, no closing full stop: "${def}"`,
    );
}

/* The built pages: a keyword span with no definition after it, for a term
   the glossary does define, came from a renderer that formats {k} by hand
   instead of calling rich(). (A term with no entry is reported above.) */
const unescape = (s) => s.replace(/&quot;/g, '"').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&');
let spans = 0;
for (const page of PAGES) {
  const html = readFileSync(page.out, 'utf8').replace(/<script[\s\S]*?<\/script>/g, '');
  for (const m of html.matchAll(/<span class="kwd">([^<]*)<\/span>(<span class="kwd-def" data-for="plain")?/g)) {
    spans++;
    if (!m[2] && definitionOf(unescape(m[1])))
      glossaryProblems.push(`${page.route}: the term "${m[1]}" ships without its plain definition. Render it with rich().`);
  }
}

for (const g of glossaryProblems) console.error(`check-markers: ${g}`);
const unused = Object.keys(glossary).filter((k) => !terms.has(k));
if (unused.length) console.log(`check-markers: note: no {k} term uses these glossary entries any more: ${unused.join(', ')}`);

if (bad || headlines.length || glossaryProblems.length) process.exit(1);
pass(
  'check-markers',
  `${PAGES.length} pages, every {em} and {k} rendered, every headline has exactly one {em}, ${terms.size} technical terms each with a plain definition (${spans} on the pages)`,
);
