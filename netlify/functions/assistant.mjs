/**
 * /api/assistant: the scoping assistant on /start/. POST a conversation,
 * get the next reply and a draft of the intake form's message; GET for
 * status (whether it's switched on). It uses a Claude model through the
 * official Anthropic SDK (@anthropic-ai/sdk), with ANTHROPIC_API_KEY set in
 * the Netlify UI (Functions scope). Until that key exists it must say it
 * isn't switched on, and the form on /start/ works without it.
 *
 * STUB from the foundation: it answers 501 until WS-A builds it. Netlify
 * Functions v2 (a default export taking a Request and a Context, returning
 * a Response); `config.path` routes it, so it isn't served at
 * /.netlify/functions/assistant. Headers on this response are set here: the
 * [[headers]] in netlify.toml apply only to static files.
 *
 * OWNER: WS-A. Validate input, cap sizes and time, rate-limit, fail closed.
 */
export default async () =>
  Response.json(
    { ok: false, enabled: false, error: 'not_built', message: 'The assistant isn’t built yet.' },
    { status: 501, headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } },
  );

export const config = {
  path: '/api/assistant',
  /* Netlify's own rate limiter, per visitor (IP) on this domain: past the
     limit it answers 429 before the function runs. Tune when it's built. */
  rateLimit: { windowLimit: 20, windowSize: 60, aggregateBy: ['ip', 'domain'] },
};
