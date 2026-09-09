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
 */
import { readFileSync } from 'node:fs';
import { PAGES } from './pages.mjs';

const MARKERS = /\{\/?(em|k)\}/g;
let bad = 0;

for (const page of PAGES) {
  const html = readFileSync(page.out, 'utf8');
  // Strip the JSON transcript: the console demo's script is data, and its
  // lines legitimately pass through unrendered.
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
  console.error(`\ncheck-markers: ${bad} unrendered marker(s). A renderer is using esc() where it needs em() or kw().`);
  process.exit(1);
}
console.log(`check-markers: ${PAGES.length} pages, every {em} and {k} was rendered`);
