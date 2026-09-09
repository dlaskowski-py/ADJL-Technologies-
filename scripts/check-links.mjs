/**
 * Every internal link resolves.
 *
 * Three failure modes, and Capital shipped the third: a href to a page that
 * was never built, a fragment pointing at an id that does not exist on the
 * target page, and — the quiet one — a bare "#section" emitted by a shared
 * footer, which works on the page it was written for and goes nowhere on
 * every other page that later reuses that footer. Root-relative links
 * everywhere is the rule; this is what enforces it.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PAGES } from './pages.mjs';

const ROUTES = new Set(PAGES.map((p) => p.route));
const ids = new Map();

for (const page of PAGES) {
  const html = readFileSync(page.out, 'utf8');
  const set = new Set();
  for (const m of html.matchAll(/\sid="([^"]+)"/g)) set.add(m[1]);
  ids.set(page.route, set);
}

/* Static files an anchor may legitimately point at. Short by design: if a
   link here is not a page, it should be a deliberate exception. */
const assets = new Set(['/sitemap.xml', '/robots.txt', '/favicon.svg']);

let bad = 0;

for (const page of PAGES) {
  const html = readFileSync(page.out, 'utf8');
  /* ANCHORS ONLY. A bare /href="..."/ also matches the stylesheet, the
     preloaded font, the canonical and every module script — all of which
     are resources rather than navigation, and none of which will ever be a
     "built page". */
  for (const m of html.matchAll(/<a\s[^>]*?href="([^"]+)"/g)) {
    const href = m[1];
    if (/^(https?:|mailto:|tel:)/.test(href)) continue;

    if (href.startsWith('#')) {
      // Legitimate only when the target is on this very page. The skip link
      // and the wordmark's back-to-top are the intended cases.
      if (!ids.get(page.route).has(href.slice(1))) {
        console.error(`check-links: ${page.route} → ${href} (no such id on this page)`);
        bad++;
      }
      continue;
    }

    const [path, frag] = href.split('#');
    if (assets.has(path)) continue;

    if (!ROUTES.has(path)) {
      console.error(`check-links: ${page.route} → ${href} (not a built page)`);
      bad++;
      continue;
    }
    if (frag && !ids.get(path).has(frag)) {
      console.error(`check-links: ${page.route} → ${href} (no id "${frag}" on ${path})`);
      bad++;
    }
  }
}

// Every built page must be reachable from somewhere, or it is a page nobody
// can find and nobody will remember to update.
const all = PAGES.map((p) => readFileSync(p.out, 'utf8')).join('\n');
for (const route of ROUTES) {
  if (route === '/') continue;
  if (!new RegExp(`<a\\s[^>]*?href="${route}"`).test(all)) {
    console.error(`check-links: ${route} is built but nothing links to it`);
    bad++;
  }
}

if (bad) process.exit(1);
console.log(`check-links: ${PAGES.length} pages, every internal link and fragment resolves`);
