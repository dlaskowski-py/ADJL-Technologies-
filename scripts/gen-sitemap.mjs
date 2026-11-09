/**
 * A sitemap from the one page list, so it can't omit a page that exists.
 *
 * <lastmod> is the date of the last commit that touched the page's content
 * modules (pages.mjs `content`), not the build date. A sitemap where every
 * page changed today, every day, tells a crawler nothing, and crawlers that
 * notice learn to ignore the field. The same value is each case page's
 * TechArticle dateModified, from the same helper in seo.mjs, so the two
 * can't disagree.
 */
import { writeFileSync } from 'node:fs';
import { ORIGIN, PAGES } from './pages.mjs';
import { dateModifiedOf } from './seo.mjs';

const urls = PAGES.map(
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

const distinct = new Set(PAGES.map(dateModifiedOf)).size;
console.log(`sitemap: ${PAGES.length} urls, ${distinct} distinct lastmod dates from git`);
