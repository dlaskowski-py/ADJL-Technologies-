/**
 * The scanner's report, drawn by both sides: the /scan/ renderer in Node
 * (the recorded example, prerendered) and src/motion/scan.ts in the
 * browser (a visitor's own scan, from /api/scan). Same function, so a scan
 * the visitor runs looks exactly like the example they were shown.
 *
 * CONTENT-FREE ON PURPOSE, like machine-kit.ts: nothing here imports
 * src/content*.ts, because the lazy chunk imports this file. Every sentence
 * arrives in `copy` (src/content-scan.ts `scanCopy`, written into the page
 * as a JSON block for the browser). Values from the scanned page are
 * someone else's text: every one goes through x().
 *
 * Markup here is styled by ATTRIBUTE selectors under [data-scan]
 * (src/styles/pages/scan.css), never by classes, because the browser builds
 * the same markup at runtime where check-css can't see it. The readouts are
 * data-chrome (they're measurements, not sentences); the findings are prose.
 *
 * The result shape is what netlify/functions/scan.mjs returns.
 */

export type Layer = 'people' | 'crawlers' | 'machines';
export type Level = 'fix' | 'improve' | 'note' | 'ok';
export type Group = 'search' | 'answers' | 'fetch' | 'training';

export type Finding = { id: string; layer: Layer; level: Level; vars: Record<string, string | number> };

export type ScanResult = {
  v: 1;
  url: string;
  finalUrl: string;
  at: string;
  ms: number;
  fetch: {
    status: number;
    ms: number;
    firstByte: number;
    bytes: number;
    transfer: number;
    type: string;
    encoding: string;
    redirects: { status: number; from: string; to: string }[];
    xRobots: string;
  };
  page: {
    title: string;
    titles: number;
    description: string;
    lang: string;
    /** The text of the first 50 h1s, in order. */
    h1s: string[];
    /** How many h1s the page has. */
    h1Count: number;
    headings: { level: number; text: string }[];
    headingCount: number;
    words: number;
    mainWords: number | null;
    shell: { root: string; scripts: number; noscriptJs: boolean };
    links: { internal: number; external: number; nofollow: number; targets: number };
    images: { total: number; missingAlt: number };
    canonical: string;
    canonicals: number;
    robotsMeta: string;
    botMeta: string;
    refresh: string;
    og: Record<string, string>;
    twitter: Record<string, string>;
    jsonld: { blocks: number; invalid: number; types: string[] };
    microdata: number;
  };
  robots: { state: 'found' | 'missing' | 'unreadable' | 'error' | 'timeout'; status: number; bytes?: number; sitemaps: string[] };
  sitemap: {
    state: 'found' | 'missing' | 'html' | 'unreadable' | 'error' | 'timeout';
    status: number;
    url: string;
    declared: boolean;
    kind?: string;
    urls?: number;
    truncated?: boolean;
  };
  llms: { state: 'found' | 'missing' | 'html' | 'error' | 'timeout'; status: number; bytes?: number; heading?: string };
  agents: { token: string; verdict: 'allowed' | 'blocked' | 'unknown'; rule: 'own' | 'all' | 'none' | 'error'; line: string }[];
  findings: Finding[];
};

export type Crawler = { token: string; by: string; group: Group; what: string };

export type FindingCopy = { title: string; why?: string; fix?: string };

/** Every word the report uses. src/content-scan.ts `scanCopy`. */
export type ScanCopy = {
  title: string;
  request: { method: string; status: string; time: string; size: string; redirects: string; none: string };
  summary: { label: string; tally: Record<Level, string>; clear: string; checked: string };
  levels: Record<Level, string>;
  todo: string;
  layers: Record<Layer, { n: string; title: string; sub: string }>;
  rows: Record<string, string>;
  values: Record<string, string>;
  findings: Record<string, FindingCopy>;
  agents: {
    title: string;
    sub: string;
    head: { token: string; by: string; what: string; verdict: string };
    groups: Record<Group, string>;
    verdicts: Record<'allowed' | 'blocked' | 'unknown', string>;
    rules: Record<'own' | 'all' | 'none' | 'error', string>;
  };
  crawlers: Crawler[];
};

/* ── Formatting ─────────────────────────────────────────────────────── */

/** Escape for text and attributes alike. */
export const x = (s: string | number): string =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const fmtKB = (bytes: number): string => `${(bytes / 1024).toFixed(1)} kB`;
export const fmtMs = (ms: number): string => (ms >= 1000 ? `${(ms / 1000).toFixed(1)} s` : `${Math.round(ms)} ms`);

/** A value for a sentence: whole numbers get thousands separators. */
const val = (v: string | number): string => (typeof v === 'number' ? v.toLocaleString('en-US') : v);

/** Fill {name} slots. Values are escaped; the copy around them is ours. */
export function fill(s: string, vars: Record<string, string | number> = {}): string {
  return x(s).replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? x(val(vars[k])) : m));
}

/** An address without its scheme, for headings and labels. */
export const bare = (u: string): string => u.replace(/^https?:\/\//i, '');

const GLYPH: Record<Level, string> = { fix: '✕', improve: '▲', note: '●', ok: '✓' };

/** The three planes of the hero figure, the active one lit. */
const planes = (layer: Layer): string => `<svg data-part="planes" data-on="${layer}" viewBox="0 0 40 34" aria-hidden="true">
  <path data-plane="machines" d="M20 18 38 25 20 32 2 25Z"/>
  <path data-plane="crawlers" d="M20 10 38 17 20 24 2 17Z"/>
  <path data-plane="people" d="M20 2 38 9 20 16 2 9Z"/>
</svg>`;

/* ── Pieces ─────────────────────────────────────────────────────────── */

type Row = [label: string, value: string, attrs?: string];

const rowsHtml = (rows: Row[]): string =>
  `<dl data-part="readout" data-chrome>${rows
    .map(([k, v, a]) => `<div data-part="row"${a ? ` ${a}` : ''}><dt>${x(k)}</dt><dd>${v}</dd></div>`)
    .join('')}</dl>`;

const q = (s: string, none: string): string => (s ? `<q>${x(s)}</q>` : `<span data-part="none">${x(none)}</span>`);

function findingHtml(f: Finding, c: ScanCopy): string {
  const fc = c.findings[f.id];
  if (!fc) return '';
  const head = `<span data-part="mark" aria-hidden="true">${GLYPH[f.level]}</span><span data-part="level">${x(c.levels[f.level])}</span>`;
  if (f.level === 'ok') {
    /* A fine line is a readout ("Title set, 57 characters."), not a
       sentence to quote: data-chrome keeps it out of Ask and the twins. */
    return `<li data-level="ok" data-chrome>${head}<p data-part="ftitle">${fill(fc.title, f.vars)}</p></li>`;
  }
  return `<li data-level="${f.level}" id="scan-${x(f.id)}">${head}<p data-part="ftitle"><strong>${fill(
    fc.title,
    f.vars,
  )}</strong></p>${fc.why ? `<p>${fill(fc.why, f.vars)}</p>` : ''}${
    fc.fix ? `<p data-part="todo"><span data-part="todo-label">${x(c.todo)}</span> ${fill(fc.fix, f.vars)}</p>` : ''
  }</li>`;
}

function outline(hs: ScanResult['page']['headings'], total: number, c: ScanCopy): string {
  if (!hs.length) return `<span data-part="none">${x(c.values.none)}</span>`;
  const shown = hs.slice(0, 12);
  const more = total - shown.length;
  return `<ol data-part="outline">${shown
    .map((h) => `<li data-h="${h.level}"><span data-part="hl">h${h.level}</span> ${x(h.text || '·')}</li>`)
    .join('')}${more > 0 ? `<li data-h="more">${fill(c.values.more, { n: more })}</li>` : ''}</ol>`;
}

function fileState(
  f: { state: string; status: number },
  c: ScanCopy,
  found: string,
): string {
  const v = c.values;
  switch (f.state) {
    case 'found':
      return `<span data-ok>${found}</span>`;
    case 'missing':
      return `<span data-miss>${fill(v.missing, { status: f.status })}</span>`;
    case 'html':
    case 'unreadable':
      return `<span data-miss>${x(v.unreadable)}</span>`;
    case 'timeout':
      return `<span data-miss>${x(v.timeout)}</span>`;
    default:
      return `<span data-miss>${f.status ? fill(v.error, { status: f.status }) : x(v.unreachable)}</span>`;
  }
}

/* ── The layers ─────────────────────────────────────────────────────── */

/** The first few h1s, quoted, and how many more there are. */
function h1s(p: ScanResult['page'], v: ScanCopy['values']): string {
  if (!p.h1s.length) return `<span data-part="none">${x(v.none)}</span>`;
  const shown = p.h1s.slice(0, 5);
  const more = Math.max(p.h1Count || 0, p.h1s.length) - shown.length;
  return `${shown.map((h) => `<q>${x(h)}</q>`).join(' ')}${
    more > 0 ? ` <span data-part="aside">${fill(v.more, { n: more })}</span>` : ''
  }`;
}

function peopleRows(r: ScanResult, c: ScanCopy): Row[] {
  const p = r.page;
  const L = c.rows;
  const v = c.values;
  const words = `<b>${x(p.words.toLocaleString('en-US'))}</b>${
    p.mainWords !== null ? ` <span data-part="aside">${fill(v.inMain, { n: p.mainWords.toLocaleString('en-US') })}</span>` : ''
  }`;
  return [
    [L.title, `${q(p.title, v.none)}${p.title ? ` <span data-part="aside">${fill(v.chars, { n: p.title.length })}</span>` : ''}`],
    [
      L.description,
      `${q(p.description, v.none)}${p.description ? ` <span data-part="aside">${fill(v.chars, { n: p.description.length })}</span>` : ''}`,
    ],
    [L.h1, h1s(p, v)],
    [L.words, words, 'data-wide'],
    [L.outline, outline(p.headings, p.headingCount, c), 'data-wide'],
    [L.lang, p.lang ? `<code>${x(p.lang)}</code>` : `<span data-part="none">${x(v.none)}</span>`],
    [L.images, p.images.total ? fill(v.alt, { n: p.images.missingAlt, total: p.images.total }) : x(v.noImages)],
  ];
}

function crawlerRows(r: ScanResult, c: ScanCopy): Row[] {
  const p = r.page;
  const L = c.rows;
  const v = c.values;
  const robotsMeta = [p.robotsMeta, p.botMeta].filter(Boolean).join(' · ');
  return [
    [L.final, `<code>${x(bare(r.finalUrl))}</code>`, 'data-wide'],
    [
      L.redirects,
      r.fetch.redirects.length
        ? `<ol data-part="hops">${r.fetch.redirects
            .map((h) => `<li><span data-part="hl">${x(h.status)}</span> <code>${x(bare(h.from))}</code></li>`)
            .join('')}</ol>`
        : x(c.request.none),
    ],
    [L.canonical, p.canonical ? `<code>${x(bare(p.canonical))}</code>` : `<span data-part="none">${x(v.none)}</span>`],
    [L.robotsMeta, robotsMeta ? `<code>${x(robotsMeta)}</code>` : x(v.robotsDefault)],
    [L.xRobots, r.fetch.xRobots ? `<code>${x(r.fetch.xRobots)}</code>` : `<span data-part="none">${x(v.none)}</span>`],
    [L.links, fill(v.links, { internal: p.links.internal, external: p.links.external, nofollow: p.links.nofollow })],
    [L.robots, fileState(r.robots, c, fill(v.robotsFound, { n: r.robots.sitemaps.length }))],
    [
      L.sitemap,
      fileState(
        r.sitemap,
        c,
        `<code>${x(bare(r.sitemap.url))}</code>${r.sitemap.declared ? ` <span data-part="aside">${x(v.declared)}</span>` : ''}`,
      ),
    ],
  ];
}

function machineRows(r: ScanResult, c: ScanCopy): Row[] {
  const p = r.page;
  const L = c.rows;
  const v = c.values;
  const j = p.jsonld;
  const ld = j.blocks
    ? `${fill(v.blocks, { n: j.blocks, bad: j.invalid })}${
        j.types.length ? `<span data-part="types">${j.types.map((t) => `<code>${x(t)}</code>`).join('')}</span>` : ''
      }`
    : `<span data-part="none">${x(v.none)}</span>`;
  const tags = (o: Record<string, string>, keys: string[]) => {
    const have = keys.filter((k) => o[k]);
    return have.length
      ? `<span data-part="types">${keys
          .map((k) => `<code${o[k] ? '' : ' data-off'}>${x(k)}</code>`)
          .join('')}</span>`
      : `<span data-part="none">${x(v.none)}</span>`;
  };
  return [
    [L.jsonld, ld, 'data-wide'],
    [L.microdata, p.microdata ? fill(v.items, { n: p.microdata }) : `<span data-part="none">${x(v.none)}</span>`],
    [L.og, tags(p.og, ['title', 'description', 'image', 'type', 'url'])],
    [L.twitter, tags(p.twitter, ['card', 'title', 'image'])],
    [
      L.llms,
      fileState(r.llms, c, r.llms.heading ? `<q>${x(r.llms.heading)}</q>` : x(v.found)),
    ],
  ];
}

function layerHtml(layer: Layer, r: ScanResult, c: ScanCopy): string {
  const L = c.layers[layer];
  const rows = layer === 'people' ? peopleRows(r, c) : layer === 'crawlers' ? crawlerRows(r, c) : machineRows(r, c);
  const fs = r.findings.filter((f) => f.layer === layer);
  return `<section data-layer="${layer}" aria-labelledby="scan-${layer}">
    <header data-part="layer-head">${planes(layer)}<span data-part="n" aria-hidden="true">${x(L.n)}</span><div>
      <h3 id="scan-${layer}">${x(L.title)}</h3>
      <p>${x(L.sub)}</p>
    </div></header>
    <div data-part="layer-body">
      ${rowsHtml(rows)}
      <ul data-part="findings">${fs.map((f) => findingHtml(f, c)).join('')}</ul>
    </div>
  </section>`;
}

function agentsHtml(r: ScanResult, c: ScanCopy): string {
  const A = c.agents;
  const by = new Map(r.agents.map((a) => [a.token, a]));
  const groups: Group[] = ['search', 'answers', 'fetch', 'training'];
  const body = groups
    .map((g) => {
      const list = c.crawlers.filter((cr) => cr.group === g);
      if (!list.length) return '';
      return `<tbody data-group="${g}"><tr data-part="group"><th colspan="4" scope="colgroup">${x(A.groups[g])}</th></tr>${list
        .map((cr) => {
          const a = by.get(cr.token);
          const verdict = a?.verdict ?? 'unknown';
          const rule = a?.rule ?? 'error';
          return `<tr data-verdict="${verdict}">
          <th scope="row" data-chrome><code>${x(cr.token)}</code></th>
          <td data-part="by" data-chrome>${x(cr.by)}</td>
          <td data-part="what">${x(cr.what)}</td>
          <td data-part="verdict" data-chrome><span data-part="mark" aria-hidden="true">${
            verdict === 'allowed' ? '✓' : verdict === 'blocked' ? '✕' : '?'
          }</span> ${x(A.verdicts[verdict])}<span data-part="rule">${x(A.rules[rule])}${
            a?.line ? ` <code>${x(a.line)}</code>` : ''
          }</span></td>
        </tr>`;
        })
        .join('')}</tbody>`;
    })
    .join('');
  return `<section data-part="agents" aria-labelledby="scan-agents">
    <header data-part="agents-head"><h3 id="scan-agents">${x(A.title)}</h3><p>${x(A.sub)}</p></header>
    <div data-part="agents-wrap"><table>
      <thead><tr><th scope="col">${x(A.head.token)}</th><th scope="col">${x(A.head.by)}</th><th scope="col">${x(
        A.head.what,
      )}</th><th scope="col">${x(A.head.verdict)}</th></tr></thead>
      ${body}
    </table></div>
  </section>`;
}

/* ── The whole report ───────────────────────────────────────────────── */

/**
 * The report for one scan. `chip` is the provenance chip markup for the
 * header (Recorded for the example, a live label for a visitor's scan);
 * the caller makes it, since chips read the shared copy.
 */
export function renderReport(r: ScanResult, c: ScanCopy, chip: string): string {
  const R = c.request;
  const counts: Record<Level, number> = { fix: 0, improve: 0, note: 0, ok: 0 };
  for (const f of r.findings) counts[f.level]++;
  const todo = r.findings.filter((f) => f.level !== 'ok');
  const tally = (['fix', 'improve', 'note', 'ok'] as Level[])
    .filter((l) => counts[l])
    .map((l) => `<span data-level="${l}"><b>${counts[l]}</b> ${x(c.summary.tally[l])}</span>`)
    .join('');
  const first = todo.slice(0, 5);

  return `<div data-part="report" data-status="${r.fetch.status >= 400 ? 'error' : 'ok'}">
    <div data-part="head" tabindex="-1">
      <span data-part="title">${x(c.title)}</span>
      <span data-part="target">${x(bare(r.finalUrl))}</span>
      ${chip}
    </div>
    <div data-part="request" data-chrome>
      <span data-part="get"><b>${x(R.method)}</b> <code>${x(bare(r.url))}</code></span>
      <span><small>${x(R.status)}</small> <b data-code="${r.fetch.status >= 400 ? 'bad' : 'good'}">${x(r.fetch.status)}</b></span>
      <span><small>${x(R.time)}</small> <b>${x(fmtMs(r.fetch.ms))}</b></span>
      <span><small>${x(R.size)}</small> <b>${x(fmtKB(r.fetch.bytes))}</b></span>
      <span><small>${x(R.redirects)}</small> <b>${r.fetch.redirects.length ? x(r.fetch.redirects.length) : x(R.none)}</b></span>
    </div>
    <div data-part="summary">
      <p data-part="tally" data-chrome>${tally}</p>
      ${
        first.length
          ? `<p data-part="first-label">${x(c.summary.label)}</p><ol data-part="first" data-chrome>${first
              .map(
                (f) =>
                  `<li data-level="${f.level}"><a href="#scan-${x(f.id)}"><span data-part="mark" aria-hidden="true">${
                    GLYPH[f.level]
                  }</span> ${fill(c.findings[f.id]?.title ?? f.id, f.vars)}</a></li>`,
              )
              .join('')}</ol>`
          : `<p data-part="first-label">${x(c.summary.clear)}</p>`
      }
    </div>
    ${(['people', 'crawlers', 'machines'] as Layer[]).map((l) => layerHtml(l, r, c)).join('')}
    ${agentsHtml(r, c)}
  </div>`;
}
