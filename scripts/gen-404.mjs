/**
 * The 404 page.
 *
 * Netlify serves its own if the site does not provide one, which is a dead
 * end: no nav, no branding, and nothing for a visitor or a crawler to follow
 * back into the site. A 404 that links onward keeps a mistyped URL or a
 * stale inbound link from being the end of the visit.
 *
 * Built from dist/index.html rather than written by hand, so it picks up the
 * real hashed asset paths — a hand-written 404 referencing a stylesheet whose
 * hash changed is an unstyled page nobody looks at until a customer does.
 *
 * Deliberately noindex: a 404 that gets indexed competes with real pages.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { ORIGIN } from './pages.mjs';

const src = readFileSync('dist/index.html', 'utf8');

const nav = /<div id="nav-root">([\s\S]*?)<\/div>\s*<main/.exec(src);
const foot = /<footer class="foot">[\s\S]*?<\/footer>/.exec(src);
if (!nav || !foot) {
  console.error('gen-404: could not lift the nav and footer out of dist/index.html');
  process.exit(1);
}

const body = `<section class="chero" id="top">
    <div class="wrap chero-inner">
      <p class="eyebrow">404</p>
      <h1 class="display"><span class="hl-line">This page doesn’t</span><span class="hl-line"><em>exist.</em></span></h1>
      <p class="chero-body">The link may be old, or the address may have a typo in it. Everything the site has is one click away.</p>
      <div class="hero-actions" style="margin-top:2.4rem">
        <a class="btn btn--solid" href="/"><span>Go to the home page</span><span class="arw">&rarr;</span></a>
        <a class="btn btn--ghost" href="/work/"><span>See the work</span></a>
      </div>
    </div>
  </section>`;

let out = src
  .replace(/<main class="page" id="page">[\s\S]*<\/main>/, `<main class="page" id="page">${body}${foot[0]}</main>`)
  .replace(/<title>[\s\S]*?<\/title>/, '<title>Page not found — ADJL Technology</title>')
  .replace(
    /<meta name="description"[\s\S]*?\/>/,
    '<meta name="description" content="That page does not exist. Everything on the ADJL Technology site is one click from here." />',
  )
  // A 404 must never be indexed, and must never claim to be the home page.
  .replace(/<link rel="canonical"[^>]*>/, '<meta name="robots" content="noindex, follow" />')
  .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, '')
  .replace(/<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${ORIGIN}/404" />`);

writeFileSync('dist/404.html', out);
console.log(`gen-404: dist/404.html — ${(out.length / 1024).toFixed(1)} kB, noindex`);
