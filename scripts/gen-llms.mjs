/**
 * The site, written for machines: /llms.txt, /llms-full.txt and a markdown
 * twin of every page at {route}index.md.
 *
 * llms.txt is a proposed convention (not a standard, and we say so on the
 * SEO page): a plain-markdown index an answer engine can read in one
 * request. Who the firm is, then one line per page, grouped, each with the
 * page's own meta description. Each page's twin is that page's prose as
 * markdown, so a model that wants the substance doesn't have to parse our
 * markup, run our scripts, or guess which <div> is the content. Every page
 * links its twin with <link rel="alternate" type="text/markdown">, and
 * dist/_headers serves each one as text/markdown with a canonical Link
 * header pointing back at the HTML page, so the twin never competes with
 * the page it copies. llms-full.txt is every twin, in one file.
 *
 * All of it is generated from dist/ after prerender, never written by hand,
 * for the same reason the <title> slots are filled from content modules: a
 * hand-kept summary is the copy nobody edits, and it would start describing
 * a site that no longer exists the first time a headline changed.
 *
 * The pages are read through the site's one tokenizer and exclusion set
 * (src/lib/exclude.ts), the same reading Machine View and check-voice use.
 * Instrument chrome, decoration, the Machine View panel, the precomputed Ask
 * answers and Source sheets aren't prose and don't appear. On top of that,
 * a twin drops what only makes sense with a pointer: buttons, form
 * controls, the breadcrumb nav and skip links.
 */
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { INDEXED, ORIGIN } from './pages.mjs';
import { dateModifiedOf, llmsLine, ORG_DESCRIPTION, shortTitle, twinOf } from './seo.mjs';
import { walk, isExcluded, classes, INLINE } from './lib-text.mjs';
import { addHeaders } from './lib/headers.mjs';

const CONTACT = 'daniel@adjlcapital.com';

/** Elements a reader with no pointer has no use for. */
const TWIN_SKIP = new Set(['button', 'input', 'select', 'textarea', 'option', 'label', 'nav', 'dialog', 'canvas', 'video', 'audio', 'iframe', 'object', 'img', 'picture']);
const skipForTwin = (el) =>
  isExcluded(el.name, el.attrs) ||
  TWIN_SKIP.has(el.name) ||
  'hidden' in el.attrs ||
  classes(el).some((c) => /^skip(-|$)/.test(c));

const LEAVES = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'dt', 'dd', 'summary', 'figcaption', 'caption', 'p', 'blockquote', 'pre', 'td', 'th']);

const squash = (s) => s.replace(/[\s ]+/g, ' ').trim();
/** Keep a paragraph from being read as markdown syntax it doesn't mean. */
const guard = (s) => s.replace(/^([#>+*-]|\d+\.)(\s)/, '\\$1$2');

/** One page's <main> as markdown. */
function toMarkdown(html, route) {
  const blocks = []; // { kind, text }
  const lists = []; // { ordered, n }
  let inMain = 0;
  let leaf = null; // { kind, el, buf, depth, marker, emitted }
  let loose = [];
  let term = null;
  let table = null; // { rows: [], row: null, header: false }
  const frames = []; // inline wrappers: { kind: 'a'|'code', at, href }

  const target = () => (leaf ? leaf.buf : loose);
  const url = (href) => {
    if (!href) return '';
    if (href.startsWith('#')) return `${ORIGIN}${route}${href}`;
    if (href.startsWith('/')) return `${ORIGIN}${href}`;
    return href;
  };

  const flushLoose = () => {
    const t = squash(loose.join(''));
    loose = [];
    if (t) blocks.push({ kind: 'p', text: guard(t) });
  };

  const start = (kind, el, extra = {}) => {
    flushLoose();
    leaf = { kind, el, buf: [], ...extra };
  };

  const end = () => {
    const l = leaf;
    leaf = null;
    if (!l) return;
    const raw = l.buf.join('');
    const text = l.kind === 'pre' ? raw.replace(/^\n+|\s+$/g, '') : squash(raw);
    if (!text) {
      if (l.kind === 'dd' && term) {
        blocks.push({ kind: 'li', text: `- **${term}**` });
        term = null;
      }
      return;
    }
    switch (l.kind) {
      case 'h1': case 'h2': case 'h3': case 'h4': case 'h5': case 'h6':
        blocks.push({ kind: 'h', text: `${'#'.repeat(Number(l.kind[1]))} ${text}` });
        break;
      case 'summary':
        blocks.push({ kind: 'h', text: `### ${text}` });
        break;
      case 'li':
        if (!l.emitted) blocks.push({ kind: 'li', text: `${'  '.repeat(l.depth)}${l.marker} ${text}` });
        break;
      case 'dt':
        if (term) blocks.push({ kind: 'li', text: `- **${term}**` });
        term = text;
        break;
      case 'dd':
        blocks.push({ kind: 'li', text: term ? `- **${term}:** ${text}` : `- ${text}` });
        term = null;
        break;
      case 'blockquote':
        blocks.push({ kind: 'p', text: `> ${text}` });
        break;
      case 'pre':
        blocks.push({ kind: 'p', text: '```\n' + text + '\n```' });
        break;
      case 'td': case 'th':
        if (table?.row) {
          table.row.push(text.replace(/\|/g, '\\|'));
          if (l.kind === 'th') table.header = true;
        }
        break;
      default:
        blocks.push({ kind: 'p', text: guard(text) });
    }
  };

  walk(
    html,
    {
      open(el) {
        if (el.name === 'main') inMain++;
        if (!inMain || el.excluded) return;
        const name = el.name;

        if (name === 'ul' || name === 'ol') {
          // A list nested in a list item: the item's own text goes first.
          if (leaf?.kind === 'li' && !leaf.emitted) {
            const t = squash(leaf.buf.join(''));
            if (t) blocks.push({ kind: 'li', text: `${'  '.repeat(leaf.depth)}${leaf.marker} ${t}` });
            leaf.emitted = true;
            leaf.parentLeaf = true;
            lists.push({ ordered: name === 'ol', n: 0, outer: leaf });
            leaf = null;
            return;
          }
          if (leaf) end();
          flushLoose();
          lists.push({ ordered: name === 'ol', n: 0 });
          return;
        }
        if (name === 'table') {
          if (leaf) end();
          flushLoose();
          table = { rows: [], row: null, header: false };
          return;
        }
        if (name === 'tr' && table) {
          table.row = [];
          return;
        }
        if (name === 'dl') {
          if (leaf) end();
          flushLoose();
          term = null;
          return;
        }

        if (LEAVES.has(name)) {
          if (leaf && (name === 'p' || name === 'blockquote')) {
            leaf.buf.push(' ');
            return;
          }
          if (leaf) end();
          if (name === 'li') {
            const list = lists[lists.length - 1] ?? { ordered: false, n: 0 };
            list.n++;
            start('li', el, { depth: Math.max(0, lists.length - 1), marker: list.ordered ? `${list.n}.` : '-' });
          } else start(name, el);
          return;
        }

        if (name === 'br') {
          target().push(leaf?.kind === 'pre' ? '\n' : ' ');
          return;
        }
        if (name === 'a' && el.attrs.href) {
          frames.push({ kind: 'a', el, at: target().length, href: el.attrs.href, buf: target() });
          return;
        }
        if (name === 'code' && leaf?.kind !== 'pre') {
          frames.push({ kind: 'code', el, at: target().length, buf: target() });
          return;
        }
        if (!INLINE.has(name)) {
          // A block boundary with no leaf of its own (div, section, span…).
          if (!leaf && ['div', 'section', 'article', 'header', 'footer', 'aside', 'figure', 'details', 'hgroup', 'fieldset'].includes(name)) {
            flushLoose();
          } else target().push(' ');
        }
      },

      close(el) {
        if (el.name === 'main') {
          if (inMain === 1) {
            if (leaf) end();
            flushLoose();
          }
          inMain--;
          return;
        }
        if (!inMain || el.excluded) return;
        const name = el.name;

        const f = frames[frames.length - 1];
        if (f && f.el === el) {
          frames.pop();
          const inner = squash(f.buf.splice(f.at).join(''));
          if (f.kind === 'code') f.buf.push(inner ? `\`${inner}\`` : '');
          else if (inner) f.buf.push(`[${inner.replace(/\]/g, '\\]')}](${url(f.href)})`);
          return;
        }

        if (name === 'ul' || name === 'ol') {
          const list = lists.pop();
          if (list?.outer) leaf = null;
          return;
        }
        if (name === 'tr' && table?.row) {
          if (table.row.length) table.rows.push(table.row);
          table.row = null;
          return;
        }
        if (name === 'table' && table) {
          const rows = table.rows;
          table = null;
          if (!rows.length) return;
          const width = Math.max(...rows.map((r) => r.length));
          const pad = (r) => [...r, ...Array(width - r.length).fill('')];
          const line = (r) => `| ${pad(r).join(' | ')} |`;
          const out = [line(rows[0]), `|${' --- |'.repeat(width)}`, ...rows.slice(1).map(line)];
          blocks.push({ kind: 'p', text: out.join('\n') });
          return;
        }
        if (name === 'dl') {
          if (leaf) end();
          if (term) blocks.push({ kind: 'li', text: `- **${term}**` });
          term = null;
          return;
        }
        if (leaf && leaf.el === el) {
          end();
          return;
        }
        if (!INLINE.has(name) && name !== 'br') target().push(' ');
      },

      text(t, info) {
        if (!inMain || info.excluded || info.raw) return;
        target().push(t);
      },
    },
    { skip: skipForTwin },
  );

  /* Consecutive list items sit on adjacent lines; everything else is
     separated by a blank line. */
  let out = '';
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (i) out += b.kind === 'li' && blocks[i - 1].kind === 'li' ? '\n' : '\n\n';
    out += b.text;
  }
  return out.trim();
}

/** The <title> and meta description, read from the built page. */
function head(html) {
  let title = '';
  let inTitle = false;
  let description = '';
  walk(html, {
    open(el) {
      if (el.name === 'title') inTitle = true;
      if (el.name === 'meta' && el.attrs.name === 'description') description = el.attrs.content ?? '';
    },
    close(el) {
      if (el.name === 'title') inTitle = false;
    },
    text(t) {
      if (inTitle) title += t;
    },
  });
  return { title: squash(title), description: squash(description) };
}

/* INDEXED, not PAGES: a noindex page (the form's thank-you page) gets no
   twin and no line in llms.txt or llms-full.txt. */
const pages = INDEXED.map((p) => {
  const html = readFileSync(p.out, 'utf8');
  const { title, description } = head(html);
  const body = toMarkdown(html, p.route);
  const url = `${ORIGIN}${p.route}`;
  const updated = dateModifiedOf(p).slice(0, 10);
  /* The twin: the page's h1 first, then the description and where the
     page lives, then the page. */
  const lines = body.split('\n');
  const h1 = lines.findIndex((l) => l.startsWith('# '));
  const preamble = [`> ${description}`, '', `Page: ${url}`, `Updated: ${updated}`];
  /* Anything above the h1 (the hero's eyebrow) moves below the preamble,
     so every twin opens on its title. */
  const twin =
    h1 >= 0
      ? [lines[h1], '', ...preamble, '', ...lines.slice(0, h1), ...lines.slice(h1 + 1)].join('\n')
      : [`# ${shortTitle(title)}`, '', ...preamble, '', body].join('\n');
  return { ...p, title, description, url, twin: twin.replace(/\n{3,}/g, '\n\n').trim() + '\n', hasH1: h1 >= 0 };
});

/* ── Twins ─────────────────────────────────────────────────────────── */
for (const p of pages) {
  const file = `dist${twinOf(p.route)}`;
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, p.twin);
  addHeaders(twinOf(p.route), {
    'Content-Type': 'text/markdown; charset=utf-8',
    Link: `<${p.url}>; rel="canonical"`,
  });
}

/* ── llms.txt ──────────────────────────────────────────────────────── */
const groups = [
  ['Services', (p) => p.route.startsWith('/services/')],
  ['Work', (p) => p.route.startsWith('/work/')],
  ['Notes', (p) => p.route.startsWith('/notes/')],
  ['Firm', (p) => p.kind === 'home' || p.kind === 'firm'],
  ['Legal', (p) => p.kind === 'legal'],
];

const index = [
  '# ADJL Technology',
  '',
  `> ${ORG_DESCRIPTION}`,
  '',
  `ADJL Technology is founded and led by Daniel Laskowski. Contact: ${CONTACT}. Every page below is also published as markdown: add index.md to its URL.`,
];
const listed = new Set();
for (const [name, test] of groups) {
  const list = pages.filter((p) => test(p) && !listed.has(p.route));
  if (!list.length) continue;
  index.push('', `## ${name}`, '');
  for (const p of list) {
    listed.add(p.route);
    index.push(llmsLine({ origin: ORIGIN, route: p.route, title: p.title, description: p.description }));
  }
  if (name === 'Firm') index.push(`- [Contact](${ORIGIN}/#contact): Email ${CONTACT}.`);
}
const unlisted = pages.filter((p) => !listed.has(p.route));
index.push(
  '',
  '## Machine-readable',
  '',
  `- [llms-full.txt](${ORIGIN}/llms-full.txt): Every page’s text as markdown, in one file.`,
  `- [sitemap.xml](${ORIGIN}/sitemap.xml): Every page, with the date its content last changed.`,
  `- [Build report](${ORIGIN}/build-report.json): The checks this deploy passed, written at the end of its build.`,
  `- [Markdown copy of the home page](${ORIGIN}${twinOf('/')}): Every page has one at its URL plus index.md.`,
);
writeFileSync('dist/llms.txt', index.join('\n') + '\n');

/* ── llms-full.txt ─────────────────────────────────────────────────── */
const full = [
  '# ADJL Technology: every page as markdown',
  '',
  `> Every page on ${ORIGIN}, converted at build time from the same HTML a browser receives. Each page is also at its own URL plus index.md.`,
];
for (const p of pages) full.push('', '---', '', p.twin.trim());
writeFileSync('dist/llms-full.txt', full.join('\n') + '\n');

/* Plain text needs its charset stated, or the curly apostrophes in the copy
   arrive as mojibake in any client that guesses Latin-1. */
for (const f of ['/llms.txt', '/llms-full.txt']) addHeaders(f, { 'Content-Type': 'text/plain; charset=utf-8' });

let bad = 0;
for (const p of pages) {
  if (!p.hasH1) {
    console.error(`gen-llms: ${p.route} produced no h1 in its markdown. The extractor dropped the content.`);
    bad++;
  }
}
if (unlisted.length) {
  console.error(`gen-llms: ${unlisted.map((p) => p.route).join(', ')} fit no llms.txt group`);
  bad++;
}
if (bad) process.exit(1);

const tokens = pages.reduce((n, p) => n + p.twin.length, 0) / 4;
console.log(
  `gen-llms: llms.txt (${pages.length} pages) + llms-full.txt (${(full.join('\n').length / 1024).toFixed(1)} kB) + ${pages.length} markdown twins (≈ ${Math.round(tokens).toLocaleString('en-US')} tokens, estimate: characters ÷ 4) + _headers`,
);
