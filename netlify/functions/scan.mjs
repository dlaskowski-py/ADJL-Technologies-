/**
 * /api/scan: "See what AI sees on your site". Given a visitor's URL, fetch
 * that page server-side and return what a search crawler or an AI answer
 * engine is handed.
 *
 * STUB from the foundation: it answers 501 until WS-S builds it. Netlify
 * Functions v2 (a default export taking a Request and a Context, returning
 * a Response); `config.path` routes it, so it isn't served at
 * /.netlify/functions/scan. Headers on this response are set here: the
 * [[headers]] in netlify.toml apply only to static files.
 *
 * OWNER: WS-S. Validate input, cap sizes and time, rate-limit, fail closed.
 */
export default async () =>
  Response.json(
    { ok: false, error: 'not_built', message: 'The scanner isn’t built yet.' },
    { status: 501, headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } },
  );

export const config = {
  path: '/api/scan',
  /* Netlify's own rate limiter, per visitor (IP) on this domain: past the
     limit it answers 429 before the function runs. Tune when it's built. */
  rateLimit: { windowLimit: 10, windowSize: 60, aggregateBy: ['ip', 'domain'] },
};
