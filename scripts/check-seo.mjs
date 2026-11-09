/**
 * The things a crawler and a share-card scraper read, asserted.
 *
 * All of these fail silently. A relative og:image looks perfectly correct in
 * the markup and renders no preview anywhere. This site shipped exactly
 * that, and nothing on the page or in any other guard would have shown it.
 * Same for a canonical pointing at the wrong origin, a second h1, or JSON-LD
 * with a syntax error in it. You find out from a customer, or you never find
 * out.
 *
 * Since the rebuild it also checks that the structured data holds together
 * as one graph:
 *
 *   - every page's WebPage is still a WebPage (a hub is also a
 *     CollectionPage and an FAQ page also a FAQPage; neither replaces it)
 *   - case pages carry a TechArticle by Daniel, hubs an ItemList, service
 *     pages a Service, the app page a SoftwareApplication with no invented
 *     offers or ratings
 *   - every `{"@id": …}` reference points at a node that exists, on this
 *     page or on the page of this site it names
 *   - every `data-ld="#x"` in the markup (the attribute Machine View and the
 *     hero graph use to pin a section to its entity) resolves to an @id in
 *     the same page's graph
 *   - the markdown twin the head advertises was actually written, and
 *     dist/_headers serves it as text/markdown with a canonical Link back
 *     to its page (and marks the search index and source sheets noindex)
 *   - no title carries an em-dash: the separator is " | " everywhere
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { ORIGIN, PAGES } from './pages.mjs';
import { slugOf, twinOf } from './seo.mjs';
import { walk, ldNodes, typesOf, jsonScripts } from './lib-text.mjs';
import { pass } from './lib/report.mjs';
import { readHeaders } from './lib/headers.mjs';

/** Google truncates a title near 60 characters (the spec target). Over 65
 *  is certainly cut. */
const TITLE_MAX = 65;
const THEME = '#0a0c10';

let bad = 0;
const fail = (msg) => {
  console.error(`check-seo: ${msg}`);
  bad++;
};

/** Everything this guard reads from one page, in one walk. */
function read(html) {
  const out = { title: '', titles: 0, metas: [], links: [], h1: 0, dataLd: [], lang: null };
  let inTitle = false;
  walk(html, {
    open(el) {
      if (el.name === 'html') out.lang = el.attrs.lang ?? null;
      if (el.name === 'title') {
        out.titles++;
        inTitle = out.titles === 1;
      }
      if (el.name === 'meta') out.metas.push(el.attrs);
      if (el.name === 'link') out.links.push(el.attrs);
      if (el.name === 'h1') out.h1++;
      if ('data-ld' in el.attrs) out.dataLd.push({ value: el.attrs['data-ld'], type: el.attrs['data-ld-type'] ?? '', tag: el.name });
    },
    close(el) {
      if (el.name === 'title') inTitle = false;
    },
    text(t) {
      if (inTitle) out.title += t;
    },
  });
  out.title = out.title.replace(/\s+/g, ' ').trim();
  return out;
}

/** Every bare reference `{"@id": X}` (an object with only an @id) in a node. */
function refs(value, out = []) {
  if (Array.isArray(value)) value.forEach((v) => refs(v, out));
  else if (value && typeof value === 'object') {
    const keys = Object.keys(value);
    if (keys.length === 1 && keys[0] === '@id') out.push(value['@id']);
    else for (const v of Object.values(value)) refs(v, out);
  }
  return out;
}

/** Every @id DEFINED anywhere in a node tree (nested definitions count:
 *  Daniel is defined inside the Organization's `founder`). */
function defined(value, out = new Set()) {
  if (Array.isArray(value)) value.forEach((v) => defined(v, out));
  else if (value && typeof value === 'object') {
    const keys = Object.keys(value);
    if (typeof value['@id'] === 'string' && keys.length > 1) out.add(value['@id']);
    for (const v of Object.values(value)) defined(v, out);
  }
  return out;
}

const titles = new Map();
const graphs = new Map(); // route → { nodes, ids }

for (const page of PAGES) {
  const html = readFileSync(page.out, 'utf8');
  const head = read(html);
  const route = page.route;

  // ── Title ──────────────────────────────────────────────────────
  if (!head.title) fail(`${route} has no title`);
  if (head.titles > 1) fail(`${route} has ${head.titles} <title> elements`);
  if (head.title.length > TITLE_MAX) fail(`${route} title is ${head.title.length} chars, and Google cuts near 60`);
  if (/[—–]/.test(head.title)) fail(`${route} title "${head.title}" uses a dash as a separator. Use " | ".`);
  if (titles.has(head.title)) fail(`${route} shares its title with ${titles.get(head.title)}`);
  titles.set(head.title, route);

  // ── Canonical ──────────────────────────────────────────────────
  const canon = head.links.filter((l) => (l.rel ?? '').split(/\s+/).includes('canonical'));
  if (canon.length !== 1) fail(`${route} has ${canon.length} canonical links; there must be exactly one`);
  if (canon[0] && canon[0].href !== `${ORIGIN}${route}`) fail(`${route} canonical points at ${canon[0].href}`);

  // ── Markdown twin ──────────────────────────────────────────────
  const alt = head.links.filter(
    (l) => (l.rel ?? '').split(/\s+/).includes('alternate') && (l.type ?? '').toLowerCase() === 'text/markdown',
  );
  if (alt.length !== 1) fail(`${route} has ${alt.length} markdown alternate links; there must be exactly one`);
  else {
    const href = alt[0].href ?? '';
    if (href !== twinOf(route)) fail(`${route} markdown alternate is "${href}", expected "${twinOf(route)}"`);
    const file = `dist${href}`;
    if (!href.startsWith('/') || !existsSync(file)) fail(`${route} advertises ${href}, but ${file} wasn't written`);
  }

  // ── One h1 ─────────────────────────────────────────────────────
  if (head.h1 !== 1) fail(`${route} has ${head.h1} h1 elements; there must be exactly one`);

  // ── Theme color (one ground, §1.1) ─────────────────────────────
  const theme = head.metas.filter((m) => m.name === 'theme-color');
  if (theme.length !== 1 || (theme[0].content ?? '').toLowerCase() !== THEME) {
    fail(`${route} theme-color is ${theme.map((m) => m.content).join(', ') || 'missing'}, expected ${THEME}`);
  }

  // ── Open Graph ─────────────────────────────────────────────────
  for (const prop of ['og:title', 'og:description', 'og:url', 'og:image', 'og:site_name', 'og:type']) {
    const n = head.metas.filter((m) => m.property === prop).length;
    if (!n) fail(`${route} is missing ${prop}`);
    else if (n > 1) fail(`${route} has ${n} ${prop} tags`);
  }
  for (const [k, v] of [['og:title', 'property'], ['og:description', 'property'], ['description', 'name']]) {
    const m = head.metas.find((x) => x[v] === k);
    if (m && /—/.test(m.content ?? '')) fail(`${route} ${k} carries an em-dash; meta copy uses none`);
  }

  /* THE ONE THAT ACTUALLY BIT. Open Graph requires an absolute URL; a
     root-relative path is silently ignored by every scraper, so the link
     previews with no image and the markup looks fine. */
  const og = head.metas.find((m) => m.property === 'og:image')?.content ?? '';
  if (og && !/^https?:\/\//.test(og)) {
    fail(`${route} og:image "${og}" isn't absolute. Scrapers ignore it and the preview shows no image`);
  }
  if (og && !og.startsWith(ORIGIN)) fail(`${route} og:image is on another origin: ${og}`);

  // The card has to exist, and be big enough for a large-image card.
  const card = `public/og/${slugOf(route)}.jpg`;
  if (!existsSync(card)) fail(`${route} has no share card at ${card}. Run \`npm run og\``);
  else if (statSync(card).size < 8000) fail(`${card} is suspiciously small (${statSync(card).size} bytes)`);

  // ── Structured data ────────────────────────────────────────────
  const blocks = jsonScripts(html, ['application/ld+json']);
  if (!blocks.length) {
    fail(`${route} has no JSON-LD`);
    continue;
  }
  for (const b of blocks) if (!b.ok) fail(`${route} JSON-LD doesn't parse`);
  const nodes = ldNodes(html);
  const ids = defined(nodes);
  graphs.set(route, { nodes, ids });

  const byType = (t) => nodes.filter((n) => typesOf(n).includes(t));
  const types = nodes.flatMap(typesOf);
  for (const required of ['Organization', 'WebSite', 'WebPage']) {
    if (!types.includes(required)) fail(`${route} JSON-LD has no ${required} node`);
  }

  const webpage = nodes.find((n) => n['@id'] === `${ORIGIN}${route}#webpage`);
  if (!webpage) fail(`${route} has no WebPage at ${ORIGIN}${route}#webpage`);
  else if (!typesOf(webpage).includes('WebPage')) {
    fail(`${route} WebPage node was replaced by ${typesOf(webpage).join('/')}. WebPage stays; add types beside it.`);
  }

  if (page.parent !== undefined && !types.includes('BreadcrumbList')) fail(`${route} has a parent but no BreadcrumbList`);
  if (page.faq && !(webpage && typesOf(webpage).includes('FAQPage'))) fail(`${route} carries an FAQ but its WebPage isn't a FAQPage`);
  if (page.faq && webpage && !(Array.isArray(webpage.mainEntity) && webpage.mainEntity.length)) {
    fail(`${route} FAQPage has no Questions as mainEntity`);
  }

  if (page.service && !byType('Service').some((n) => n['@id'] === `${ORIGIN}${route}#service`)) {
    fail(`${route} is a practice page but its JSON-LD has no Service at #service`);
  }

  if (page.article) {
    const art = byType('TechArticle').find((n) => n['@id'] === `${ORIGIN}${route}#article`);
    if (!art) fail(`${route} is a case page but its JSON-LD has no TechArticle at #article`);
    else {
      if (!art.headline) fail(`${route} TechArticle has no headline`);
      if (art.author?.['@id'] !== `${ORIGIN}/#daniel`) fail(`${route} TechArticle author isn't ${ORIGIN}/#daniel`);
      if (!art.dateModified || Number.isNaN(Date.parse(art.dateModified))) fail(`${route} TechArticle dateModified "${art.dateModified}" isn't a date`);
      if (!Array.isArray(art.about) || art.about.length !== page.article.about.length) {
        fail(`${route} TechArticle about doesn't list the ${page.article.about.length} @ids in pages.mjs`);
      }
    }
  }

  if (page.collection) {
    if (!(webpage && typesOf(webpage).includes('CollectionPage'))) fail(`${route} is a hub but its WebPage isn't also a CollectionPage`);
    const list = byType('ItemList').find((n) => n['@id'] === `${ORIGIN}${route}#itemlist`);
    if (!list) fail(`${route} is a hub but has no ItemList at #itemlist`);
    else {
      const want =
        page.collection === 'services'
          ? [...PAGES.filter((p) => p.kind === 'service').map((p) => p.route), '/work/']
          : PAGES.filter((p) => p.kind === 'case').map((p) => p.route);
      const got = (list.itemListElement ?? []).map((li) => String(li.url ?? li.item?.['@id'] ?? '').replace(ORIGIN, ''));
      const missing = want.filter((r) => !got.includes(r));
      if (missing.length) fail(`${route} ItemList is missing ${missing.join(', ')}`);
    }
  }

  if (page.app) {
    const app = byType('SoftwareApplication').find((n) => n['@id'] === `${ORIGIN}${route}#app`);
    if (!app) fail(`${route} describes an app but has no SoftwareApplication at #app`);
    else {
      for (const k of ['offers', 'aggregateRating', 'review']) {
        if (k in app) fail(`${route} SoftwareApplication carries ${k}. There's no price or public rating to state.`);
      }
    }
  }

  const org = byType('Organization').find((n) => n['@id'] === `${ORIGIN}/#organization`);
  if (org && 'sameAs' in org) fail(`${route} Organization has sameAs. List only profiles the firm controls, and none exist yet.`);

  /* data-ld: '#x' matches the @id on this page that ends in '#x'; a
     '/path#x' value is an @id on this origin. */
  for (const d of head.dataLd) {
    const v = d.value.trim();
    const ok = v.startsWith('#')
      ? [...ids].some((id) => id.startsWith(ORIGIN) && id.endsWith(v))
      : v.startsWith('/')
        ? ids.has(`${ORIGIN}${v}`)
        : ids.has(v);
    if (!ok) fail(`${route} <${d.tag} data-ld="${v}"> doesn't resolve to an @id in this page's JSON-LD`);
  }
}

/* Cross-page references. Every `{"@id": X}` must name a node that's
   defined: on this page, or (for an @id on this origin) on the page its
   path names. An @id on another origin, like ADJL Capital's Organization,
   is that site's to define. */
const routeOfId = (id) => {
  const path = id.slice(ORIGIN.length).split('#')[0] || '/';
  return path.endsWith('/') ? path : `${path}/`;
};
for (const [route, { nodes, ids }] of graphs) {
  for (const id of new Set(refs(nodes))) {
    if (ids.has(id)) continue;
    if (!id.startsWith(`${ORIGIN}/`)) continue;
    const target = graphs.get(routeOfId(id));
    if (!target) fail(`${route} references ${id}, on a page that isn't built`);
    else if (!target.ids.has(id)) fail(`${route} references ${id}, which ${routeOfId(id)} doesn't define`);
  }
}

/* ── dist/_headers ─────────────────────────────────────────────────
   What the machine files are served AS is invisible in the HTML and only
   shows up in a `curl -I` against a deploy. A twin served as text/plain
   with no canonical competes with the page it copies; a search index
   served without noindex can be indexed as a page. Netlify path patterns
   allow `*` (any run of characters) and `:name` (one segment). */
const headerBlocks = readHeaders();
const matches = (pattern, path) =>
  new RegExp(
    '^' + pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/:[A-Za-z_]+/g, '[^/]+') + '$',
  ).test(path);
const headerOf = (path, name) => {
  let value = null;
  for (const b of headerBlocks) {
    if (!matches(b.path, path)) continue;
    for (const [k, v] of b.headers) if (k.toLowerCase() === name.toLowerCase()) value = v;
  }
  return value;
};
for (const page of PAGES) {
  const twin = twinOf(page.route);
  const type = headerOf(twin, 'Content-Type') ?? '';
  if (!/^text\/markdown\b/.test(type) || !/charset=utf-8/i.test(type)) {
    fail(`_headers doesn't serve ${twin} as text/markdown; charset=utf-8 (got "${type || 'nothing'}")`);
  }
  const link = headerOf(twin, 'Link') ?? '';
  if (link !== `<${ORIGIN}${page.route}>; rel="canonical"`) fail(`_headers gives ${twin} no canonical Link back to ${ORIGIN}${page.route}`);
}
const noindex = [
  ...(existsSync('dist/search-index.json') ? ['/search-index.json'] : []),
  ...(existsSync('dist/source') ? readdirSync('dist/source').filter((f) => f.endsWith('.json')).map((f) => `/source/${f}`) : []),
];
for (const path of noindex) {
  if (!/noindex/i.test(headerOf(path, 'X-Robots-Tag') ?? '')) fail(`_headers doesn't mark ${path} X-Robots-Tag: noindex`);
}

// ── Sitemap, robots, 404 ────────────────────────────────────────
if (!existsSync('dist/sitemap.xml')) fail('no dist/sitemap.xml');
else {
  const xml = readFileSync('dist/sitemap.xml', 'utf8');
  for (const page of PAGES) {
    if (!xml.includes(`<loc>${ORIGIN}${page.route}</loc>`)) fail(`sitemap is missing ${page.route}`);
  }
  const lastmods = [...xml.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((m) => m[1]);
  if (lastmods.length !== PAGES.length) fail(`sitemap has ${lastmods.length} <lastmod> for ${PAGES.length} pages`);
  for (const d of lastmods) if (Number.isNaN(Date.parse(d))) fail(`sitemap lastmod "${d}" isn't a date`);
}
if (!existsSync('dist/og/logo-512.png')) {
  fail('no dist/og/logo-512.png. The Organization logo in the JSON-LD points at it');
}
if (!existsSync('dist/robots.txt')) fail('no dist/robots.txt');
else if (!readFileSync('dist/robots.txt', 'utf8').includes(`Sitemap: ${ORIGIN}/sitemap.xml`)) {
  fail("robots.txt doesn't point at the sitemap on this origin");
}
if (!existsSync('dist/404.html')) fail('no dist/404.html');
else if (!readFileSync('dist/404.html', 'utf8').includes('noindex')) {
  fail('dist/404.html is indexable. A 404 that gets indexed competes with real pages');
}

/* Nothing in the build may name a host other than ORIGIN. A canonical, a
   sitemap entry or an og:image left on the old domain is invisible on the
   page and hands every link that reaches it to a redirect. */
const STALE = /https?:\/\/[a-z0-9-]+\.netlify\.app/gi;
const stale = (f, text) => {
  const hits = text.match(STALE);
  if (hits && !ORIGIN.includes('netlify.app')) fail(`${f} still names ${[...new Set(hits)].join(', ')}. The origin is ${ORIGIN}`);
};
for (const page of PAGES) stale(page.route, readFileSync(page.out, 'utf8'));
for (const f of ['dist/robots.txt', 'dist/sitemap.xml', 'dist/.well-known/security.txt', 'dist/llms.txt', 'dist/llms-full.txt']) {
  if (existsSync(f)) stale(f, readFileSync(f, 'utf8'));
}

if (bad) {
  console.error(`\ncheck-seo: ${bad} problem(s)`);
  process.exit(1);
}
const articles = PAGES.filter((p) => p.article).length;
const hubs = PAGES.filter((p) => p.collection).length;
pass(
  'check-seo',
  `${PAGES.length} pages, one h1 each, canonical, markdown twin, absolute og:image, JSON-LD graph resolves (${articles} TechArticles, ${hubs} collections, every data-ld pinned), sitemap, robots, 404`,
);
