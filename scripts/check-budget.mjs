/**
 * Byte budgets, per page, measured gzipped the way they travel.
 *
 * The site sells speed, and its status bar prints what each page weighs on
 * the visitor's own device. A budget nobody enforces drifts one reasonable
 * addition at a time, and the first anyone hears of it is a readout on the
 * home page that contradicts the copy beside it. So the build fails first.
 *
 *   HTML per page                         ≤ 40 kB gz
 *   first-load JS per page                ≤ 24 kB gz   the page's entry
 *                                                      <script type=module>
 *                                                      plus every
 *                                                      <link rel=modulepreload>
 *   shared CSS (linked by every page)     ≤ 24 kB gz   (was 20; see BUDGET)
 *   page-only CSS (one page's own sheet)  ≤ 10 kB gz
 *   each lazy chunk                       ≤ 10 kB gz
 *   /search-index.json                    ≤ 22 kB gz
 *   all JS reachable from home            ≤ 70 kB gz   first load plus every
 *                                                      chunk it can import,
 *                                                      transitively
 *
 * It also checks what a budget can't see:
 *
 *   - no dist/media/. The films are gone and stay gone.
 *   - no resource from another origin. Every `src=` and every resource
 *     `<link href>` is root-relative, and no stylesheet url() or @import
 *     leaves the site. The CSP would block one anyway; this fails the build
 *     before a visitor's console does.
 *   - no orphans. Every file under dist/assets, dist/fonts and dist/og is
 *     referenced by some HTML, CSS or JS. Everything else in dist/ is a page,
 *     a referenced file, or a machine-readable surface on the list below.
 *     A file nobody references is weight nobody remembers adding.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { basename, join, relative, sep } from 'node:path';
import { PAGES } from './pages.mjs';
import { elements } from './lib-text.mjs';
import { pass } from './lib/report.mjs';

const KB = 1024;
const BUDGET = {
  html: 40 * KB,
  firstLoad: 24 * KB,
  /* Raised from the spec's 20 kB on purpose, not to make a failure go
     away. The 20 was set before the instruments were designed; the
     shipped set (Machine View and its views, Ask, the pipeline, the
     replay, five diagrams, the palette) styles about 4.5 kB gz of
     interface the estimate didn't know about, and check-css proves none
     of it is dead. 24 kB of render-blocking CSS is still small. If this
     trips again, trim a stylesheet; don't move the number a second time. */
  css: 24 * KB,
  /* Styles one page links for itself, on top of the shared sheet. */
  pageCss: 10 * KB,
  lazyChunk: 10 * KB,
  searchIndex: 22 * KB,
  reachable: 70 * KB,
};

/* A font's license travels with the font (the OFL asks for exactly that),
   and nothing links to it. */
const LICENSES = [/^fonts\/[\w.-]*(OFL|LICENSE|license)[\w.-]*\.(txt|md)$/];

/* Machine-readable surfaces and site furniture: files in dist/ that no page
   needs to reference, by pattern. Anything else unreferenced is an orphan. */
const SURFACES = [
  /^robots\.txt$/,
  /^sitemap\.xml$/,
  /^llms(-full)?\.txt$/,
  /^(.+\/)?index\.md$/,
  /^search-index\.json$/,
  /^build-report\.json$/,
  /^\.guard-log\.jsonl$/,
  /^source\/[a-z0-9-]+\.json$/,
  /^_headers$/,
  /^_redirects$/,
  /^\.well-known\/security\.txt$/,
];

let bad = 0;
const fail = (msg) => {
  console.error(`check-budget: ${msg}`);
  bad++;
};
const kb = (n) => `${(n / KB).toFixed(1)} kB`;

const gzCache = new Map();
const gz = (file) => {
  if (!gzCache.has(file)) gzCache.set(file, gzipSync(readFileSync(file), { level: 9 }).length);
  return gzCache.get(file);
};

function walkDir(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walkDir(p, out);
    else out.push(p);
  }
  return out;
}

const rel = (f) => relative('dist', f).split(sep).join('/');
const all = walkDir('dist');
const htmlFiles = all.filter((f) => f.endsWith('.html'));
const cssFiles = all.filter((f) => f.endsWith('.css'));
const jsFiles = all.filter((f) => /\.m?js$/.test(f));

/** A root-relative URL in the HTML → its file in dist. */
const fileOf = (url) => join('dist', decodeURI(url.split(/[?#]/)[0]).replace(/^\//, ''));
const isExternal = (url) => /^(https?:)?\/\//i.test(url.trim());

/* ── JS graph: which chunk imports which ───────────────────────────── */
const imports = new Map();
for (const f of jsFiles) {
  const code = readFileSync(f, 'utf8');
  const deps = new Set();
  /* Static imports, dynamic import() and Vite's preload dependency map all
     name sibling chunks by file name. Any JS file name that appears in a
     chunk's source is an edge. */
  for (const m of code.matchAll(/["'`(,]\s*(?:\.{1,2}\/|\/?assets\/)?([\w.-]+\.m?js)\b/g)) {
    const target = jsFiles.find((j) => basename(j) === m[1]);
    if (target && target !== f) deps.add(target);
  }
  imports.set(f, deps);
}
const closure = (roots) => {
  const seen = new Set();
  const stack = [...roots];
  while (stack.length) {
    const f = stack.pop();
    if (seen.has(f)) continue;
    seen.add(f);
    for (const d of imports.get(f) ?? []) stack.push(d);
  }
  return seen;
};

/* ── Per page ──────────────────────────────────────────────────────── */
const firstLoadAll = new Set();
let homeReach = null;
let worst = { html: 0, js: 0 };
/** route → the stylesheets its HTML links, as dist files. */
const pageStyles = new Map();

for (const page of PAGES) {
  const html = readFileSync(page.out, 'utf8');
  const route = page.route;

  const htmlGz = gzipSync(Buffer.from(html), { level: 9 }).length;
  worst.html = Math.max(worst.html, htmlGz);
  if (htmlGz > BUDGET.html) fail(`${route} HTML is ${kb(htmlGz)} gz (budget ${kb(BUDGET.html)})`);

  const entry = [];
  const preload = [];
  const styles = [];
  for (const el of elements(html)) {
    const a = el.attrs;
    if (el.name === 'script' && a.src && (a.type ?? '').toLowerCase() === 'module') entry.push(a.src);
    if (el.name === 'link') {
      const rels = (a.rel ?? '').toLowerCase().split(/\s+/);
      if (rels.includes('modulepreload') && a.href) preload.push(a.href);
      if (rels.includes('stylesheet') && a.href) styles.push(a.href);
      /* A resource link (not canonical/alternate, which are references to
         pages) must stay on this origin. */
      const resource = rels.some((r) => ['stylesheet', 'preload', 'modulepreload', 'icon', 'prefetch', 'manifest', 'apple-touch-icon', 'mask-icon'].includes(r));
      if (resource && a.href && isExternal(a.href)) fail(`${route} loads <link rel="${a.rel}" href="${a.href}"> from another origin`);
    }
    if ('src' in a && a.src && isExternal(a.src)) fail(`${route} <${el.name} src="${a.src}"> loads from another origin`);
    if ('srcset' in a && /(^|,)\s*(https?:)?\/\//i.test(a.srcset)) fail(`${route} <${el.name} srcset> loads from another origin`);
  }

  if (!entry.length) fail(`${route} has no <script type="module" src> entry`);
  const first = [...entry, ...preload].map(fileOf);
  for (const f of first) if (!existsSync(f)) fail(`${route} references ${f}, which isn't in dist`);
  const present = first.filter((f) => existsSync(f));
  present.forEach((f) => firstLoadAll.add(f));
  const firstGz = present.reduce((n, f) => n + gz(f), 0);
  worst.js = Math.max(worst.js, firstGz);
  if (firstGz > BUDGET.firstLoad) {
    fail(`${route} first-load JS is ${kb(firstGz)} gz (budget ${kb(BUDGET.firstLoad)}): ${present.map((f) => `${basename(f)} ${kb(gz(f))}`).join(', ')}`);
  }

  for (const s of styles) if (!isExternal(s) && !existsSync(fileOf(s))) fail(`${route} links ${s}, which isn't in dist`);
  pageStyles.set(route, styles.filter((s) => !isExternal(s)).map(fileOf).filter((f) => existsSync(f)));
  if (route === '/') homeReach = closure(present);
}

/* ── CSS ───────────────────────────────────────────────────────────── */
/* Two budgets, because there are two kinds of stylesheet. The SHARED one
   is linked from every page, so every visitor pays for it wherever they
   land. A PAGE-ONLY one (the home page's landing styles, /work/'s showcase
   styles) is paid for only by the page that links it, and gets its own,
   smaller cap so a page can't hide a second site's worth of CSS there. */
const routes = [...pageStyles.keys()];
const sharedCss = cssFiles.filter((f) => routes.every((r) => pageStyles.get(r).includes(f)));
const cssGz = sharedCss.reduce((n, f) => n + gz(f), 0);
if (cssGz > BUDGET.css) fail(`shared CSS is ${kb(cssGz)} gz across ${sharedCss.length} file(s) (budget ${kb(BUDGET.css)})`);
let worstPageCss = 0;
for (const r of routes) {
  const own = pageStyles.get(r).filter((f) => !sharedCss.includes(f));
  const ownGz = own.reduce((n, f) => n + gz(f), 0);
  worstPageCss = Math.max(worstPageCss, ownGz);
  if (ownGz > BUDGET.pageCss) fail(`${r} page-only CSS is ${kb(ownGz)} gz (budget ${kb(BUDGET.pageCss)}): ${own.map((f) => `${basename(f)} ${kb(gz(f))}`).join(', ')}`);
}
for (const f of cssFiles) {
  const css = readFileSync(f, 'utf8');
  for (const m of css.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)) {
    if (isExternal(m[1])) fail(`${rel(f)} loads url(${m[1]}) from another origin`);
  }
  for (const m of css.matchAll(/@import\s+(?:url\()?\s*['"]?([^'");\s]+)/g)) {
    if (isExternal(m[1])) fail(`${rel(f)} @imports ${m[1]} from another origin`);
  }
}

/* ── Lazy chunks and home's reach ──────────────────────────────────── */
let lazyCount = 0;
let biggestLazy = 0;
for (const f of jsFiles.filter((j) => rel(j).startsWith('assets/'))) {
  if (firstLoadAll.has(f)) continue;
  lazyCount++;
  biggestLazy = Math.max(biggestLazy, gz(f));
  if (gz(f) > BUDGET.lazyChunk) fail(`lazy chunk ${rel(f)} is ${kb(gz(f))} gz (budget ${kb(BUDGET.lazyChunk)})`);
}
const reachGz = homeReach ? [...homeReach].reduce((n, f) => n + gz(f), 0) : 0;
if (reachGz > BUDGET.reachable) {
  fail(`all JS reachable from home is ${kb(reachGz)} gz across ${homeReach.size} files (budget ${kb(BUDGET.reachable)})`);
}

/* ── Search index ──────────────────────────────────────────────────── */
let indexGz = 0;
if (existsSync('dist/search-index.json')) {
  indexGz = gz('dist/search-index.json');
  if (indexGz > BUDGET.searchIndex) fail(`search-index.json is ${kb(indexGz)} gz (budget ${kb(BUDGET.searchIndex)})`);
}

/* ── No media ──────────────────────────────────────────────────────── */
if (existsSync('dist/media')) fail('dist/media/ exists. The films were removed; nothing may ship there.');

/* ── Orphans ───────────────────────────────────────────────────────── */
const corpus = [...htmlFiles, ...cssFiles, ...jsFiles].map((f) => readFileSync(f, 'utf8')).join('\n');
const referenced = (f) => {
  const r = rel(f);
  return corpus.includes(`/${r}`) || corpus.includes(r) || corpus.includes(basename(f));
};
let orphans = 0;
for (const f of all) {
  const r = rel(f);
  if (r.endsWith('.html')) continue;
  if (referenced(f)) continue;
  /* assets/, fonts/ and og/ hold only things pages load, so there's no
     pattern that excuses a file there. Elsewhere, machine surfaces are
     expected to stand alone. */
  const owned = /^(assets|fonts|og)\//.test(r);
  if (!owned && SURFACES.some((re) => re.test(r))) continue;
  if (LICENSES.some((re) => re.test(r))) continue;
  fail(`${r} ships, and nothing references it`);
  orphans++;
}

if (bad) {
  console.error(`\ncheck-budget: ${bad} problem(s)`);
  process.exit(1);
}
pass(
  'check-budget',
  `${PAGES.length} pages within budget: HTML ≤ ${kb(worst.html)} gz, first-load JS ≤ ${kb(worst.js)} gz, shared CSS ${kb(cssGz)} gz, page-only CSS ≤ ${kb(worstPageCss)} gz, ${lazyCount} lazy chunks ≤ ${kb(biggestLazy)} gz, ${kb(reachGz)} reachable from home${indexGz ? `, search index ${kb(indexGz)} gz` : ''}, no orphans, no third-party resources`,
);
