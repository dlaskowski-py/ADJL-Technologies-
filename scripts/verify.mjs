/**
 * Drives a real browser over the built site.
 *
 * Point it at `npm run preview`, which serves the exact dist/ that deploys —
 * BASE defaults to it. Aiming this at a public URL is possible but not the
 * intended use, and in a sandboxed environment the browser may not have the
 * same network path that curl does.
 *
 * Screenshots at desktop and phone, plus the checks that only a running
 * browser can make: that nothing overflows horizontally, that every film is
 * actually playing rather than merely present, that no console error fired,
 * and that the flow diagram's trace advances when the page is scrolled.
 *
 * Run against `npm run preview`.
 */
import { chromium } from 'playwright-core';
import { mkdirSync, globSync } from 'node:fs';
import { PAGES } from './pages.mjs';

const BASE = process.env.BASE ?? 'http://localhost:4173';
const SHOTS = 'artifacts';
mkdirSync(SHOTS, { recursive: true });

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'phone', width: 390, height: 844, isMobile: true, hasTouch: true },
];

/* The pinned Chromium that ships with this environment. Resolved by glob
   rather than hard-coded, because the revision suffix changes with the
   image and a hard-coded path fails on the next rebuild. */
const CHROME = globSync('/opt/pw-browsers/chromium-*/chrome-linux/chrome')[0];
if (!CHROME) {
  console.error('verify: no chromium under /opt/pw-browsers');
  process.exit(2);
}

/* Autoplay is forced on because the whole point of the film checks below is
   to prove the clips are advancing; a browser that refuses to start them
   would report a failure that no real visitor experiences. */
const browser = await chromium.launch({
  executablePath: CHROME,
  args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'],
});

let failures = 0;
const note = (msg) => console.log(`  ${msg}`);
const fail = (msg) => {
  console.error(`  FAIL ${msg}`);
  failures++;
};

for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 2,
    isMobile: vp.isMobile ?? false,
    hasTouch: vp.hasTouch ?? false,
  });

  for (const page of PAGES) {
    const p = await ctx.newPage();
    const errors = [];
    p.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    p.on('pageerror', (e) => errors.push(String(e)));

    const slug = page.route === '/' ? 'home' : page.route.replace(/^\/|\/$/g, '').replace(/\//g, '-');
    console.log(`${vp.name} ${page.route}`);

    await p.goto(BASE + page.route, { waitUntil: 'networkidle' });
    // Let the reveals fire and the films start.
    await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.5));
    await p.waitForTimeout(1200);
    await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await p.waitForTimeout(900);
    await p.evaluate(() => window.scrollTo(0, 0));
    await p.waitForTimeout(700);

    // Horizontal overflow — the single most common phone bug, and invisible
    // on a desktop where the extra width fits.
    const overflow = await p.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    if (overflow > 1) fail(`${page.route} scrolls ${overflow}px sideways at ${vp.width}px`);

    // Anything still invisible after a full scroll is content nobody sees.
    const unrevealed = await p.evaluate(
      () => document.querySelectorAll('[data-reveal]:not(.is-in)').length,
    );
    if (unrevealed > 0) fail(`${page.route} left ${unrevealed} element(s) unrevealed`);

    if (errors.length) fail(`${page.route} console: ${errors.slice(0, 3).join(' | ')}`);

    await p.screenshot({ path: `${SHOTS}/${slug}-${vp.name}.png`, fullPage: true });
    await p.close();
  }
  await ctx.close();
}

/* WITHOUT SCRIPTING, the page must still be a page.
 *
 * The reveal styles hid [data-reveal] by default and waited for
 * IntersectionObserver to bring it back, so with scripting off 58 of 59
 * elements on the home page sat at opacity 0. Every word was in the DOM and
 * none of it was on the screen — the exact opposite of what prerendering is
 * for, and invisible to every other check here because they all run with
 * scripting on. */
{
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    javaScriptEnabled: false,
  });
  for (const page of PAGES) {
    const p = await ctx.newPage();
    await p.goto(BASE + page.route, { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(250);
    const hidden = await p.evaluate(
      () =>
        [...document.querySelectorAll('[data-reveal]')].filter(
          (e) => parseFloat(getComputedStyle(e).opacity) < 0.05,
        ).length,
    );
    if (hidden > 0) fail(`${page.route} hides ${hidden} element(s) when scripting is off`);
    await p.close();
  }
  note(`no-JS: all ${PAGES.length} pages render their content with scripting disabled`);
  await ctx.close();
}

/* Films: present is not the same as playing. Capital shipped a hero clip
   that played correctly and measured zero movement — it looked like a
   photograph, and nothing in its suite caught it. This checks currentTime
   actually advances. */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(BASE + '/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(2500);
  const moving = await p.evaluate(async () => {
    const vids = Array.from(document.querySelectorAll('video'));
    const before = vids.map((v) => v.currentTime);
    await new Promise((r) => setTimeout(r, 1200));
    return vids.map((v, i) => ({
      src: v.currentSrc.split('/').pop(),
      advanced: v.currentTime - before[i],
    }));
  });
  if (!moving.length) fail('no <video> attached on the home page');
  for (const m of moving) {
    if (m.advanced < 0.3) fail(`${m.src} is attached but not advancing (${m.advanced.toFixed(2)}s)`);
    else note(`film ${m.src} advancing ${m.advanced.toFixed(2)}s/1.2s`);
  }

  // The flow trace must actually respond to scroll.
  const flow = await p.evaluate(async () => {
    const el = document.querySelector('.flow-live');
    if (!el) return null;
    document.querySelector('#process')?.scrollIntoView({ block: 'start' });
    await new Promise((r) => setTimeout(r, 500));
    const a = parseFloat(getComputedStyle(el).strokeDashoffset);
    window.scrollBy(0, 500);
    await new Promise((r) => setTimeout(r, 500));
    const b = parseFloat(getComputedStyle(el).strokeDashoffset);
    return { a, b };
  });
  if (!flow) fail('no flow diagram on the home page');
  else if (Math.abs(flow.a - flow.b) < 1) fail(`flow trace did not advance (${flow.a} → ${flow.b})`);
  else note(`flow trace advanced ${(flow.a - flow.b).toFixed(0)}px on scroll`);

  await ctx.close();
}

await browser.close();

if (failures) {
  console.error(`\nverify: ${failures} failure(s)`);
  process.exit(1);
}
console.log(`\nverify: ${PAGES.length} pages x ${VIEWPORTS.length} viewports, clean`);
