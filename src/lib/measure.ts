/**
 * What a crawler is handed: one pure function over an HTML STRING.
 *
 * It runs in two places and has to agree with itself in both:
 *
 *   BUILD    scripts/prerender.mjs measures each page's finished HTML and
 *            the Machine View readout ships prerendered with those values,
 *            so the panel is true with scripting off.
 *   LIVE     src/motion/machine.ts re-fetches the page the way a crawler
 *            would (no script run, cache bypassed) and measures the bytes
 *            the server actually sent.
 *
 * So it can't use DOMParser or any other browser API: it's a small tag
 * tokenizer over the string. It isn't a general HTML parser and doesn't
 * need to be. It reads markup this site's own build emits, and the build
 * would fail long before a malformed page reached it.
 */

export type Heading = { level: number; text: string };

export type Measure = {
  bytes: number;
  title: string;
  description: string;
  canonical: string;
  robots: string;
  lang: string;
  ogImage: string;
  h1: number;
  headings: Heading[];
  /** Words of visible prose in <main>, with script/style/template removed
   *  and aria-hidden decoration dropped. */
  words: number;
  links: { internal: number; external: number; mailto: number };
  images: { total: number; missingAlt: number };
  jsonLdTypes: string[];
  jsonLdBlocks: number;
  jsonLdValid: boolean;
};

const ENT: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  rsquo: '’',
  lsquo: '‘',
  ldquo: '“',
  rdquo: '”',
  mdash: '—',
  ndash: '–',
  hellip: '…',
  middot: '·',
  rarr: '→',
  larr: '←',
};

export function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === '#') {
      const n = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : m;
    }
    return ENT[e.toLowerCase()] ?? m;
  });
}

const attr = (tag: string, name: string): string => {
  const m = new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, 'i').exec(tag);
  return m ? decodeEntities(m[2] ?? m[3] ?? '') : '';
};

const text = (html: string): string =>
  decodeEntities(html.replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();

/** Remove every element carrying aria-hidden="true", nested ones included,
 *  by walking tags with a depth counter. A regex alone can't match nested
 *  elements of the same name, and the decorative layers on this site nest. */
export function stripHidden(html: string): string {
  const re = /<(\/?)([a-z][a-z0-9-]*)\b([^>]*?)(\/?)>/gi;
  const VOID = /^(area|base|br|col|embed|hr|img|input|link|meta|source|track|wbr)$/i;
  let out = '';
  let last = 0;
  let skipDepth = 0;
  let skipName = '';
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const [whole, close, name, rest, selfClose] = m;
    const isVoid = VOID.test(name) || selfClose === '/';
    if (skipDepth === 0) {
      if (!close && /\saria-hidden\s*=\s*"true"/i.test(` ${rest}`)) {
        out += html.slice(last, m.index);
        if (isVoid) {
          last = m.index + whole.length;
          continue;
        }
        skipDepth = 1;
        skipName = name.toLowerCase();
        continue;
      }
    } else {
      if (name.toLowerCase() === skipName && !isVoid) {
        skipDepth += close ? -1 : 1;
        if (skipDepth === 0) last = m.index + whole.length;
      }
      continue;
    }
  }
  if (skipDepth === 0) out += html.slice(last);
  return out;
}

export function measureHtml(html: string, origin = ''): Measure {
  const head = /<head[^>]*>([\s\S]*?)<\/head>/i.exec(html)?.[1] ?? '';
  const metaTags = head.match(/<meta\b[^>]*>/gi) ?? [];
  const linkTags = head.match(/<link\b[^>]*>/gi) ?? [];
  const meta = (key: string, by: 'name' | 'property') =>
    attr(metaTags.find((t) => attr(t, by).toLowerCase() === key) ?? '', 'content');

  const body = /<body[^>]*>([\s\S]*)<\/body>/i.exec(html)?.[1] ?? html;
  const clean = body
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<template\b[\s\S]*?<\/template>/gi, ' ');
  const main = /<main\b[^>]*>([\s\S]*)<\/main>/i.exec(clean)?.[1] ?? clean;

  const headings: Heading[] = [];
  for (const h of main.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)) {
    headings.push({ level: Number(h[1]), text: text(h[2]) });
  }

  const prose = text(stripHidden(main));
  const words = prose ? prose.split(' ').filter((w) => /[\p{L}\p{N}]/u.test(w)).length : 0;

  const links = { internal: 0, external: 0, mailto: 0 };
  for (const a of clean.matchAll(/<a\b[^>]*>/gi)) {
    const href = attr(a[0], 'href');
    if (!href) continue;
    if (href.startsWith('mailto:')) links.mailto++;
    else if (/^https?:/i.test(href) && !(origin && href.startsWith(origin))) links.external++;
    else links.internal++;
  }

  const imgs = clean.match(/<img\b[^>]*>/gi) ?? [];
  const missingAlt = imgs.filter((t) => !/\salt\s*=/i.test(t)).length;

  const blocks = [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];
  const types: string[] = [];
  let valid = blocks.length > 0;
  for (const b of blocks) {
    try {
      const data = JSON.parse(b[1]);
      const nodes: { '@type'?: string | string[] }[] = data['@graph'] ?? [data];
      for (const n of nodes) {
        const t = n['@type'];
        if (Array.isArray(t)) types.push(...t);
        else if (t) types.push(t);
      }
    } catch {
      valid = false;
    }
  }

  return {
    bytes: new TextEncoder().encode(html).length,
    title: text(/<title[^>]*>([\s\S]*?)<\/title>/i.exec(head)?.[1] ?? ''),
    description: meta('description', 'name'),
    canonical: attr(linkTags.find((t) => attr(t, 'rel') === 'canonical') ?? '', 'href'),
    robots: meta('robots', 'name'),
    lang: attr(/<html\b[^>]*>/i.exec(html)?.[0] ?? '', 'lang'),
    ogImage: meta('og:image', 'property'),
    h1: headings.filter((h) => h.level === 1).length,
    headings,
    words,
    links,
    images: { total: imgs.length, missingAlt },
    jsonLdTypes: types,
    jsonLdBlocks: blocks.length,
    jsonLdValid: valid,
  };
}

/** Words in a live DOM subtree, counted the same way measureHtml counts
 *  them, so "readable without JavaScript: N of M" compares like with like. */
export function countWords(s: string): number {
  const t = s.replace(/\s+/g, ' ').trim();
  return t ? t.split(' ').filter((w) => /[\p{L}\p{N}]/u.test(w)).length : 0;
}
