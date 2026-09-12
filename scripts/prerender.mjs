/**
 * Renders every page to static HTML at build time.
 *
 * The section modules are pure string functions with no DOM dependency, so
 * they run in Node. Crawlers and no-JS visitors get the whole page, and the
 * browser gets real content on first paint instead of an empty shell — the
 * client script then only wires up interaction.
 *
 * The title and social tags are filled from the page's own content module,
 * not typed into the shell. Capital shipped a page whose <title> still said
 * "TDPS Trading System" months after the page had been rewritten, because
 * the shell was the copy nobody edited. The shell here holds slots; the
 * content module is the source, and a missing slot fails the build rather
 * than silently leaving the placeholder in production.
 */
import { build } from 'esbuild';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { ORIGIN, PAGES } from './pages.mjs';
import { buildHead } from './seo.mjs';

let bytes = 0;

for (const page of PAGES) {
  if (!existsSync(page.out)) {
    console.error(`prerender: ${page.out} missing — did vite build emit it?`);
    process.exit(1);
  }

  const bundle = await build({
    entryPoints: [page.entry],
    bundle: true,
    format: 'esm',
    platform: 'node',
    write: false,
    logLevel: 'silent',
    // The entry pulls a section module, which imports the stylesheets
    // through boot.ts's sibling — nothing here needs CSS, so it is stubbed
    // rather than parsed.
    external: ['*.css'],
  });

  const mod = await import(
    'data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text).toString('base64')
  );

  const { navHtml, pageHtml } = mod.render();

  const before = readFileSync(page.out, 'utf8');
  let after = before
    .replace('<div id="nav-root"></div>', `<div id="nav-root">${navHtml}</div>`)
    .replace('<main class="page" id="page"></main>', `<main class="page" id="page">${pageHtml}</main>`);

  if (after === before) {
    console.error(`prerender: ${page.out} had no mount points to fill`);
    process.exit(1);
  }

  const enc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const swap = (re, value) => {
    if (!value) return;
    if (!re.test(after)) {
      console.error(`prerender: ${page.out} has no slot matching ${re}`);
      process.exit(1);
    }
    after = after.replace(re, value);
  };

  if (!mod.meta) {
    console.error(`prerender: ${page.entry} exports no meta`);
    process.exit(1);
  }

  swap(/<title>[\s\S]*?<\/title>/, `<title>${enc(mod.meta.title)}</title>`);
  swap(
    /<meta name="description"[\s\S]*?\/>/,
    `<meta name="description" content="${enc(mod.meta.description)}" />`,
  );
  swap(
    /<meta property="og:title"[\s\S]*?\/>/,
    `<meta property="og:title" content="${enc(mod.meta.ogTitle ?? mod.meta.title)}" />`,
  );
  swap(
    /<meta property="og:description"[\s\S]*?\/>/,
    `<meta property="og:description" content="${enc(
      mod.meta.ogDescription ?? mod.meta.description,
    )}" />`,
  );

  /* The canonical URL, the share card, and the structured data. All of it
     derives from the page's own content module and its entry in pages.mjs,
     so none of it can disagree with what the page actually says. */
  const head = buildHead({ origin: ORIGIN, page, pages: PAGES, meta: mod.meta, faq: mod.faq });
  after = after.replace('</head>', `${head}\n  </head>`);

  /* The og:image placeholder in the shell is a relative path and would be
     ignored by every scraper. buildHead emits the absolute one; this removes
     the decoy so there is exactly one og:image on the page. */
  after = after.replace(/\n?\s*<meta property="og:image" content="\/media\/[^"]*" \/>/, '');

  writeFileSync(page.out, after);
  bytes += after.length;
  console.log(`prerender: ${page.out.padEnd(48)} ${(after.length / 1024).toFixed(1)} kB`);
}

console.log(`prerender: ${PAGES.length} pages, ${(bytes / 1024).toFixed(0)} kB of HTML`);
