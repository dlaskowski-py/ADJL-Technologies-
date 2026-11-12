/**
 * robots.txt and security.txt, written from ORIGIN.
 *
 * Both used to be static files in public/ with the origin typed into them,
 * which meant a domain move silently left robots.txt advertising a sitemap
 * on the old host. They're a few lines each; generating them costs nothing
 * and removes a whole class of drift.
 *
 * robots.txt names the AI crawlers in their own group. Today that group
 * says the same thing as the default (allow everything), so it changes no
 * behavior. It's there so the choice is written down: whether answer
 * engines may read and train on this site is Daniel's call, and when he
 * makes it, it's one line in this file. Daniel confirms this group before
 * launch.
 *
 * It also says, in a comment, where an agent should go instead of
 * crawling: /llms.txt for the text, and the MCP endpoint at /mcp, with
 * /agents/ on how to connect. A comment, because robots.txt has no field
 * for either and this file shouldn't invent one. No Disallow for /mcp
 * either: it answers POST, a crawler's GET gets a 405 marked noindex, and
 * a Disallow could read to an agent as "don't use this", which isn't
 * meant. (MCP Server Cards, an experimental MCP extension, would add a
 * discovery document under .well-known; it isn't published here while
 * its own repository calls it pre-release.)
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { ORIGIN } from './pages.mjs';

/** AI crawlers with a published user-agent token. */
const AI_CRAWLERS = ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended'];

writeFileSync(
  'dist/robots.txt',
  `User-agent: *
Allow: /

# AI crawlers and AI training. Named so the choice is explicit, not
# inherited. Default: allow. Daniel confirms this group before launch.
${AI_CRAWLERS.map((ua) => `User-agent: ${ua}`).join('\n')}
Allow: /

# For AI agents: this site's text is at ${ORIGIN}/llms.txt, and its MCP
# endpoint (Model Context Protocol, POST only) is ${ORIGIN}/mcp.
# How to connect: ${ORIGIN}/agents/

Sitemap: ${ORIGIN}/sitemap.xml
`,
);

mkdirSync('dist/.well-known', { recursive: true });
/* RFC 9116 makes Expires mandatory, so a stale file announces itself
   instead of being trusted forever. A year from the build: every deploy
   renews it. */
const expires = new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().replace(/\.\d{3}Z$/, 'Z');
writeFileSync(
  'dist/.well-known/security.txt',
  `Contact: mailto:daniel@adjlcapital.com
Expires: ${expires}
Preferred-Languages: en
Canonical: ${ORIGIN}/.well-known/security.txt
`,
);

console.log(
  `gen-wellknown: robots.txt (default group + ${AI_CRAWLERS.length} named AI crawlers, a pointer to llms.txt and /mcp) + security.txt on ${ORIGIN}`,
);
