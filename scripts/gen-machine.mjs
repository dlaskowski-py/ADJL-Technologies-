/**
 * The machine surfaces that are built from the finished pages. Runs right
 * after prerender.mjs, and mutates the built HTML in one place: the Ask
 * panels' <!--ask:pre--> markers.
 *
 *   1. /search-index.json   every quotable passage on the site (<p>, <li>,
 *                           <dd> and FAQ answers inside <main>, with the
 *                           shared exclusion set applied, and the Ask panel
 *                           and footer left out), plus N, avgdl and the
 *                           stopword list. df and postings are built in the
 *                           browser on load, and checked against N and avgdl.
 *   2. Ask precompute       every chip's answer, computed here by the same
 *                           src/lib/bm25.ts the browser runs, written into
 *                           each Ask panel as <article id="ask-q{n}">. With
 *                           JavaScript off the chips link to these, and
 *                           check-links validates every citation in them. A
 *                           passage quoted once is linked, not re-quoted, by
 *                           later answers. "Break the input" answers also
 *                           carry data-met: every slider floor at which the
 *                           case does what it promises.
 *   3. Ask evaluation       the demo has its own evaluation set: every home
 *                           chip must answer, and each "Break the input"
 *                           chip must answer, abstain, or answer from two
 *                           sections, at the default floor. If one doesn't,
 *                           the build stops here.
 *   4. /source/<slug>.json  what Source view shows for each section: its
 *                           content object (raw {em} markers kept), renderer,
 *                           motion contracts and bytes.
 *   5. dist/_headers        X-Robots-Tag: noindex for the index and the
 *                           source sheets.
 *
 *   node scripts/gen-machine.mjs            the build step
 *   node scripts/gen-machine.mjs --dry      read dist/, write nothing, and
 *                                           print every chip's retrieval
 *   node scripts/gen-machine.mjs --explain  the same table, then build
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { gzipSync } from 'node:zlib';
import { PAGES, slugOf } from './pages.mjs';
import { loadTs } from './lib/ts.mjs';
import { pass } from './lib/report.mjs';
import { addHeaders } from './lib/headers.mjs';

const DRY = process.argv.includes('--dry');
const EXPLAIN = DRY || process.argv.includes('--explain');
const NAME = 'gen-machine';

const { walk, decodeEntities } = await loadTs('src/lib/tokenize.ts');
const { isExcluded, INLINE } = await loadTs('src/lib/exclude.ts');
const bm = await loadTs('src/lib/bm25.ts');
const C = await loadTs('src/content.ts');

/** Index budget, gzipped (spec §9). */
/* 40 kB. The index holds every indexable passage on the site, so it grows
   with the copy: 22 at first, 24 with the landing page, 26 with Loep, and
   40 with the eleven pages of the second round (the scanner, the start
   page, the agents page, the audit, the research case, three notes and
   the changelog), which took it from 16 pages to 27. It's fetched only
   when a visitor first touches Ask, never on page load, which is why its
   cap can follow the content. A new page is a reason to raise it; longer
   copy on an old one isn't. */
const INDEX_BUDGET = 40 * 1024;
/** A passage needs this many words to be worth quoting. Shorter <li> and
 *  <dd> are labels ("Week one", "Home"), not answers. */
const MIN_WORDS = 4;

let problems = 0;
const fail = (msg) => {
  console.error(`${NAME}: ${msg}`);
  problems++;
};

const squash = (s) => s.replace(/\s+/g, ' ').trim();
const words = (s) => s.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
const gz = (s) => gzipSync(Buffer.from(s), { level: 9 }).length;
const kb = (n) => `${(n / 1024).toFixed(1)} kB`;

/* ── Reading the pages ─────────────────────────────────────────────── */

/** The injected answers from an earlier run, so a re-run starts clean. */
const PRE = /<!--ask:pre-->[\s\S]*?<!--\/ask:pre-->|<!--ask:pre-->/g;
const strip = (html) => html.replace(PRE, '<!--ask:pre-->');

/** Not quotable: the shared exclusion set, plus the Ask panel itself
 *  (it quotes passages, it isn't one), the footer, navigation, anything
 *  hidden, the mono eyebrows and labels, the hero spec strips (a
 *  label names a thing; it doesn't answer anything), and the home page's
 *  "You say / We write / You get" strip: its request is a made-up example,
 *  and Ask quoting it would present it as something a customer said. */
const LABELS = /(^|\s)(eyebrow|label|specs|lp-build|ag-tool)(\s|$)/;
const skip = (el) =>
  isExcluded(el.name, el.attrs) ||
  LABELS.test(el.attrs.class ?? '') ||
  'data-ask' in el.attrs ||
  'hidden' in el.attrs ||
  el.name === 'footer' ||
  el.name === 'nav';

const PASSAGE = new Set(['p', 'li', 'dd']);
const HEADING = new Set(['h1', 'h2', 'summary']);

/**
 * Every passage on one page, in reading order, plus every id on the page
 * (citations are checked against them).
 */
function readPage(html, route) {
  const out = [];
  const ids = new Set();
  /* Open passages, innermost last. One that contains another passage is
     "dead": its inner <p>s are the passages, not the wrapper <li>. */
  const open = [];
  let heading = '';
  let hbuf = null;
  let headId = null; // { id, start } of the last heading that carried an id

  const inMain = (el) => {
    for (let e = el; e; e = e.parent) if (e.name === 'main') return true;
    return false;
  };

  walk(
    html,
    {
      open(el, stack) {
        if (el.attrs.id) ids.add(el.attrs.id);
        if (el.excluded || !inMain(el)) return;
        if (HEADING.has(el.name)) hbuf = [];
        if (/^h[1-6]$/.test(el.name) && el.attrs.id) headId = { id: el.attrs.id, start: el.start };
        if (hbuf && !INLINE.has(el.name)) hbuf.push(' ');
        for (const p of open) if (!INLINE.has(el.name)) p.parts.push(' ');
        if (!PASSAGE.has(el.name)) {
          if (el.name === 'a') for (const p of open) p.linkDepth++;
          return;
        }
        for (const p of open) p.dead = true;
        /* The citation anchor: the nearest ancestor with an id, or a
           heading with an id that opened after it. */
        let anc = null;
        let sec = null;
        for (let i = stack.length - 2; i >= 0; i--) {
          const s = stack[i];
          if (!anc && s.attrs.id && s.name !== 'main') anc = s;
          if (s.name === 'section' && s.attrs.id) sec = s.attrs.id;
        }
        const anchor = headId && (!anc || headId.start > anc.start) ? headId.id : anc?.attrs.id;
        open.push({ el, parts: [], linkText: 0, allText: 0, linkDepth: 0, dead: false, anchor, sec, heading });
      },
      close(el) {
        if (el.excluded || !inMain(el)) return;
        if (HEADING.has(el.name) && hbuf) {
          heading = squash(hbuf.join(''));
          hbuf = null;
        }
        if (el.name === 'a') for (const p of open) p.linkDepth = Math.max(0, p.linkDepth - 1);
        for (const p of open) if (!INLINE.has(el.name)) p.parts.push(' ');
        if (!PASSAGE.has(el.name) || open[open.length - 1]?.el !== el) return;
        const p = open.pop();
        const text = squash(p.parts.join('')).replace(/\s+([,.;:!?)])/g, '$1');
        if (p.dead || words(text) < MIN_WORDS) return;
        /* A list item that's only a link is navigation, not an answer. */
        if (p.linkText >= p.allText) return;
        if (!p.anchor) {
          fail(`${route}: a passage has no id before it to cite: "${text.slice(0, 60)}…"`);
          return;
        }
        out.push({
          route,
          anchor: p.anchor,
          heading: p.heading || '',
          text,
          ...(p.sec && p.sec !== p.anchor ? { sec: p.sec } : {}),
        });
      },
      text(t, info) {
        if (info.excluded || info.raw || !inMain(info.parent)) return;
        if (hbuf) hbuf.push(t);
        const p = open[open.length - 1];
        if (!p) return;
        p.parts.push(t);
        const n = t.trim().length;
        p.allText += n;
        if (p.linkDepth > 0) p.linkText += n;
      },
    },
    { skip },
  );
  return { passages: out, ids };
}

/* ── Source sheets ─────────────────────────────────────────────────── */

/** Motion and instrument contracts (spec §3.16), as attributes. */
const CONTRACTS = [
  'data-reveal', 'data-scrub', 'data-flow', 'data-lattice', 'data-compile', 'data-decode',
  'data-telemetry', 'data-views', 'data-machine', 'data-ask', 'data-pipeline', 'data-replay',
  'data-leaders', 'data-headers', 'data-palette', 'data-scene', 'data-typer', 'data-intro-overlay',
];

/** "content.sections[2].items" → ['content', 'sections', 2, 'items'] */
const pathOf = (s) =>
  s
    .replace(/\[(\d+)\]/g, '.$1')
    .split('.')
    .filter(Boolean)
    .map((k) => (/^\d+$/.test(k) ? Number(k) : k));

async function resolveSrc(src) {
  const [file, path = ''] = src.split('#');
  const mod = await loadTs(`src/${file}`);
  let v = mod;
  for (const k of pathOf(path)) {
    if (v == null || !(k in Object(v))) return { error: `${file} has no ${path}` };
    v = v[k];
  }
  return { value: v };
}

/** Every <section data-src data-renderer> on a built page. */
function sectionsOf(html) {
  const found = [];
  walk(html, {
    open(el) {
      if (el.name === 'section' && el.attrs['data-src'] && el.attrs['data-renderer']) {
        found.push({ el, contracts: [] });
      }
      for (const f of found) {
        if (f.el.end >= 0 && f.el.end <= el.start) continue;
        for (const c of CONTRACTS) if (c in el.attrs && !f.contracts.includes(c)) f.contracts.push(c);
      }
    },
  });
  return found.map(({ el, contracts }) => ({
    id: el.attrs.id ?? '',
    src: el.attrs['data-src'],
    renderer: el.attrs['data-renderer'],
    contracts,
    html: html.slice(el.start, el.end),
  }));
}

/* ── Ask answers, as prerendered HTML ──────────────────────────────── */

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** The abstain sentence, with the address linked: the renderer's own, so
 *  the live panel and these answers can't word it differently. */
const { abstainSay } = await loadTs('src/sections/instruments/ask.ts');

/** The slider's floors, as whole percents: 15, 20 … 75. */
const FLOORS = [];
for (let f = bm.FLOOR_MIN; f <= bm.FLOOR_MAX + 1e-9; f += bm.FLOOR_STEP) FLOORS.push(Math.round(f * 100));

/**
 * One chip's answer. `quoted` maps each passage already quoted in this
 * panel to the answer that quoted it: a later answer citing the same
 * passage links it and says where it's quoted, instead of quoting it
 * twice. ("Who ownes the code?" citing the same three passages as "Who
 * owns the code…" is the point of that case, and reads better that way.)
 */
function articleHtml(n, q, res, ui, expect, quoted) {
  const { cited } = res.answer;
  const ok = cited.length > 0;
  const head = ok
    ? (cited.length === 1 ? C.ask.announce.one : C.ask.announce.cited.replace('{n}', String(cited.length)))
    : C.ask.announce.none;
  const quotes = cited
    .map((h) => {
      const qt = bm.quote(h.p.text, h.matched, engine.stop);
      const href = `${h.p.route}#${h.p.anchor}`;
      const key = `${href} ${qt.text}`;
      const first = quoted.get(key);
      if (first === undefined) quoted.set(key, n);
      const cite = `<p data-a="cite"><a href="${esc(href)}"><span data-a="where">${esc(href)}</span><span data-a="head">${esc(
        h.p.heading,
      )}</span></a><span data-a="conf">${bm.fmt(h.conf)}</span>${
        first === undefined ? '' : `<a data-a="same" href="#ask-q${first}">${esc(ui.sameAs.replace('{n}', String(first)))}</a>`
      }</p>`;
      return first === undefined
        ? `<li data-a="quote"><blockquote data-a="text" data-cut="${+qt.before}${+qt.after}"><p>${esc(qt.text)}</p></blockquote>${cite}</li>`
        : `<li data-a="quote">${cite}</li>`;
    })
    .join('');
  /* A "Break the input" case also carries every slider floor at which it
     does what it promises, so the panel's verdicts can follow the slider
     without re-running four searches on every step. */
  const met = expect
    ? ` data-met="${FLOORS.filter((f) => bm.meets(expect, bm.gate(res.search, f / 100))).join(' ')}"`
    : '';
  return `<article class="askp-pre" id="ask-q${n}" data-outcome="${ok ? 'answer' : 'abstain'}"${met}>
      <p class="askp-pre-head"><span>${esc(ui.preLabel.replace('{n}', String(n)))}</span><span>${esc(head)}</span></p>
      <p class="askp-pre-q">${esc(q)}</p>
      ${ok ? `<ol data-a="quotes">${quotes}</ol>` : `<p data-a="abstain"><span data-a="glyph" aria-hidden="true">▲</span> <span>${abstainSay()}</span></p>`}
    </article>`;
}

/* ── Run ───────────────────────────────────────────────────────────── */

const UI = (await loadTs('src/content-instruments.ts')).askUi;

const pages = [];
for (const page of PAGES) {
  if (!existsSync(page.out)) {
    fail(`${page.out} is missing. Run vite build and prerender first.`);
    continue;
  }
  const html = strip(readFileSync(page.out, 'utf8'));
  pages.push({ page, html, ...readPage(html, page.route) });
}
if (problems) process.exit(1);

/* 1. The index. Each passage once: the contact block and the shared
      practice copy appear on several pages, and the first page in the
      registry (home first) is the one that gets cited. */
const seen = new Set();
const list = [];
let dupes = 0;
for (const pg of pages) {
  /* A noindex page (the form's thank-you page) is nothing Ask should cite. */
  if (pg.page.noindex) continue;
  for (const p of pg.passages) {
    if (seen.has(p.text)) {
      dupes++;
      continue;
    }
    seen.add(p.text);
    list.push(p);
  }
}
const index = bm.buildIndex(list);
const indexJson = JSON.stringify(index);
const indexGz = gz(indexJson);
if (indexGz > INDEX_BUDGET) {
  fail(`search-index.json is ${kb(indexGz)} gz, over its ${kb(INDEX_BUDGET)} budget.`);
}
const engine = bm.createEngine(index);
if (!engine.ok) fail('the search index and src/lib/bm25.ts disagree about N or avgdl');
const idsOf = new Map(pages.map((pg) => [pg.page.route, pg.ids]));

/* 2 + 3. Precompute, inject, evaluate. */
const EXPECT_TEXT = { answer: 'answers', abstain: 'abstains', 'answer-2': 'answers from two sections' };
const results = [];
for (const pg of pages) {
  const m = /<[^>]*\bdata-ask="(home|full)"/.exec(pg.html);
  if (!m) continue;
  if (!pg.html.includes('<!--ask:pre-->')) {
    fail(`${pg.page.route}: the Ask panel has no <!--ask:pre--> marker`);
    continue;
  }
  const variant = m[1];
  const qs =
    variant === 'full'
      ? C.ask.groups.items.map((g) => ({ q: g.q, expect: g.expect, label: g.label }))
      : C.ask.chips.map((q) => ({ q, expect: 'answer', label: 'Home chip' }));
  const quoted = new Map();
  const articles = qs.map((item, i) => {
    const res = bm.run(engine, item.q, bm.FLOOR);
    const { cited } = res.answer;
    const ok = bm.meets(item.expect, res.answer) && new Set(cited.map((h) => bm.sectionOf(h.p))).size === cited.length;
    for (const h of cited) {
      if (!idsOf.get(h.p.route)?.has(h.p.anchor)) fail(`citation ${h.p.route}#${h.p.anchor} doesn't resolve`);
    }
    results.push({ route: pg.page.route, variant, ...item, res, ok });
    return articleHtml(i + 1, item.q, res, UI, variant === 'full' && item.expect, quoted);
  });
  pg.html = pg.html.replace('<!--ask:pre-->', `<!--ask:pre-->${articles.join('')}<!--/ask:pre-->`);
}

if (EXPLAIN) {
  for (const r of results) {
    const { search, answer } = r.res;
    console.log(
      `\n${r.ok ? '✓' : '✕'} ${r.route} [${r.variant}] "${r.q}" expects ${r.expect}: cited ${answer.cited.length}` +
        `, best ${bm.fmt(answer.best)}${search.parts.length > 1 ? `, ${search.parts.length} parts` : ''}`,
    );
    for (const pt of search.parts) {
      console.log(`    part "${pt.text}": ${pt.terms.map((t) => `${t.term}(df ${t.df})`).join(' ')}`);
    }
    for (const h of search.hits.slice(0, bm.TOP)) {
      const mark = answer.cited.includes(h) ? '●' : answer.above.includes(h) ? '○' : ' ';
      console.log(
        `  ${mark} ${bm.fmt(h.conf)} ${h.score.toFixed(2).padStart(6)}  q${h.part + 1} ${`${h.p.route}#${h.p.anchor}`.padEnd(
          44,
        )} ${h.p.text.slice(0, 70)}`,
      );
    }
  }
  console.log(`\n${index.N} passages (${dupes} duplicates dropped), avgdl ${index.avgdl}, ${engine.post.size} terms, ${kb(indexJson.length)} raw, ${kb(indexGz)} gz`);
}

const broken = results.filter((r) => !r.ok);
for (const r of broken) {
  const best = r.res.answer.best;
  fail(
    `Ask chip "${r.q}" (${r.route}) should ${EXPECT_TEXT[r.expect].replace(/s\b/, '')} at floor ${bm.fmt(bm.FLOOR)}, ` +
      `but it cited ${r.res.answer.cited.length} passage(s); best confidence ${bm.fmt(best)}. ` +
      `Run node scripts/gen-machine.mjs --dry to see what it retrieved.`,
  );
}

/* 4. Source sheets. */
let sheets = 0;
let unresolved = 0;
const sources = [];
for (const pg of pages) {
  const secs = [];
  for (const s of sectionsOf(pg.html)) {
    const r = await resolveSrc(s.src).catch((e) => ({ error: String(e?.message ?? e).split('\n')[0] }));
    if (r.error) {
      unresolved++;
      console.warn(`${NAME}: ${pg.page.route}#${s.id} data-src "${s.src}" doesn't resolve (${r.error})`);
    }
    secs.push({
      id: s.id,
      src: s.src,
      renderer: s.renderer,
      contracts: s.contracts,
      bytes: { raw: Buffer.byteLength(s.html), gz: gz(s.html) },
      content: r.error ? null : r.value ?? null,
    });
  }
  sources.push({ slug: slugOf(pg.page.route), json: JSON.stringify({ v: 1, route: pg.page.route, sections: secs }) });
  sheets += secs.length;
}

if (problems) process.exit(1);

const answered = results.filter((r) => r.res.answer.cited.length > 0).length;
const summary =
  `search index ${index.N} passages from ${pages.length} pages, ${kb(indexGz)} gz; ` +
  `${results.length} Ask chips behave as expected at floor ${bm.fmt(bm.FLOOR)} ` +
  `(${answered} answer, ${results.length - answered} abstain); ` +
  `${sources.length} source files, ${sheets} sections${unresolved ? `, ${unresolved} unresolved` : ''}`;

if (DRY) {
  console.log(`${NAME} (dry run, nothing written): ${summary}`);
  process.exit(0);
}

const put = (file, body) => {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, body);
};
put('dist/search-index.json', indexJson);
for (const pg of pages) put(pg.page.out, pg.html);
for (const s of sources) put(`dist/source/${s.slug}.json`, s.json);
addHeaders('/search-index.json', { 'X-Robots-Tag': 'noindex' });
addHeaders('/source/*', { 'X-Robots-Tag': 'noindex' });

pass(NAME, summary);
