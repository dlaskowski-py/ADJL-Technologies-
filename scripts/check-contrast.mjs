/**
 * Measures text contrast on the BUILT, RUNNING site.
 *
 * tokens.css states a ratio for every pairing it defines, but a stated ratio
 * is an intention. What a reader actually sees is the color that won the
 * cascade, at whatever opacity it ended up with, over whatever is actually
 * behind it. So this measures the page a browser rendered: for every element
 * with its own text, the computed color, composited through its own and
 * every ancestor's opacity, against the first opaque background up the tree.
 *
 * One ground and no text over any canvas or the hero figure (the layout rule
 * in tokens.css) is what makes that flat measurement valid. The film pass
 * this script used to carry is gone with the films.
 *
 * The page isn't one state, though, so it's measured in each of them:
 *
 *   render    the page as it loads
 *   machine   html[data-view="machine"]: the grid brightens, decoration
 *             dims, and headings, links and landmarks grow annotations.
 *             Those annotations are ::before/::after content, so pseudo-
 *             elements with text are measured too, in every pass.
 *   source    html[data-view="source"], with the Source sheets open
 *   drawer    Machine view's readout drawer, when the page has one
 *   dialog    the ⌘K palette, open, when the page has one
 *   ask       Ask This Site after a cited answer and after an abstention
 *
 * A state whose element isn't on the page yet is skipped with a note, not
 * failed. Decoration (anything under aria-hidden="true") is exempt, as WCAG
 * exempts pure decoration; its pseudo-element labels are not.
 *
 * Run against `npm run preview`.
 */
import { PAGES as ALL_PAGES } from './pages.mjs';
import { chromiumLauncher, launchOptions } from './lib/browser.mjs';

const BASE = (process.env.BASE ?? 'http://localhost:4173').replace(/\/$/, '');
/* ONLY=/,/work/ limits the run to those routes, for a quick look after one
   change. The full run is the one that counts. */
const ONLY = process.env.ONLY ? new Set(process.env.ONLY.split(',').map((r) => r.trim())) : null;
const PAGES = ALL_PAGES.filter((p) => !ONLY || ONLY.has(p.route));

const srgb = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const lum = ([r, g, b]) => 0.2126 * srgb(r / 255) + 0.7152 * srgb(g / 255) + 0.0722 * srgb(b / 255);
const ratio = (a, b) => {
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
};
/** WCAG AA: 3:1 for large text (>=24px, or >=18.66px bold), else 4.5:1. */
const floorFor = (px, weight) => (px >= 24 || (px >= 18.66 && weight >= 700) ? 3 : 4.5);
/** Text drawn at alpha < 1 is its color mixed with what's behind it. */
const composite = (fg, bg, a) => fg.map((c, i) => a * c + (1 - a) * bg[i]);

const chromium = await chromiumLauncher();
const browser = await chromium.launch(launchOptions);
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });

let failures = 0;
let checked = 0;
const notes = new Set();
const perPass = {};

/** Every text-bearing element (and text-bearing pseudo-element) under
 *  `scope`, with what's needed to compute its ratio. Runs in the page. */
function collect(scope) {
  const parse = (s) => {
    const m = /rgba?\(([^)]+)\)/.exec(s ?? '');
    if (!m) return null;
    const n = m[1].split(/[ ,/]+/).filter(Boolean).map((v) => parseFloat(v));
    return { rgb: [n[0], n[1], n[2]], a: n.length > 3 ? n[3] : 1 };
  };
  const root = scope ? document.querySelector(scope) : document.body;
  if (!root) return null;

  const alphaOf = (el, own) => {
    let a = own;
    for (let e = el; e && e !== document.documentElement; e = e.parentElement) {
      const o = parseFloat(getComputedStyle(e).opacity);
      if (!Number.isNaN(o)) a *= o;
    }
    return a;
  };
  const bgOf = (el) => {
    for (let a = el; a; a = a.parentElement) {
      const b = parse(getComputedStyle(a).backgroundColor);
      if (b && b.a >= 0.95) return b.rgb;
    }
    return parse(getComputedStyle(document.documentElement).backgroundColor)?.rgb ?? [255, 255, 255];
  };
  const visible = (el, cs) => {
    if (cs.visibility === 'hidden' || cs.display === 'none') return false;
    const r = el.getBoundingClientRect();
    return r.width >= 2 && r.height >= 2;
  };

  const out = [];
  for (const el of [root, ...root.querySelectorAll('*')]) {
    const cs = getComputedStyle(el);
    const decorative = !!el.closest('[aria-hidden="true"]');

    const own = Array.from(el.childNodes)
      .filter((n) => n.nodeType === 3)
      .map((n) => n.textContent.trim())
      .join('');
    if (own && !decorative && visible(el, cs)) {
      const fg = parse(cs.color);
      const alpha = fg ? alphaOf(el, fg.a) : 0;
      if (fg && alpha >= 0.06) {
        out.push({
          what: `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : ''}`,
          text: own.slice(0, 46),
          fg: fg.rgb,
          bg: bgOf(el),
          alpha,
          px: parseFloat(cs.fontSize),
          weight: parseInt(cs.fontWeight, 10) || 400,
        });
      }
    }

    /* Generated text: Machine view's annotations are content: attr(href)
       and friends on ::before/::after. */
    for (const pseudo of ['::before', '::after']) {
      const ps = getComputedStyle(el, pseudo);
      const content = ps.content;
      if (!content || content === 'none' || content === 'normal' || ps.display === 'none') continue;
      /* Drop the alt-text part (`/ ""`). What's left is text when it
         carries a letter or digit, or pulls one in with attr()/counter().
         Separator and bullet glyphs alone (› · →) are decoration. */
      const textual = content.replace(/\/\s*(""|'')\s*$/, '').trim();
      if (!/attr\(|counters?\(|[\p{L}\p{N}]/u.test(textual)) continue;
      if (!visible(el, cs)) continue;
      const fg = parse(ps.color);
      if (!fg) continue;
      const own = parse(ps.backgroundColor);
      const alpha = alphaOf(el, fg.a) * (parseFloat(ps.opacity) || 1);
      if (alpha < 0.06) continue;
      out.push({
        what: `${el.tagName.toLowerCase()}${pseudo}`,
        text: textual.replace(/^"(.*)"$/, '$1').slice(0, 46),
        fg: fg.rgb,
        bg: own && own.a >= 0.95 ? own.rgb : bgOf(el),
        alpha,
        px: parseFloat(ps.fontSize),
        weight: parseInt(ps.fontWeight, 10) || 400,
      });
    }
  }
  return out;
}

function judge(route, pass, targets) {
  perPass[pass] = (perPass[pass] ?? 0) + targets.length;
  for (const t of targets) {
    checked++;
    const floor = floorFor(t.px, t.weight);
    const fgL = lum(t.alpha < 0.995 ? composite(t.fg, t.bg, t.alpha) : t.fg);
    const r = ratio(fgL, lum(t.bg));
    if (r < floor) {
      console.error(
        `check-contrast: [${pass}] ${route} ${t.what} "${t.text}": ${r.toFixed(2)}:1 (needs ${floor}) at ${t.px}px${t.alpha < 0.995 ? ` (alpha ${t.alpha.toFixed(2)})` : ''}`,
      );
      failures++;
    }
  }
}

/** Load a page with every reveal fired, back at the top. */
async function load(route) {
  const p = await ctx.newPage();
  await p.goto(BASE + route, { waitUntil: 'networkidle' });
  await p.evaluate(async () => {
    const step = Math.floor(window.innerHeight * 0.8);
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, document.documentElement.scrollHeight);
    await new Promise((r) => setTimeout(r, 700));
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 400));
  });
  return p;
}

/** Switch views the way a visitor does (the radio, so views.ts runs and
 *  Source sheets get inserted), and set the attribute regardless, so the
 *  CSS state is measured even before views.ts exists. */
async function setView(p, view) {
  await p.evaluate(async (v) => {
    const radio = document.querySelector(`[data-views] input[type="radio"][value="${v}"]`);
    if (radio) radio.click();
    document.documentElement.dataset.view = v;
    await new Promise((r) => setTimeout(r, 700));
  }, view);
}

const ASK_PAGES = new Set(['/', '/services/ai-engineering/']);

for (const page of PAGES) {
  const route = page.route;

  // ── Render ──
  let p = await load(route);
  judge(route, 'render', (await p.evaluate(collect, null)) ?? []);

  // ── Ask, answered and abstained ──
  if (ASK_PAGES.has(route)) {
    for (const [state, q] of [
      ['ask answered', null],
      ['ask abstained', 'Do you sell a chatbot subscription?'],
    ]) {
      const ran = await p.evaluate(async (question) => {
        const root = document.querySelector('[data-ask]');
        const field = root?.querySelector('input[type="search"], input');
        if (!field) return false;
        root.scrollIntoView({ block: 'center' });
        field.focus();
        field.value = question ?? field.placeholder ?? 'Who owns the code?';
        field.dispatchEvent(new Event('input', { bubbles: true }));
        const btn = [...root.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Ask');
        if (btn) btn.click();
        else field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        await new Promise((r) => setTimeout(r, 1500));
        return true;
      }, q);
      if (!ran) notes.add(`${state}: skipped (no Ask input on ${route} yet)`);
      else judge(route, state, (await p.evaluate(collect, '[data-ask]')) ?? []);
    }
  }

  // ── ⌘K dialog ──
  const opened = await p.evaluate(async () => {
    const btn = document.querySelector('[data-palette]');
    if (!btn) return false;
    btn.click();
    await new Promise((r) => setTimeout(r, 500));
    return !!document.querySelector('dialog[open]');
  });
  if (!opened) notes.add('dialog: skipped (no [data-palette] that opens a dialog yet)');
  else judge(route, 'dialog', (await p.evaluate(collect, 'dialog[open]')) ?? []);
  await p.close();

  // ── Machine, and its drawer ──
  p = await load(route);
  await setView(p, 'machine');
  judge(route, 'machine', (await p.evaluate(collect, null)) ?? []);
  const drawer = await p.evaluate(() => {
    const d = document.querySelector('[data-drawer]');
    if (!d) return false;
    const r = d.getBoundingClientRect();
    return r.width > 2 && r.height > 2 && getComputedStyle(d).visibility !== 'hidden';
  });
  if (!drawer) notes.add('drawer: skipped (no visible [data-drawer] in Machine view yet)');
  else judge(route, 'drawer', (await p.evaluate(collect, '[data-drawer]')) ?? []);
  await p.close();

  // ── Source, with the sheets open ──
  p = await load(route);
  await setView(p, 'source');
  const sheets = await p.evaluate(async () => {
    const t0 = performance.now();
    while (performance.now() - t0 < 2500 && !document.querySelector('[data-source-sheet]')) {
      await new Promise((r) => setTimeout(r, 150));
    }
    return document.querySelectorAll('[data-source-sheet]').length;
  });
  if (!sheets) notes.add('source: sheets not present yet; measured the source-view CSS state only');
  judge(route, 'source', (await p.evaluate(collect, null)) ?? []);
  await p.close();
}

await browser.close();

for (const n of notes) console.log(`check-contrast: note: ${n}`);
const passes = Object.entries(perPass)
  .map(([k, v]) => `${k} ${v}`)
  .join(', ');
if (failures) {
  console.error(`\ncheck-contrast: ${failures} failure(s) across ${checked} measurements (${passes})`);
  process.exit(1);
}
console.log(`check-contrast: ${checked} measurements across ${PAGES.length} pages (${passes}), all clear of their WCAG AA floor`);
