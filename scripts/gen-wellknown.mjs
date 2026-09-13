/**
 * robots.txt and security.txt, written from ORIGIN.
 *
 * Both used to be static files in public/ with the origin typed into them,
 * which meant a domain move silently left robots.txt advertising a sitemap
 * on the old host. They are two lines each; generating them costs nothing
 * and removes a whole class of drift.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { ORIGIN } from './pages.mjs';

writeFileSync(
  'dist/robots.txt',
  `User-agent: *
Allow: /

Sitemap: ${ORIGIN}/sitemap.xml
`,
);

mkdirSync('dist/.well-known', { recursive: true });
writeFileSync(
  'dist/.well-known/security.txt',
  `Contact: mailto:daniel@adjlcapital.com
Preferred-Languages: en
Canonical: ${ORIGIN}/.well-known/security.txt
`,
);

console.log(`gen-wellknown: robots.txt + security.txt on ${ORIGIN}`);
