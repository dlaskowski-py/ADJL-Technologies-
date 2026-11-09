/**
 * Machine View: what a crawler is handed.
 *
 * Two renderers, run at two moments:
 *
 *   renderMachine(variant)      the panel's frame, in the page renderer. It
 *                               leaves a <!--machine:variant--> marker where
 *                               the readout goes.
 *   renderMachineReadout(m, v)  the readout itself, computed from the
 *                               FINISHED page by src/lib/prerender-hooks.ts
 *                               (and again by scripts/stamp-sizes.mjs on the
 *                               page exactly as it ships, once the markdown
 *                               twin and llms.txt exist). Marked BUILD.
 *
 * motion/machine.ts then re-fetches the page with no script run, measures
 * it with the same function, and swaps values in place (BUILD → LIVE, with
 * a ▲ on anything that changed). It writes into the slots below by their
 * data-k keys and never re-renders the frame, so the readers radiogroup
 * keeps its state and nothing shifts.
 *
 * Variants (data-machine):
 *   full      home #machine and /services/seo/#machine: three readers
 *   parity    /work/this-site/#static: words readable without JavaScript
 *   schema    /work/this-site/#graph: the JSON-LD graph
 *   surfaces  /work/this-site/#surfaces: the machine-readable files
 *
 * Everything inside the readout is styled by attribute selectors scoped
 * under [data-machine] (machine.css): the live side builds some of the
 * same markup at runtime, where check-css can't see a class.
 */
import { machineView as MV, prov, status } from '../../content';
import { chip, esc } from '../html';
import type { Measure } from '../../lib/measure';
import { fmtInt, fmtKB, ldList, ldSig, ldSvg, outlineHtml, outlineSig, pathOf, siteOrg, x } from './machine-kit';

export type MachineVariant = 'full' | 'parity' | 'schema' | 'surfaces';

/* Labels that aren't in src/content.ts yet. They're short instrument
   labels, not prose; listed in WS2's report to move into machineView. */
const L = {
  title: { full: 'Machine view', parity: 'Parity', schema: MV.rows.graph, surfaces: MV.rows.surfaces },
  bytes: 'bytes',
  robotsDefault: 'index, follow (default)',
  raw: 'raw HTML',
  dom: 'rendered',
  over: 'over',
  far: 'described on another page',
  graphLabel: 'JSON-LD graph: {n} entities, {e} references',
  ldFacts: '{n} entities · {e} references · {b} block',
  parses: 'parses',
  broken: 'doesn’t parse',
  file: 'file',
  status: 'status',
  size: 'size',
  firstLines: 'first {n} lines',
  links: '{n} · {u} unique',
  other: 'mailto {m} · external {e}',
  headings: 'headings',
  missing: 'not found',
  twinMissing: 'Fetched from {url} when JavaScript runs.',
  llmsMissing: 'Read from /llms.txt when JavaScript runs.',
  /* "Entities in plain words": generated from the graph. */
  says: 'This page says it’s a {types} on the website of {org}, an Organization founded by {founder}.',
  saysNoFounder: 'This page says it’s a {types} on the website of {org}.',
  about: 'It’s about {x}.',
  also: 'It also describes a {type}: {name}.',
  questions: 'It lists {n} questions, each with its answer.',
  elsewhere: 'It points to {n} things described on other pages.',
};

/** The machine-readable files the readout checks, in the order shown. */
export const SURFACES = ['/robots.txt', '/sitemap.xml', '/llms.txt', '/llms-full.txt', '{twin}', '/build-report.json'];
/** The Crawlers reader checks the first four a crawler asks for. */
const CRAWLER_SURFACES = ['/robots.txt', '/sitemap.xml', '/llms.txt', '{twin}'];

/** How many lines of the markdown twin the Answer engines reader shows. */
export const TWIN_LINES = 40;

/** Strings the live module needs, carried on the panel so the lazy chunk
 *  never imports the site's copy. */
function liveCopy(): string {
  return esc(
    JSON.stringify({
      say: MV.announce,
      changed: MV.changed,
      live: prov.live.label,
      liveDef: prov.live.def,
      nr: status.notReported,
      nrTitle: status.notReportedTitle,
      budget: MV.rows.budget,
      lines: L.firstLines,
      links: L.links,
      missing: L.missing,
    }),
  );
}

export function renderMachine(variant: MachineVariant): string {
  const r = MV.readers;
  const readers =
    variant === 'full'
      ? `<div class="machine-bar">
      <fieldset class="machine-readers" data-readers>
        <legend class="machine-legend">${esc(r.legend)}</legend>
        <div class="machine-track">${(['people', 'crawlers', 'answer'] as const)
          .map(
            (k) =>
              `<label class="machine-opt"><input type="radio" name="machine-reader" value="${k}"${
                k === 'crawlers' ? ' checked' : ''
              } /><span>${esc(r[k])}</span></label>`,
          )
          .join('')}</div>
      </fieldset>
      <button class="btn btn--ghost machine-open" type="button" data-open-machine data-js-only><span>${esc(
        MV.open,
      )}</span><span class="arw" aria-hidden="true">→</span></button>
    </div>`
      : '';
  const foot =
    variant === 'parity'
      ? `<div class="machine-foot"><button class="btn btn--ghost machine-open" type="button" data-open-machine data-js-only><span>${esc(
          MV.open,
        )}</span><span class="arw" aria-hidden="true">→</span></button></div>`
      : '';
  return `<div class="panel machine" data-machine="${variant}" data-copy="${liveCopy()}">
    <div class="panel-head" data-chrome><span class="panel-title">${esc(L.title[variant])}</span>${chip('build')}</div>
    ${readers}
    <div data-machine-readout="${variant}"><!--machine:${variant}--></div>
    ${foot}
    <p class="sr-only" aria-live="polite" data-machine-say></p>
  </div>`;
}

/* ── The readout ───────────────────────────────────────────────────── */

export type ReadoutExtras = {
  /** The markdown twin, read from dist at build (stamp-sizes): its first
   *  TWIN_LINES lines and its full length in characters. */
  twin?: { head: string; chars: number } | null;
  /** This page's line in /llms.txt, read from dist at build. */
  llms?: string | null;
  /** Bytes on disk of each machine-readable file, read at build. */
  surfaces?: Record<string, number>;
};

const NEEDS = `title="${esc(status.needsJsTitle)}"`;

/** A value only a live fetch can fill: "needs JS" until then. */
const live = (k: string, tag = 'b') => `<${tag} data-k="${k}" data-nojs ${NEEDS}>${esc(status.needsJs)}</${tag}>`;

/** A value with a character budget: the text, a bar, and "57 of 60". */
function budgeted(k: string, text: string, max: number): string {
  const n = [...text].length;
  const f = Math.min(1, n / max);
  const over = n > max;
  return `<dd data-k="${k}" data-v="${x(text)}"><q data-text>${x(text)}</q><span data-gauge${over ? ' data-over' : ''}><span data-meter aria-hidden="true"><i style="--f:${f.toFixed(
    3,
  )}"></i></span><span data-n>${esc(String(n))} ${esc(MV.rows.budget.replace('{n}', String(max)))}${
    over ? ` <span data-warn>▲ ${esc(L.over)}</span>` : ''
  }</span></span></dd>`;
}

const row = (label: string, dd: string, attrs = '') => `<div data-row${attrs}><dt>${esc(label)}</dt>${dd}</div>`;

function reqStrip(m: Measure): string {
  const path = pathOf(m.canonical);
  return `<p data-req><span data-verb>GET</span> <span data-path>${x(path)}</span><span data-cell><span data-l>${esc(
    MV.rows.status,
  )}</span> ${live('status')}</span><span data-cell><span data-l>${esc(MV.rows.ttfb)}</span> ${live(
    'ttfb',
  )}</span><span data-cell><span data-l>${esc(L.bytes)}</span> ${live('bytes')}</span></p>`;
}

/** The parity meter: words in the raw HTML (N, BUILD) against words the
 *  browser rendered (M, live only). Both bars scale to the larger. */
function parity(m: Measure, big = false): string {
  const n = fmtInt(m.words);
  return `<div data-parity${big ? ' data-big' : ''}>
    <p data-l>${esc(MV.rows.words)}</p>
    <p data-figure><b data-k="words" data-v="${m.words}">${n}</b> <span data-of>${esc(
      MV.rows.budget.replace('{n}', '\u0000'),
    ).replace('\u0000', live('dom'))}</span> <span data-k="pct"></span></p>
    <div data-bars aria-hidden="true">
      <div data-bar="raw"><span data-bl>${esc(L.raw)}</span><span data-track><i style="--f:1" data-k="rawbar"></i></span><span data-bn>${n}</span></div>
      <div data-bar="dom"><span data-bl>${esc(L.dom)}</span><span data-track data-empty><i style="--f:0" data-k="dombar"></i></span><span data-bn data-k="dom2">${esc(
        status.needsJs,
      )}</span></div>
    </div>
  </div>`;
}

function surfacesList(m: Measure, which: string[], ex: ReadoutExtras): string {
  const twin = m.twin || `${pathOf(m.canonical)}index.md`;
  return `<ul data-surfaces>${which
    .map((p) => {
      const path = p === '{twin}' ? twin : p;
      const size = ex.surfaces?.[path];
      return `<li data-surface="${x(path)}"><a href="${x(path)}" data-file>${x(path)}</a><span data-k="s:${x(
        path,
      )}" data-nojs ${NEEDS}>${esc(status.needsJs)}</span><span data-k="b:${x(path)}"${
        size !== undefined ? ` data-v="${size}">${fmtKB(size)}` : ` data-nojs ${NEEDS}>${esc(status.needsJs)}`
      }</span></li>`;
    })
    .join('')}</ul>`;
}

function graphBlock(m: Measure, origin: string): string {
  const label = L.graphLabel.replace('{n}', String(m.ld.nodes.length)).replace('{e}', String(m.ld.edges.length));
  const facts = L.ldFacts
    .replace('{n}', String(m.ld.nodes.length))
    .replace('{e}', String(m.ld.edges.length))
    .replace('{b}', String(m.jsonLdBlocks));
  return `<div data-graph data-k="ld" data-v="${x(ldSig(m.ld))}">
    <div data-svg>${ldSvg(m.ld, label, origin)}</div>
    <div data-ld-side>
      <p data-facts>${esc(facts)} · <span data-ok="${m.jsonLdValid ? 'yes' : 'no'}">${m.jsonLdValid ? '✓' : '✕'} ${esc(
        m.jsonLdValid ? L.parses : L.broken,
      )}</span></p>
      ${ldList(m.ld, L.far, origin)}
    </div>
  </div>`;
}

/** The entities, in plain words, from the graph alone. */
export function entitySentences(m: Measure, origin = ''): string {
  const nodes = m.ld.nodes;
  const org = siteOrg(nodes, origin);
  const page = nodes.find((n) => n.local && n.types.includes('WebPage'));
  if (!page || !org) return '';
  const name = (id: string) => {
    const n = nodes.find((k) => k.id === id);
    return n?.name || n?.types[0] || '';
  };
  const founder = m.ld.edges.find((e) => e.from === org.id && e.prop === 'founder');
  const types = page.types.join(' and ');
  const out = [
    (founder ? L.says : L.saysNoFounder)
      .replace('{types}', types)
      .replace('{org}', org.name)
      .replace('{founder}', founder ? name(founder.to) : ''),
  ];
  const about = m.ld.edges
    .filter((e) => e.from === page.id && e.prop === 'about')
    .map((e) => name(e.to))
    .filter(Boolean);
  if (about.length) out.push(L.about.replace('{x}', about.join(' and ')));
  for (const n of nodes) {
    if (!n.local || n === org || n === page) continue;
    if (n.types.some((t) => ['WebSite', 'Person', 'BreadcrumbList', 'Organization'].includes(t))) continue;
    out.push(L.also.replace('{type}', n.types[0]).replace('{name}', n.name || n.types[0]));
  }
  const q = page.inline.Question;
  if (q) out.push(L.questions.replace('{n}', String(q)));
  const far = nodes.filter((n) => !n.local).length;
  if (far) out.push(L.elsewhere.replace('{n}', String(far)));
  return out.join(' ');
}

function answerPane(m: Measure, ex: ReadoutExtras, origin: string): string {
  const twinUrl = m.twin || `${pathOf(m.canonical)}index.md`;
  const t = ex.twin;
  const lines = L.firstLines.replace('{n}', String(TWIN_LINES));
  return `<div data-pane="answer">
    <div data-twin>
      <p data-l>${esc(MV.rows.twin)} · <a href="${x(twinUrl)}" data-file>${x(twinUrl)}</a> · <span data-lines>${esc(lines)}</span></p>
      ${
        t
          ? `<pre data-k="twin" data-v="${t.chars}" tabindex="0">${x(t.head)}</pre>`
          : `<pre data-k="twin" data-nojs tabindex="0">${esc(L.twinMissing.replace('{url}', twinUrl))}</pre>`
      }
    </div>
    <dl data-rows>
      ${row(
        MV.rows.tokens,
        t
          ? `<dd data-k="tokens" data-v="${Math.round(t.chars / 4)}">≈ ${fmtInt(t.chars / 4)}</dd>`
          : `<dd>${live('tokens', 'span')}</dd>`,
      )}
      ${row(
        MV.rows.llms,
        ex.llms
          ? `<dd><code data-k="llms" data-v="${x(ex.llms)}">${x(ex.llms)}</code></dd>`
          : `<dd><code data-k="llms" data-nojs ${NEEDS}>${esc(L.llmsMissing)}</code></dd>`,
      )}
      ${row(MV.rows.graph, `<dd data-k="says" data-v="${x(ldSig(m.ld))}">${x(entitySentences(m, origin))}</dd>`)}
    </dl>
  </div>`;
}

function peoplePane(): string {
  const mt = status.metrics;
  const keys = ['lcp', 'cls', 'inp', 'transfer', 'thirdparty'] as const;
  return `<div data-pane="people">
    <dl data-rows data-people>${keys
      .map((k) =>
        row(
          mt[k],
          /* 3rd-party has a BUILD value (stamp-sizes counts other-origin
             resources in the HTML); the rest exist only live. */
          k === 'thirdparty'
            ? `<dd><span class="num" data-metric="${k}" data-reading="build" title="${esc(prov.build.def)}"></span></dd>`
            : `<dd><span class="num" data-metric="${k}" data-state="nojs" ${NEEDS}>${esc(status.needsJs)}</span></dd>`,
        ),
      )
      .join('')}</dl>
  </div>`;
}

function crawlersPane(m: Measure, ex: ReadoutExtras, origin: string): string {
  const rows = [
    row(MV.rows.title, budgeted('title', m.title, 60)),
    row(MV.rows.description, budgeted('description', m.description, 160)),
    row(MV.rows.canonical, `<dd data-k="canonical" data-v="${x(m.canonical)}"><code>${x(m.canonical)}</code></dd>`),
    row(
      MV.rows.robots,
      `<dd data-k="robots" data-v="${x(m.robots)}"><code>${x(m.robots || L.robotsDefault)}</code></dd>`,
    ),
    row(MV.rows.h1, `<dd data-k="h1" data-v="${m.h1}">${m.h1}</dd>`),
    row(
      MV.rows.links,
      `<dd data-k="links" data-v="${m.links.internal}/${m.links.targets}">${esc(
        L.links.replace('{n}', fmtInt(m.links.internal)).replace('{u}', fmtInt(m.links.targets)),
      )} <span data-dim>${esc(L.other.replace('{m}', String(m.links.mailto)).replace('{e}', String(m.links.external)))}</span></dd>`,
    ),
  ].join('');
  return `<div data-pane="crawlers">
    <div data-cols>
      <div data-col="facts">
        <dl data-rows>${rows}</dl>
        ${parity(m)}
      </div>
      <div data-col="outline">
        <p data-l>${esc(MV.rows.outline)} · <span data-dim>${fmtInt(m.headings.filter((h) => h.level <= 3).length)} ${esc(
          L.headings,
        )}</span></p>
        <div data-k="outline" data-v="${x(outlineSig(m.headings))}" data-scroll tabindex="0">${outlineHtml(m.headings)}</div>
      </div>
    </div>
    <div data-cols="wide">
      <div data-col="graph"><p data-l>${esc(MV.rows.graph)}</p>${graphBlock(m, origin)}</div>
      <div data-col="surfaces"><p data-l>${esc(MV.rows.surfaces)}</p>${surfacesList(m, CRAWLER_SURFACES, ex)}</div>
    </div>
  </div>`;
}

export function renderMachineReadout(m: Measure, variant: MachineVariant, ex: ReadoutExtras = {}): string {
  const origin = /^[a-z]+:\/\/[^/]+/i.exec(m.canonical)?.[0] ?? '';
  switch (variant) {
    case 'full':
      return `<div data-mr="full">${reqStrip(m)}${peoplePane()}${crawlersPane(m, ex, origin)}${answerPane(
        m,
        ex,
        origin,
      )}</div>`;
    case 'parity':
      return `<div data-mr="parity">${reqStrip(m)}${parity(m, true)}<dl data-rows data-inline>${row(
        MV.rows.h1,
        `<dd data-k="h1" data-v="${m.h1}">${m.h1}</dd>`,
      )}${row(
        L.headings,
        `<dd data-k="hcount" data-v="${m.headings.length}">${fmtInt(m.headings.length)}</dd>`,
      )}${row(
        MV.rows.links,
        `<dd data-k="links" data-v="${m.links.internal}/${m.links.targets}">${esc(
          L.links.replace('{n}', fmtInt(m.links.internal)).replace('{u}', fmtInt(m.links.targets)),
        )}</dd>`,
      )}</dl></div>`;
    case 'schema':
      return `<div data-mr="schema">${graphBlock(m, origin)}</div>`;
    case 'surfaces':
      return `<div data-mr="surfaces"><p data-surface-head aria-hidden="true"><span>${esc(L.file)}</span><span>${esc(
        L.status,
      )}</span><span>${esc(L.size)}</span></p>${surfacesList(m, SURFACES, ex)}</div>`;
  }
}
