/**
 * A sitemap from the one page list, so it can't omit a page that exists.
 *
 * <lastmod> is the date of the last commit that touched the page's content
 * modules (pages.mjs `content`), not the build date. A sitemap where every
 * page changed today, every day, tells a crawler nothing, and crawlers that
 * notice learn to ignore the field. The same value is each case page's
 * TechArticle dateModified, from the same helper in seo.mjs, so the two
 * can't disagree.
 *
 * Built from INDEXED, not PAGES: a noindex page (the form's thank-you
 * page) is left out, since listing a page in the sitemap asks for exactly
 * what its robots tag refuses.
 */
import { writeFileSync } from 'node:fs';
import { INDEXED, ORIGIN, PAGES } from './pages.mjs';
import { dateModifiedOf } from './seo.mjs';

const urls = INDEXED.map(
  (p) => `  <url>
    <loc>${ORIGIN}${p.route}</loc>
    <lastmod>${dateModifiedOf(p)}</lastmod>
    <priority>${p.priority}</priority>
  </url>`,
).join('\n');

writeFileSync(
  'dist/sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`,
);

const distinct = new Set(INDEXED.map(dateModifiedOf)).size;
const left = PAGES.length - INDEXED.length;
console.log(`sitemap: ${INDEXED.length} urls, ${distinct} distinct lastmod dates from git${left ? `, ${left} noindex page${left === 1 ? '' : 's'} left out` : ''}`);
