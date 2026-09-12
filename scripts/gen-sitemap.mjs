/** A sitemap from the one page list, so it cannot omit a page that exists. */
import { writeFileSync } from 'node:fs';
import { ORIGIN, PAGES } from './pages.mjs';

const today = new Date().toISOString().slice(0, 10);

const urls = PAGES.map(
  (p) => `  <url>
    <loc>${ORIGIN}${p.route}</loc>
    <lastmod>${today}</lastmod>
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

console.log(`sitemap: ${PAGES.length} urls`);
