/**
 * /api/scan: "See what AI sees on your site".
 *
 * POST {"url": "example.com"}. We fetch that page from this server the way
 * a crawler does (no script run), read robots.txt, look for a sitemap and
 * /llms.txt, and return what people, crawlers and machines get from it,
 * with findings ordered by impact. The words for the findings live in
 * src/content-scan.ts; this returns their ids and the values they quote, so
 * the page, an agent and the build all say the same thing.
 *
 * Two response shapes:
 *   Accept: application/x-ndjson   one JSON object per line as the scan
 *                                  runs: {"type":"step",...} for each step
 *                                  as it starts and ends, then
 *                                  {"type":"result"} or {"type":"error"}.
 *                                  /scan/ uses this to show real progress.
 *   anything else                  one JSON object: {ok, result} or
 *                                  {ok:false, error, message}.
 *
 * THIS FETCHES ADDRESSES A STRANGER TYPES IN, so it's written defensively
 * and fails closed:
 *
 *   - http and https only, ports 80 and 443 only, no user:password@.
 *   - The hostname is resolved here, and EVERY address it resolves to must
 *     be public: private, loopback, link-local, CGNAT, multicast, reserved,
 *     documentation, IPv4-mapped/compatible/translated IPv6 and unique-local
 *     ranges are refused. Then the socket connects to the address we
 *     checked (a pinned lookup), so DNS can't answer one way for the check
 *     and another for the connection (rebinding).
 *   - Redirects are followed by hand, at most 3, and every hop goes through
 *     the same checks. So does robots.txt, a sitemap it names on another
 *     host, and /llms.txt.
 *   - One time budget for the whole scan (8 s), a 2 MB cap on the page
 *     (decompressed: a small gzip can't inflate past it) and smaller caps
 *     on the other files. Reading stops at the cap.
 *   - A user agent that names the scanner and where to read about it.
 *   - Nothing is stored. Not the address, not the page, not the visitor's
 *     IP. Logs carry an error code, never the URL.
 *   - Rate limits: Netlify's own limiter per IP (config below) answers 429
 *     before this runs; behind it, a per-instance limiter in memory, keyed
 *     by a salted hash of the IP that never leaves this process and is
 *     dropped after a minute.
 *
 * Netlify Functions v2: a default export taking a Request and a Context.
 * `config.path` routes it, so it isn't served at /.netlify/functions/scan.
 * Headers on these responses are set here; netlify.toml's [[headers]]
 * apply only to static files.
 */
import { lookup } from 'node:dns/promises';
import { BlockList, isIP } from 'node:net';
import http from 'node:http';
import https from 'node:https';
import zlib from 'node:zlib';
import { createHash, randomBytes } from 'node:crypto';
import { tokens, decodeEntities } from '../../src/lib/tokenize.ts';
import { crawlers, scanErrors } from '../../src/content-scan.ts';

const VERSION = '1.0';
export const USER_AGENT = `Mozilla/5.0 (compatible; ADJLScan/${VERSION}; +https://adjltechnology.com/scan/)`;

const LIMITS = {
  /** The whole scan, start to last byte. */
  totalMs: 8000,
  /** The page itself must have arrived by then, leaving time for the rest. */
  pageMs: 6000,
  /** Each of robots.txt, the sitemap and llms.txt. */
  fileMs: 3000,
  pageBytes: 2 * 1024 * 1024,
  /** Google reads the first 500 KiB of a robots.txt; so do we. */
  robotsBytes: 500 * 1024,
  /** Enough of a sitemap or llms.txt to say what it is. */
  peekBytes: 64 * 1024,
  redirects: 3,
  urlLength: 2048,
  bodyBytes: 4096,
};

/* ── Addresses we refuse ────────────────────────────────────────────── */

/* Two lists, not one: Node's BlockList matches an IPv4 address against
   IPv4-mapped IPv6 rules, so ::ffff:0:0/96 in a shared list would refuse
   every IPv4 address there is. */
const BLOCKED4 = new BlockList();
const BLOCKED6 = new BlockList();
for (const [net, bits] of [
  ['0.0.0.0', 8], // "this network"
  ['10.0.0.0', 8], // private
  ['100.64.0.0', 10], // carrier-grade NAT
  ['127.0.0.0', 8], // loopback
  ['169.254.0.0', 16], // link-local, cloud metadata
  ['172.16.0.0', 12], // private
  ['192.0.0.0', 24], // IETF protocol assignments
  ['192.0.2.0', 24], // documentation
  ['192.88.99.0', 24], // 6to4 relay anycast
  ['192.168.0.0', 16], // private
  ['198.18.0.0', 15], // benchmarking
  ['198.51.100.0', 24], // documentation
  ['203.0.113.0', 24], // documentation
  ['224.0.0.0', 4], // multicast
  ['240.0.0.0', 4], // reserved, and broadcast
]) {
  BLOCKED4.addSubnet(net, bits, 'ipv4');
}
for (const [net, bits] of [
  ['::', 96], // unspecified, loopback and IPv4-compatible
  ['::ffff:0:0', 96], // IPv4-mapped
  ['64:ff9b::', 96], // IPv4/IPv6 translation
  ['64:ff9b:1::', 48], // local-use translation
  ['100::', 64], // discard
  ['2001::', 23], // IETF protocol assignments (Teredo, benchmarking, ORCHID)
  ['2001:db8::', 32], // documentation
  ['2002::', 16], // 6to4: carries an IPv4 address
  ['fc00::', 7], // unique-local
  ['fe80::', 10], // link-local
  ['fec0::', 10], // site-local (deprecated)
  ['ff00::', 8], // multicast
]) {
  BLOCKED6.addSubnet(net, bits, 'ipv6');
}
/* Global unicast is 2000::/3. Anything outside it isn't a public host. */
const GLOBAL6 = new BlockList();
GLOBAL6.addSubnet('2000::', 3, 'ipv6');

/** True when `ip` is a public address we may connect to. */
export function isPublicAddress(ip) {
  const v = isIP(ip);
  if (v === 4) return !BLOCKED4.check(ip, 'ipv4');
  if (v === 6) {
    const low = ip.toLowerCase();
    /* An IPv4 address written inside IPv6 is judged as IPv4 too, whatever
       prefix carries it. */
    const tail = /(\d+\.\d+\.\d+\.\d+)$/.exec(low);
    if (tail && !isPublicAddress(tail[1])) return false;
    return GLOBAL6.check(low, 'ipv6') && !BLOCKED6.check(low, 'ipv6');
  }
  return false;
}

/** Names that only mean something inside a private network. */
const PRIVATE_NAME = /(^|\.)(localhost|local|localdomain|internal|intranet|lan|home|corp|home\.arpa|in-addr\.arpa|ip6\.arpa)$/i;

/* ── Errors ─────────────────────────────────────────────────────────── */

class ScanError extends Error {
  /** `code` is a key of scanErrors in src/content-scan.ts. */
  constructor(code, vars = {}) {
    super(code);
    this.code = code;
    this.vars = vars;
  }
}

const STATUS_FOR = {
  bad_url: 400,
  scheme: 400,
  credentials: 400,
  port: 400,
  private_name: 400,
  blocked: 400,
  not_found: 422,
  refused: 502,
  tls: 502,
  timeout: 504,
  too_large: 422,
  not_html: 422,
  redirects: 422,
  rate_limited: 429,
  method: 405,
  bad_request: 400,
  failed: 500,
};

function errorBody(e) {
  const code = e instanceof ScanError ? e.code : 'failed';
  const copy = scanErrors[code] ?? scanErrors.failed;
  const vars = e instanceof ScanError ? e.vars : {};
  return {
    ok: false,
    error: code,
    title: copy.title,
    message: copy.body.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? '')),
    vars,
  };
}

/* ── The address a visitor typed ────────────────────────────────────── */

/** Turn what was typed into a URL we're willing to fetch, or throw. */
export function normalizeUrl(input) {
  let s = String(input ?? '').trim();
  if (!s || s.length > LIMITS.urlLength || /[\s<>"'`\\]/.test(s)) throw new ScanError('bad_url');
  /* "example.com" and "example.com:443/x" get https://. Anything else that
     starts like a scheme ("ftp:", "javascript:", "file:") is that scheme. */
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) {
    if (/^[a-z][a-z0-9+.-]*:(?!\d)/i.test(s)) throw new ScanError('scheme');
    s = 'https://' + s.replace(/^\/+/, '');
  }
  let u;
  try {
    u = new URL(s);
  } catch {
    throw new ScanError('bad_url');
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new ScanError('scheme');
  if (u.username || u.password) throw new ScanError('credentials');
  return u;
}

/** Check one URL (scheme, port, credentials, name) and resolve it to an
 *  address we've vetted. Returns the address to pin the connection to. */
async function vet(u, opts, deadline) {
  if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new ScanError('scheme');
  if (u.username || u.password) throw new ScanError('credentials');
  const port = u.port ? Number(u.port) : u.protocol === 'https:' ? 443 : 80;
  if (!opts.ports.includes(port)) throw new ScanError('port');

  const host = u.hostname.replace(/^\[|\]$/g, '').replace(/\.$/, '').toLowerCase();
  if (!host) throw new ScanError('bad_url');
  const literal = isIP(host);
  if (literal) {
    if (!opts.allow(host)) throw new ScanError('blocked');
    return { host, port, address: host, family: literal };
  }
  if (!host.includes('.') || PRIVATE_NAME.test(host)) throw new ScanError('private_name');

  let addrs;
  try {
    addrs = await withDeadline(opts.resolve(host), deadline);
  } catch (e) {
    if (e instanceof ScanError) throw e;
    throw new ScanError('not_found', { host });
  }
  if (!addrs.length) throw new ScanError('not_found', { host });
  /* Every address must pass, not just the first: a name that answers
     with one public and one private address is refused outright. */
  if (!addrs.every((a) => opts.allow(a.address))) throw new ScanError('blocked');
  /* Prefer IPv4: many function hosts have no IPv6 route out. */
  const pick = addrs.find((a) => a.family === 4) ?? addrs[0];
  return { host, port, address: pick.address, family: pick.family };
}

const defaultResolve = (host) => lookup(host, { all: true, verbatim: true });

function withDeadline(promise, deadline) {
  const left = deadline - Date.now();
  if (left <= 0) return Promise.reject(new ScanError('timeout'));
  let t;
  return Promise.race([
    promise,
    new Promise((_, rej) => {
      t = setTimeout(() => rej(new ScanError('timeout')), left);
    }),
  ]).finally(() => clearTimeout(t));
}

/* ── One request, pinned to the vetted address ──────────────────────── */

/**
 * GET `u` once (no redirects). Resolves with the status, headers and up to
 * `maxBytes` of the decoded body. `overflow: 'error'` throws too_large past
 * the cap; 'truncate' stops reading there and says so.
 */
function getOnce(u, target, { deadline, maxBytes, overflow, accept }) {
  return new Promise((resolve, reject) => {
    const left = deadline - Date.now();
    if (left <= 0) return reject(new ScanError('timeout'));
    const mod = u.protocol === 'https:' ? https : http;
    const started = Date.now();
    let settled = false;
    /* What we read the body from: the response, or the decompressor it's
       piped into. Destroyed the moment we settle, whichever way: a
       decompressor left alive keeps inflating what it already holds (a
       1.6 kB brotli body can be gigabytes of zeros) long after the visitor
       has been told the page is too large. */
    let body = null;
    const done = (fn, v) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (body) body.destroy();
      fn(v);
    };

    const req = mod.request(
      {
        protocol: u.protocol,
        host: target.host,
        port: target.port,
        path: (u.pathname || '/') + u.search,
        method: 'GET',
        /* The pin: whatever the socket asks, it gets the address we vetted. */
        lookup: (_h, o, cb) => {
          if (typeof o === 'function') cb = o;
          if (o && typeof o === 'object' && o.all) cb(null, [{ address: target.address, family: target.family }]);
          else cb(null, target.address, target.family);
        },
        autoSelectFamily: false,
        agent: false,
        servername: isIP(target.host) ? undefined : target.host,
        headers: {
          'User-Agent': USER_AGENT,
          Accept: accept,
          'Accept-Encoding': 'gzip, deflate, br',
          'Accept-Language': 'en-US,en;q=0.8',
          Connection: 'close',
        },
        timeout: left,
      },
      (res) => {
        const status = res.statusCode ?? 0;
        const headers = res.headers;
        const firstByte = Date.now() - started;
        if (status >= 300 && status < 400 && headers.location) {
          res.destroy();
          return done(resolve, { status, headers, body: Buffer.alloc(0), bytes: 0, transfer: 0, firstByte, ms: Date.now() - started, truncated: false });
        }
        const enc = String(headers['content-encoding'] ?? '').trim().toLowerCase();
        body = res;
        if (enc === 'gzip' || enc === 'x-gzip') body = res.pipe(zlib.createGunzip());
        else if (enc === 'deflate') body = res.pipe(zlib.createInflate());
        else if (enc === 'br') body = res.pipe(zlib.createBrotliDecompress());
        let transfer = 0;
        res.on('data', (c) => (transfer += c.length));
        const chunks = [];
        let bytes = 0;
        const finish = (truncated) =>
          done(resolve, {
            status,
            headers,
            body: Buffer.concat(chunks),
            bytes,
            transfer,
            firstByte,
            ms: Date.now() - started,
            truncated,
          });
        body.on('data', (c) => {
          if (settled) return;
          if (bytes + c.length > maxBytes) {
            if (overflow === 'error') {
              req.destroy();
              res.destroy();
              return done(reject, new ScanError('too_large'));
            }
            chunks.push(c.subarray(0, maxBytes - bytes));
            bytes = maxBytes;
            req.destroy();
            res.destroy();
            return finish(true);
          }
          chunks.push(c);
          bytes += c.length;
        });
        body.on('end', () => finish(false));
        body.on('error', () => done(reject, new ScanError('refused')));
        res.on('error', () => done(reject, new ScanError('refused')));
      },
    );
    const timer = setTimeout(() => {
      req.destroy();
      done(reject, new ScanError('timeout'));
    }, left);
    req.on('timeout', () => {
      req.destroy();
      done(reject, new ScanError('timeout'));
    });
    req.on('error', (e) => {
      const c = e && e.code ? String(e.code) : '';
      if (/CERT|SSL|TLS|SELF_SIGNED|UNABLE_TO|ERR_TLS/i.test(c) || /certificate|ssl|tls/i.test(String(e.message))) {
        return done(reject, new ScanError('tls'));
      }
      done(reject, new ScanError('refused'));
    });
    req.end();
  });
}

/** GET with redirects followed by hand, every hop vetted. */
async function fetchSafe(start, opts, { deadline, maxBytes, overflow = 'error', accept = '*/*' }) {
  let u = start;
  const hops = [];
  for (let i = 0; ; i++) {
    const target = await vet(u, opts, deadline);
    const r = await getOnce(u, target, { deadline, maxBytes, overflow, accept });
    if (r.status >= 300 && r.status < 400 && r.headers.location) {
      if (i >= LIMITS.redirects) throw new ScanError('redirects', { n: LIMITS.redirects });
      let next;
      try {
        next = new URL(String(r.headers.location), u);
      } catch {
        throw new ScanError('bad_url');
      }
      next.hash = '';
      hops.push({ status: r.status, from: u.href, to: next.href });
      u = next;
      continue;
    }
    return { ...r, url: u, hops };
  }
}

/* ── Reading the page ───────────────────────────────────────────────── */

/* Named references beyond the tokenizer's own short table that real pages
   use in titles and descriptions. */
const MORE_ENT = {
  eacute: 'é', egrave: 'è', ecirc: 'ê', aacute: 'á', agrave: 'à', acirc: 'â', auml: 'ä', ouml: 'ö', uuml: 'ü',
  oacute: 'ó', iacute: 'í', uacute: 'ú', ntilde: 'ñ', ccedil: 'ç', szlig: 'ß', Eacute: 'É', reg: '®', trade: '™',
  laquo: '«', raquo: '»', euro: '€', pound: '£',
};
const decode = (s) => decodeEntities(s).replace(/&([a-zA-Z]+);/g, (m, n) => MORE_ENT[n] ?? m);
const squash = (s) => s.replace(/\s+/g, ' ').trim();
const clip = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
const wordsIn = (s) => s.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;

/** Text inside these is not what a reader sees on the page. */
const SKIP = new Set(['script', 'style', 'noscript', 'template', 'svg', 'math', 'iframe', 'object', 'canvas']);
/** Ids single-page apps mount into. Empty and present = drawn by script. */
const APP_ROOTS = new Set(['root', 'app', '__next', '__nuxt', '___gatsby', 'svelte', 'q-app']);

const sameSite = (a, b) => a.replace(/^www\./, '') === b.replace(/^www\./, '');

/** Everything the report says about the HTML itself. Pure: a string in,
 *  facts out. */
export function readPage(html, pageUrl) {
  const out = {
    title: '',
    titles: 0,
    description: '',
    lang: '',
    /** The first 50 h1s' text; h1Count has them all. */
    h1s: [],
    h1Count: 0,
    headings: [],
    headingCount: 0,
    words: 0,
    mainWords: null,
    shell: { root: '', scripts: 0, noscriptJs: false },
    links: { internal: 0, external: 0, nofollow: 0, targets: 0 },
    images: { total: 0, missingAlt: 0 },
    canonical: '',
    canonicals: 0,
    robotsMeta: '',
    botMeta: '',
    refresh: '',
    og: {},
    twitter: {},
    jsonld: { blocks: 0, invalid: 0, types: [] },
    microdata: 0,
  };
  let base = pageUrl;
  const skip = {};
  let skipping = 0;
  let inHead = false;
  let mainDepth = 0;
  let mainWords = -1;
  let heading = null;
  let script = null;
  let rawIn = null;
  let noscript = '';
  let inNoscript = 0;
  const text = [];
  const targets = new Set();
  const types = new Set();
  const metas = {};

  const closeHeading = () => {
    if (!heading) return;
    const t = clip(squash(heading.parts.join('')), 140);
    out.headingCount++;
    if (heading.level === 1) {
      out.h1Count++;
      if (out.h1s.length < 50) out.h1s.push(t);
    }
    if (heading.level <= 3 && out.headings.length < 40) out.headings.push({ level: heading.level, text: t });
    heading = null;
  };

  for (const tk of tokens(html)) {
    if (tk.kind === 'open') {
      const { name, attrs } = tk;
      if (name === 'html' && !out.lang) out.lang = squash(attrs.lang ?? attrs['xml:lang'] ?? '');
      if (name === 'head') inHead = true;
      if (name === 'body') inHead = false;
      /* The element whose raw or RCDATA text comes next, if any. */
      rawIn = name === 'script' || name === 'style' || name === 'title' || name === 'textarea' ? name : null;
      if (name === 'script') {
        script = (attrs.type ?? '').toLowerCase();
        if (attrs.src) out.shell.scripts++;
      }
      if (name === 'noscript') inNoscript++;
      if (SKIP.has(name) && !tk.selfClosing && !(name === 'script' || name === 'style')) {
        skip[name] = (skip[name] ?? 0) + 1;
        skipping++;
      }
      if (skipping) continue;
      switch (name) {
        case 'base':
          if (attrs.href) {
            try {
              base = new URL(attrs.href, pageUrl).href;
            } catch {
              /* a broken <base> is ignored, as browsers do */
            }
          }
          break;
        case 'meta': {
          const key = (attrs.name ?? attrs.property ?? '').toLowerCase().trim();
          const content = squash(decode(attrs.content ?? ''));
          const equiv = (attrs['http-equiv'] ?? '').toLowerCase();
          if (equiv === 'refresh' && !out.refresh) out.refresh = clip(content, 200);
          if (!key) break;
          if (key === 'robots') out.robotsMeta = squash(`${out.robotsMeta} ${content}`).slice(0, 200);
          else if (key === 'googlebot' || key === 'bingbot') out.botMeta = squash(`${out.botMeta} ${key}: ${content}`).slice(0, 200);
          if (!(key in metas)) metas[key] = content;
          break;
        }
        case 'link': {
          const rel = (attrs.rel ?? '').toLowerCase().split(/\s+/);
          if (rel.includes('canonical')) {
            out.canonicals++;
            if (!out.canonical && attrs.href) {
              try {
                out.canonical = new URL(decode(attrs.href), base).href;
              } catch {
                out.canonical = clip(attrs.href, 300);
              }
            }
          }
          break;
        }
        case 'main':
          if (mainWords < 0) mainWords = 0;
          mainDepth++;
          break;
        case 'a': {
          const href = decode(attrs.href ?? '').trim();
          if (!href || href.startsWith('#') || /^(mailto|tel|javascript|data|sms):/i.test(href)) break;
          let to;
          try {
            to = new URL(href, base);
          } catch {
            break;
          }
          if (to.protocol !== 'http:' && to.protocol !== 'https:') break;
          if ((attrs.rel ?? '').toLowerCase().split(/\s+/).includes('nofollow')) out.links.nofollow++;
          if (sameSite(to.hostname, pageUrl.hostname)) {
            out.links.internal++;
            targets.add(to.pathname + to.search);
          } else out.links.external++;
          break;
        }
        case 'img':
          out.images.total++;
          if (attrs.alt === undefined) out.images.missingAlt++;
          break;
      }
      if ('itemscope' in attrs) out.microdata++;
      if (attrs.id && APP_ROOTS.has(attrs.id) && !out.shell.root) out.shell.root = attrs.id;
      if (/^h[1-6]$/.test(name)) {
        closeHeading();
        heading = { level: Number(name[1]), name, parts: [] };
      } else if (heading && /^(br|p|div|li)$/.test(name)) heading.parts.push(' ');
    } else if (tk.kind === 'close') {
      const { name } = tk;
      if (name === 'script') script = null;
      if (name === rawIn) rawIn = null;
      if (name === 'head') inHead = false;
      if (name === 'noscript') inNoscript = Math.max(0, inNoscript - 1);
      if (skip[name]) {
        skip[name]--;
        skipping--;
        continue;
      }
      if (skipping) continue;
      if (name === 'main') mainDepth = Math.max(0, mainDepth - 1);
      if (heading && name === heading.name) closeHeading();
    } else if (tk.kind === 'text') {
      const raw = html.slice(tk.start, tk.end);
      if (tk.raw) {
        /* Script content: only JSON-LD matters here. */
        if (script !== null && /^application\/ld\+json\b/.test(script)) {
          out.jsonld.blocks++;
          const cleaned = raw
            .trim()
            .replace(/^<!--|-->$/g, '')
            .replace(/^\s*\/\/\s*<!\[CDATA\[|\/\/\s*\]\]>\s*$/g, '')
            .trim();
          try {
            const data = JSON.parse(cleaned);
            const visit = (v, depth) => {
              if (depth > 4 || types.size >= 24) return;
              if (Array.isArray(v)) return v.forEach((x) => visit(x, depth));
              if (!v || typeof v !== 'object') return;
              const t = v['@type'];
              for (const x of Array.isArray(t) ? t : t ? [t] : []) if (typeof x === 'string') types.add(clip(x, 60));
              if (Array.isArray(v['@graph'])) visit(v['@graph'], depth + 1);
              for (const k of Object.keys(v)) if (k[0] !== '@' && v[k] && typeof v[k] === 'object') visit(v[k], depth + 1);
            };
            visit(data, 0);
          } catch {
            out.jsonld.invalid++;
          }
        }
        continue;
      }
      if (tk.rcdata) {
        /* <title> or <textarea>. A title inside an SVG is the drawing's,
           not the page's (skipping covers it). */
        if (rawIn === 'title' && !skipping) {
          out.titles++;
          if (!out.title) out.title = clip(squash(decode(raw)), 300);
        }
        continue;
      }
      const t = decode(raw);
      if (inNoscript) noscript += ' ' + t;
      if (skipping || inHead) continue;
      text.push(t);
      if (mainDepth > 0) mainWords += wordsIn(t);
      if (heading) heading.parts.push(t);
    }
  }
  closeHeading();

  out.description = clip(metas.description ?? '', 400);
  out.words = wordsIn(text.join(' '));
  out.mainWords = mainWords >= 0 ? mainWords : null;
  out.links.targets = targets.size;
  out.shell.noscriptJs = /javascript/i.test(noscript);
  for (const k of ['og:title', 'og:description', 'og:image', 'og:type', 'og:url', 'og:site_name']) {
    if (metas[k]) out.og[k.slice(3)] = clip(metas[k], 300);
  }
  for (const k of ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image']) {
    if (metas[k]) out.twitter[k.slice(8)] = clip(metas[k], 300);
  }
  out.jsonld.types = [...types];
  return out;
}

/* ── robots.txt (RFC 9309) ──────────────────────────────────────────── */

/** Groups of user agents with their rules, plus the Sitemap lines. */
export function parseRobots(text) {
  const groups = [];
  const sitemaps = [];
  let cur = null;
  let agentRun = false;
  for (let line of String(text).split(/\r\n|\r|\n/)) {
    line = line.replace(/#.*$/, '').trim();
    const m = /^([A-Za-z-]+)\s*:\s*(.*)$/.exec(line);
    if (!m) continue;
    const key = m[1].toLowerCase();
    const val = m[2].trim();
    if (key === 'user-agent') {
      if (!cur || !agentRun) groups.push((cur = { agents: [], rules: [] }));
      cur.agents.push(val.toLowerCase());
      agentRun = true;
    } else if (key === 'allow' || key === 'disallow') {
      if (cur) cur.rules.push({ allow: key === 'allow', path: val });
      agentRun = false;
    } else if (key === 'sitemap') {
      if (val && sitemaps.length < 20) sitemaps.push(val);
    }
  }
  return { groups, sitemaps };
}

/**
 * Does a robots.txt path pattern match this path? `*` is any run of
 * characters and a final `$` anchors the end (RFC 9309, section 2.2.3).
 *
 * No RegExp on purpose: the pattern is written by the site being scanned,
 * and `*` turned into `.*` backtracks. "/*a*a*a*a*a*a*a*a*a*b" against a
 * long path of a's would hold the event loop for minutes, past every
 * timer we set. This walks the path once instead: each piece between the
 * stars is found at its earliest place after the one before (taking the
 * earliest never loses a match), and the last piece has to sit at the end
 * when the pattern is anchored.
 */
function ruleMatches(pattern, path) {
  const anchored = pattern.endsWith('$');
  const parts = (anchored ? pattern.slice(0, -1) : pattern).split('*');
  const first = parts[0];
  const last = parts[parts.length - 1];
  if (!path.startsWith(first)) return false;
  if (parts.length === 1) return !anchored || path.length === first.length;
  let pos = first.length;
  for (let i = 1; i < parts.length - 1; i++) {
    const at = path.indexOf(parts[i], pos);
    if (at < 0) return false;
    pos = at + parts[i].length;
  }
  return anchored ? path.length - last.length >= pos && path.endsWith(last) : path.indexOf(last, pos) >= 0;
}

/**
 * What robots.txt says to one crawler about one path: the group naming the
 * crawler if there is one, else the group for every crawler (*), else
 * nothing applies. Longest matching rule wins; Allow wins a tie.
 *
 * `seen` (optional) remembers each pattern's answer for this path, so a
 * robots.txt that repeats one long list for every crawler is matched once,
 * not once per crawler. Pass the same Map only with the same path.
 */
export function robotsVerdict(parsed, token, path, seen = null) {
  const t = token.toLowerCase();
  const own = parsed.groups.filter((g) => g.agents.some((a) => a === t || a.split('/')[0].trim() === t));
  const star = parsed.groups.filter((g) => g.agents.includes('*'));
  const groups = own.length ? own : star;
  const rule = own.length ? 'own' : star.length ? 'all' : 'none';
  let best = null;
  for (const g of groups) {
    for (const r of g.rules) {
      if (!r.path) continue;
      let hit = seen?.get(r.path);
      if (hit === undefined) {
        hit = ruleMatches(r.path, path);
        seen?.set(r.path, hit);
      }
      if (!hit) continue;
      if (!best || r.path.length > best.path.length || (r.path.length === best.path.length && r.allow && !best.allow)) best = r;
    }
  }
  return { verdict: best && !best.allow ? 'blocked' : 'allowed', rule, line: best ? `${best.allow ? 'Allow' : 'Disallow'}: ${clip(best.path, 80)}` : '' };
}

/* ── The scan ───────────────────────────────────────────────────────── */

const looksHtml = (buf) => /^\s*(<!doctype html|<html|<head|<body|<!--)/i.test(buf.subarray(0, 512).toString('latin1'));

function charsetOf(contentType, buf) {
  const m = /charset\s*=\s*["']?([\w-]+)/i.exec(contentType);
  if (m) return m[1].toLowerCase();
  const sniff = /<meta[^>]+charset\s*=\s*["']?([\w-]+)/i.exec(buf.subarray(0, 4096).toString('latin1'));
  return sniff ? sniff[1].toLowerCase() : 'utf-8';
}

function decodeBody(buf, contentType) {
  try {
    return new TextDecoder(charsetOf(contentType, buf), { fatal: false }).decode(buf);
  } catch {
    return new TextDecoder('utf-8', { fatal: false }).decode(buf);
  }
}

/** Fetch a small file at the site's root (robots.txt, llms.txt, a sitemap)
 *  with the same protections, within what's left of the budget. */
async function fetchFile(url, opts, deadline, maxBytes, accept) {
  const cap = Math.min(deadline, Date.now() + LIMITS.fileMs);
  if (cap - Date.now() < 250) return { state: 'skipped' };
  try {
    const r = await fetchSafe(url, opts, { deadline: cap, maxBytes, overflow: 'truncate', accept });
    return {
      state: 'ok',
      status: r.status,
      url: r.url.href,
      bytes: r.bytes,
      truncated: r.truncated,
      type: String(r.headers['content-type'] ?? ''),
      html: looksHtml(r.body),
      gz: r.body[0] === 0x1f && r.body[1] === 0x8b,
      text: r.body.toString('utf8'),
    };
  } catch (e) {
    const code = e instanceof ScanError ? e.code : 'failed';
    return { state: code === 'timeout' ? 'timeout' : code === 'blocked' || code === 'private_name' ? 'blocked' : 'error' };
  }
}

/** Run one scan. `onStep` hears each step start and finish. */
export async function scan(input, opts = {}, onStep = () => {}) {
  const o = {
    ports: opts.ports ?? [80, 443],
    allow: opts.allow ?? isPublicAddress,
    resolve: opts.resolve ?? defaultResolve,
  };
  const t0 = Date.now();
  const deadline = t0 + (opts.totalMs ?? LIMITS.totalMs);
  const start = normalizeUrl(input);
  start.hash = '';

  /* 1. The page. */
  onStep({ step: 'fetch', state: 'start' });
  const page = await fetchSafe(start, o, {
    deadline: Math.min(deadline, t0 + (opts.pageMs ?? LIMITS.pageMs)),
    maxBytes: opts.pageBytes ?? LIMITS.pageBytes,
    overflow: 'error',
    accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5',
  });
  const contentType = String(page.headers['content-type'] ?? '');
  const mime = contentType.split(';')[0].trim().toLowerCase();
  if (mime ? !/^(text\/html|application\/xhtml\+xml)$/.test(mime) : !looksHtml(page.body)) {
    throw new ScanError('not_html', { type: mime || 'unknown' });
  }
  onStep({ step: 'fetch', state: 'done', ms: page.ms });

  /* 2. Read it. */
  onStep({ step: 'parse', state: 'start' });
  const p0 = Date.now();
  const html = decodeBody(page.body, contentType);
  const finalUrl = page.url;
  const read = readPage(html, finalUrl);
  const xRobots = String([].concat(page.headers['x-robots-tag'] ?? []).join(', ')).slice(0, 200);
  onStep({ step: 'parse', state: 'done', ms: Date.now() - p0 });

  /* 3 and 4, side by side: robots.txt (then the sitemap it names), and
     llms.txt. */
  const origin = finalUrl.origin;
  onStep({ step: 'robots', state: 'start' });
  onStep({ step: 'files', state: 'start' });

  const robotsJob = (async () => {
    const r0 = Date.now();
    const f = await fetchFile(new URL('/robots.txt', origin), o, deadline, LIMITS.robotsBytes, 'text/plain,*/*;q=0.5');
    let robots;
    if (f.state !== 'ok') robots = { state: f.state === 'timeout' || f.state === 'skipped' ? 'timeout' : 'error', status: 0, sitemaps: [] };
    else if (f.status >= 500) robots = { state: 'error', status: f.status, sitemaps: [] };
    else if (f.status >= 400) robots = { state: 'missing', status: f.status, sitemaps: [] };
    else if (f.status !== 200 || f.html) robots = { state: 'unreadable', status: f.status, sitemaps: [] };
    else {
      const parsed = parseRobots(f.text);
      robots = { state: 'found', status: f.status, bytes: f.bytes, sitemaps: parsed.sitemaps.map((s) => clip(s, 300)), parsed };
    }
    onStep({ step: 'robots', state: 'done', ms: Date.now() - r0 });
    return robots;
  })();

  const llmsJob = fetchFile(new URL('/llms.txt', origin), o, deadline, LIMITS.peekBytes, 'text/plain,text/markdown,*/*;q=0.5');

  const robots = await robotsJob;
  const s0 = Date.now();
  const declared = robots.sitemaps?.[0];
  let sitemapUrl = null;
  try {
    sitemapUrl = declared ? new URL(declared, origin) : new URL('/sitemap.xml', origin);
  } catch {
    sitemapUrl = new URL('/sitemap.xml', origin);
  }
  const sm = await fetchFile(sitemapUrl, o, deadline, LIMITS.peekBytes, 'application/xml,text/xml,text/plain,*/*;q=0.5');
  const llmsFile = await llmsJob;
  onStep({ step: 'files', state: 'done', ms: Date.now() - s0 });

  const sitemap = (() => {
    const base = { url: sitemapUrl.href, declared: Boolean(declared) };
    if (sm.state !== 'ok') return { ...base, state: sm.state === 'timeout' || sm.state === 'skipped' ? 'timeout' : 'error', status: 0 };
    if (sm.status !== 200) return { ...base, state: 'missing', status: sm.status };
    const head = sm.text.slice(0, 4096);
    const kind = sm.gz ? 'gzip' : /<sitemapindex\b/i.test(head) ? 'index' : /<urlset\b/i.test(head) ? 'urlset' : /^\s*https?:\/\//i.test(head) ? 'text' : '';
    if (!kind) return { ...base, state: sm.html ? 'html' : 'unreadable', status: sm.status };
    const urls = kind === 'text' ? (sm.text.match(/^\s*https?:\/\//gim) ?? []).length : (sm.text.match(/<loc>/gi) ?? []).length;
    return { ...base, state: 'found', status: sm.status, kind, urls, truncated: sm.truncated };
  })();

  const llms = (() => {
    if (llmsFile.state !== 'ok') return { state: llmsFile.state === 'timeout' || llmsFile.state === 'skipped' ? 'timeout' : 'error', status: 0 };
    if (llmsFile.status !== 200) return { state: 'missing', status: llmsFile.status };
    if (llmsFile.html) return { state: 'html', status: llmsFile.status };
    const first = /^#\s+(.+)$/m.exec(llmsFile.text.slice(0, 4096));
    return { state: 'found', status: llmsFile.status, bytes: llmsFile.bytes, heading: first ? clip(squash(first[1]), 120) : '' };
  })();

  /* AI crawlers (and the two big search crawlers) against this page. */
  const path = (finalUrl.pathname || '/') + finalUrl.search;
  const seen = new Map();
  const agents = crawlers.items.map((c) => {
    if (robots.state === 'found') return { token: c.token, ...robotsVerdict(robots.parsed, c.token, path, seen) };
    if (robots.state === 'missing' || robots.state === 'unreadable') return { token: c.token, verdict: 'allowed', rule: 'none', line: '' };
    return { token: c.token, verdict: 'unknown', rule: 'error', line: '' };
  });
  delete robots.parsed;

  const result = {
    v: 1,
    url: start.href,
    finalUrl: finalUrl.href,
    at: new Date(t0).toISOString(),
    fetch: {
      status: page.status,
      ms: page.ms,
      firstByte: page.firstByte,
      bytes: page.bytes,
      transfer: page.transfer,
      type: clip(contentType, 120),
      encoding: String(page.headers['content-encoding'] ?? ''),
      redirects: page.hops,
      xRobots,
    },
    page: read,
    robots,
    sitemap,
    llms,
    agents,
    ms: Date.now() - t0,
  };
  result.findings = findingsFor(result);
  return result;
}

/* ── Findings ───────────────────────────────────────────────────────── */

/** Which group each crawler belongs to (search, answers, fetch, training). */
const GROUP = Object.fromEntries(crawlers.items.map((c) => [c.token, c.group]));

/**
 * Plain-English findings, by id; the words are in content-scan.ts. Ordered
 * by impact: everything that keeps a page out of results first, then what
 * costs it, then what's worth a look, then what's already right. Within a
 * level the order below is the order of impact.
 */
export const ORDER = [
  // fix
  'status', 'noindex', 'search-blocked', 'no-text', 'title-missing', 'jsonld-broken',
  // improve
  'thin', 'answers-blocked', 'robots-error', 'canonical-missing', 'desc-missing', 'h1-missing', 'jsonld-missing',
  'og-missing', 'nofollow', 'sitemap-missing', 'slow',
  // note
  'canonical-other', 'redirects', 'refresh', 'title-long', 'desc-long', 'h1-many', 'lang-missing', 'img-alt',
  'og-partial', 'robots-missing', 'llms-missing',
  // ok
  'status-ok', 'indexable', 'text-ok', 'title-ok', 'desc-ok', 'h1-ok', 'canonical-ok', 'robots-ok', 'training-blocked',
  'sitemap-ok', 'jsonld-ok', 'og-ok', 'llms-ok',
];
const LEVEL_RANK = { fix: 0, improve: 1, note: 2, ok: 3 };

export function findingsFor(r) {
  const f = [];
  const add = (id, layer, level, vars = {}) => f.push({ id, layer, level, vars });
  const p = r.page;
  const status = r.fetch.status;

  /* What crawlers follow. */
  if (status >= 400) add('status', 'crawlers', 'fix', { status });
  else add('status-ok', 'crawlers', 'ok', { status });

  const noindex = /\b(noindex|none)\b/i;
  if (noindex.test(p.robotsMeta) || noindex.test(r.fetch.xRobots) || noindex.test(p.botMeta)) {
    add('noindex', 'crawlers', 'fix', { where: noindex.test(r.fetch.xRobots) ? 'header' : 'meta' });
  } else add('indexable', 'crawlers', 'ok');
  if (/\bnofollow\b/i.test(p.robotsMeta) || /\bnofollow\b/i.test(r.fetch.xRobots)) add('nofollow', 'crawlers', 'improve');

  const blocked = (g) => r.agents.filter((a) => GROUP[a.token] === g && a.verdict === 'blocked').map((a) => a.token);
  const search = blocked('search');
  const answers = [...blocked('answers'), ...blocked('fetch')];
  const training = blocked('training');
  if (search.length) add('search-blocked', 'crawlers', 'fix', { names: search.join(', ') });
  if (answers.length) add('answers-blocked', 'crawlers', 'improve', { names: answers.join(', ') });
  if (r.robots.state === 'error' || r.robots.state === 'timeout') add('robots-error', 'crawlers', 'improve', { status: r.robots.status || '' });
  else if (r.robots.state === 'missing' || r.robots.state === 'unreadable') add('robots-missing', 'crawlers', 'note');
  /* Only a robots.txt we actually read can be said to let crawlers in.
     Without one, robots-missing above already says everything is open. */
  if (r.robots.state === 'found' && !search.length && !answers.length) {
    if (training.length) add('training-blocked', 'crawlers', 'ok', { names: training.join(', ') });
    else add('robots-ok', 'crawlers', 'ok');
  }

  if (!p.canonical) add('canonical-missing', 'crawlers', 'improve');
  else {
    const norm = (u) => {
      try {
        const x = new URL(u);
        return (x.host.replace(/^www\./, '') + x.pathname.replace(/\/+$/, '') + x.search).toLowerCase();
      } catch {
        return u;
      }
    };
    if (norm(p.canonical) !== norm(r.finalUrl)) add('canonical-other', 'crawlers', 'note', { url: p.canonical });
    else add('canonical-ok', 'crawlers', 'ok');
  }
  if (r.fetch.redirects.length >= 2) add('redirects', 'crawlers', 'note', { n: r.fetch.redirects.length });
  if (p.refresh) add('refresh', 'crawlers', 'note');
  if (r.sitemap.state === 'found') add('sitemap-ok', 'crawlers', 'ok', { url: r.sitemap.url });
  else add('sitemap-missing', 'crawlers', 'improve');
  if (r.fetch.ms > 3000) add('slow', 'crawlers', 'improve', { s: (r.fetch.ms / 1000).toFixed(1) });

  /* What people read. */
  if (status < 400) {
    /* Few words is a fix when the page looks drawn by script (a known app
       mount point, or a noscript note asking for JavaScript). Otherwise we
       can't tell a script-drawn page from a short one, and say so. */
    const drawn = Boolean(p.shell.root) || p.shell.noscriptJs;
    if (p.words < 50) add(drawn ? 'no-text' : 'thin', 'people', drawn ? 'fix' : 'improve', { n: p.words });
    else add('text-ok', 'people', 'ok', { n: p.words });
  }
  if (!p.title) add('title-missing', 'people', 'fix');
  else if (p.title.length > 60) add('title-long', 'people', 'note', { len: p.title.length });
  else add('title-ok', 'people', 'ok', { len: p.title.length });
  if (!p.description) add('desc-missing', 'people', 'improve');
  else if (p.description.length > 160) add('desc-long', 'people', 'note', { len: p.description.length });
  else add('desc-ok', 'people', 'ok', { len: p.description.length });
  if (!p.h1Count) add('h1-missing', 'people', 'improve');
  else if (p.h1Count > 1) add('h1-many', 'people', 'note', { n: p.h1Count });
  else add('h1-ok', 'people', 'ok');
  if (!p.lang) add('lang-missing', 'people', 'note');
  if (p.images.missingAlt > 0) add('img-alt', 'people', 'note', { n: p.images.missingAlt, total: p.images.total });

  /* What machines parse. */
  if (p.jsonld.invalid > 0) add('jsonld-broken', 'machines', 'fix', { n: p.jsonld.invalid, total: p.jsonld.blocks });
  if (!p.jsonld.blocks) add('jsonld-missing', 'machines', 'improve');
  else if (p.jsonld.invalid < p.jsonld.blocks) add('jsonld-ok', 'machines', 'ok', { types: p.jsonld.types.slice(0, 6).join(', ') });
  const og = p.og;
  if (!og.title && !og.image) add('og-missing', 'machines', 'improve');
  else if (!og.image) add('og-partial', 'machines', 'note');
  else add('og-ok', 'machines', 'ok');
  if (r.llms.state === 'found') add('llms-ok', 'machines', 'ok');
  else add('llms-missing', 'machines', 'note');

  const at = (id) => {
    const i = ORDER.indexOf(id);
    return i < 0 ? ORDER.length : i;
  };
  return f.sort((a, b) => LEVEL_RANK[a.level] - LEVEL_RANK[b.level] || at(a.id) - at(b.id));
}

/* ── Rate limit (behind Netlify's own) ──────────────────────────────── */

/* Netlify's limiter (config.rateLimit, below) is the real one: it counts
   per IP across every instance and answers 429 before this code runs.
   This is a backstop inside one instance, for a burst that lands before
   Netlify's count catches up. The key is a SHA-256 of the IP with a salt
   made fresh for each instance, so it means nothing outside this process,
   and a key is dropped once its last minute has passed: nothing about a
   visitor is kept longer than that, and nothing is written anywhere. */
const SALT = randomBytes(16);
const hits = new Map();
const PER_MINUTE = 10;

function limited(ip) {
  const key = createHash('sha256').update(SALT).update(String(ip)).digest('base64url').slice(0, 22);
  const now = Date.now();
  for (const [k, times] of hits) if (now - times[times.length - 1] >= 60_000) hits.delete(k);
  const recent = (hits.get(key) ?? []).filter((t) => now - t < 60_000);
  if (recent.length >= PER_MINUTE) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  return false;
}

/* ── The handler ────────────────────────────────────────────────────── */

const HEADERS = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex', 'X-Content-Type-Options': 'nosniff' };
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...HEADERS, 'Content-Type': 'application/json; charset=utf-8' } });

/**
 * The handler, with its network seams. Production uses the defaults
 * (public addresses only, ports 80 and 443, the system resolver). The
 * options exist so tests can aim it at a local server; nothing a request
 * carries can reach them.
 */
export function createHandler(opts = {}) {
  return async (req, context) => {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify(errorBody(new ScanError('method'))), {
        status: 405,
        headers: { ...HEADERS, Allow: 'POST', 'Content-Type': 'application/json; charset=utf-8' },
      });
    }
    const ip = context?.ip ?? req.headers.get('x-nf-client-connection-ip') ?? 'unknown';
    if (!opts.noLimit && limited(ip)) return json(errorBody(new ScanError('rate_limited')), 429);

    let input;
    try {
      const len = Number(req.headers.get('content-length') ?? 0);
      if (len > LIMITS.bodyBytes) throw new Error('big');
      const raw = await req.text();
      if (raw.length > LIMITS.bodyBytes) throw new Error('big');
      input = JSON.parse(raw)?.url;
      if (typeof input !== 'string') throw new Error('shape');
    } catch {
      return json(errorBody(new ScanError('bad_request')), 400);
    }
    /* The obvious refusals answer before anything is fetched. */
    try {
      normalizeUrl(input);
    } catch (e) {
      return json(errorBody(e), STATUS_FOR[e.code] ?? 400);
    }

    const stream = /application\/x-ndjson/i.test(req.headers.get('accept') ?? '');
    if (!stream) {
      try {
        return json({ ok: true, result: await scan(input, opts) });
      } catch (e) {
        if (!(e instanceof ScanError)) console.error('scan: failed', e?.name ?? 'Error');
        return json(errorBody(e), STATUS_FOR[e?.code] ?? 500);
      }
    }

    const enc = new TextEncoder();
    const body = new ReadableStream({
      async start(controller) {
        const send = (o) => {
          try {
            controller.enqueue(enc.encode(JSON.stringify(o) + '\n'));
          } catch {
            /* the visitor left; nothing to tell */
          }
        };
        try {
          const result = await scan(input, opts, (s) => send({ type: 'step', ...s }));
          send({ type: 'result', result });
        } catch (e) {
          if (!(e instanceof ScanError)) console.error('scan: failed', e?.name ?? 'Error');
          send({ type: 'error', ...errorBody(e) });
        }
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      },
    });
    return new Response(body, { status: 200, headers: { ...HEADERS, 'Content-Type': 'application/x-ndjson; charset=utf-8' } });
  };
}

export default createHandler();

export const config = {
  path: '/api/scan',
  /* Netlify's own limiter, per visitor IP on this domain: past the limit
     it answers 429 before the function runs. A scan makes up to a dozen
     requests to someone else's server, so this is kept low. */
  rateLimit: { windowLimit: 10, windowSize: 60, aggregateBy: ['ip', 'domain'] },
};
