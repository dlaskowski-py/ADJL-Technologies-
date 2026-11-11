/**
 * The last thing the build writes into the HTML: the measurements that can
 * only be taken once every page is final.
 *
 * It runs after the generators (gen-machine, gen-llms) and before the
 * guards, so what it writes is exactly what ships, and what the guards and
 * check-budget then measure. Four passes per page, in this order, because
 * each later one depends on the bytes the earlier ones wrote:
 *
 *   1. MACHINE VIEW. The BUILD readout was computed at prerender, before
 *      the Ask answers, the markdown twins and llms.txt existed. It's
 *      computed again here from the page as it now is (the same
 *      lib/measure.ts the browser runs), with the twin's first lines, this
 *      page's llms.txt line and each machine-readable file's size on disk.
 *      So a live re-fetch of the deployed page reads exactly what BUILD
 *      says, and a "changed since build" mark means something did change.
 *   2. HEADERS. The curl -I panel's policy is rewritten from netlify.toml,
 *      the file Netlify actually deploys, so the panel can't drift from it.
 *   3. MODULE WEIGHTS. The gzip size of every JavaScript chunk Vite emitted,
 *      by name, against its budget, into [data-weights] on /work/this-site/.
 *   4. SIZES. Per page, gzipped the way check-budget measures them (level 9,
 *      1 kB = 1024 bytes), into [data-metric]:
 *        html        this page
 *        css         its stylesheet(s)
 *        js          its entry module plus every modulepreload
 *        thirdparty  resource URLs in the HTML from another origin (0)
 *      Writing a size changes the size, so this iterates to a fixed point,
 *      at most three passes. Values are shown to 0.1 kB.
 *
 * Everything written lands inside data-chrome or data-machine, which the
 * exclusion set drops, so none of it changes a word count, the voice
 * check or the markdown twins.
 */
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';
import { ORIGIN, PAGES } from './pages.mjs';
import { loadTs } from './lib/ts.mjs';

const { elements } = await loadTs('src/lib/tokenize.ts');
const { measureHtml } = await loadTs('src/lib/measure.ts');
const machine = await loadTs('src/sections/instruments/machine.ts');
const headers = await loadTs('src/sections/instruments/headers.ts');
const weights = await loadTs('src/sections/instruments/weights.ts');
const thisSite = await loadTs('src/content-case-this-site.ts');

const KB = 1024;
const kb = (n) => `${(n / KB).toFixed(1)} kB`;
const gz = (buf) => gzipSync(buf, { level: 9 }).length;
const fileOf = (url) => join('dist', decodeURI(url.split(/[?#]/)[0]).replace(/^\//, ''));
const gzCache = new Map();
const gzFile = (url) => {
  const f = fileOf(url);
  if (!gzCache.has(f)) gzCache.set(f, existsSync(f) ? gz(readFileSync(f)) : 0);
  return gzCache.get(f);
};

/** Replace the INNER html of every element matching `test`, last first so
 *  earlier offsets stay valid. `fn(el)` returns the new inner html, or
 *  null to leave it. */
function replaceInner(html, test, fn) {
  const hits = elements(html).filter(test);
  let out = html;
  for (const el of hits.reverse()) {
    const next = fn(el);
    if (next === null || next === undefined) continue;
    const close = out.lastIndexOf(`</${el.name}`, el.end);
    if (close < el.openEnd) continue;
    out = out.slice(0, el.openEnd) + next + out.slice(close);
  }
  return out;
}

const has = (name) => (el) => name in el.attrs;

/* ── 1. Machine View ───────────────────────────────────────────────── */

const llmsTxt = existsSync('dist/llms.txt') ? readFileSync('dist/llms.txt', 'utf8') : '';

function machineReadouts(html, page) {
  if (!html.includes('data-machine-readout')) return html;
  const m = measureHtml(html, ORIGIN);
  const twinUrl = m.twin || `${page.route}index.md`;
  const twinFile = fileOf(twinUrl);
  const twinText = existsSync(twinFile) ? readFileSync(twinFile, 'utf8') : null;
  const twin = twinText
    ? { head: twinText.split('\n').slice(0, machine.TWIN_LINES).join('\n'), chars: twinText.length }
    : null;
  const llms =
    llmsTxt
      .split('\n')
      .find((l) => l.includes(`](${ORIGIN}${page.route})`))
      ?.trim() ?? null;
  const surfaces = {};
  for (const p of machine.SURFACES) {
    const path = p === '{twin}' ? twinUrl : p;
    const f = fileOf(path);
    if (existsSync(f)) surfaces[path] = statSync(f).size;
  }
  return replaceInner(html, has('data-machine-readout'), (el) =>
    machine.renderMachineReadout(m, el.attrs['data-machine-readout'], { twin, llms, surfaces }),
  );
}

/* ── 2. Headers, from netlify.toml ─────────────────────────────────── */

/** The [headers.values] of the `for = "/*"` block, in file order. */
function deployedHeaders() {
  const toml = readFileSync('netlify.toml', 'utf8');
  /* Each block ends where the next table starts. The /* block is the last
     [[headers]] table, and without the cut it ran on into the
     [[redirects]] after it, which put the redirect's from/to on the panel
     as if they were response headers. */
  const blocks = toml
    .split(/^\[\[headers\]\]\s*$/m)
    .slice(1)
    .map((b) => b.split(/^\[\[(?!headers\.)/m)[0]);
  for (const b of blocks) {
    if (!/^\s*for\s*=\s*"\/\*"\s*$/m.test(b)) continue;
    const out = [];
    for (const m of b.matchAll(/^\s*([A-Za-z][\w-]*)\s*=\s*"((?:[^"\\]|\\.)*)"\s*$/gm)) {
      if (m[1] === 'for') continue;
      out.push([m[1], m[2]]);
    }
    return out;
  }
  return [];
}

const deployed = deployedHeaders();
const cspValue = deployed.find(([k]) => k.toLowerCase() === 'content-security-policy')?.[1] ?? '';
const directives = cspValue
  .split(';')
  .map((d) => d.trim())
  .filter(Boolean);
{
  /* Every deployed directive should carry an annotation, and every
     annotation should name a deployed directive, values included: compared
     on the whole directive, so form-action going from 'none' to 'self' in
     netlify.toml warns until the note under the panel is rewritten to match.
     A mismatch is reported, not fatal: the <pre> always shows the deployed
     policy. */
  const norm = (d) => d.trim().split(/\s+/).join(' ');
  const notes = new Set(thisSite.csp.map((c) => norm(c.directive)));
  const live = new Set(directives.map(norm));
  for (const d of live) if (!notes.has(d)) console.warn(`stamp-sizes: CSP directive "${d}" has no annotation in content-case-this-site.ts#csp`);
  for (const d of notes) if (!live.has(d)) console.warn(`stamp-sizes: annotated directive "${d}" isn't in netlify.toml's policy`);
}

function headersPanel(html, page) {
  if (!html.includes('data-headers-build')) return html;
  const others = deployed.filter(([k]) => k.toLowerCase() !== 'content-security-policy');
  let out = replaceInner(html, has('data-headers-build'), () => headers.headerLines(directives, others));
  out = replaceInner(out, (el) => el.name === 'span' && 'data-url' in el.attrs, () => `${ORIGIN}${page.route}`);
  return out;
}

/* ── 3. Module weights ─────────────────────────────────────────────── */

const SHARED_BUDGET = { measure: 3 * KB, tokenize: 3 * KB, exclude: 3 * KB, 'machine-kit': 3 * KB };

function chunks() {
  const dir = 'dist/assets';
  if (!existsSync(dir)) return new Map();
  const out = new Map();
  for (const f of readdirSync(dir)) {
    const m = /^(.+)-[A-Za-z0-9_-]{8}\.js$/.exec(f);
    if (!m) continue;
    const name = m[1] === 'main' ? 'core' : m[1];
    out.set(name, (out.get(name) ?? 0) + gz(readFileSync(join(dir, f))));
  }
  return out;
}

function weightRows() {
  const sizes = chunks();
  const rows = [];
  const listed = new Set();
  for (const w of weights.WEIGHTS) {
    if (!sizes.has(w.name)) continue;
    rows.push(weights.weightRow(w.name, sizes.get(w.name), w.budget));
    listed.add(w.name);
  }
  /* Anything else Vite split out (code two lazy modules share). */
  for (const [name, size] of [...sizes].sort((a, b) => b[1] - a[1])) {
    if (listed.has(name)) continue;
    rows.push(weights.weightRow(name, size, SHARED_BUDGET[name] ?? 10 * KB));
  }
  return rows.join('');
}

let weightsHtml = null;
function moduleWeights(html) {
  if (!html.includes('data-weights')) return html;
  weightsHtml ??= weightRows();
  return replaceInner(html, has('data-weights'), () => weightsHtml);
}

/* ── 4. Sizes ──────────────────────────────────────────────────────── */

const isExternal = (url) => /^(https?:)?\/\//i.test(url) && !url.startsWith(ORIGIN + '/') && url !== ORIGIN;

/** css, js and third-party: fixed for a page, read from its own tags. */
function resources(html) {
  let css = 0;
  let js = 0;
  let third = 0;
  for (const el of elements(html)) {
    const a = el.attrs;
    if (el.name === 'link') {
      const rel = (a.rel ?? '').toLowerCase().split(/\s+/);
      const resource = rel.some((r) => ['stylesheet', 'preload', 'modulepreload', 'icon', 'prefetch', 'manifest'].includes(r));
      if (!resource || !a.href) continue;
      if (isExternal(a.href)) third++;
      else if (rel.includes('stylesheet')) css += gzFile(a.href);
      else if (rel.includes('modulepreload')) js += gzFile(a.href);
    } else if (el.name === 'script' && a.src) {
      if (isExternal(a.src)) third++;
      else if ((a.type ?? '').toLowerCase() === 'module') js += gzFile(a.src);
    } else if (['img', 'iframe', 'video', 'audio', 'source', 'embed', 'track'].includes(el.name)) {
      for (const u of [a.src, ...(a.srcset ?? '').split(',').map((s) => s.trim().split(/\s+/)[0])]) {
        if (u && isExternal(u)) third++;
      }
    } else if (el.name === 'object' && a.data && isExternal(a.data)) third++;
  }
  return { css, js, third };
}

function stamp(html, values) {
  return replaceInner(
    html,
    (el) => el.attrs['data-metric'] in values,
    (el) => values[el.attrs['data-metric']],
  );
}

/* The 404 page carries the same status bar, so its sizes are stamped too.
   It's written by gen-404, outside the page registry. */
const NOT_FOUND = { route: '/404', out: 'dist/404.html' };
const STAMPED = existsSync(NOT_FOUND.out) ? [...PAGES, NOT_FOUND] : PAGES;

let total = 0;
for (const page of STAMPED) {
  if (!existsSync(page.out)) {
    console.error(`stamp-sizes: ${page.out} is missing`);
    process.exit(1);
  }
  let html = readFileSync(page.out, 'utf8');
  html = machineReadouts(html, page);
  html = headersPanel(html, page);
  html = moduleWeights(html);

  const { css, js, third } = resources(html);
  let passes = 0;
  let htmlGz = 0;
  for (; passes < 3; ) {
    passes++;
    htmlGz = gz(Buffer.from(html));
    const next = stamp(html, { html: kb(htmlGz), css: kb(css), js: kb(js), thirdparty: String(third) });
    if (next === html) break;
    html = next;
  }
  /* One more measurement, to say honestly whether the shown value matches. */
  const final = gz(Buffer.from(html));
  const settled = kb(final) === kb(htmlGz);
  if (!settled) console.warn(`stamp-sizes: ${page.route} html settled at ${kb(final)} but shows ${kb(htmlGz)} after 3 passes`);

  writeFileSync(page.out, html);
  total++;
  console.log(
    `stamp-sizes: ${page.route.padEnd(34)} html ${kb(final).padStart(8)} · css ${kb(css)} · js ${kb(js)} · 3rd-party ${third} (${passes} pass${passes > 1 ? 'es' : ''})`,
  );
}
console.log(`stamp-sizes: ${total} pages stamped${weightsHtml ? ', module weights written' : ''}`);
