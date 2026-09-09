/** A sitemap from the one page list, so it cannot omit a page that exists. */
import { writeFileSync } from 'node:fs';
import { PAGES } from './pages.mjs';

const ORIGIN = process.env.SITE_ORIGIN ?? 'https://adjltechnologies.netlify.app';
const today = new Date().toISOString().slice(0, 10);

const urls = PAGES.map(
  (p) => `  <url>
    <loc>${ORIGIN}${p.route}</loc>
    <lastmod>${today}</lastmod>
    <priority>${p.route === '/' ? '1.0' : p.route.startsWith('/legal/') ? '0.3' : '0.8'}</priority>
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
