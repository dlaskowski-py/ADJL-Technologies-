/**
 * Renders the share cards: one per page, 1200×630, into public/og/.
 *
 * Each card's art is that page's own structure drawing, the same poster SVG
 * the hero ships (lib/poster.ts), on the site's ground and drafting grid,
 * with the card copy beside it and a mono title block naming the page and
 * the commit it was drawn from: "adjltechnology.com/services/seo/ · a1b2c3d".
 * Legal pages have no hero figure, so their poster is drawn here, from their
 * built HTML, by the same renderer. Nothing on a card is a picture of
 * something the page doesn't contain.
 *
 * A LOCAL CHORE, not part of `npm run build`: it reads a finished dist/ and
 * drives a real browser, and Playwright is kept out of devDependencies so
 * Netlify doesn't install it on every deploy. The cards are committed.
 *
 * So a card can fall behind its page: the copy in CARDS is written by hand,
 * and the home card once kept the old headline for a build after the hero
 * changed. Two things stop that. Each run records the og:title every card
 * was drawn for (scripts/og-cards.json), and check-seo fails the build when
 * a page's og:title has moved on since. And each card is copied into the
 * dist/ it was drawn from, so a local preview shows the card just made.
 *
 *   npx vite build && node scripts/prerender.mjs && node scripts/gen-og.mjs
 *   (needs playwright-core or playwright: npm i --no-save playwright-core)
 */
import { createRequire } from 'node:module';
import { copyFileSync, existsSync, globSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { OG_MANIFEST, ORIGIN, PAGES, ogTitleOf, slugOf } from './pages.mjs';
import { BUILD_SHA } from './build-stamp.mjs';
import { loadTs } from './lib/ts.mjs';

const OUT = 'public/og';
mkdirSync(OUT, { recursive: true });

/** Card copy (SPEC §5.8). Written for a link preview, not a search result:
 *  the brand is already in the corner. The last line takes the copper. */
const CARDS = {
  home: { kicker: 'AI · Websites · Apps · SEO', line: ['AI, websites and apps,', 'built for what’s next.'] },
  services: { kicker: 'Services', line: ['AI, SEO and software,', 'from one team.'] },
  'services-ai-engineering': { kicker: 'AI Engineering', line: ['AI agents and automation', 'that show their work.'] },
  'services-seo': { kicker: 'SEO & AI Search', line: ['Technical SEO for search', 'and AI answer engines.'] },
  'services-software': { kicker: 'Websites & Apps', line: ['Websites, apps', 'and the systems behind them.'] },
  work: { kicker: 'Work', line: ['What we’ve built,', 'and how it works.'] },
  'work-mobile-app': { kicker: 'Native App', line: ['The whole engine,', 'on the phone.'] },
  'work-loep': { kicker: 'Loep', line: ['The records behind a price,', 'on one sheet.'] },
  'work-private-site': { kicker: 'Private Site', line: ['A private site', 'that says no by default.'] },
  'work-this-site': { kicker: 'This Website', line: ['The site you’re on', 'is the SEO case study.'] },
  'work-real-estate-intelligence': { kicker: 'Real Estate Intelligence', line: ['Paste a listing.', 'Get the underwriting.'] },
  'work-trading-infrastructure': { kicker: 'Trading Infrastructure', line: ['Code that behaves the same on Tuesday', 'as it did on Monday.'] },
  'work-ai-implementation': { kicker: 'AI Implementation', line: ['We start at the workflow,', 'not the model.'] },
  approach: { kicker: 'How We Work', line: ['How the work runs,', 'and where it stops.'] },
  'legal-privacy': { kicker: 'Legal', line: ['Privacy.', 'No tracking, no cookies.'] },
  'legal-terms': { kicker: 'Legal', line: ['Terms of use.'] },
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const font = (f) => readFileSync(`public/fonts/${f}`).toString('base64');
const FONTS = `
  @font-face { font-family: 'Manrope'; font-weight: 200 800; font-display: block;
    src: url(data:font/woff2;base64,${font('manrope.woff2')}) format('woff2'); }
  @font-face { font-family: 'JetBrains Mono'; font-weight: 100 800; font-display: block;
    src: url(data:font/woff2;base64,${font('jetbrains-mono.woff2')}) format('woff2'); }`;
/* The site's own tokens and the poster's own styles, so the drawing on the
   card is the drawing on the page. */
const TOKENS = readFileSync('src/styles/tokens.css', 'utf8');
const POSTER_CSS = readFileSync('src/styles/instruments/lattice.css', 'utf8');
const HOST = ORIGIN.replace(/^https?:\/\//, '');
const SHA = BUILD_SHA;

const { renderPoster } = await loadTs('src/lib/poster.ts');

/** The page's poster: the one it ships, or (legal pages) drawn here the
 *  same way from the same HTML. */
function posterOf(page) {
  const html = readFileSync(page.out, 'utf8');
  const shipped = /<svg class="pg"[\s\S]*?<\/svg>/.exec(html)?.[0];
  return shipped ?? renderPoster(html, page.route).svg;
}

function card(page, c, svg) {
  const lines = c.line
    .map((l, i) => (i === c.line.length - 1 && c.line.length > 1 ? `<em>${esc(l)}</em>` : esc(l)))
    .join('<br>');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    ${FONTS}
    ${TOKENS}
    ${POSTER_CSS}
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { width: 1200px; height: 630px; overflow: hidden; position: relative;
      background: var(--ground); color: var(--fg); font-family: var(--font-sans);
      -webkit-font-smoothing: antialiased; }
    .grid { position: absolute; inset: 0;
      background-image: linear-gradient(var(--grid-major) 1px, transparent 1px),
        linear-gradient(90deg, var(--grid-major) 1px, transparent 1px),
        linear-gradient(var(--grid-minor) 1px, transparent 1px),
        linear-gradient(90deg, var(--grid-minor) 1px, transparent 1px);
      background-size: 64px 64px, 64px 64px, 16px 16px, 16px 16px;
      background-position: -1px -1px; }
    .art { position: absolute; top: 39px; right: 40px; width: 552px; height: 552px;
      border: 1px solid var(--rule); border-radius: 6px;
      background: radial-gradient(60% 60% at 50% 50%, rgba(108, 75, 245, 0.08), transparent 70%), var(--ground); }
    .art .pg { position: absolute; inset: 0; width: 100%; height: 100%; }
    .art .pg-t { font-size: 15px; }
    .copy { position: absolute; left: 72px; top: 56px; bottom: 56px; width: 520px;
      display: flex; flex-direction: column; }
    .brand { display: flex; align-items: center; gap: 14px; font-size: 27px; font-weight: 700; letter-spacing: -0.01em; }
    .brand b { font-weight: 400; color: var(--fg-2); }
    .mark { display: flex; align-items: flex-end; gap: 4px; height: 30px; }
    .mark i { display: block; width: 8px; height: 30px; border-radius: 2px; background: var(--fg); }
    .mark i:nth-child(2) { background: var(--signal); }
    .body { margin-top: auto; }
    .kicker { display: flex; align-items: center; gap: 14px; margin-bottom: 22px;
      font-family: var(--font-mono); font-size: 15px; font-weight: 500; letter-spacing: 0.14em;
      text-transform: uppercase; color: var(--fg-3); }
    .kicker::before { content: ''; width: 28px; height: 2px; background: var(--signal); }
    h1 { font-size: ${c.line.join(' ').length > 44 ? 48 : 54}px; font-weight: 600; line-height: 1.04;
      letter-spacing: -0.035em; text-wrap: balance; }
    h1 em { font-style: normal; font-weight: 300; letter-spacing: -0.03em; color: var(--signal); }
    .block { display: inline-flex; margin-top: 40px; align-self: flex-start;
      border: 1px solid var(--rule-3); border-radius: 2px;
      font-family: var(--font-mono); font-size: 15px; color: var(--fg-2); }
    .block span { padding: 9px 14px; }
    .block span + span { border-left: 1px solid var(--rule-3); color: var(--fg-3); }
  </style></head><body>
    <div class="grid"></div>
    <div class="art">${svg}</div>
    <div class="copy">
      <div class="brand"><span class="mark"><i></i><i></i><i></i></span><span>ADJL <b>Technology</b></span></div>
      <div class="body">
        <p class="kicker">${esc(c.kicker)}</p>
        <h1>${lines}</h1>
      </div>
      <p class="block"><span>${esc(HOST + page.route)} · ${esc(SHA)}</span></p>
    </div>
  </body></html>`;
}

async function chromiumLib() {
  for (const name of ['playwright-core', 'playwright']) {
    try {
      return (await import(name)).chromium;
    } catch {
      /* next */
    }
  }
  /* A global install: require() honours NODE_PATH, import() doesn't. */
  const req = createRequire(import.meta.url);
  for (const name of ['playwright-core', 'playwright']) {
    try {
      return req(name).chromium;
    } catch {
      /* next */
    }
  }
  console.error('gen-og: needs Playwright (npm i --no-save playwright-core)');
  process.exit(2);
}

for (const p of PAGES) {
  if (!existsSync(p.out)) {
    console.error(`gen-og: no ${p.out}. Build first (vite build + prerender)`);
    process.exit(1);
  }
  if (!CARDS[slugOf(p.route)]) {
    console.error(`gen-og: no card copy for ${slugOf(p.route)}. Add it to CARDS`);
    process.exit(1);
  }
}

const chromium = await chromiumLib();
const browser = await chromium
  .launch()
  .catch(() => chromium.launch({ executablePath: globSync('/opt/pw-browsers/chromium-*/chrome-linux*/chrome')[0] }));
const ctx = await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();

/** Into the build this run read, when it has an og/ folder (vite copies
 *  public/ before this script can run, so dist/og holds the cards from
 *  before). */
const toDist = (file) => existsSync('dist/og') && copyFileSync(`${OUT}/${file}`, `dist/og/${file}`);
const drawnFor = {};

for (const p of PAGES) {
  const slug = slugOf(p.route);
  drawnFor[slug] = { ogTitle: ogTitleOf(readFileSync(p.out, 'utf8')), card: CARDS[slug].line.join(' ') };
  await page.setContent(card(p, CARDS[slug], posterOf(p)), { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(120);
  /* JPEG at 88: a share card is scaled down by every platform that shows
     it, and PNG of a hairline drawing is several times the bytes. */
  await page.screenshot({ path: `${OUT}/${slug}.jpg`, type: 'jpeg', quality: 88 });
  toDist(`${slug}.jpg`);
  console.log(`  ${slug.padEnd(32)} ${(statSync(`${OUT}/${slug}.jpg`).size / 1024).toFixed(0)} kB`);
}

/* The Organization logo: square, on a plain light ground, at a real pixel
   size. Google's structured-data logo has to be a raster it can measure,
   and it's shown on white. */
await page.setViewportSize({ width: 512, height: 512 });
await page.setContent(
  `<!doctype html><html><head><meta charset="utf-8"><style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{width:512px;height:512px;background:#fafafc;display:grid;place-items:center}
    .mark{display:flex;align-items:flex-end;gap:14px;height:250px}
    .mark i{display:block;width:64px;height:250px;border-radius:14px;background:#0e1117}
    .mark i:nth-child(2){width:35px;background:#d9542a}
  </style></head><body><span class="mark"><i></i><i></i><i></i></span></body></html>`,
  { waitUntil: 'load' },
);
await page.screenshot({ path: `${OUT}/logo-512.png`, type: 'png' });
toDist('logo-512.png');
writeFileSync(OG_MANIFEST, `${JSON.stringify(drawnFor, null, 2)}\n`);
console.log(`  ${'logo-512.png'.padEnd(32)} ${(statSync(`${OUT}/logo-512.png`).size / 1024).toFixed(0)} kB`);

await browser.close();
console.log(`\ngen-og: ${PAGES.length} share cards (commit ${SHA}) + logo -> ${OUT}/`);
