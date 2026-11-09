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
 */
import { readFileSync } from 'node:fs';
import { PAGES } from './pages.mjs';
import { headlineProblems } from './lib/ts.mjs';
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

if (bad || headlines.length) process.exit(1);
pass('check-markers', `${PAGES.length} pages, every {em} and {k} rendered, every headline has exactly one {em}`);
