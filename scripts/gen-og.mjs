/**
 * Renders the social share cards — one per page, 1200x630.
 *
 * A LOCAL CHORE, not part of `npm run build`. It drives a real browser, and
 * Playwright is deliberately kept out of devDependencies so Netlify does not
 * install it on every deploy. The cards are committed, exactly like the film
 * renditions.
 *
 * Why render rather than crop: the film posters are 3362x1440, which is
 * 2.33:1. A social card is 1.91:1, so cropping alone both wastes most of the
 * file and gives eight pages an unlabelled picture. Rendering puts the page's
 * own headline on it, in the site's own type, over the film that page
 * actually uses — so a link posted in Slack says what it is.
 *
 *   node scripts/gen-og.mjs        (needs: npm i --no-save playwright-core)
 */
import { chromium } from 'playwright-core';
import { mkdirSync, globSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { ORIGIN, PAGES } from './pages.mjs';
import { slugOf } from './seo.mjs';

const OUT = 'public/og';
mkdirSync(OUT, { recursive: true });

const CHROME = globSync('/opt/pw-browsers/chromium-*/chrome-linux/chrome')[0];
if (!CHROME) {
  console.error('gen-og: no chromium under /opt/pw-browsers');
  process.exit(2);
}

/** Card copy. Deliberately NOT the page's <title>: a title is written for a
 *  search result and repeats the brand, which the card already shows in the
 *  corner. These are written for a link preview. */
const CARDS = {
  home: { kicker: 'AI Consulting · Applied Engineering', line: ['We build the system.', 'Not the slide deck.'] },
  work: { kicker: 'Selected Work', line: ['Three practices.', 'All of them in production.'] },
  approach: { kicker: 'How We Work', line: ['How the work runs,', 'and where it stops.'] },
  'work-real-estate-intelligence': { kicker: 'Real Estate Intelligence', line: ['Paste a listing.', 'Get the underwriting.'] },
  'work-trading-infrastructure': { kicker: 'Trading Infrastructure', line: ['Market data in,', 'orders out.'] },
  'work-ai-implementation': { kicker: 'AI Implementation', line: ['We start at the workflow,', 'not the model.'] },
  'legal-privacy': { kicker: 'Legal', line: ['Privacy.', 'No tracking, no cookies.'] },
  'legal-terms': { kicker: 'Legal', line: ['Terms of use.'] },
};

const font = readFileSync('public/fonts/manrope.woff2').toString('base64');

function html(slug, film, card) {
  const poster = readFileSync(`public/media/${film}.jpg`).toString('base64');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @font-face { font-family: 'Manrope'; font-weight: 200 800; font-display: block;
      src: url(data:font/woff2;base64,${font}) format('woff2'); }
    * { margin:0; padding:0; box-sizing:border-box; }
    body { width:1200px; height:630px; overflow:hidden; font-family:'Manrope',sans-serif;
           background:#fafafc; position:relative; }
    .film { position:absolute; inset:0; background:url(data:image/jpeg;base64,${poster}) center/cover no-repeat; }
    /* The same diagonal hold the site's heroes use, so the card reads as the
       page it links to. */
    .veil { position:absolute; inset:0; background:
      linear-gradient(96deg, rgba(250,250,252,.985) 0%, rgba(250,250,252,.975) 44%,
        rgba(250,250,252,.9) 60%, rgba(250,250,252,.55) 76%, rgba(250,250,252,.1) 94%, rgba(250,250,252,0) 100%); }
    .inner { position:relative; height:100%; padding:64px 72px; display:flex; flex-direction:column; }
    .brand { display:flex; align-items:center; gap:13px; }
    .mark { display:flex; align-items:flex-end; gap:3.5px; height:30px; }
    .mark i { display:block; width:8px; height:30px; border-radius:2px; background:#0e1117; }
    .mark i:nth-child(2) { width:4.4px; background:#d9542a; }
    .wm { font-size:24px; font-weight:700; letter-spacing:-.022em; color:#0e1117; }
    .wm b { font-weight:400; color:#616978; }
    .body { margin-top:auto; }
    .kicker { display:flex; align-items:center; gap:14px; font-size:17px; font-weight:600;
              letter-spacing:.16em; text-transform:uppercase; color:#3d4453; margin-bottom:24px; }
    .kicker::before { content:''; width:44px; height:3px; border-radius:3px;
      background:linear-gradient(90deg,#d9542a,#0fa3a3,#6c4bf5); }
    h1 { font-size:${card.line.length > 1 ? 68 : 76}px; font-weight:600; letter-spacing:-.035em;
         line-height:1.04; color:#0e1117; max-width:17ch; }
    h1 em { font-style:normal; font-weight:300; color:#c2451c; }
    .foot { margin-top:34px; font-size:19px; color:#3d4453; font-weight:500; }
  </style></head><body>
    <div class="film"></div><div class="veil"></div>
    <div class="inner">
      <div class="brand"><span class="mark"><i></i><i></i><i></i></span>
        <span class="wm">ADJL <b>Technology</b></span></div>
      <div class="body">
        <p class="kicker">${card.kicker}</p>
        <h1>${card.line.map((l, i) => (i === card.line.length - 1 && card.line.length > 1 ? `<em>${l}</em>` : l)).join('<br>')}</h1>
        <p class="foot">${ORIGIN.replace(/^https?:\/\//, '')}</p>
      </div>
    </div>
  </body></html>`;
}

const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();

for (const p of PAGES) {
  const slug = slugOf(p.route);
  const card = CARDS[slug];
  if (!card) {
    console.error(`gen-og: no card copy for ${slug} — add it to CARDS`);
    process.exit(1);
  }
  await page.setContent(html(slug, p.film, card), { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(120);
  // JPEG at 86: a share card is scaled down by every platform that shows it,
  // and PNG would be four times the bytes for a picture of a photograph.
  await page.screenshot({ path: `${OUT}/${slug}.jpg`, type: 'jpeg', quality: 86 });
  console.log(`  ${slug.padEnd(32)} ${(statSync(`${OUT}/${slug}.jpg`).size / 1024).toFixed(0)} kB`);
}

/* The Organization logo. Square, on a plain ground, at a real pixel size —
   Google's structured-data logo requirement is a raster image it can measure,
   which the favicon SVG is not. */
await page.setViewportSize({ width: 512, height: 512 });
await page.setContent(
  `<!doctype html><html><head><meta charset="utf-8"><style>
    @font-face { font-family:'Manrope'; font-weight:200 800; font-display:block;
      src:url(data:font/woff2;base64,${font}) format('woff2'); }
    *{margin:0;padding:0;box-sizing:border-box}
    body{width:512px;height:512px;background:#fafafc;display:grid;place-items:center}
    .mark{display:flex;align-items:flex-end;gap:14px;height:250px}
    .mark i{display:block;width:64px;height:250px;border-radius:14px;background:#0e1117}
    .mark i:nth-child(2){width:35px;background:#d9542a}
  </style></head><body>
    <span class="mark"><i></i><i></i><i></i></span>
  </body></html>`,
  { waitUntil: 'load' },
);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: `${OUT}/logo-512.png`, type: 'png' });
console.log(`  ${'logo-512.png'.padEnd(32)} ${(statSync(`${OUT}/logo-512.png`).size / 1024).toFixed(0)} kB`);

await browser.close();
console.log(`\ngen-og: ${PAGES.length} share cards + logo -> ${OUT}/`);
