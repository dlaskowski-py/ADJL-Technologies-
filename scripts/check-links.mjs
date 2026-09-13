/**
 * Every internal link resolves.
 *
 * Three failure modes, and Capital shipped the third: a href to a page that
 * was never built, a fragment pointing at an id that does not exist on the
 * target page, and — the quiet one — a bare "#section" emitted by a shared
 * footer, which works on the page it was written for and goes nowhere on
 * every other page that later reuses that footer. Root-relative links
 * everywhere is the rule; this is what enforces it.
 *
 * The second pass covers OUTBOUND links, which this script skipped entirely
 * until the site grew its first one. It does not check that the far end is
 * up: a build that reaches the network fails whenever somebody else's DNS
 * does. It checks what is actually this repo's business and what a future
 * edit could quietly change — which host, which path, what the link says,
 * and whether the page carrying it still carries the securities disclaimer.
 * The one live external link points at ADJL Capital, a firm that raises
 * money, so "adjlcapital.com" becoming "Invest with ADJL Capital →", or the
 * href sliding to /invest/, is the exact regression worth failing on.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ORIGIN, PAGES } from './pages.mjs';

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

/* ── Outbound links ───────────────────────────────────────────────────
   Every host this site may link to, and why. Adding one is meant to take a
   deliberate edit here, because an outbound link is the one thing on a
   static site that can change meaning without the site changing at all. */
const ALLOWED_HOSTS = new Map([
  ['adjlcapital.com', 'the affiliated investment firm, referenced on /legal/terms/'],
]);

/* Paths on an allowed host this site must never route a reader into. ADJL
   Capital's investor funnel is public and indexable on its own, which is
   that firm's business. Sending a visitor there from a page that says
   "nothing on this site is an offer to sell or a solicitation of any
   security" would be ours. */
const DENIED_PATHS = [/^\/invest/i, /^\/investments/i, /waitlist/i];

/* A link label may name a destination. It may not ask for anything. This is
   the edit the guard exists to stop: someone makes a neutral reference read
   as an invitation, and nothing else in the build notices. */
const SOLICITATION =
  /\b(invest|investing|join|sign\s*up|subscribe|apply|waitlist|get\s+started|opportunit)/i;

/* A page carrying an outbound link must still carry this sentence. It is the
   context the link is read in, and the whole reason for the placement. */
const DISCLAIMER = 'an offer to sell or a solicitation of any security';

const linkedHosts = new Set();
const ourHost = new URL(ORIGIN).hostname;

for (const page of PAGES) {
  const html = readFileSync(page.out, 'utf8');

  for (const m of html.matchAll(/<a\s([^>]*?)href="(https?:[^"]+)"([^>]*)>([\s\S]*?)<\/a>/g)) {
    const attrs = `${m[1]} ${m[3]}`;
    const href = m[2];
    const label = m[4].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

    let url;
    try {
      url = new URL(href);
    } catch {
      console.error(`check-links: ${page.route} → ${href} (not a parseable URL)`);
      bad++;
      continue;
    }

    /* An absolute link to our own origin is its own bug class: it skips every
       route and fragment check above, so it can point at a 404 forever while
       this script reports clean. Root-relative is the rule. */
    if (url.hostname === ourHost) {
      console.error(
        `check-links: ${page.route} → ${href} (absolute link to our own host; use a root-relative path)`,
      );
      bad++;
      continue;
    }

    if (!ALLOWED_HOSTS.has(url.hostname)) {
      console.error(`check-links: ${page.route} → ${href} (host is not allowlisted in this file)`);
      bad++;
      continue;
    }
    linkedHosts.add(url.hostname);

    if (url.protocol !== 'https:') {
      console.error(`check-links: ${page.route} → ${href} (outbound links must be https)`);
      bad++;
    }

    const target = `${url.pathname}${url.search}${url.hash}`;
    if (DENIED_PATHS.some((re) => re.test(target))) {
      console.error(`check-links: ${page.route} → ${href} (routes a reader into an investor funnel)`);
      bad++;
    }

    if (SOLICITATION.test(label)) {
      console.error(
        `check-links: ${page.route} → "${label}" (link text reads as a solicitation, not a reference)`,
      );
      bad++;
    }

    /* noopener means nothing without a target, so it is required only where
       one is set, rather than shipped as a no-op attribute everywhere. */
    if (/target="_blank"/.test(attrs) && !/rel="[^"]*noopener/.test(attrs)) {
      console.error(`check-links: ${page.route} → ${href} (target="_blank" without rel="noopener")`);
      bad++;
    }

    if (!html.toLowerCase().includes(DISCLAIMER)) {
      console.error(
        `check-links: ${page.route} carries an outbound link but not the securities disclaimer`,
      );
      bad++;
    }
  }
}

/* Bidirectional, like the reachability check below: an allowlisted host that
   nothing links to is a permission nobody remembered to revoke. */
for (const [host, why] of ALLOWED_HOSTS) {
  if (!linkedHosts.has(host)) {
    console.error(`check-links: ${host} is allowlisted (${why}) but nothing links to it`);
    bad++;
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
console.log(
  `check-links: ${PAGES.length} pages, every internal link and fragment resolves, ${linkedHosts.size} outbound host allowed`,
);
