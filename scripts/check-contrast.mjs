/**
 * Measures text contrast on the BUILT, RUNNING site.
 *
 * tokens.css states a ratio for every pairing it defines, but a stated ratio
 * is an intention. What a reader actually sees is the colour that won the
 * cascade, over whatever is actually behind it — which on this site is
 * sometimes a film under a gradient veil, and there is no way to compute that
 * from the stylesheet at all.
 *
 * So there are two passes, and the second is the one that matters:
 *
 *   FLAT   Text over a solid ground. The effective background is found by
 *          walking ancestors until something opaque is hit. Fast, exact,
 *          and it covers most of the site.
 *
 *   FILM   Text over a .backdrop. The text is made TRANSPARENT, the region behind
 *          it is screenshotted, and a NEAR-EXTREME percentile of that region
 *          is used. Several frames are sampled across the loop, because a
 *          clip whose average is comfortable can still sweep a specular
 *          highlight under a headline twice a loop, and an average hides
 *          exactly that.
 *
 *          Sampling is done over the TEXT's own client rects, obtained from a
 *          Range over its text nodes, not over the element's bounding box. A
 *          block-level <p class="eyebrow"> spans the whole column however
 *          short its words are, so its box is mostly empty film to the right
 *          of the text — and measuring that reported 1.50:1 on an eyebrow
 *          whose actual glyphs sit on a well-veiled part of the frame. What
 *          matters is what is behind the letters.
 *
 *          Transparency rather than visibility:hidden, and the whole
 *          containing block rather than the target alone. Two bugs came out
 *          of getting this wrong. Hiding only the target left the ADJACENT
 *          line's descenders inside the sample — a 'p' hanging into the line
 *          below reported 1.94:1 against text sitting on pale film. And
 *          hiding the element outright removed its OWN background, so a
 *          translucent numeral chip was measured against the film it is there
 *          to sit on top of. Making every glyph in the block transparent
 *          leaves backgrounds, borders and chips exactly where they are and
 *          removes only the letters.
 *
 *          A percentile is still used on top of that, for antialiased edges
 *          and for the odd stray pixel a border contributes.
 *
 * PNG decoding is done by handing the screenshot back to the browser as a
 * data URL and reading it off a canvas, rather than adding an image library
 * for the sake of one number.
 *
 * Run against `npm run preview`.
 */
import { chromium } from 'playwright-core';
import { globSync } from 'node:fs';
import { PAGES } from './pages.mjs';

const BASE = process.env.BASE ?? 'http://localhost:4173';
const CHROME = globSync('/opt/pw-browsers/chromium-*/chrome-linux/chrome')[0];

/** Frames sampled across an 8-second loop, for text sitting over film. */
const FILM_SAMPLES = 5;

const srgb = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const lum = ([r, g, b]) =>
  0.2126 * srgb(r / 255) + 0.7152 * srgb(g / 255) + 0.0722 * srgb(b / 255);
const ratio = (a, b) => {
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
};

/** WCAG AA: 3:1 for large text (>=24px, or >=18.66px bold), else 4.5:1. */
const floorFor = (px, weight) => (px >= 24 || (px >= 18.66 && weight >= 700) ? 3 : 4.5);

const browser = await chromium.launch({
  executablePath: CHROME,
  args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'],
});
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });

/** A scratch page used only to decode screenshots into pixels. */
const decoder = await ctx.newPage();
await decoder.goto('about:blank');

async function worstPixel(pngBuffer) {
  return decoder.evaluate(async (b64) => {
    const img = new Image();
    img.src = 'data:image/png;base64,' + b64;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.width;
    c.height = img.height;
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0);
    const { data } = g.getImageData(0, 0, c.width, c.height);
    const s = (v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));

    const lums = new Float64Array(data.length / 4);
    const px = new Array(data.length / 4);
    for (let i = 0, j = 0; i < data.length; i += 4, j++) {
      px[j] = [data[i], data[i + 1], data[i + 2]];
      lums[j] = 0.2126 * s(px[j][0] / 255) + 0.7152 * s(px[j][1] / 255) + 0.0722 * s(px[j][2] / 255);
    }

    const idx = Array.from(lums.keys()).sort((a, b) => lums[a] - lums[b]);
    // 2% in from each end. Anything rarer than that is a stray glyph edge or
    // a compression artefact, not something a word is sitting on.
    const lo = idx[Math.floor(idx.length * 0.01)];
    const hi = idx[Math.floor(idx.length * 0.99)];
    return { min: px[lo], max: px[hi], minL: lums[lo], maxL: lums[hi] };
  }, pngBuffer.toString('base64'));
}

let failures = 0;
let checked = 0;

for (const page of PAGES) {
  const p = await ctx.newPage();
  await p.goto(BASE + page.route, { waitUntil: 'networkidle' });
  /* text-fill-color as well as color: a descendant that sets its own colour
     — the copper <em> in every headline does — would otherwise ignore an
     inherited transparent. */
  await p.addStyleTag({
    content: '.cc-blank, .cc-blank * { color: transparent !important; -webkit-text-fill-color: transparent !important; text-shadow: none !important; }',
  });
  // Reveal everything, then come back to the top.
  await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await p.waitForTimeout(900);
  await p.evaluate(() => window.scrollTo(0, 0));
  await p.waitForTimeout(700);

  const targets = await p.evaluate(() => {
    const parse = (s) => {
      const m = /rgba?\(([^)]+)\)/.exec(s);
      if (!m) return null;
      const n = m[1].split(',').map((v) => parseFloat(v));
      return { rgb: [n[0], n[1], n[2]], a: n.length > 3 ? n[3] : 1 };
    };

    const out = [];
    let id = 0;

    for (const el of document.querySelectorAll('body *')) {
      // Only elements with their own visible text.
      const own = Array.from(el.childNodes)
        .filter((n) => n.nodeType === 3)
        .map((n) => n.textContent.trim())
        .join('');
      if (!own) continue;

      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none') continue;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;

      const fg = parse(cs.color);
      if (!fg) continue;

      /* Effective alpha: the element's own opacity times every ancestor's,
         multiplied by the alpha in the colour itself.

         This used to SKIP anything under 0.9, on the theory that a partly
         transparent element was mid-reveal. That was wrong twice over — the
         reveals are all complete by the time this runs, and design states
         that dim text permanently are exactly the ones most likely to fail.
         The skip hid an 11px numeral sitting at 2.16:1 and a whole column of
         body copy at 2.2:1, and reported the page clean. A faded colour is
         not a reason to look away; it is the reason to look. */
      let alpha = fg.a;
      for (let a = el; a && a !== document.documentElement; a = a.parentElement) {
        const o = parseFloat(getComputedStyle(a).opacity);
        if (!Number.isNaN(o)) alpha *= o;
      }
      if (alpha < 0.06) continue;

      // Is there film behind this element anywhere up the tree?
      let overFilm = false;
      for (let a = el; a && a !== document.body; a = a.parentElement) {
        if (a.querySelector?.(':scope > .backdrop')) { overFilm = true; break; }
      }

      // Effective flat background: first opaque ancestor background-color.
      let bg = null;
      for (let a = el; a && !bg; a = a.parentElement) {
        const b = parse(getComputedStyle(a).backgroundColor);
        if (b && b.a >= 0.95) bg = b.rgb;
      }

      /* Tight rects around the glyphs themselves — one per rendered line —
         rather than the element's box. */
      const rects = [];
      for (const n of el.childNodes) {
        if (n.nodeType !== 3 || !n.textContent.trim()) continue;
        const range = document.createRange();
        range.selectNodeContents(n);
        for (const rr of range.getClientRects()) {
          if (rr.width >= 4 && rr.height >= 4) rects.push({ x: rr.x, y: rr.y, w: rr.width, h: rr.height });
        }
      }
      if (overFilm && !rects.length) continue;

      el.setAttribute('data-cc', String(id));
      out.push({
        id: id++,
        tag: el.tagName.toLowerCase(),
        cls: el.className?.toString?.().slice(0, 40) ?? '',
        text: own.slice(0, 46),
        fg: fg.rgb,
        bg,
        px: parseFloat(cs.fontSize),
        weight: parseInt(cs.fontWeight, 10) || 400,
        alpha,
        overFilm,
        // Widest first: if the count has to be capped, keep the lines with
        // the most glyphs on them.
        rects: rects.sort((a, b) => b.w - a.w).slice(0, 4),
      });
    }
    return out;
  });

  /** Text drawn at alpha < 1 is really its colour mixed with what is behind
   *  it. Measure what lands on the screen, not what the stylesheet asked for. */
  const composite = (fg, bg, a) => fg.map((c, i) => a * c + (1 - a) * bg[i]);

  for (const t of targets) {
    const floor = floorFor(t.px, t.weight);

    if (!t.overFilm) {
      if (!t.bg) continue;
      checked++;
      const fgL = lum(t.alpha < 0.995 ? composite(t.fg, t.bg, t.alpha) : t.fg);
      const r = ratio(fgL, lum(t.bg));
      if (r < floor) {
        console.error(
          `check-contrast: ${page.route} ${t.tag}.${t.cls} "${t.text}" — ${r.toFixed(2)}:1 (needs ${floor}) at ${t.px}px${
            t.alpha < 0.995 ? ` (alpha ${t.alpha.toFixed(2)})` : ''
          }`,
        );
        failures++;
      }
      continue;
    }

    // FILM. Hide the text, sample the region behind it across the loop.
    checked++;
    let worst = Infinity;
    let worstAt = null;

    for (let i = 0; i < FILM_SAMPLES; i++) {
      await p.evaluate(
        ([id, frac]) => {
          const el = document.querySelector(`[data-cc="${id}"]`);
          if (el) {
            el.scrollIntoView({ block: 'center', behavior: 'instant' });
            /* Blank EVERY glyph on the page, not just this element's block.
               A line box belongs to its block, so a neighbouring line's
               descenders overlap this rect and get sampled as background —
               and walking up to "the containing block" does not help when
               the masked headline spans are themselves display:block. There
               is no downside to blanking everything: only backgrounds are
               being measured, and colour:transparent leaves every background,
               border, chip and film exactly where it was. */
            document.body.classList.add('cc-blank');
          }
          for (const v of document.querySelectorAll('video')) {
            if (v.duration && isFinite(v.duration)) v.currentTime = v.duration * frac;
          }
        },
        [t.id, i / FILM_SAMPLES],
      );
      await p.waitForTimeout(260);

      /* Clip in VIEWPORT coordinates after centring the element. A fullPage
         screenshot is stitched from several captures and repaints
         position:fixed elements into every one, so the fixed nav lands
         inside clips taken far down the page. */
      const clips = await p.evaluate((id) => {
        const el = document.querySelector(`[data-cc="${id}"]`);
        if (!el) return [];
        el.scrollIntoView({ block: 'center', behavior: 'instant' });
        // Re-derive the glyph rects after scrolling — they are viewport
        // relative, so the pre-scroll values are stale.
        const out = [];
        for (const n of el.childNodes) {
          if (n.nodeType !== 3 || !n.textContent.trim()) continue;
          const range = document.createRange();
          range.selectNodeContents(n);
          for (const rr of range.getClientRects()) {
            if (rr.width < 4 || rr.height < 4) continue;
            const x = Math.max(0, Math.floor(rr.x));
            const y = Math.max(0, Math.floor(rr.y));
            const w = Math.floor(Math.min(rr.width, window.innerWidth - x));
            const h = Math.floor(Math.min(rr.height, window.innerHeight - y));
            if (w >= 4 && h >= 4) out.push({ x, y, width: w, height: h });
          }
        }
        return out.sort((a, b) => b.width - a.width).slice(0, 4);
      }, t.id);

      for (const clip of clips) {
        const shot = await p.screenshot({ clip });
        const { minL, maxL, min, max } = await worstPixel(shot);
        // Dark text is worst against the dark end; light text against the
        // light end. Take whichever applies to this foreground.
        const rawL = lum(t.fg);
        const bgL = rawL < 0.4 ? minL : maxL;
        const bgPx = rawL < 0.4 ? min : max;
        const fgL = t.alpha < 0.995 ? lum(composite(t.fg, bgPx, t.alpha)) : rawL;
        const r = ratio(fgL, bgL);
        if (r < worst) {
          worst = r;
          worstAt = bgPx;
        }
      }

      await p.evaluate(() => {
        document.querySelectorAll('.cc-blank').forEach((n) => n.classList.remove('cc-blank'));
      });
    }

    if (worst === Infinity) continue;
    if (worst < floor) {
      console.error(
        `check-contrast: ${page.route} ${t.tag}.${t.cls} "${t.text}" over film — ${worst.toFixed(
          2,
        )}:1 (needs ${floor}) at ${t.px}px, worst background rgb(${worstAt.join(',')})`,
      );
      failures++;
    }
  }

  await p.close();
}

await browser.close();

if (failures) {
  console.error(`\ncheck-contrast: ${failures} failure(s) across ${checked} text elements`);
  process.exit(1);
}
console.log(`check-contrast: ${checked} text elements measured, all clear of their WCAG AA floor`);
