/**
 * Writes /llms.txt and /llms-full.txt from the BUILT pages.
 *
 * llms.txt is a plain-markdown index an AI answer engine can read in one
 * request: who the firm is, and one line per page with the page's own meta
 * description. llms-full.txt is the same thing with every page's prose
 * flattened to markdown, so a model that wants the substance doesn't have
 * to parse our markup, run our scripts, or guess which <div> is the content.
 *
 * Both are generated from dist/ after prerender, never written by hand, for
 * the same reason the <title> slots are filled from content modules: a
 * hand-kept summary is the copy nobody edits, and it would start describing
 * a site that no longer exists the first time a headline changed.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { ORIGIN, PAGES } from './pages.mjs';

const decode = (s) =>
  s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&rarr;|&larr;|&darr;|&uarr;/g, '');

const attr = (html, re) => decode(re.exec(html)?.[1] ?? '').trim();

/** The page's main content as markdown: headings, paragraphs, list items,
 *  definition terms. Anything marked aria-hidden is decoration (the
 *  animated layers, the scrambled glyphs) and is dropped with its subtree. */
function toMarkdown(html) {
  let main = /<main[^>]*>([\s\S]*?)<\/main>/.exec(html)?.[1] ?? '';
  main = main
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/g, ' ')
    .replace(/<template[\s\S]*?<\/template>/g, ' ')
    .replace(/<footer[\s\S]*?<\/footer>/g, ' ');

  /* Strip aria-hidden subtrees. A regex cannot match nested elements in
     general, but the decorative layers on this site are leaf-ish (spans and
     divs holding no headings or paragraphs), so removing the opening tag's
     element up to its matching close for the common tags is enough — and
     check-llms below would show a heading that went missing. */
  for (let i = 0; i < 6; i++) {
    main = main.replace(
      /<(span|div|i|figure|canvas|ul|ol|p)\b[^>]*aria-hidden="true"[^>]*>(?:(?!<\1\b)[\s\S])*?<\/\1>/g,
      ' ',
    );
  }

  const out = [];
  const re = /<(h1|h2|h3|h4|p|li|dt|dd|summary|blockquote)\b[^>]*>([\s\S]*?)<\/\1>/g;
  let m;
  while ((m = re.exec(main))) {
    const tag = m[1];
    const text = decode(m[2].replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
    if (!text) continue;
    if (tag === 'h1') out.push(`# ${text}`);
    else if (tag === 'h2') out.push(`\n## ${text}`);
    else if (tag === 'h3' || tag === 'summary') out.push(`\n### ${text}`);
    else if (tag === 'h4' || tag === 'dt') out.push(`**${text}**`);
    else if (tag === 'li') out.push(`- ${text}`);
    else out.push(text);
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

const pages = PAGES.map((p) => {
  const html = readFileSync(p.out, 'utf8');
  return {
    ...p,
    title: attr(html, /<title>([\s\S]*?)<\/title>/),
    description: attr(html, /<meta name="description" content="([^"]*)"/),
    body: toMarkdown(html),
  };
});

const home = pages.find((p) => p.route === '/');
const groups = [
  ['Services', (p) => p.route.startsWith('/services/')],
  ['Work', (p) => p.route.startsWith('/work/')],
  ['Firm', (p) => !p.route.startsWith('/services/') && !p.route.startsWith('/work/') && !p.route.startsWith('/legal/') && p.route !== '/'],
  ['Legal', (p) => p.route.startsWith('/legal/')],
];

const index = [
  '# ADJL Technology',
  '',
  `> ${home.description}`,
  '',
  'ADJL Technology is an AI engineering studio founded and led by Daniel Laskowski. It builds AI systems, search visibility (technical SEO and AI answer engines), websites, web and mobile apps, and the data systems behind them. Contact: daniel@adjlcapital.com.',
  '',
  `- [Home](${ORIGIN}/): ${home.description}`,
];
for (const [name, test] of groups) {
  const list = pages.filter(test);
  if (!list.length) continue;
  index.push('', `## ${name}`, '');
  for (const p of list) index.push(`- [${p.crumb}](${ORIGIN}${p.route}): ${p.description}`);
}
index.push('', '## Optional', '', `- [Full text of every page](${ORIGIN}/llms-full.txt): the same pages, flattened to markdown`);

writeFileSync('dist/llms.txt', index.join('\n') + '\n');

const full = [
  '# ADJL Technology — full text',
  '',
  `> Every page on ${ORIGIN}, flattened to markdown at build time from the same HTML a browser receives.`,
];
for (const p of pages) {
  full.push('', '---', '', `URL: ${ORIGIN}${p.route}`, `Title: ${p.title}`, '', p.body);
}
writeFileSync('dist/llms-full.txt', full.join('\n') + '\n');

let bad = 0;
for (const p of pages) {
  if (!/^# /m.test(p.body)) {
    console.error(`gen-llms: ${p.route} produced no h1 in its markdown — the extractor dropped the content`);
    bad++;
  }
}
if (bad) process.exit(1);

console.log(
  `gen-llms: llms.txt (${pages.length} pages) + llms-full.txt (${(full.join('\n').length / 1024).toFixed(1)} kB)`,
);
