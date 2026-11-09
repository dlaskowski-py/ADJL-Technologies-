/**
 * Drives a real browser over the built site.
 *
 * Point it at `npm run preview`, which serves the exact dist/ that deploys.
 * BASE defaults to it. Aiming this at a public URL is possible but not the
 * intended use.
 *
 * The build's guards read HTML. These are the checks only a running browser
 * can make, on all pages at 390px (a phone, touch, so the lite tier) and
 * 1440px (a desktop, fine pointer, so the full tier):
 *
 *   - nothing overflows sideways
 *   - no console error fires
 *   - the largest contentful paint is the hero's TEXT (the h1 or the lead),
 *     never the figure. The h1 has to paint at once on every tier.
 *   - CLS stays under 0.02 across a full scroll (decode, telemetry and the
 *     live readouts all swap text in place, and none of it may move a line)
 *   - no hero text overlaps the hero figure
 *   - every [data-reveal] is revealed by the end of a scroll
 *
 * Then the instruments, each where it lives. Anything that isn't on the
 * page yet is reported "skipped (not present)", not failed:
 *
 *   - lattice: on the full tier it runs (data-running="true"), stops on
 *     Pause, and stops when scrolled offscreen. No <canvas> exists at all
 *     under prefers-reduced-motion or on a touch device.
 *   - pipeline: data-stage reaches 5 over a scroll
 *   - Machine View: the live re-fetch completes, and the parity meter reads
 *     100% (every word readable without JavaScript)
 *   - Ask: the default question cites at least one passage, and a question
 *     about something this site doesn't offer abstains
 *   - views: the Render / Source / Machine radios change html[data-view]
 *   - flow: a case page's stage trace advances on scroll
 *
 * And the one the prerender exists for: with JavaScript OFF, every page's
 * <main> carries the same text as with it on, within 2%, read through the
 * site's exclusion set (src/lib/exclude.ts, injected into the page). And no
 * [data-reveal] is left invisible without scripting.
 *
 * Run against `npm run preview`.
 */
import { mkdirSync } from 'node:fs';
import { PAGES, slugOf } from './pages.mjs';
import { bundleForBrowser } from './lib/ts.mjs';
import { chromiumLauncher, launchOptions } from './lib/browser.mjs';

const BASE = (process.env.BASE ?? 'http://localhost:4173').replace(/\/$/, '');
const SHOTS = 'artifacts';
mkdirSync(SHOTS, { recursive: true });

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'phone', width: 390, height: 844, isMobile: true, hasTouch: true },
];
const CLS_MAX = 0.02;
const PARITY_TOLERANCE = 0.02;

const chromium = await chromiumLauncher();
const browser = await chromium.launch(launchOptions);
const EXCLUDE = await bundleForBrowser('src/lib/exclude.ts', '__adjlExclude');

let failures = 0;
let skips = 0;
const ok = (msg) => console.log(`  ok   ${msg}`);
const skip = (msg) => {
  console.log(`  skip ${msg}`);
  skips++;
};
const fail = (msg) => {
  console.error(`  FAIL ${msg}`);
  failures++;
};

/* Collected before any page script runs: LCP entries (with their element)
   and layout shifts, so CLS can be computed in session windows. */
const VITALS = () => {
  const v = (window.__vitals = { lcpEl: null, lcp: 0, shifts: [] });
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        v.lcp = e.startTime;
        v.lcpEl = e.element ?? null;
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) if (!e.hadRecentInput) v.shifts.push({ value: e.value, t: e.startTime });
    }).observe({ type: 'layout-shift', buffered: true });
  } catch {
    /* an old engine: the checks below report n/r */
  }
};

async function newContext(opts = {}) {
  const ctx = await browser.newContext({ deviceScaleFactor: 1, ...opts });
  await ctx.addInitScript(VITALS);
  return ctx;
}

/** Open a page and collect its console errors. */
async function open(ctx, route) {
  const p = await ctx.newPage();
  const errors = [];
  p.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  p.on('pageerror', (e) => errors.push(String(e)));
  await p.goto(BASE + route, { waitUntil: 'load' });
  return { p, errors };
}

/** Text of <main> through the shared exclusion set. Injected by CDP, which
 *  the page's CSP doesn't govern, and which works with scripting off. */
async function mainText(p) {
  await p.evaluate(EXCLUDE);
  return p.evaluate(() => {
    const main = document.querySelector('main');
    return main ? globalThis.__adjlExclude.domText(main) : '';
  });
}

/** Scroll the whole page in steps, so reveals and lazy modules fire. */
async function scrollThrough(p) {
  await p.evaluate(async () => {
    const step = Math.max(200, Math.floor(window.innerHeight * 0.8));
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 90));
    }
    window.scrollTo(0, document.documentElement.scrollHeight);
    await new Promise((r) => setTimeout(r, 600));
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 400));
  });
}

const jsOnText = new Map();

/* ── Every page, both viewports ──────────────────────────────────────── */
for (const vp of VIEWPORTS) {
  const ctx = await newContext({
    viewport: { width: vp.width, height: vp.height },
    isMobile: vp.isMobile ?? false,
    hasTouch: vp.hasTouch ?? false,
  });

  for (const page of PAGES) {
    console.log(`${vp.name} ${page.route}`);
    const { p, errors } = await open(ctx, page.route);
    await p.waitForTimeout(400);

    // LCP, read before anything scrolls (a scroll ends LCP observation).
    const lcp = await p.evaluate(() => {
      const el = window.__vitals?.lcpEl;
      if (!el) return { found: false };
      const fig = el.closest('.hero-fig, [data-lattice], figure, canvas, svg');
      const hero = el.closest('.hero, #top');
      const inText = !!el.closest('h1') || (!!hero && !fig && el.tagName !== 'IMG');
      return { found: true, inText, tag: el.tagName.toLowerCase(), cls: String(el.className ?? '').slice(0, 40) };
    });
    if (!lcp.found) skip(`${page.route} LCP: the browser reported no entry`);
    else if (!lcp.inText) fail(`${page.route} LCP is <${lcp.tag} class="${lcp.cls}">, not the hero text, at ${vp.width}px`);

    await scrollThrough(p);

    // Horizontal overflow: the single most common phone bug.
    const overflow = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (overflow > 1) fail(`${page.route} scrolls ${overflow}px sideways at ${vp.width}px`);

    // Anything still invisible after a full scroll is content nobody sees.
    const unrevealed = await p.evaluate(() => document.querySelectorAll('[data-reveal]:not(.is-in)').length);
    if (unrevealed > 0) fail(`${page.route} left ${unrevealed} element(s) unrevealed at ${vp.width}px`);

    // CLS in session windows (1s gap, 5s cap), the way the metric is defined.
    const cls = await p.evaluate(() => {
      const s = window.__vitals?.shifts ?? [];
      let best = 0;
      let win = 0;
      let start = -1;
      let last = -1;
      for (const e of s) {
        if (start < 0 || e.t - last > 1000 || e.t - start > 5000) {
          win = 0;
          start = e.t;
        }
        win += e.value;
        last = e.t;
        best = Math.max(best, win);
      }
      return best;
    });
    if (cls >= CLS_MAX) fail(`${page.route} CLS ${cls.toFixed(3)} after a full scroll at ${vp.width}px (max ${CLS_MAX})`);

    // No text over the hero figure.
    const overlaps = await p.evaluate(() => {
      const hero = document.querySelector('.hero, #top');
      const fig = hero?.querySelector('.hero-fig, [data-lattice]');
      if (!hero || !fig) return null;
      const f = fig.getBoundingClientRect();
      const hits = [];
      for (const el of hero.querySelectorAll('h1, p, a, li, dt, dd, .btn')) {
        if (fig.contains(el)) continue;
        const r = el.getBoundingClientRect();
        const w = Math.min(r.right, f.right) - Math.max(r.left, f.left);
        const h = Math.min(r.bottom, f.bottom) - Math.max(r.top, f.top);
        if (w > 1 && h > 1 && r.width && r.height) hits.push(`<${el.tagName.toLowerCase()}> "${el.textContent.trim().slice(0, 30)}"`);
      }
      return hits;
    });
    if (overlaps?.length) fail(`${page.route} hero text overlaps the figure at ${vp.width}px: ${overlaps.slice(0, 3).join(', ')}`);

    if (errors.length) fail(`${page.route} console at ${vp.width}px: ${errors.slice(0, 3).join(' | ')}`);

    if (vp.name === 'desktop') jsOnText.set(page.route, await mainText(p));

    await p.screenshot({ path: `${SHOTS}/${slugOf(page.route)}-${vp.name}.png`, fullPage: true });
    await p.close();
  }
  await ctx.close();
}

/* ── Instruments ─────────────────────────────────────────────────────── */
console.log('instruments');
{
  const ctx = await newContext({ viewport: { width: 1440, height: 900 } });

  /* Lattice: full tier runs, Pause stops it, offscreen stops it. */
  {
    const { p } = await open(ctx, '/');
    const has = await p.$('[data-lattice]');
    if (!has) skip('lattice: skipped (not present)');
    else {
      const tier = await p.evaluate(() => document.documentElement.dataset.motion ?? '(unset)');
      const running = () => p.evaluate(() => document.querySelector('[data-lattice]')?.getAttribute('data-running'));
      const waitFor = async (want, ms) => {
        const t0 = Date.now();
        while (Date.now() - t0 < ms) {
          if ((await running()) === want) return true;
          await p.waitForTimeout(150);
        }
        return false;
      };
      if (tier !== 'full') skip(`lattice: this browser resolved the "${tier}" tier, so the full-tier checks can't run`);
      else if (!(await waitFor('true', 8000))) fail('lattice: data-running never became "true" on the full tier');
      else {
        ok('lattice: running on the full tier');
        const pause = await p.$('[data-lattice] [data-pause], [data-pause]');
        if (!pause) skip('lattice: Pause skipped (no [data-pause] present)');
        else {
          await pause.evaluate((b) => b.click());
          if (await waitFor('false', 1500)) ok('lattice: Pause stops it');
          else fail('lattice: still data-running="true" after Pause');
          await pause.evaluate((b) => b.click()); // undo, and clear the stored preference
          await waitFor('true', 4000);
        }
        await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
        if (await waitFor('false', 2500)) ok('lattice: stops when scrolled offscreen');
        else fail('lattice: still data-running="true" after scrolling it offscreen');
      }
      await p.evaluate(() => {
        try {
          localStorage.removeItem('adjl:motion');
        } catch {
          /* private mode */
        }
      });
    }
    await p.close();
  }

  /* Pipeline: data-stage reaches 5 over a scroll. */
  {
    const { p } = await open(ctx, '/');
    if (!(await p.$('[data-pipeline]'))) skip('pipeline: skipped (not present)');
    else {
      const max = await p.evaluate(async () => {
        const root = document.querySelector('[data-pipeline]');
        const read = () =>
          Math.max(
            -1,
            ...[root, ...root.querySelectorAll('[data-stage]')]
              .map((e) => Number(e.getAttribute('data-stage')))
              .filter((n) => Number.isFinite(n)),
          );
        const top = root.getBoundingClientRect().top + window.scrollY - window.innerHeight;
        const bottom = top + root.offsetHeight + window.innerHeight;
        let best = read();
        for (let y = Math.max(0, top); y <= bottom; y += 120) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 70));
          best = Math.max(best, read());
        }
        return best;
      });
      if (max < 0) fail('pipeline: no data-stage attribute appeared while scrolling');
      else if (max < 5) fail(`pipeline: data-stage only reached ${max} (needs 5)`);
      else ok(`pipeline: data-stage reached ${max}`);
    }
    await p.close();
  }

  /* Machine View: the live fetch completes with parity at 100%. */
  {
    const { p } = await open(ctx, '/');
    if (!(await p.$('[data-machine]'))) skip('machine: skipped (not present)');
    else {
      await p.evaluate(() => document.querySelector('[data-machine]')?.scrollIntoView({ block: 'center' }));
      const result = await p.evaluate(async () => {
        const root = document.querySelector('[data-machine]');
        const t0 = performance.now();
        while (performance.now() - t0 < 9000) {
          if (root.querySelector('.prov[data-prov="live"]')) break;
          await new Promise((r) => setTimeout(r, 200));
        }
        const live = !!root.querySelector('.prov[data-prov="live"]');
        const attr = root.querySelector('[data-parity]')?.getAttribute('data-parity') ?? root.getAttribute('data-parity');
        const m = /(\d[\d,]*)\s+of\s+(\d[\d,]*)\s*\((\d+(?:\.\d+)?)\s*%\)/.exec(root.textContent ?? '');
        return { live, pct: attr !== null && attr !== undefined ? Number(attr) : m ? Number(m[3]) : null, text: m?.[0] ?? null };
      });
      if (!result.live) fail('machine: the live re-fetch never completed (no Live chip inside [data-machine] after 9s)');
      else if (result.pct === null) fail('machine: live, but no parity reading found (expected "N of M (P%)" or data-parity)');
      else if (result.pct < 100) fail(`machine: parity is ${result.pct}%${result.text ? ` (${result.text})` : ''}, not 100%`);
      else ok(`machine: live fetch complete, parity ${result.pct}%`);
    }
    await p.close();
  }

  /* Ask: the default question cites; the chatbot question abstains. */
  {
    const { p } = await open(ctx, '/');
    const input = await p.$('[data-ask] input[type="search"], [data-ask] input');
    if (!(await p.$('[data-ask]'))) skip('ask: skipped (not present)');
    else if (!input) skip('ask: skipped (no input in [data-ask] yet)');
    else {
      const ask = (q) =>
        p.evaluate(async (question) => {
          const root = document.querySelector('[data-ask]');
          const field = root.querySelector('input[type="search"], input');
          const btn =
            [...root.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Ask') ??
            root.querySelector('button[type="button"]');
          const q2 = question ?? (field.placeholder || root.querySelector('a[href^="#ask-q"], [data-chip]')?.textContent.trim());
          field.focus();
          field.value = q2;
          field.dispatchEvent(new Event('input', { bubbles: true }));
          if (btn) btn.click();
          else field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
          const region = root.querySelector('[aria-live]');
          const t0 = performance.now();
          while (performance.now() - t0 < 5000) {
            if (region?.textContent.trim()) break;
            await new Promise((r) => setTimeout(r, 150));
          }
          const said = region?.textContent.trim() ?? '';
          const cites = [...root.querySelectorAll('a[href]')].filter((a) => {
            const h = a.getAttribute('href');
            return !a.closest('[data-ask-pre]') && !h.startsWith('#ask-q') && /#./.test(h) && !h.startsWith('mailto:');
          }).length;
          const abstained = /no answer/i.test(said) || /Nothing on this site answers that/.test(root.textContent.replace(root.querySelector('[data-ask-pre]')?.textContent ?? '', ''));
          const n = /(\d+)\s+passages?\s+cited/i.exec(said);
          return { question: q2, said, cites: n ? Number(n[1]) : cites, abstained };
        }, q);
      const a = await ask(null);
      if (a.cites >= 1 && !a.abstained) ok(`ask: "${a.question}" cites ${a.cites} passage(s)`);
      else fail(`ask: the default question "${a.question}" didn't cite a passage (announced: "${a.said}")`);
      const b = await ask('Do you sell a chatbot subscription?');
      if (b.abstained) ok('ask: "Do you sell a chatbot subscription?" abstains');
      else fail(`ask: "Do you sell a chatbot subscription?" answered instead of abstaining (announced: "${b.said}")`);
    }
    await p.close();
  }

  /* Views: the radios change html[data-view]. */
  {
    const { p } = await open(ctx, '/');
    const radios = await p.$$('[data-views] input[type="radio"]');
    if (!radios.length) skip('views: skipped (not present)');
    else {
      for (const v of ['machine', 'source', 'render']) {
        const got = await p.evaluate(async (value) => {
          const r = document.querySelector(`[data-views] input[type="radio"][value="${value}"]`);
          if (!r) return { missing: true };
          r.click();
          await new Promise((res) => setTimeout(res, 450));
          return { view: document.documentElement.dataset.view ?? null };
        }, v);
        if (got.missing) fail(`views: no "${v}" radio in [data-views]`);
        else if (got.view === v || (v === 'render' && !got.view)) ok(`views: ${v} sets html[data-view="${got.view ?? ''}"]`);
        else fail(`views: choosing ${v} left html[data-view="${got.view}"]`);
      }
    }
    await p.close();
  }

  /* Flow: a case page's stage trace advances on scroll. */
  {
    const route = PAGES.find((pg) => pg.kind === 'case')?.route ?? '/';
    const { p } = await open(ctx, route);
    const flow = await p.evaluate(async () => {
      const el = document.querySelector('[data-flow] .flow-live');
      if (!el) return null;
      el.closest('[data-flow]').scrollIntoView({ block: 'start' });
      await new Promise((r) => setTimeout(r, 500));
      const a = parseFloat(getComputedStyle(el).strokeDashoffset);
      window.scrollBy(0, 500);
      await new Promise((r) => setTimeout(r, 500));
      const b = parseFloat(getComputedStyle(el).strokeDashoffset);
      return { a, b };
    });
    if (!flow) skip(`flow: skipped (not present on ${route})`);
    else if (Math.abs(flow.a - flow.b) < 1) fail(`flow: trace on ${route} didn't advance (${flow.a} → ${flow.b})`);
    else ok(`flow: trace on ${route} advanced ${Math.abs(flow.a - flow.b).toFixed(0)}px on scroll`);
    await p.close();
  }

  await ctx.close();
}

/* No canvas when motion is reduced, or on a touch device (lite tier). */
for (const [label, opts] of [
  ['prefers-reduced-motion', { viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' }],
  ['touch', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }],
]) {
  const ctx = await newContext(opts);
  const { p } = await open(ctx, '/');
  await p.waitForTimeout(3500); // past load + idle, when the lattice would start
  const n = await p.evaluate(() => document.querySelectorAll('canvas').length);
  if (n) fail(`${label}: ${n} <canvas> on the home page. Only the full tier draws one.`);
  else ok(`${label}: no canvas`);
  await ctx.close();
}

/* ── JavaScript off ──────────────────────────────────────────────────
   The reveal styles once hid [data-reveal] by default and waited for an
   IntersectionObserver to bring it back, so with scripting off 58 of 59
   elements on the home page sat at opacity 0: every word in the DOM and
   none on the screen. And the text itself has to be all there: the same
   words as the scripted page, within 2%. */
console.log('no-JS');
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
  const before = failures;
  for (const page of PAGES) {
    const p = await ctx.newPage();
    await p.goto(BASE + page.route, { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(150);
    const hidden = await p.evaluate(
      () => [...document.querySelectorAll('[data-reveal]')].filter((e) => parseFloat(getComputedStyle(e).opacity) < 0.05).length,
    );
    if (hidden > 0) fail(`${page.route} hides ${hidden} element(s) when scripting is off`);

    const off = await mainText(p);
    const on = jsOnText.get(page.route) ?? '';
    const diff = on.length ? Math.abs(off.length - on.length) / on.length : off.length ? 1 : 0;
    if (diff > PARITY_TOLERANCE) {
      fail(`${page.route} <main> text is ${off.length} chars with JS off and ${on.length} with it on (${(diff * 100).toFixed(1)}% apart, max ${PARITY_TOLERANCE * 100}%)`);
    }
    await p.close();
  }
  if (failures === before) ok(`${PAGES.length} pages: content visible and text within ${PARITY_TOLERANCE * 100}% of the scripted page`);
  await ctx.close();
}

await browser.close();

if (failures) {
  console.error(`\nverify: ${failures} failure(s), ${skips} skipped`);
  process.exit(1);
}
console.log(`\nverify: ${PAGES.length} pages x ${VIEWPORTS.length} viewports clean${skips ? `, ${skips} check(s) skipped (not present yet)` : ''}`);
