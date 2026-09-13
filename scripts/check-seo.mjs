/**
 * The things a crawler and a share-card scraper read, asserted.
 *
 * All of these fail silently. A relative og:image looks perfectly correct in
 * the markup and renders no preview anywhere — this site shipped exactly
 * that, and nothing on the page or in any other guard would have shown it.
 * Same for a canonical pointing at the wrong origin, a second h1, or JSON-LD
 * with a syntax error in it. You find out from a customer, or you never find
 * out.
 */
import { readFileSync, existsSync, statSync } from 'node:fs';
import { ORIGIN, PAGES } from './pages.mjs';
import { slugOf } from './seo.mjs';

/** Google truncates a title near 60 characters. Over 70 is certainly cut. */
const TITLE_MAX = 65;

let bad = 0;
const fail = (msg) => {
  console.error(`check-seo: ${msg}`);
  bad++;
};

const titles = new Map();

for (const page of PAGES) {
  const html = readFileSync(page.out, 'utf8');
  const one = (re, what) => {
    const m = html.match(re);
    if (!m) fail(`${page.route} has no ${what}`);
    else if (m.length > 1) fail(`${page.route} has ${m.length} ${what} tags — there must be exactly one`);
    return m?.[0] ?? '';
  };

  // ── Title ──────────────────────────────────────────────────────
  const title = (/<title>([^<]*)<\/title>/.exec(html) ?? [])[1] ?? '';
  if (!title) fail(`${page.route} has no title`);
  if (title.length > TITLE_MAX) fail(`${page.route} title is ${title.length} chars — Google cuts near 60`);
  if (titles.has(title)) fail(`${page.route} shares its title with ${titles.get(title)}`);
  titles.set(title, page.route);

  // ── Canonical ──────────────────────────────────────────────────
  const canonical = one(/<link rel="canonical"[^>]*>/g, 'canonical');
  const href = (/href="([^"]*)"/.exec(canonical) ?? [])[1];
  if (href && href !== `${ORIGIN}${page.route}`) {
    fail(`${page.route} canonical points at ${href}`);
  }

  // ── One h1 ─────────────────────────────────────────────────────
  const h1s = (html.match(/<h1[ >]/g) ?? []).length;
  if (h1s !== 1) fail(`${page.route} has ${h1s} h1 elements — there must be exactly one`);

  // ── Open Graph ─────────────────────────────────────────────────
  for (const prop of ['og:title', 'og:description', 'og:url', 'og:image', 'og:site_name', 'og:type']) {
    const m = html.match(new RegExp(`<meta property="${prop}"[^>]*>`, 'g'));
    if (!m) fail(`${page.route} is missing ${prop}`);
    else if (m.length > 1) fail(`${page.route} has ${m.length} ${prop} tags`);
  }

  /* THE ONE THAT ACTUALLY BIT. Open Graph requires an absolute URL; a
     root-relative path is silently ignored by every scraper, so the link
     previews with no image and the markup looks fine. */
  const og = (/<meta property="og:image" content="([^"]*)"/.exec(html) ?? [])[1] ?? '';
  if (og && !/^https?:\/\//.test(og)) {
    fail(`${page.route} og:image "${og}" is not absolute — scrapers ignore it and the preview shows no image`);
  }
  if (og && !og.startsWith(ORIGIN)) fail(`${page.route} og:image is on another origin: ${og}`);

  // The card has to exist, and be big enough for a large-image card.
  const card = `public/og/${slugOf(page.route)}.jpg`;
  if (!existsSync(card)) fail(`${page.route} has no share card at ${card} — run \`npm run og\``);
  else if (statSync(card).size < 8000) fail(`${card} is suspiciously small (${statSync(card).size} bytes)`);

  // ── Structured data ────────────────────────────────────────────
  const ld = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html);
  if (!ld) {
    fail(`${page.route} has no JSON-LD`);
  } else {
    let parsed;
    try {
      parsed = JSON.parse(ld[1]);
    } catch (e) {
      fail(`${page.route} JSON-LD does not parse: ${e.message}`);
    }
    if (parsed) {
      /* @type may be a string or an array — the home page's WebPage node is
         ['WebPage','FAQPage'], because a page carrying an FAQ IS a FAQPage
         rather than sitting next to one. Flatten before looking. */
      const types = (parsed['@graph'] ?? []).flatMap((n) =>
        Array.isArray(n['@type']) ? n['@type'] : [n['@type']],
      );
      for (const required of ['Organization', 'WebSite', 'WebPage']) {
        if (!types.includes(required)) fail(`${page.route} JSON-LD has no ${required} node`);
      }
      if (page.service && !types.includes('Service')) {
        fail(`${page.route} is a practice page but its JSON-LD has no Service node`);
      }
      if (page.parent !== undefined && !types.includes('BreadcrumbList')) {
        fail(`${page.route} has a parent but no BreadcrumbList`);
      }
      if (page.faq && !types.includes('FAQPage')) {
        fail(`${page.route} carries the site FAQ but its JSON-LD has no FAQPage type`);
      }
    }
  }

  // ── lang ───────────────────────────────────────────────────────
  if (!/<html lang="en"/.test(html)) fail(`${page.route} has no lang on <html>`);
}

// ── Sitemap, robots, 404 ────────────────────────────────────────
if (!existsSync('dist/sitemap.xml')) fail('no dist/sitemap.xml');
else {
  const xml = readFileSync('dist/sitemap.xml', 'utf8');
  for (const page of PAGES) {
    if (!xml.includes(`${ORIGIN}${page.route}`)) fail(`sitemap is missing ${page.route}`);
  }
}
if (!existsSync('dist/og/logo-512.png')) {
  fail('no dist/og/logo-512.png — the Organization logo in the JSON-LD points at it');
}
if (!existsSync('dist/robots.txt')) fail('no dist/robots.txt');
else if (!readFileSync('dist/robots.txt', 'utf8').includes(`${ORIGIN}/sitemap.xml`)) {
  fail('robots.txt does not point at the sitemap on this origin');
}
if (!existsSync('dist/404.html')) fail('no dist/404.html');
else if (!readFileSync('dist/404.html', 'utf8').includes('noindex')) {
  fail('dist/404.html is indexable — a 404 that gets indexed competes with real pages');
}

/* Nothing in the build may name a host other than ORIGIN. A canonical, a
   sitemap entry or an og:image left on the old domain is invisible on the
   page and hands every link that reaches it to a redirect. */
const STALE = /https?:\/\/[a-z0-9-]+\.netlify\.app/gi;
for (const page of PAGES) {
  const hits = readFileSync(page.out, 'utf8').match(STALE);
  if (hits && !ORIGIN.includes('netlify.app')) {
    fail(`${page.route} still names ${[...new Set(hits)].join(', ')} — the origin is ${ORIGIN}`);
  }
}
for (const f of ['dist/robots.txt', 'dist/sitemap.xml', 'dist/.well-known/security.txt']) {
  if (!existsSync(f)) continue;
  const hits = readFileSync(f, 'utf8').match(STALE);
  if (hits && !ORIGIN.includes('netlify.app')) {
    fail(`${f} still names ${[...new Set(hits)].join(', ')}`);
  }
}

if (bad) {
  console.error(`\ncheck-seo: ${bad} problem(s)`);
  process.exit(1);
}
console.log(
  `check-seo: ${PAGES.length} pages — canonical, one h1, absolute og:image, share card, JSON-LD (Organization/WebSite/WebPage${PAGES.some((p) => p.service) ? '/Service' : ''}), sitemap, robots, 404`,
);
