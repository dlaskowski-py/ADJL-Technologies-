/**
 * Renders every page to static HTML at build time.
 *
 * The section modules are pure string functions with no DOM dependency, so
 * they run in Node. Crawlers and no-JS visitors get the whole page, and the
 * browser gets real content on first paint instead of an empty shell — the
 * client script then only wires up interaction and motion.
 *
 * Per page, in order:
 *   1. render the nav and page markup into the shell's mount points
 *   2. fill the title and social slots from the page's own content module
 *   3. append the head: canonical, share card, markdown alternate, JSON-LD
 *   4. run the build passes over the FINISHED page (src/lib/prerender-hooks):
 *      the structure poster and the Machine View readout, both measured
 *      from exactly what ships
 *
 * A missing slot fails the build rather than leaving a placeholder in
 * production. Capital once shipped a page whose <title> still named a page
 * that had been rewritten months earlier, because the shell was the copy
 * nobody edited.
 */
import { build } from 'esbuild';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { ORIGIN, PAGES } from './pages.mjs';
import { buildHead } from './seo.mjs';
import { DEFINE } from './build-stamp.mjs';

async function load(entry) {
  const bundle = await build({
    entryPoints: [entry],
    bundle: true,
    format: 'esm',
    platform: 'node',
    write: false,
    logLevel: 'silent',
    define: DEFINE,
    // Section modules import stylesheets through boot.ts's siblings; the
    // prerender needs none of them, so CSS is stubbed, not parsed.
    external: ['*.css'],
  });
  return import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text).toString('base64'));
}

const hooks = await load('src/lib/prerender-hooks.ts');

const enc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const plain = (s) => s.replace(/\{\/?(em|k)\}/g, '');

let bytes = 0;

for (const page of PAGES) {
  if (!existsSync(page.out)) {
    console.error(`prerender: ${page.out} missing — did vite build emit it?`);
    process.exit(1);
  }

  const mod = await load(page.entry);
  if (!mod.meta) {
    console.error(`prerender: ${page.entry} exports no meta`);
    process.exit(1);
  }

  const { navHtml, pageHtml } = mod.render();

  const before = readFileSync(page.out, 'utf8');
  let after = before
    .replace('<div id="nav-root"></div>', `<div id="nav-root">${navHtml}</div>`)
    .replace('<main class="page" id="page"></main>', `<main class="page" id="page">${pageHtml}</main>`);

  if (after === before) {
    console.error(`prerender: ${page.out} had no mount points to fill`);
    process.exit(1);
  }

  const swap = (re, value) => {
    if (!value) return;
    if (!re.test(after)) {
      console.error(`prerender: ${page.out} has no slot matching ${re}`);
      process.exit(1);
    }
    after = after.replace(re, value);
  };

  swap(/<title>[\s\S]*?<\/title>/, `<title>${enc(mod.meta.title)}</title>`);
  swap(/<meta name="description"[\s\S]*?\/>/, `<meta name="description" content="${enc(mod.meta.description)}" />`);
  swap(
    /<meta property="og:title"[\s\S]*?\/>/,
    `<meta property="og:title" content="${enc(mod.meta.ogTitle ?? mod.meta.title)}" />`,
  );
  swap(
    /<meta property="og:description"[\s\S]*?\/>/,
    `<meta property="og:description" content="${enc(mod.meta.ogDescription ?? mod.meta.description)}" />`,
  );

  /* The h1's text, for the TechArticle headline. Read from the rendered
     page, so it's always the headline the reader actually sees. */
  const h1 = /<h1\b[^>]*>([\s\S]*?)<\/h1>/
    .exec(pageHtml)?.[1]
    ?.replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

  const head = buildHead({ origin: ORIGIN, page, pages: PAGES, meta: mod.meta, faq: mod.faq, h1: h1 && plain(h1) });
  after = after.replace('</head>', `${head}\n  </head>`);

  after = hooks.afterRender(after, page.route, ORIGIN);

  writeFileSync(page.out, after);
  bytes += after.length;
  console.log(`prerender: ${page.out.padEnd(52)} ${(after.length / 1024).toFixed(1)} kB`);
}

console.log(`prerender: ${PAGES.length} pages, ${(bytes / 1024).toFixed(0)} kB of HTML`);
