/**
 * /mcp: the front door for AI agents. A Model Context Protocol server that
 * answers questions about ADJL Technology from the site's own words, with
 * a source for every answer, and can start a conversation with Daniel by
 * sending the intake form for the person the agent works for. Documented
 * on /agents/ and in llms.txt.
 *
 * PROTOCOL. Written against the MCP specification revision 2026-07-28
 * (modelcontextprotocol.io, read 2026-11-11), and dual-era as that
 * revision describes:
 *
 *   modern  2026-07-28. No handshake: every request carries its version
 *           and client capabilities in params._meta, and the Streamable
 *           HTTP headers MCP-Protocol-Version, Mcp-Method and (tools/call)
 *           Mcp-Name, which must match the body. server/discover answers
 *           with the versions, capabilities and instructions. Results carry
 *           resultType "complete" and serverInfo in _meta; tools/list and
 *           server/discover carry caching hints (ttlMs, cacheScope).
 *   legacy  2025-11-25, 2025-06-18, 2025-03-26 (and 2024-11-05 messages
 *           over this transport): the initialize handshake, answered
 *           without a session (no Mcp-Session-Id is ever minted), then
 *           notifications/initialized, ping, tools/list and tools/call.
 *           A request with no MCP-Protocol-Version header is 2025-03-26,
 *           as the transport allows.
 *
 * Both eras are stateless here, so any instance can answer any request.
 *
 * TRANSPORT. POST only, one JSON-RPC message per request (none of the
 * versions above allow batches), answered with one application/json
 * body, never a stream. A notification or a client's response gets 202
 * and no body. GET and DELETE get 405 with Allow. Errors that are about
 * the HTTP request (wrong method, body too large, bad Origin, malformed
 * JSON, header mismatch, unsupported version) have an HTTP status and a
 * JSON-RPC error body; an unknown method is 404 for a modern request, as
 * that revision requires. Everything else is 200 with a JSON-RPC result
 * or error. A tool's own failure (bad arguments, nothing found, a limit)
 * is a result with isError: true, worded so the agent can fix the call.
 *
 * ORIGIN. A request with no Origin header (every native MCP client, and
 * every server-side one) is served. A browser's Origin must be this
 * site: adjltechnology.com, a Netlify preview of it, or localhost while
 * developing. Anything else gets 403 before the body is read, which is
 * the DNS-rebinding protection the transport requires. CORS headers are
 * only ever sent back to an allowed origin, never "*".
 *
 * DATA. The tools read what the build wrote: dist/search-index.json (the
 * same passages, stemmer and confidence floor as Ask This Site, scored
 * by the same src/lib/bm25.ts) and dist/llms-full.txt (every indexed
 * page's markdown twin, which get_page and the list tools are made of).
 * Both are bundled with the function ([functions.mcp] included_files in
 * netlify.toml) and read once per warm instance, so an answer is this
 * deploy's text by construction. If they aren't on disk (a local test),
 * they're fetched once from the request's own origin, with a time and
 * size cap, and kept for five minutes. The page list (src/site-pages.ts)
 * decides which paths exist; a noindex page doesn't.
 *
 * WRITING. start_conversation is the one tool that acts. It POSTs the
 * intake form ("start", the form contract in BUILD2/src/sections/start.ts)
 * to the site's own origin, url-encoded, with source=agent and the
 * honeypot left empty, the same request the start page's own script
 * makes. Netlify Forms then stores it, filters spam and emails Daniel.
 *
 * LIMITS, all failing closed:
 *   - per client IP and domain, 60 requests a minute: Netlify's own
 *     limiter (config.rateLimit below) answers 429 before this runs
 *   - a 32 kB body, read as a stream and cut off past the cap
 *   - start_conversation: 3 messages a day per visitor, and
 *     MCP_DAILY_LIMIT a day for the whole site (default 20, at most 1000;
 *     0 switches it off without a deploy). The same message twice in a
 *     day is sent once. The limits live in Netlify Blobs (store
 *     "mcp-limits") as numbered slots, each an empty record: the
 *     visitor's (day/sent/visitor/0..2) and the site's (day/site/0000..).
 *     A message is sent only after it holds one of each, claimed with an
 *     atomic onlyIfNew write, so calls that arrive together can't get
 *     past either limit; if the form isn't delivered, its slots are given
 *     back. The visitor part is a SHA-256 of the IP address mixed with a
 *     random value made once a day and kept only in that store, never the
 *     address itself; the duplicate check keeps a SHA-256 of the message
 *     mixed with the same value (day/dup/hash). The day's records and its
 *     random value are deleted after that day, the next time any tool is
 *     called. If the store can't be read or written, nothing is sent.
 *   - 5 s to fetch the site's files when they aren't bundled, 10 s to
 *     hand the form to Netlify
 *
 * PRIVACY. Nothing an agent searches for or reads is stored or logged.
 * The log line for a tool call is its name, its outcome and its time:
 * one of the tools' own names and outcome codes, never text from the
 * request, so a caller can't write into the log.
 *
 * Netlify Functions v2: a default export taking (Request, Context) and
 * returning a Response, routed by config.path. Headers are set here; the
 * [[headers]] in netlify.toml apply only to static files. createHandler()
 * takes its dependencies (the site, the form, the store, env, clock), so
 * the tests can drive it with fakes.
 *
 * OWNER: WS-M.
 */
import { getStore } from '@netlify/blobs';
import { createHash, randomBytes } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createEngine, fmt, FLOOR, quote, run } from '../../src/lib/bm25.ts';
import { SITE_PAGES } from '../../src/site-pages.ts';
import { mcp as WORDS } from '../../src/content-agents.ts';

/* ── Versions ─────────────────────────────────────────────────────── */

export const MODERN = ['2026-07-28'];
export const LEGACY = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05'];
export const SUPPORTED = [...MODERN, ...LEGACY];
/** What a legacy client is offered when it asks for a version we don't
 *  speak: the latest handshake version. */
const LATEST_LEGACY = LEGACY[0];

const META = {
  version: 'io.modelcontextprotocol/protocolVersion',
  caps: 'io.modelcontextprotocol/clientCapabilities',
  server: 'io.modelcontextprotocol/serverInfo',
};

/** JSON-RPC and MCP error codes this server sends. */
export const CODES = {
  parse: -32700,
  invalidRequest: -32600,
  method: -32601,
  params: -32602,
  internal: -32603,
  headerMismatch: -32020,
  unsupportedVersion: -32022,
};

export const LIMITS = {
  bodyBytes: 32 * 1024,
  query: 300,
  results: 8,
  defaultResults: 5,
  /** Longest quote in a search result, cut at a sentence. */
  quote: 600,
  path: 2048,
  name: 120,
  email: 200,
  messageMin: 20,
  messageMax: 5000,
  perVisitorDay: 3,
  daily: 20,
  /** The most MCP_DAILY_LIMIT can raise it to: one slot is one key. */
  dailyMax: 1000,
  fetchMs: 5000,
  submitMs: 10_000,
  /** The site's files, when fetched instead of bundled. */
  fileBytes: 4 * 1024 * 1024,
  /** How long a fetched copy is kept. A bundled copy is kept for good. */
  fetchedTtlMs: 5 * 60_000,
  /** tools/list and server/discover change only with a deploy. */
  ttlMs: 60 * 60_000,
};

/* ── Hosts ────────────────────────────────────────────────────────── */

const CANONICAL = 'https://adjltechnology.com';
/** This site's hosts: the domain, Netlify's name for it and its deploy
 *  previews, and localhost while developing (plain http allowed). */
const SITE_HOSTS = [/^(www\.)?adjltechnology\.com$/, /^([a-z0-9-]+--)?adjl-technology\.netlify\.app$/];
const LOCAL_HOSTS = /^(localhost|127\.0\.0\.1|\[::1\])$/;

function trustedUrl(u) {
  if (u.protocol === 'https:' && SITE_HOSTS.some((re) => re.test(u.hostname))) return true;
  return (u.protocol === 'http:' || u.protocol === 'https:') && LOCAL_HOSTS.test(u.hostname);
}

/** Is this browser Origin one of ours? "null" and anything unparsable
 *  isn't. */
export function originAllowed(origin) {
  try {
    const u = new URL(origin);
    return u.origin === origin && trustedUrl(u);
  } catch {
    return false;
  }
}

/** Hosts that serve the site themselves rather than redirect: the apex
 *  and deploy previews. www and the bare netlify.app name answer 301 to
 *  the apex (netlify.toml, scripts/pages.mjs), so a form posted there
 *  would never reach Netlify Forms. */
const SELF_HOSTS = [/^adjltechnology\.com$/, /^[a-z0-9-]+--adjl-technology\.netlify\.app$/];

/** The site's own origin, for fetching its files and sending its form:
 *  the origin this request arrived on when it serves the site itself (so
 *  a deploy preview talks to itself), else the canonical one. */
function selfOrigin(req) {
  try {
    const u = new URL(req.url);
    if ((u.protocol === 'https:' && SELF_HOSTS.some((re) => re.test(u.hostname))) || LOCAL_HOSTS.test(u.hostname)) {
      return u.origin;
    }
  } catch {
    /* Fall through to the canonical origin. */
  }
  return CANONICAL;
}

/* ── Responses ────────────────────────────────────────────────────── */

const BASE_HEADERS = {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'X-Robots-Tag': 'noindex',
};
const ALLOW = 'POST, OPTIONS';

function corsFor(origin) {
  return origin ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : {};
}

function json(body, status, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...BASE_HEADERS, 'Content-Type': 'application/json; charset=utf-8', ...extra },
  });
}

const rpcError = (id, code, message, data) => ({
  jsonrpc: '2.0',
  ...(id === undefined ? {} : { id }),
  error: { code, message, ...(data === undefined ? {} : { data }) },
});

/* ── The site ─────────────────────────────────────────────────────── */

/** The page list, by route. A noindex page has no twin and no passages. */
const PAGES = new Map(SITE_PAGES.map((p) => [p.route, p]));
const labelOf = (route) => PAGES.get(route)?.label ?? route;

/**
 * Every page's markdown twin, from llms-full.txt. gen-llms writes one
 * header, then each twin after a line of three dashes; each twin opens on
 * its h1, then "> description", "Page: <url>" and "Updated: <date>".
 */
export function parseFull(text) {
  const pages = new Map();
  for (const chunk of text.split(/\n\n---\n\n(?=# )/).slice(1)) {
    const lines = chunk.split('\n');
    const field = (prefix) => lines.find((l) => l.startsWith(prefix))?.slice(prefix.length).trim() ?? '';
    const url = field('Page: ');
    let route;
    try {
      route = new URL(url).pathname;
    } catch {
      continue;
    }
    pages.set(route, {
      route,
      url,
      title: lines[0].replace(/^#\s+/, '').trim(),
      description: field('> '),
      updated: field('Updated: '),
      markdown: `${chunk.trim()}\n`,
    });
  }
  return pages;
}

/** The search engine and the pages, from the two files' text. Throws if
 *  either is unusable: an index the bm25 code didn't write can't be
 *  scored honestly, and no pages means nothing to cite. */
export function parseSite(indexText, fullText) {
  const engine = createEngine(JSON.parse(indexText));
  if (!engine.ok) throw new Error('search index does not match src/lib/bm25.ts');
  const pages = parseFull(fullText);
  if (!pages.size) throw new Error('llms-full.txt holds no pages');
  const first = pages.values().next().value;
  return { engine, pages, origin: new URL(first.url).origin };
}

/** The bundled copies, if this deploy has them. Netlify puts
 *  included_files under the function's root, which is the working
 *  directory on Lambda; the other paths cover other runtimes. */
function readBundled() {
  const dirs = [];
  if (process.env.LAMBDA_TASK_ROOT) dirs.push(join(process.env.LAMBDA_TASK_ROOT, 'dist'));
  dirs.push(join(process.cwd(), 'dist'));
  try {
    dirs.push(fileURLToPath(new URL('../../dist', import.meta.url)));
  } catch {
    /* Bundled somewhere import.meta.url doesn't point at a file. */
  }
  for (const d of dirs) {
    const index = join(d, 'search-index.json');
    const full = join(d, 'llms-full.txt');
    try {
      if (existsSync(index) && existsSync(full)) return parseSite(readFileSync(index, 'utf8'), readFileSync(full, 'utf8'));
    } catch (err) {
      logError('bundled', err);
    }
  }
  return null;
}

/** GET one of the site's own files, capped in time and size. */
async function fetchText(url) {
  const res = await fetch(url, {
    headers: { Accept: 'application/json, text/plain;q=0.9, */*;q=0.1' },
    redirect: 'error',
    signal: AbortSignal.timeout(LIMITS.fetchMs),
  });
  if (!res.ok || !res.body) throw new Error(`${url} answered ${res.status}`);
  const reader = res.body.getReader();
  const parts = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > LIMITS.fileBytes) {
      await reader.cancel();
      throw new Error(`${url} is over ${LIMITS.fileBytes} bytes`);
    }
    parts.push(value);
  }
  return Buffer.concat(parts).toString('utf8');
}

let bundled; // undefined: not looked for yet; null: not there
const fetched = new Map(); // origin → { at, site }

/** The site, once per warm instance: bundled, or fetched from `origin`. */
async function defaultLoadSite(origin, now) {
  if (bundled === undefined) bundled = readBundled();
  if (bundled) return bundled;
  const hit = fetched.get(origin);
  if (hit && now - hit.at < LIMITS.fetchedTtlMs) return hit.site;
  const [index, full] = await Promise.all([fetchText(`${origin}/search-index.json`), fetchText(`${origin}/llms-full.txt`)]);
  const site = parseSite(index, full);
  fetched.set(origin, { at: now, site });
  return site;
}

/* ── The form ─────────────────────────────────────────────────────── */

/** Hand the intake form to Netlify, as the start page's script does.
 *  True when Netlify took it: a 2xx, or the 302/303 a form handler may
 *  send toward its success page. A 301, 307 or 308 is a host redirect,
 *  so the form never reached Netlify Forms; it counts as not delivered. */
async function submitForm(origin, fields) {
  const body = new URLSearchParams({
    'form-name': 'start',
    name: fields.name,
    email: fields.email,
    topic: fields.topic,
    message: fields.message,
    source: 'agent',
    'company-website': '',
  });
  const res = await fetch(`${origin}/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': `ADJL-MCP/${WORDS.version} (+${WORDS.page})`,
    },
    body: body.toString(),
    redirect: 'manual',
    signal: AbortSignal.timeout(LIMITS.submitMs),
  });
  await res.body?.cancel().catch(() => {});
  return res.ok || res.status === 302 || res.status === 303;
}

/* ── Limits ───────────────────────────────────────────────────────── */

const dayOf = (ms) => new Date(ms).toISOString().slice(0, 10);
const sha = (s) => createHash('sha256').update(s).digest('hex');

/** Today's random value, made by whichever request needs it first. */
async function daySalt(store, day) {
  const key = `${day}/salt`;
  const have = await store.get(key);
  if (have) return have;
  await store.set(key, randomBytes(16).toString('hex'), { onlyIfNew: true });
  const salt = await store.get(key);
  if (!salt) throw new Error('no salt');
  return salt;
}

/**
 * A first look at today's counts, before anything is written: 'paused'
 * when sending is switched off (MCP_DAILY_LIMIT=0), 'full' when the site's
 * slots for the day are taken, 'limited' when this visitor's are. Only a
 * look: reserve() is what holds the limits when calls arrive together.
 */
export async function admit(store, { ip, now, daily, perVisitor }) {
  if (daily <= 0) return { verdict: 'paused' };
  const day = dayOf(now);
  const salt = await daySalt(store, day);
  const visitor = sha(`${salt}|${ip}`).slice(0, 32);
  const gate = { day, salt, visitor, daily, perVisitor };
  const site = await store.list({ prefix: `${day}/site/` });
  if (site.blobs.length >= daily) return { verdict: 'full', ...gate };
  const mine = await store.list({ prefix: `${day}/sent/${visitor}/` });
  if (mine.blobs.length >= perVisitor) return { verdict: 'limited', ...gate };
  return { verdict: null, ...gate };
}

/**
 * Claim one of this visitor's slots for the day, then one of the site's,
 * each a numbered key written with onlyIfNew. Netlify Blobs makes that
 * write atomic, so two calls can never hold the same slot and the limits
 * hold however many calls arrive at once; a count or a listing can't
 * promise that. The visitor's slot comes first, so one address can hold
 * at most perVisitor of the site's slots even for a moment. Returns
 * { verdict: null, keys } with the claimed keys (release them if the
 * message isn't sent), or { verdict: 'limited' | 'full' } having claimed
 * nothing.
 */
export async function reserve(store, gate) {
  const { day, visitor, daily, perVisitor } = gate;
  let own = null;
  for (let j = 0; j < perVisitor && !own; j++) {
    const key = `${day}/sent/${visitor}/${j}`;
    if ((await store.set(key, '1', { onlyIfNew: true })).modified) own = key;
  }
  if (!own) return { verdict: 'limited' };

  try {
    const { blobs } = await store.list({ prefix: `${day}/site/` });
    const taken = new Set(blobs.map((b) => b.key));
    for (let i = 0; i < daily; i++) {
      const key = `${day}/site/${String(i).padStart(4, '0')}`;
      if (taken.has(key)) continue;
      /* Not modified: another call took this slot since the listing. */
      if ((await store.set(key, '1', { onlyIfNew: true })).modified) return { verdict: null, keys: [own, key] };
    }
  } catch (err) {
    await release(store, [own]);
    throw err;
  }
  await release(store, [own]);
  return { verdict: 'full' };
}

/** Give back claimed slots (and a duplicate check) when nothing was
 *  sent. A failed delete only leaves a slot held: fail closed. */
async function release(store, keys) {
  for (const key of keys) await store.delete(key).catch((err) => logError('limits', err));
}

/** Delete every record (and random value) from a day before today. */
export async function sweep(store, now) {
  const today = dayOf(now);
  const { directories = [] } = await store.list({ directories: true });
  for (const d of directories) {
    if (d === today) continue;
    const { blobs } = await store.list({ prefix: `${d}/` });
    for (const b of blobs) await store.delete(b.key);
  }
}

/* ── Tools ────────────────────────────────────────────────────────── */

const R = WORDS.replies;
const fill = (s, vars) => s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
const words = Object.fromEntries(WORDS.tools.map((t) => [t.name, t]));
const paramText = (tool, name) => words[tool].params.find((p) => p.name === name)?.text ?? '';

const str = (description, extra = {}) => ({ type: 'string', description, ...extra });
const obj = (properties, required = []) => ({
  type: 'object',
  properties,
  ...(required.length ? { required } : {}),
  additionalProperties: false,
});

const READ = { readOnlyHint: true, openWorldHint: false };

/** The input and output schemas, by tool. Words come from
 *  content-agents.ts; types and limits live here. */
const SCHEMAS = {
  search_site: {
    input: obj(
      {
        query: str(paramText('search_site', 'query'), { minLength: 1, maxLength: LIMITS.query }),
        limit: {
          type: 'integer',
          description: paramText('search_site', 'limit'),
          minimum: 1,
          maximum: LIMITS.results,
          default: LIMITS.defaultResults,
        },
      },
      ['query'],
    ),
    output: obj(
      {
        query: { type: 'string' },
        answered: { type: 'boolean' },
        floor: { type: 'number' },
        results: {
          type: 'array',
          items: obj(
            {
              page: { type: 'string' },
              page_url: { type: 'string' },
              url: { type: 'string' },
              section: { type: 'string' },
              quote: { type: 'string' },
              confidence: { type: 'number' },
            },
            ['page', 'page_url', 'url', 'section', 'quote', 'confidence'],
          ),
        },
        closest: {
          type: 'array',
          items: obj({ page: { type: 'string' }, url: { type: 'string' } }, ['page', 'url']),
        },
      },
      ['query', 'answered', 'floor', 'results', 'closest'],
    ),
    annotations: READ,
  },
  get_page: {
    input: obj({ path: str(paramText('get_page', 'path'), { minLength: 1, maxLength: LIMITS.path }) }, ['path']),
    annotations: READ,
  },
  list_services: {
    input: obj({}),
    output: obj(
      {
        overview_url: { type: 'string' },
        services: {
          type: 'array',
          items: obj(
            { name: { type: 'string' }, url: { type: 'string' }, summary: { type: 'string' }, part_of: { type: 'string' } },
            ['name', 'url', 'summary'],
          ),
        },
      },
      ['overview_url', 'services'],
    ),
    annotations: READ,
  },
  list_work: {
    input: obj({}),
    output: obj(
      {
        overview_url: { type: 'string' },
        work: {
          type: 'array',
          items: obj({ name: { type: 'string' }, url: { type: 'string' }, summary: { type: 'string' } }, ['name', 'url', 'summary']),
        },
      },
      ['overview_url', 'work'],
    ),
    annotations: READ,
  },
  start_conversation: {
    input: obj(
      {
        name: str(paramText('start_conversation', 'name'), { minLength: 1, maxLength: LIMITS.name }),
        email: str(paramText('start_conversation', 'email'), { minLength: 3, maxLength: LIMITS.email }),
        message: str(paramText('start_conversation', 'message'), {
          minLength: LIMITS.messageMin,
          maxLength: LIMITS.messageMax,
        }),
        topic: str(paramText('start_conversation', 'topic'), { enum: WORDS.topics }),
      },
      ['name', 'email', 'message'],
    ),
    output: obj(
      {
        status: { type: 'string', enum: ['sent', 'already_sent'] },
        reply_to: { type: 'string' },
        topic: { type: 'string' },
      },
      ['status', 'reply_to', 'topic'],
    ),
    /* It adds a message and never changes or removes anything; the same
       message twice in a day is sent once; it reaches a person. */
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  },
};

/** tools/list, in a fixed order (the order of content-agents.ts). */
export const TOOLS = WORDS.tools.map((t) => {
  const s = SCHEMAS[t.name];
  return {
    name: t.name,
    title: t.title,
    description: t.description,
    inputSchema: s.input,
    ...(s.output ? { outputSchema: s.output } : {}),
    annotations: { title: t.title, ...s.annotations },
  };
});

const done = (text, structured) => ({
  content: [{ type: 'text', text }],
  ...(structured === undefined ? {} : { structuredContent: structured }),
  isError: false,
});
const failed = (text) => ({ content: [{ type: 'text', text }], isError: true });

/** Arguments the tool doesn't take, as an error result; null when fine. */
function unexpected(args, allowed) {
  const extra = Object.keys(args).find((k) => !allowed.includes(k));
  if (extra === undefined) return null;
  return failed(
    allowed.length
      ? fill(R.invalid.args, { arg: extra, args: allowed.join(', ') })
      : fill(R.invalid.noArgs, { arg: extra }),
  );
}

const oneLine = (s) => s.replace(/\s+/g, ' ').trim();

function searchSite(site, args) {
  const bad = unexpected(args, ['query', 'limit']);
  if (bad) return { result: bad, outcome: 'bad_args' };
  if (typeof args.query !== 'string' || !oneLine(args.query) || args.query.length > LIMITS.query) {
    return { result: failed(R.invalid.query), outcome: 'bad_args' };
  }
  const limit = args.limit ?? LIMITS.defaultResults;
  if (!Number.isInteger(limit) || limit < 1 || limit > LIMITS.results) return { result: failed(R.invalid.limit), outcome: 'bad_args' };

  const query = oneLine(args.query);
  const { search, answer } = run(site.engine, query);
  /* The answer's own picks first (one per section, every part of a
     compound question served), then everything else above the floor. */
  const seen = new Set();
  const picked = [];
  for (const h of [...answer.cited, ...answer.above]) {
    if (picked.length >= limit) break;
    if (seen.has(h.p.id)) continue;
    seen.add(h.p.id);
    picked.push(h);
  }
  const results = picked.map((h) => {
    const q = quote(h.p.text, h.matched, site.engine.stop, LIMITS.quote);
    return {
      page: labelOf(h.p.route),
      page_url: `${site.origin}${h.p.route}`,
      url: `${site.origin}${h.p.route}#${h.p.anchor}`,
      section: h.p.heading,
      quote: `${q.before ? '… ' : ''}${q.text}${q.after ? ' …' : ''}`,
      confidence: Number(fmt(h.conf)),
    };
  });

  if (results.length) {
    const text = [
      fill(R.searchHead, { query }),
      ...results.map((r, i) => `${i + 1}. ${r.page}: ${r.section} (confidence ${fmt(r.confidence)})\n   ${r.url}\n   “${r.quote}”`),
    ].join('\n\n');
    return {
      result: done(text, { query, answered: true, floor: FLOOR, results, closest: [] }),
      outcome: `answered:${results.length}`,
    };
  }

  const routes = [];
  for (const h of search.hits) {
    if (!routes.includes(h.p.route)) routes.push(h.p.route);
    if (routes.length >= 3) break;
  }
  const closest = routes.map((r) => ({ page: labelOf(r), url: `${site.origin}${r}` }));
  const text = [
    fill(R.searchNone, { query }),
    ...(closest.length ? [R.searchClosest, closest.map((c) => `- ${c.page}: ${c.url}`).join('\n')] : []),
  ].join('\n\n');
  return { result: done(text, { query, answered: false, floor: FLOOR, results: [], closest }), outcome: 'abstained' };
}

/** "/services/seo", "services/seo/index.md" or a full address on this
 *  site → "/services/seo/". null when it isn't a path on this site. */
export function routeOf(raw) {
  let u;
  try {
    u = new URL(raw.trim(), `${CANONICAL}/`);
  } catch {
    return null;
  }
  if (!trustedUrl(u)) return null;
  let path = u.pathname.replace(/\/{2,}/g, '/').replace(/\/index\.(md|html)$/, '/').toLowerCase();
  if (!path.endsWith('/')) path += '/';
  return path;
}

function getPage(site, args) {
  const bad = unexpected(args, ['path']);
  if (bad) return { result: bad, outcome: 'bad_args' };
  if (typeof args.path !== 'string' || !args.path.trim() || args.path.length > LIMITS.path) {
    return { result: failed(R.invalid.path), outcome: 'bad_args' };
  }
  const route = routeOf(args.path);
  if (!route) return { result: failed(R.offSite), outcome: 'off_site' };
  const page = site.pages.get(route);
  if (!page || !PAGES.has(route) || PAGES.get(route).noindex) {
    return { result: failed(fill(R.notFound, { path: route })), outcome: 'not_found' };
  }
  return { result: done(page.markdown), outcome: 'read' };
}

/** The indexed pages under a hub, in the page list's order. */
function listUnder(site, hub) {
  return SITE_PAGES.filter((p) => p.route.startsWith(hub) && p.route !== hub && !p.noindex)
    .map((p) => ({ p, page: site.pages.get(p.route) }))
    .filter((x) => x.page);
}

function listServices(site, args) {
  const bad = unexpected(args, []);
  if (bad) return { result: bad, outcome: 'bad_args' };
  const services = listUnder(site, '/services/').map(({ p, page }) => ({
    name: p.label,
    url: page.url,
    summary: page.description,
    ...(p.parent && p.parent !== '/services/' ? { part_of: labelOf(p.parent) } : {}),
  }));
  const overview = `${site.origin}/services/`;
  const text = [
    fill(R.servicesHead, { url: overview }),
    services.map((s) => `- ${s.name}${s.part_of ? ` (part of ${s.part_of})` : ''}: ${s.summary}\n  ${s.url}`).join('\n'),
  ].join('\n\n');
  return { result: done(text, { overview_url: overview, services }), outcome: `listed:${services.length}` };
}

function listWork(site, args) {
  const bad = unexpected(args, []);
  if (bad) return { result: bad, outcome: 'bad_args' };
  const work = listUnder(site, '/work/').map(({ p, page }) => ({ name: p.label, url: page.url, summary: page.description }));
  const overview = `${site.origin}/work/`;
  const text = [fill(R.workHead, { url: overview }), work.map((w) => `- ${w.name}: ${w.summary}\n  ${w.url}`).join('\n')].join(
    '\n\n',
  );
  return { result: done(text, { overview_url: overview, work }), outcome: `listed:${work.length}` };
}

const EMAIL = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:".]{2,}$/;
// eslint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;

/** The form's fields, or an error result. */
export function checkMessage(args) {
  const bad = unexpected(args, ['name', 'email', 'message', 'topic']);
  if (bad) return { error: bad };
  const { name, email, message, topic } = args;
  if (typeof name !== 'string' || !name.trim() || name.length > LIMITS.name || /[\r\n]/.test(name) || CONTROL.test(name)) {
    return { error: failed(R.invalid.name) };
  }
  if (typeof email !== 'string' || email.trim().length > LIMITS.email || !EMAIL.test(email.trim())) {
    return { error: failed(R.invalid.email) };
  }
  if (typeof message !== 'string' || CONTROL.test(message)) return { error: failed(R.invalid.messageShort) };
  const text = message.trim();
  if (text.length < LIMITS.messageMin) return { error: failed(R.invalid.messageShort) };
  if (text.length > LIMITS.messageMax) return { error: failed(R.invalid.messageLong) };
  if (topic !== undefined && !WORDS.topics.includes(topic)) {
    return { error: failed(fill(R.invalid.topic, { topics: WORDS.topics.join(', ') })) };
  }
  return {
    fields: {
      name: name.trim(),
      email: email.trim(),
      message: text,
      topic: topic ?? WORDS.topics[WORDS.topics.length - 1],
    },
  };
}

async function startConversation(args, ctx) {
  const v = checkMessage(args);
  if (v.error) return { result: v.error, outcome: 'bad_args' };
  const f = v.fields;
  const contact = WORDS.contact;
  const daily = Number.parseInt(ctx.env('MCP_DAILY_LIMIT') ?? '', 10);

  let store;
  let gate;
  try {
    store = ctx.store();
    gate = await admit(store, {
      ip: ctx.ip,
      now: ctx.now,
      daily: Number.isFinite(daily) && daily >= 0 ? Math.min(daily, LIMITS.dailyMax) : LIMITS.daily,
      perVisitor: LIMITS.perVisitorDay,
    });
  } catch (err) {
    logError('limits', err);
    return { result: failed(fill(R.failed, { contact })), outcome: 'store_error' };
  }
  if (gate.verdict) return { result: failed(fill(R[gate.verdict], { contact })), outcome: gate.verdict };

  /* Once per message per day: an agent that retries after a timeout
     mustn't email Daniel twice. The key holds no words, only a hash. */
  const dupKey = `${gate.day}/dup/${sha(`${gate.salt}|${f.email.toLowerCase()}|${f.name}|${f.message}`).slice(0, 40)}`;
  let first;
  try {
    first = (await store.set(dupKey, '1', { onlyIfNew: true })).modified;
  } catch (err) {
    logError('limits', err);
    return { result: failed(fill(R.failed, { contact })), outcome: 'store_error' };
  }
  const structured = (status) => ({ status, reply_to: f.email, topic: f.topic });
  if (!first) return { result: done(R.duplicate, structured('already_sent')), outcome: 'duplicate' };

  /* Hold a slot before the form goes, so calls that arrive together
     can't all pass the first look and all send. */
  let slot;
  try {
    slot = await reserve(store, gate);
  } catch (err) {
    logError('limits', err);
    await release(store, [dupKey]);
    return { result: failed(fill(R.failed, { contact })), outcome: 'store_error' };
  }
  if (slot.verdict) {
    await release(store, [dupKey]);
    return { result: failed(fill(R[slot.verdict], { contact })), outcome: slot.verdict };
  }

  let ok = false;
  try {
    ok = await ctx.submit(ctx.origin, f);
  } catch (err) {
    logError('form', err);
  }
  if (!ok) {
    await release(store, [...slot.keys, dupKey]);
    return { result: failed(fill(R.failed, { contact })), outcome: 'form_error' };
  }
  return { result: done(fill(R.sent, { email: f.email, contact }), structured('sent')), outcome: 'sent' };
}

/* Looked up with Object.hasOwn, never RUN[name] alone: a name such as
   "constructor" or "toString" is on every object's prototype. */
const RUN = {
  search_site: (args, ctx) => ctx.site().then((s) => searchSite(s, args)),
  get_page: (args, ctx) => ctx.site().then((s) => getPage(s, args)),
  list_services: (args, ctx) => ctx.site().then((s) => listServices(s, args)),
  list_work: (args, ctx) => ctx.site().then((s) => listWork(s, args)),
  start_conversation: startConversation,
};

/* ── Protocol ─────────────────────────────────────────────────────── */

const serverInfo = () => ({
  name: WORDS.name,
  title: WORDS.title,
  version: WORDS.version,
  description: WORDS.description,
  websiteUrl: WORDS.page,
});

/** An Mcp-Name header's value, decoded from the base64 form the
 *  transport allows for names that aren't plain ASCII. null if it's
 *  neither form. */
export function headerValue(v) {
  const m = /^=\?base64\?([A-Za-z0-9+/]*={0,2})\?=$/.exec(v);
  if (m) return Buffer.from(m[1], 'base64').toString('utf8');
  return /^[\x20-\x7e\t]*$/.test(v) ? v : null;
}

/**
 * Which era a request belongs to, after the checks that era requires.
 * Returns { era, version } or { status, error } to send back.
 */
export function resolveEra(msg, headers) {
  const { id, method } = msg;
  const params = msg.params ?? {};
  const meta = params._meta && typeof params._meta === 'object' ? params._meta : {};
  const requested = meta[META.version];
  const header = headers.get('mcp-protocol-version');
  const no = (status, code, message, data) => ({ status, error: rpcError(id, code, message, data) });

  if (method === 'initialize' && requested === undefined) {
    const asked = params.protocolVersion;
    return { era: 'legacy', version: LEGACY.includes(asked) ? asked : LATEST_LEGACY };
  }

  if (requested !== undefined) {
    if (typeof requested !== 'string') return no(400, CODES.params, `_meta["${META.version}"] must be a string.`);
    if (LEGACY.includes(requested)) return { era: 'legacy', version: requested };
    if (!MODERN.includes(requested)) {
      return no(400, CODES.unsupportedVersion, 'Unsupported protocol version', { supported: SUPPORTED, requested });
    }
    if (header === null) return no(400, CODES.headerMismatch, 'Header mismatch: the MCP-Protocol-Version header is missing.');
    if (header !== requested) {
      return no(400, CODES.headerMismatch, `Header mismatch: MCP-Protocol-Version header '${header}' does not match body value '${requested}'.`);
    }
    const mh = headers.get('mcp-method');
    if (mh === null) return no(400, CODES.headerMismatch, 'Header mismatch: the Mcp-Method header is missing.');
    if (mh !== method) return no(400, CODES.headerMismatch, `Header mismatch: Mcp-Method header '${mh}' does not match body value '${method}'.`);
    if (method === 'tools/call' || method === 'prompts/get' || method === 'resources/read') {
      const body = method === 'resources/read' ? params.uri : params.name;
      const raw = headers.get('mcp-name');
      if (raw === null) return no(400, CODES.headerMismatch, 'Header mismatch: the Mcp-Name header is missing.');
      const name = headerValue(raw);
      if (name === null) return no(400, CODES.headerMismatch, 'Header mismatch: the Mcp-Name header has invalid characters.');
      if (name !== body) return no(400, CODES.headerMismatch, `Header mismatch: Mcp-Name header '${name}' does not match body value '${body}'.`);
    }
    const caps = meta[META.caps];
    if (!caps || typeof caps !== 'object' || Array.isArray(caps)) {
      return no(400, CODES.params, `Invalid params: _meta["${META.caps}"] is required.`);
    }
    return { era: 'modern', version: requested };
  }

  if (header === null) return { era: 'legacy', version: '2025-03-26' };
  if (LEGACY.includes(header)) return { era: 'legacy', version: header };
  if (MODERN.includes(header)) {
    return no(400, CODES.params, `Invalid params: version ${header} requests carry _meta["${META.version}"] and _meta["${META.caps}"].`);
  }
  return no(400, CODES.unsupportedVersion, 'Unsupported protocol version', { supported: SUPPORTED, requested: header });
}

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

/** Read the body as a stream, giving up past the cap. null: too large. */
async function readCapped(req, cap) {
  if (!req.body) return '';
  const reader = req.body.getReader();
  const parts = [];
  let size = 0;
  for (;;) {
    const { done: end, value } = await reader.read();
    if (end) break;
    size += value.byteLength;
    if (size > cap) {
      await reader.cancel().catch(() => {});
      return null;
    }
    parts.push(value);
  }
  return Buffer.concat(parts).toString('utf8');
}

function logError(where, err) {
  console.error(`mcp: ${where}: ${err?.name ?? 'Error'}: ${String(err?.message ?? err).slice(0, 200)}`);
}

const readEnv = (name) => (globalThis.Netlify?.env?.get(name) ?? process.env[name]) || undefined;

/**
 * The function, with its dependencies injectable:
 *   loadSite(origin, now)  { engine, pages, origin } (throws if unusable)
 *   submit(origin, fields) true when Netlify took the form
 *   store()                a Blobs store (get, set, list, delete)
 *   env(name)              configuration
 *   now()                  the clock
 *   log(line)              one line per tool call
 */
export function createHandler(deps = {}) {
  const loadSite = deps.loadSite ?? defaultLoadSite;
  const submit = deps.submit ?? submitForm;
  const openStore = deps.store ?? (() => getStore({ name: 'mcp-limits', consistency: 'strong' }));
  const env = deps.env ?? readEnv;
  const now = deps.now ?? Date.now;
  const log = deps.log ?? ((line) => console.info(line));
  let swept = '';

  return async (req, context = {}) => {
    const origin = req.headers.get('origin');
    if (origin !== null && !originAllowed(origin)) {
      return json(rpcError(undefined, CODES.invalidRequest, 'Forbidden: this endpoint doesn’t take requests from other websites’ pages.'), 403);
    }
    const cors = corsFor(origin);

    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          ...BASE_HEADERS,
          ...cors,
          Allow: ALLOW,
          ...(origin
            ? {
                'Access-Control-Allow-Methods': ALLOW,
                'Access-Control-Allow-Headers':
                  'Content-Type, Accept, MCP-Protocol-Version, Mcp-Method, Mcp-Name, Last-Event-ID, Mcp-Session-Id',
                'Access-Control-Max-Age': '600',
              }
            : {}),
        },
      });
    }
    if (req.method !== 'POST') {
      return json(
        rpcError(undefined, CODES.invalidRequest, `This is an MCP endpoint: send JSON-RPC with POST. How to connect: ${WORDS.page}`),
        405,
        { ...cors, Allow: ALLOW },
      );
    }

    const fail = (status, id, code, message, data) => json(rpcError(id, code, message, data), status, cors);
    const type = (req.headers.get('content-type') ?? '').toLowerCase();
    if (!type.startsWith('application/json')) {
      return fail(415, undefined, CODES.invalidRequest, 'Unsupported media type: send Content-Type: application/json.');
    }
    const accept = (req.headers.get('accept') ?? '').toLowerCase();
    if (accept && !/application\/json|application\/\*|\*\/\*/.test(accept)) {
      return fail(406, undefined, CODES.invalidRequest, 'Not acceptable: this endpoint answers with application/json.');
    }
    const tooLarge = () => fail(413, undefined, CODES.invalidRequest, `Request too large: the limit is ${LIMITS.bodyBytes} bytes.`);
    if (Number(req.headers.get('content-length') ?? 0) > LIMITS.bodyBytes) return tooLarge();

    let raw;
    try {
      raw = await readCapped(req, LIMITS.bodyBytes);
    } catch {
      return fail(400, undefined, CODES.parse, 'Parse error: the body couldn’t be read.');
    }
    if (raw === null) return tooLarge();
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      return fail(400, undefined, CODES.parse, 'Parse error: the body isn’t valid JSON.');
    }
    if (Array.isArray(msg)) {
      return fail(400, undefined, CODES.invalidRequest, 'Invalid request: batches aren’t supported. Send one JSON-RPC message per request.');
    }
    if (!isObject(msg) || msg.jsonrpc !== '2.0') {
      return fail(400, undefined, CODES.invalidRequest, 'Invalid request: expected one JSON-RPC 2.0 message.');
    }

    const hasId = Object.prototype.hasOwnProperty.call(msg, 'id');
    if (typeof msg.method !== 'string') {
      /* A client's answer to a server request. This server never asks, so
         there's nothing to do with it; the transport says accept it. */
      if (hasId && ('result' in msg || 'error' in msg)) return new Response(null, { status: 202, headers: { ...BASE_HEADERS, ...cors } });
      return fail(400, undefined, CODES.invalidRequest, 'Invalid request: a request needs a method.');
    }
    if (msg.params !== undefined && !isObject(msg.params)) {
      return fail(400, hasId ? msg.id : undefined, CODES.params, 'Invalid params: params must be an object.');
    }
    /* A notification (initialized, cancelled…): accepted, never answered. */
    if (!hasId) return new Response(null, { status: 202, headers: { ...BASE_HEADERS, ...cors } });
    const { id, method } = msg;
    if (!(typeof id === 'string' || Number.isInteger(id))) {
      return fail(400, undefined, CODES.invalidRequest, 'Invalid request: id must be a string or an integer.');
    }

    const era = resolveEra(msg, req.headers);
    if (era.error) return json(era.error, era.status, cors);
    const modern = era.era === 'modern';
    const params = msg.params ?? {};

    const reply = (result, extra = {}) =>
      json(
        {
          jsonrpc: '2.0',
          id,
          result: modern
            ? {
                resultType: 'complete',
                ...result,
                ...extra,
                /* Who answered, on every result; in full on server/discover. */
                _meta: {
                  [META.server]:
                    method === 'server/discover' ? serverInfo() : { name: WORDS.name, title: WORDS.title, version: WORDS.version },
                },
              }
            : result,
        },
        200,
        cors,
      );
    const cache = { ttlMs: LIMITS.ttlMs, cacheScope: 'public' };

    switch (method) {
      case 'initialize':
        return reply({
          protocolVersion: era.version,
          capabilities: { tools: {} },
          serverInfo: serverInfo(),
          instructions: WORDS.instructions,
        });
      case 'server/discover':
        return reply(
          {
            supportedVersions: SUPPORTED,
            capabilities: { tools: {} },
            ...(modern ? {} : { serverInfo: serverInfo() }),
            instructions: WORDS.instructions,
          },
          cache,
        );
      case 'ping':
        return reply({});
      case 'tools/list':
        if (params.cursor !== undefined && params.cursor !== null) {
          return fail(200, id, CODES.params, 'Invalid params: this list has one page, so there is no cursor to follow.');
        }
        return reply({ tools: TOOLS }, modern ? cache : {});
      case 'tools/call': {
        const name = params.name;
        if (typeof name !== 'string') return fail(200, id, CODES.params, 'Invalid params: tools/call needs params.name.');
        if (!Object.hasOwn(RUN, name)) return fail(200, id, CODES.params, `Unknown tool: ${name}`);
        if (params.arguments !== undefined && !isObject(params.arguments)) {
          return fail(200, id, CODES.params, 'Invalid params: params.arguments must be an object.');
        }
        const started = performance.now();
        const t = now();
        const self = selfOrigin(req);
        const ctx = {
          ip: context.ip || req.headers.get('x-nf-client-connection-ip') || 'unknown',
          now: t,
          origin: self,
          env,
          store: openStore,
          submit,
          site: () => loadSite(self, t),
          /* Once a day per warm instance, on any tool call: clear
             earlier days' records, after the response if the platform
             allows. */
          sweepSoon: () => {
            const today = dayOf(t);
            if (swept === today) return;
            swept = today;
            const p = Promise.resolve()
              .then(() => sweep(openStore(), t))
              .catch((err) => logError('sweep', err));
            context.waitUntil?.(p);
          },
        };
        ctx.sweepSoon();
        let out;
        try {
          out = await RUN[name](params.arguments ?? {}, ctx);
        } catch (err) {
          logError(name, err);
          out = { result: failed(R.unavailable), outcome: 'unavailable' };
        }
        /* `name` is a tool's own name by now; the outcome is checked
           against the codes the tools return (sent, read, answered:3). */
        const outcome = /^[a-z_]+(?::\d+)?$/.test(String(out.outcome)) ? out.outcome : 'other';
        log(`mcp: ${name} ${outcome} ${Math.round(performance.now() - started)}ms (${era.version})`);
        return reply(out.result);
      }
      default:
        return fail(modern ? 404 : 200, id, CODES.method, `Method not found: ${method}`);
    }
  };
}

export default createHandler();

export const config = {
  path: '/mcp',
  /* Netlify's own rate limiter, per client (IP) on this domain: past the
     limit it answers 429 before the function runs. One of the two
     code-based rules a Free or Personal plan allows (/api/scan has the
     other). start_conversation's daily counts are kept in Blobs, above. */
  rateLimit: { windowLimit: 60, windowSize: 60, aggregateBy: ['ip', 'domain'] },
};
