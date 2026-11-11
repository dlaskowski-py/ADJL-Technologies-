/**
 * /mcp: the front door for AI agents. A Model Context Protocol endpoint
 * that answers questions about ADJL Technology from the site's own words,
 * with sources, and can start a conversation with Daniel (it submits the
 * intake form server-side, with source=agent). Documented on /agents/ and
 * in llms.txt. netlify.toml bundles dist/search-index.json and
 * dist/llms-full.txt with it ([functions.mcp] included_files).
 *
 * STUB from the foundation: it answers 501 until WS-M builds it. Netlify
 * Functions v2 (a default export taking a Request and a Context, returning
 * a Response); `config.path` routes it, so it isn't served at
 * /.netlify/functions/mcp. Headers on this response are set here: the
 * [[headers]] in netlify.toml apply only to static files.
 *
 * OWNER: WS-M. Validate input, cap sizes and time, rate-limit, fail closed.
 */
export default async () =>
  Response.json(
    { ok: false, error: 'not_built', message: 'The MCP endpoint isn’t built yet.' },
    { status: 501, headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } },
  );

export const config = {
  path: '/mcp',
  /* Netlify's own rate limiter, per client (IP) on this domain: past the
     limit it answers 429 before the function runs. Tune when it's built. */
  rateLimit: { windowLimit: 60, windowSize: 60, aggregateBy: ['ip', 'domain'] },
};
