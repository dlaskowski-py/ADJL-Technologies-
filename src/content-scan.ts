/**
 * ADJL Technology: /scan/, "See what AI sees on your site".
 *
 * Every word the scanner says lives here: the page, the report's labels,
 * the findings (each with why it matters and what to do), the AI crawlers
 * and what each is for, and the error messages. Three readers use it:
 *
 *   - src/sections/scan.ts renders the page at build, with a recorded scan
 *     of this site as the example (`example`, below);
 *   - src/motion/scan.ts draws a visitor's own scan in the browser, reading
 *     `scanCopy`, `scanErrors` and `content.form` from a JSON block the
 *     page carries (so this module never ships as JavaScript);
 *   - netlify/functions/scan.mjs reads `crawlers` (which crawlers to check
 *     robots.txt for) and `scanErrors` (what to say when a scan can't run).
 *
 * The crawler list was checked against each operator's own documentation
 * on November 11, 2026: OpenAI (developers.openai.com/api/docs/bots),
 * Anthropic (support.claude.com article 8896518), Perplexity
 * (docs.perplexity.ai/guides/bots), Google ("Google's common crawlers"),
 * Apple (support.apple.com/119829), Meta (developers.facebook.com, "Meta
 * Web Crawlers") and Common Crawl (commoncrawl.org/ccbot). Google-Extended
 * was rechecked on November 12, 2026 against "Google's common crawlers"
 * (last updated October 30, 2026). It's a training opt-out AND, Google
 * says, the switch for grounding in the Gemini apps and in Grounding with
 * Google Search on Vertex AI; Google says it has no effect on inclusion or
 * ranking in Google Search, and says nothing about AI Overviews, so neither
 * does this file. ByteDance
 * publishes little about Bytespider, so its line says what's reported, not
 * what's documented. Recheck the list when adding a crawler: names and
 * purposes change.
 *
 * Same conventions as src/content.ts: headlines are arrays of lines,
 * {em}…{/em} marks one emphasized phrase per headline, and {k}…{/k} marks a
 * technical term in body copy (page copy only; the report's copy is plain
 * text, since the browser draws it too). {name} in the report copy is a
 * value filled in from the scan. Edit words here, never in a renderer.
 */

import type { Hero, Link, Meta, Section } from './content-types';
import type { Crawler, ScanCopy, ScanResult } from './sections/scan-kit';

/** The form's words. The browser reads these from the page's JSON block. */
export type ScanForm = {
  label: string;
  placeholder: string;
  button: string;
  busy: string;
  note: string;
  /** Shown instead of the form when JavaScript is off. */
  nojs: string;
  nojsLink: Link;
  stepsLabel: string;
  steps: Record<'fetch' | 'parse' | 'robots' | 'files', string>;
  /** A step's state, read out after its name. {ms} is filled in. */
  stepState: { wait: string; run: string; done: string; failed: string; skip: string };
  /** Announced, and shown under the steps. {host}, {fix}, {improve}, {first}. */
  status: { start: string; done: string; clear: string; failed: string };
  /** The chip on a visitor's own report. */
  liveChip: string;
  liveTitle: string;
};

export type ScanPage = {
  meta: Meta;
  hero: Hero;
  form: ScanForm;
  /** The report section. {date} in `exampleNote` and `exampleChip` is the
   *  day the example was recorded. `exampleNote` says the report below is
   *  that recording; the browser hides it once a visitor's own scan
   *  replaces the example. */
  report: Section & { exampleNote: string; exampleChip: string };
  how: Section;
  audit: Section & { primary: Link; secondary: Link };
};

export const content: ScanPage = {
  meta: {
    title: 'See What AI Sees on Your Site | ADJL Technology',
    description:
      'Enter a web address. We fetch the page like a crawler, with no scripts run, and show what people, search crawlers and AI answer engines get from it.',
    ogTitle: 'See what AI sees on your site.',
    ogDescription: 'A free scan of one page: what people read, what crawlers follow and what machines parse.',
  },
  hero: {
    eyebrow: 'Free site scan',
    headline: ['See what AI', '{em}sees on your site.{/em}'],
    lead: 'Type in a web address. We fetch the page the way a crawler does, without running its scripts, and show what people, search crawlers and AI answer engines get from it. Then we list what to fix first.',
  },
  form: {
    label: 'Your page’s web address',
    placeholder: 'yourbusiness.com',
    button: 'Scan this page',
    busy: 'Scanning…',
    note: 'One page, plus its robots.txt, sitemap and llms.txt. We don’t keep the address or anything we fetch.',
    nojs: 'The scanner runs from your browser, so it needs JavaScript. With it off, you can still read a recorded scan of this site below. It shows everything a scan of your page would.',
    nojsLink: { label: 'Read the recorded scan', href: '#report' },
    stepsLabel: 'Scan progress',
    steps: {
      fetch: 'Fetch the page',
      parse: 'Read the HTML',
      robots: 'Read robots.txt',
      files: 'Look for a sitemap and llms.txt',
    },
    stepState: { wait: 'waiting', run: 'running', done: '{ms}', failed: 'stopped', skip: 'not run' },
    status: {
      start: 'Scanning {host}. This takes a few seconds.',
      done: 'Done. {fix} to fix and {improve} to improve. First: {first} The report is below.',
      clear: 'Done. Nothing to fix. The report is below.',
      failed: 'The scan stopped.',
    },
    liveChip: 'Live · fetched just now',
    liveTitle: 'Fetched by our server when you pressed Scan, read the same way, and not kept.',
  },
  report: {
    id: 'report',
    eyebrow: 'The report',
    headline: ['Every page has', '{em}three readers.{/em}'],
    body: [
      'People read the words. Crawlers follow the links and the rules. Machines parse the structured data. The report reads your page the way each one does, then lists what to fix first.',
    ],
    exampleNote: 'Until you scan a page, it shows a scan of this site’s home page, recorded on {date}.',
    exampleChip: '{date}',
  },
  how: {
    id: 'how',
    eyebrow: 'What it does',
    headline: ['A first look,', '{em}not an audit.{/em}'],
    body: [
      'The scanner fetches one page from our server and reads the HTML it gets back, with no scripts run. Many AI crawlers read pages the same way. It also reads your {k}robots.txt{/k} and looks for a sitemap and an {k}llms.txt{/k}.',
      'It can’t see your rankings, your traffic or what an AI answer says about you today. It doesn’t check every page or judge your writing.',
      'We don’t store the address you scan or anything we fetch. The report goes back to your browser and nowhere else.',
    ],
  },
  audit: {
    id: 'audit',
    eyebrow: 'Go further',
    headline: ['Want the whole site', '{em}read properly?{/em}'],
    body: [
      'The website audit starts from these three layers and goes much deeper, across every kind of page on your site. You get a written report with the fixes in order of impact, and a call to walk through it.',
      'It’s priced by quote, after a look at the site.',
    ],
    primary: { label: 'Ask for an audit quote', href: '/start/?topic=audit#form' },
    secondary: { label: 'What the audit covers', href: '/services/seo/audit/' },
  },
};

/* ── The crawlers ───────────────────────────────────────────────────── */

/**
 * The crawlers the report checks robots.txt for, grouped by what blocking
 * them costs you. `token` is the name robots.txt uses.
 */
export const crawlers: { items: Crawler[] } = {
  items: [
    {
      token: 'Googlebot',
      by: 'Google',
      group: 'search',
      what: 'Crawls pages for Google Search. AI Overviews in Search use the same index.',
    },
    {
      token: 'Bingbot',
      by: 'Microsoft',
      group: 'search',
      what: 'Crawls pages for Bing search, which Copilot’s web answers draw on.',
    },
    {
      token: 'Applebot',
      by: 'Apple',
      group: 'search',
      what: 'Crawls pages for search in Siri, Spotlight and Safari. Apple says it may also use them to train its models.',
    },
    {
      token: 'OAI-SearchBot',
      by: 'OpenAI',
      group: 'answers',
      what: 'Finds pages to show and link in ChatGPT search. OpenAI’s separate GPTBot does the training crawls.',
    },
    {
      token: 'Claude-SearchBot',
      by: 'Anthropic',
      group: 'answers',
      what: 'Indexes pages to improve the results Claude’s search gives.',
    },
    {
      token: 'PerplexityBot',
      by: 'Perplexity',
      group: 'answers',
      what: 'Finds and links pages in Perplexity’s answers. Perplexity says it isn’t used for training.',
    },
    {
      token: 'Meta-WebIndexer',
      by: 'Meta',
      group: 'answers',
      what: 'Reads pages to improve Meta AI’s search results and citations.',
    },
    {
      token: 'ChatGPT-User',
      by: 'OpenAI',
      group: 'fetch',
      what: 'Visits a page when someone asks ChatGPT about it. OpenAI says robots.txt may not apply.',
    },
    {
      token: 'Claude-User',
      by: 'Anthropic',
      group: 'fetch',
      what: 'Visits a page when someone’s question to Claude needs it. Anthropic says it follows robots.txt.',
    },
    {
      token: 'Perplexity-User',
      by: 'Perplexity',
      group: 'fetch',
      what: 'Visits a page when someone asks Perplexity about it. Perplexity says it generally ignores robots.txt.',
    },
    {
      token: 'GPTBot',
      by: 'OpenAI',
      group: 'training',
      what: 'Collects pages that may be used to train OpenAI’s models.',
    },
    {
      token: 'ClaudeBot',
      by: 'Anthropic',
      group: 'training',
      what: 'Collects pages that may be used to train Anthropic’s models.',
    },
    {
      token: 'Google-Extended',
      by: 'Google',
      group: 'training',
      what: 'Not a crawler. A switch for whether Google may use your pages to train Gemini, and to ground Gemini’s answers in them. Google says it doesn’t affect whether your pages appear or rank in Google Search.',
    },
    {
      token: 'Applebot-Extended',
      by: 'Apple',
      group: 'training',
      what: 'Not a crawler. A switch for whether Apple may use what Applebot collects to train its models. Apple’s search isn’t affected.',
    },
    {
      token: 'Meta-ExternalAgent',
      by: 'Meta',
      group: 'training',
      what: 'Collects pages for uses such as training Meta’s AI models.',
    },
    {
      token: 'CCBot',
      by: 'Common Crawl',
      group: 'training',
      what: 'Builds Common Crawl, a free public archive of the web that many AI models were trained on.',
    },
    {
      token: 'Bytespider',
      by: 'ByteDance',
      group: 'training',
      what: 'The crawler of TikTok’s parent company. ByteDance says little about it. It’s widely reported to gather data for AI models.',
    },
  ],
};

/* ── The report's words ─────────────────────────────────────────────── */

export const scanCopy: ScanCopy = {
  title: 'Scan report',
  request: { method: 'GET', status: 'Status', time: 'Answered in', size: 'HTML', redirects: 'Redirects', none: 'none' },
  summary: {
    label: 'Start here',
    tally: { fix: 'to fix', improve: 'to improve', note: 'worth a look', ok: 'fine' },
    clear: 'Nothing to fix. Here’s what we checked.',
    checked: 'What we checked',
  },
  levels: { fix: 'Fix', improve: 'Improve', note: 'Worth a look', ok: 'Fine' },
  todo: 'What to do:',
  layers: {
    people: {
      n: '01',
      title: 'What people read',
      sub: 'The words on the page before any script runs, and what a search result shows.',
    },
    crawlers: {
      n: '02',
      title: 'What crawlers follow',
      sub: 'Whether search and AI crawlers may read the page, and where it sends them.',
    },
    machines: {
      n: '03',
      title: 'What machines parse',
      sub: 'Structured data, share tags and the files written for machines.',
    },
  },
  rows: {
    title: 'Title',
    description: 'Description',
    h1: 'h1',
    words: 'Words before scripts run',
    outline: 'Headings',
    lang: 'Language',
    images: 'Images',
    final: 'Final address',
    redirects: 'Redirects',
    canonical: 'Canonical',
    robotsMeta: 'Robots meta',
    xRobots: 'X-Robots-Tag',
    links: 'Links',
    robots: 'robots.txt',
    sitemap: 'Sitemap',
    jsonld: 'Structured data',
    microdata: 'Microdata',
    og: 'Open Graph',
    twitter: 'Twitter card',
    llms: 'llms.txt',
  },
  values: {
    none: 'none',
    chars: '{n} characters',
    inMain: '{n} in <main>',
    more: '+ {n} more',
    alt: '{n} of {total} without alt text',
    noImages: 'no images',
    robotsDefault: 'not set (index, follow)',
    links: '{internal} internal · {external} external · {nofollow} nofollow',
    robotsFound: 'found · Sitemap lines: {n}',
    declared: 'named in robots.txt',
    missing: 'not found ({status})',
    unreadable: 'answers, but not with a usable file',
    timeout: 'didn’t answer in time',
    error: 'server error ({status})',
    unreachable: 'couldn’t be fetched',
    found: 'found',
    blocks: 'JSON-LD blocks: {n} · broken: {bad}',
    items: 'items: {n}',
  },
  findings: {
    /* Fix: these keep the page out of results or leave it unreadable. */
    status: {
      title: 'The page answers {status}.',
      why: 'An error status tells search engines and AI crawlers there’s no page here. They drop it, and what they knew about it goes stale.',
      fix: 'Make the address answer 200, or send it with a 301 redirect to the page that replaced it.',
    },
    noindex: {
      title: 'The page asks not to be indexed.',
      why: 'A noindex tag or header keeps it out of Google and Bing. Answer engines that search those indexes won’t find it either.',
      fix: 'If people should find this page, take noindex out of the robots meta tag or the X-Robots-Tag header.',
    },
    'search-blocked': {
      title: 'robots.txt blocks {names} from this page.',
      why: 'A search crawler can’t read a page it isn’t allowed to fetch. The page drops out of results, or shows up with no description.',
      fix: 'Remove or narrow the Disallow line that matches this page.',
    },
    'no-text': {
      title: 'Only {n} words arrive before scripts run.',
      why: 'The page looks built to be drawn by JavaScript after it loads. Crawlers that don’t run scripts, and many AI crawlers don’t, see an almost empty page.',
      fix: 'Send the words in the HTML itself, by prerendering the page or rendering it on the server.',
    },
    'title-missing': {
      title: 'The page has no title.',
      why: 'The title is the blue link in search results and the name on the browser tab. Without one, search engines make one up.',
      fix: 'Add a title that says what the page is and who it’s from.',
    },
    'jsonld-broken': {
      title: '{n} of {total} structured data blocks don’t parse.',
      why: 'A JSON-LD block with a syntax error is skipped whole. Whatever it said about your business never reaches the search engine.',
      fix: 'Run the block through a JSON validator and fix the error. A stray comma or quote is the usual cause.',
    },
    /* Improve: these cost the page something. */
    thin: {
      title: 'Only {n} words on the page before scripts run.',
      why: 'That’s very little for search engines and AI answer engines to read. If more is added by JavaScript later, many AI crawlers never see it.',
      fix: 'Make sure the words that say what you offer are in the HTML itself. If the page really is this short, say more about what it offers and who it’s for.',
    },
    'answers-blocked': {
      title: 'robots.txt blocks AI search crawlers: {names}.',
      why: 'These crawlers find the pages AI answers quote and link to. Blocking them keeps you out of those answers. Blocking only the training crawlers doesn’t, with one exception. Google says Google-Extended also decides whether Gemini may ground its answers in your pages.',
      fix: 'If you want to show up in AI answers, allow these. You can keep the training crawlers blocked, apart from Google-Extended if Gemini matters to you.',
    },
    'robots-error': {
      title: 'robots.txt didn’t load.',
      why: 'When robots.txt can’t be fetched, or answers with a server error or 429 (too many requests), Google stops crawling the site and keeps trying. After 12 hours it falls back to the last copy it read, if it has one. Other crawlers may hold off too.',
      fix: 'Make /robots.txt answer 200 with your rules, or 404 if you don’t want any. If a CDN or firewall rate-limits it, exempt /robots.txt.',
    },
    'canonical-missing': {
      title: 'No canonical URL.',
      why: 'One page can often be reached at several addresses, with and without www or with tracking codes added. A canonical tag says which one to index and credit.',
      fix: 'Add a canonical link tag that points at the page’s main address.',
    },
    'desc-missing': {
      title: 'No meta description.',
      why: 'Search engines and answer engines then write their own summary from whatever text they find first. That may be a menu or a cookie notice.',
      fix: 'Write one or two sentences that say what the page offers and who it’s for.',
    },
    'h1-missing': {
      title: 'No h1 heading.',
      why: 'The h1 is the page’s headline. People, screen readers and crawlers use it to tell what the page is about.',
      fix: 'Mark the main headline as the page’s one h1.',
    },
    'jsonld-missing': {
      title: 'No structured data.',
      why: 'Structured data (JSON-LD) tells machines plainly who you are, what you sell and where. Without it, they guess from the layout.',
      fix: 'Add JSON-LD for your business and for the main thing on this page, such as a service, a product or an article.',
    },
    'og-missing': {
      title: 'No share tags.',
      why: 'When someone pastes this link into a chat or a social post, the preview has no picture and a guessed title.',
      fix: 'Add Open Graph tags: og:title, og:description and og:image.',
    },
    nofollow: {
      title: 'The page tells crawlers not to follow its links.',
      why: 'Nofollow on the whole page stops crawlers using it to find your other pages.',
      fix: 'Take nofollow out of the robots meta tag unless you mean it.',
    },
    'sitemap-missing': {
      title: 'No sitemap found.',
      why: 'A sitemap lists every page you want found, so crawlers don’t have to discover them one link at a time.',
      fix: 'Publish /sitemap.xml and name it in robots.txt with a Sitemap line.',
    },
    slow: {
      title: 'The page took {s} seconds to arrive.',
      why: 'Google says it crawls less when a site answers slowly. People leave slow pages too.',
      fix: 'Find where the time goes: the server, the database or the size of the page. Fix the slowest part first.',
    },
    /* Worth a look. */
    'gemini-blocked': {
      title: 'robots.txt opts out of Google-Extended.',
      why: 'Google says this switch covers more than training. It also decides whether Gemini may use your pages to ground its answers, in the Gemini apps and on Google Cloud’s Vertex AI. Google says it doesn’t affect whether your pages appear or rank in Google Search.',
      fix: 'If you want Gemini to be able to draw on your pages when it answers, allow Google-Extended. If you’d rather keep them out of Gemini, leave it blocked.',
    },
    'robots-slow': {
      title: 'robots.txt didn’t answer in time.',
      why: 'Our scan waits up to 3 seconds for it, less when the page itself was slow, so the limit may be ours, not your site’s. If Google can’t fetch it either, it treats that like a server error and stops crawling for a while.',
      fix: 'Check that /robots.txt answers quickly. It’s a small file and should come back in well under a second.',
    },
    'canonical-other': {
      title: 'The canonical points to another address.',
      why: 'That’s right for a duplicate page. If this is the main page, it tells search engines to index the other address.',
      fix: 'Check that {url} is the address you want indexed.',
    },
    redirects: {
      title: 'The address went through {n} redirects.',
      why: 'Each hop adds a round trip. Google follows up to 10, but other crawlers and tools may stop sooner.',
      fix: 'Link straight to the final address, and point old addresses at it in one hop.',
    },
    refresh: {
      title: 'The page redirects with a meta refresh.',
      why: 'Some crawlers don’t follow it, and people see a flash of the wrong page first.',
      fix: 'Use a server redirect (301).',
    },
    'title-long': {
      title: 'The title is {len} characters long.',
      why: 'Google cuts long titles in its results to fit the screen. It sets no fixed limit, but past about 60 characters the end of yours may be cut off.',
      fix: 'Put the words that matter first.',
    },
    'desc-long': {
      title: 'The description is {len} characters long.',
      why: 'Google cuts long descriptions in its results to fit the screen. It sets no fixed limit, but past about 160 characters the end may be cut off. It may also write its own summary from the page.',
      fix: 'Lead with the point and trim the rest.',
    },
    'h1-many': {
      title: 'The page has {n} h1 headings.',
      why: 'Search engines cope with more than one. People and screen readers do better with one clear headline.',
      fix: 'Keep one h1 for the page’s main point and make the rest h2.',
    },
    'lang-missing': {
      title: 'No language declared.',
      why: 'The lang attribute tells browsers, screen readers and translation tools what language the page is in.',
      fix: 'Add lang="en", or your language’s code, to the html tag.',
    },
    'img-alt': {
      title: '{n} of {total} images have no alt text.',
      why: 'Alt text is how screen readers and search engines know what an image shows.',
      fix: 'Describe each image that carries meaning. Give decorative ones an empty alt.',
    },
    'og-partial': {
      title: 'Share tags, but no image.',
      why: 'Previews of this link will show text and no picture.',
      fix: 'Add og:image. A picture 1200 by 630 pixels fits most previews.',
    },
    'robots-missing': {
      title: 'No usable robots.txt.',
      why: 'Every crawler may read everything, which is fine. But there’s nowhere to name your sitemap or set rules for AI crawlers.',
      fix: 'Add a short /robots.txt with a Sitemap line.',
    },
    'llms-missing': {
      title: 'No llms.txt.',
      why: 'It’s a proposed convention, a plain-text summary of a site for language models. Some AI tools read it and many don’t.',
      fix: 'Add one if it’s cheap to keep up to date. Don’t expect much from it yet.',
    },
    /* Fine: a line each. */
    'status-ok': { title: 'The page answers {status}.' },
    indexable: { title: 'Nothing tells search engines to skip it.' },
    'text-ok': { title: '{n} words arrive before any script runs.' },
    'title-ok': { title: 'Title set, {len} characters.' },
    'desc-ok': { title: 'Meta description set, {len} characters.' },
    'h1-ok': { title: 'One h1 heading.' },
    'canonical-ok': { title: 'The canonical URL points at this page.' },
    'robots-ok': { title: 'robots.txt lets search and AI crawlers in.' },
    'training-blocked': { title: 'AI search crawlers may read it. Training crawlers are blocked: {names}.' },
    'sitemap-ok': { title: 'Sitemap found.' },
    'jsonld-ok': { title: 'Structured data parses: {types}.' },
    'og-ok': { title: 'Share tags set, with an image.' },
    'llms-ok': { title: 'llms.txt found.' },
  },
  agents: {
    title: 'AI crawlers and your robots.txt',
    sub: 'What your robots.txt tells each crawler about this page. A crawler with no rules of its own follows the rules for all crawlers.',
    head: { token: 'Crawler', by: 'Run by', what: 'What it does', verdict: 'This page' },
    groups: {
      search: 'Search engines',
      answers: 'AI search and answers',
      fetch: 'Fetches a page when a person asks',
      training: 'AI training',
    },
    verdicts: { allowed: 'Allowed', blocked: 'Blocked', unknown: 'Unknown' },
    rules: {
      own: 'by its own rules',
      all: 'by the rules for all crawlers',
      none: 'no rules apply',
      error: 'robots.txt didn’t load',
    },
  },
  crawlers: crawlers.items,
};

/* ── When a scan can't run ──────────────────────────────────────────── */

/** By error code. {host}, {type} and {n} are filled in by the function.
 *  `empty` and `network` are the browser's own: nothing reached the
 *  server. */
export const scanErrors: Record<string, { title: string; body: string }> = {
  empty: { title: 'Type a web address first.', body: 'Something like yourbusiness.com works.' },
  bad_url: {
    title: 'That doesn’t look like a web address.',
    body: 'Try something like yourbusiness.com or https://yourbusiness.com/services/.',
  },
  scheme: { title: 'Only web pages can be scanned.', body: 'The address has to start with http:// or https://.' },
  credentials: {
    title: 'Take the password out.',
    body: 'The address has a username or password in it. We don’t scan pages behind a login, and a password shouldn’t go in a form like this.',
  },
  port: { title: 'Only the usual web ports.', body: 'We fetch addresses on ports 80 and 443 and nothing else.' },
  private_name: {
    title: 'That name only works inside a private network.',
    body: 'We scan public websites only.',
  },
  blocked: {
    title: 'That address points inside a private network.',
    body: 'It leads to an address that isn’t on the public internet, so we won’t fetch it.',
  },
  not_found: { title: 'We couldn’t find that site.', body: 'Nothing answers at {host}. Check the spelling.' },
  refused: {
    title: 'The site didn’t answer.',
    body: 'The connection was refused or dropped. The site may be down, or it may block scanners like this one.',
  },
  tls: {
    title: 'The site’s security certificate didn’t check out.',
    body: 'We stop when a site’s HTTPS certificate is invalid or expired. Visitors’ browsers will warn them too.',
  },
  timeout: {
    title: 'The site took too long.',
    body: 'We wait up to 6 seconds for the page to arrive. A page that slow is worth a look on its own.',
  },
  too_large: {
    title: 'The page is too large to scan.',
    body: 'It’s more than 2 MB of HTML, which is more than we read. That’s very heavy for one page.',
  },
  not_html: { title: 'That isn’t a web page.', body: 'The address returned {type}, not HTML. Try the page that links to it.' },
  redirects: {
    title: 'Too many redirects.',
    body: 'The address redirected more than {n} times, so we stopped. Crawlers give up on long chains too.',
  },
  rate_limited: { title: 'That’s a lot of scans in a short time.', body: 'Wait a minute, then try again.' },
  method: { title: 'Scans are sent with POST.', body: 'Send a JSON body with the address in a field called url.' },
  forbidden: {
    title: 'This scanner only answers its own page.',
    body: 'Run your scan at adjltechnology.com/scan/.',
  },
  bad_request: {
    title: 'That request wasn’t understood.',
    body: 'Send it as JSON (Content-Type: application/json), with the address in a field called url.',
  },
  network: { title: 'We couldn’t reach the scanner.', body: 'Check your connection and try again.' },
  failed: { title: 'Something went wrong on our side.', body: 'Try again in a minute.' },
};

/* ── The example ────────────────────────────────────────────────────── */

/**
 * A recorded scan: netlify/functions/scan.mjs run against
 * https://adjltechnology.com/ at the time in `at`, its `result` pasted
 * here unchanged. The page labels it Recorded, with that date. Re-record
 * it after a change the scan would see (a new title, a robots.txt edit, a
 * new crawler in the list above):
 *
 *   node -e "import('./netlify/functions/scan.mjs').then(async (m) => {
 *     const r = await m.scan('https://adjltechnology.com/');
 *     console.log(JSON.stringify(r, null, 2)); })"
 */
export const example: ScanResult = {
  "v": 1,
  "url": "https://adjltechnology.com/",
  "finalUrl": "https://adjltechnology.com/",
  "at": "2026-11-12T00:43:31.713Z",
  "fetch": {
    "status": 200,
    "ms": 1006,
    "firstByte": 986,
    "bytes": 139605,
    "transfer": 31074,
    "type": "text/html; charset=UTF-8",
    "encoding": "gzip",
    "redirects": [],
    "xRobots": ""
  },
  "page": {
    "title": "AI Engineering, SEO and Software Studio | ADJL Technology",
    "titles": 1,
    "description": "ADJL Technology builds AI agents and automation, websites and native apps, and the technical SEO that gets them found by search and AI answer engines.",
    "lang": "en",
    "h1s": [
      "AI, websites and apps, built for what’s next."
    ],
    "h1Count": 1,
    "headings": [
      {
        "level": 1,
        "text": "AI, websites and apps, built for what’s next."
      },
      {
        "level": 2,
        "text": "What we can build for you."
      },
      {
        "level": 3,
        "text": "AI that does the busywork"
      },
      {
        "level": 3,
        "text": "Easy to find, easy to quote"
      },
      {
        "level": 3,
        "text": "One build, on every screen"
      },
      {
        "level": 3,
        "text": "We run what we build"
      },
      {
        "level": 2,
        "text": "Things we built, and how they work."
      },
      {
        "level": 3,
        "text": "A listing link in, a sourced file out."
      },
      {
        "level": 3,
        "text": "The records behind a price, on one sheet."
      },
      {
        "level": 3,
        "text": "From the feed to the evening brief."
      },
      {
        "level": 3,
        "text": "The whole engine, offline, on a phone."
      },
      {
        "level": 3,
        "text": "Private pages that stay private."
      },
      {
        "level": 3,
        "text": "A site that checks its own claims."
      },
      {
        "level": 2,
        "text": "Have something in mind? Let’s build it."
      },
      {
        "level": 2,
        "text": "What a machine reads on this page."
      },
      {
        "level": 2,
        "text": "Ask this site. It cites or it stays quiet."
      },
      {
        "level": 2,
        "text": "Every build runs the same six steps."
      },
      {
        "level": 3,
        "text": "01Trace the work"
      },
      {
        "level": 3,
        "text": "02Pick one step"
      },
      {
        "level": 3,
        "text": "03Write down what right looks like"
      },
      {
        "level": 3,
        "text": "04Build it narrow"
      },
      {
        "level": 3,
        "text": "05Put guards where mistakes cost"
      },
      {
        "level": 3,
        "text": "06Hand it over running"
      },
      {
        "level": 2,
        "text": "You talk to Daniel. A team builds it."
      },
      {
        "level": 3,
        "text": "You describe the problem"
      },
      {
        "level": 3,
        "text": "We watch it happen"
      },
      {
        "level": 3,
        "text": "A scope, in writing"
      },
      {
        "level": 3,
        "text": "Built, measured, handed over"
      },
      {
        "level": 2,
        "text": "The things you’re actually thinking."
      },
      {
        "level": 2,
        "text": "Tell us what’s slow, or what can’t be found."
      }
    ],
    "headingCount": 30,
    "words": 3863,
    "mainWords": 3822,
    "shell": {
      "root": "",
      "scripts": 2,
      "noscriptJs": false
    },
    "links": {
      "internal": 62,
      "external": 0,
      "nofollow": 0,
      "targets": 22
    },
    "images": {
      "total": 0,
      "missingAlt": 0
    },
    "canonical": "https://adjltechnology.com/",
    "canonicals": 1,
    "robotsMeta": "",
    "botMeta": "",
    "refresh": "",
    "og": {
      "title": "AI, websites and apps, built for what’s next.",
      "description": "ADJL Technology builds AI that handles the busywork, websites people can find, and apps for iPhone and Android. Everything on the page was built by us.",
      "image": "https://adjltechnology.com/og/home.jpg",
      "type": "website",
      "url": "https://adjltechnology.com/",
      "site_name": "ADJL Technology"
    },
    "twitter": {
      "card": "summary_large_image",
      "title": "AI, websites and apps, built for what’s next.",
      "description": "ADJL Technology builds AI that handles the busywork, websites people can find, and apps for iPhone and Android. Everything on the page was built by us.",
      "image": "https://adjltechnology.com/og/home.jpg"
    },
    "jsonld": {
      "blocks": 1,
      "invalid": 0,
      "types": [
        "Organization",
        "ImageObject",
        "Person",
        "OfferCatalog",
        "ListItem",
        "WebSite",
        "WebPage",
        "FAQPage",
        "Question",
        "Answer"
      ]
    },
    "microdata": 0
  },
  "robots": {
    "state": "found",
    "status": 200,
    "bytes": 316,
    "sitemaps": [
      "https://adjltechnology.com/sitemap.xml"
    ]
  },
  "sitemap": {
    "url": "https://adjltechnology.com/sitemap.xml",
    "declared": true,
    "state": "found",
    "status": 200,
    "kind": "urlset",
    "urls": 16,
    "truncated": false
  },
  "llms": {
    "state": "found",
    "status": 200,
    "bytes": 4605,
    "heading": "ADJL Technology"
  },
  "agents": [
    {
      "token": "Googlebot",
      "verdict": "allowed",
      "rule": "all",
      "line": "Allow: /"
    },
    {
      "token": "Bingbot",
      "verdict": "allowed",
      "rule": "all",
      "line": "Allow: /"
    },
    {
      "token": "Applebot",
      "verdict": "allowed",
      "rule": "all",
      "line": "Allow: /"
    },
    {
      "token": "OAI-SearchBot",
      "verdict": "allowed",
      "rule": "all",
      "line": "Allow: /"
    },
    {
      "token": "Claude-SearchBot",
      "verdict": "allowed",
      "rule": "all",
      "line": "Allow: /"
    },
    {
      "token": "PerplexityBot",
      "verdict": "allowed",
      "rule": "own",
      "line": "Allow: /"
    },
    {
      "token": "Meta-WebIndexer",
      "verdict": "allowed",
      "rule": "all",
      "line": "Allow: /"
    },
    {
      "token": "ChatGPT-User",
      "verdict": "allowed",
      "rule": "all",
      "line": "Allow: /"
    },
    {
      "token": "Claude-User",
      "verdict": "allowed",
      "rule": "all",
      "line": "Allow: /"
    },
    {
      "token": "Perplexity-User",
      "verdict": "allowed",
      "rule": "all",
      "line": "Allow: /"
    },
    {
      "token": "GPTBot",
      "verdict": "allowed",
      "rule": "own",
      "line": "Allow: /"
    },
    {
      "token": "ClaudeBot",
      "verdict": "allowed",
      "rule": "own",
      "line": "Allow: /"
    },
    {
      "token": "Google-Extended",
      "verdict": "allowed",
      "rule": "own",
      "line": "Allow: /"
    },
    {
      "token": "Applebot-Extended",
      "verdict": "allowed",
      "rule": "all",
      "line": "Allow: /"
    },
    {
      "token": "Meta-ExternalAgent",
      "verdict": "allowed",
      "rule": "all",
      "line": "Allow: /"
    },
    {
      "token": "CCBot",
      "verdict": "allowed",
      "rule": "all",
      "line": "Allow: /"
    },
    {
      "token": "Bytespider",
      "verdict": "allowed",
      "rule": "all",
      "line": "Allow: /"
    }
  ],
  "ms": 1813,
  "findings": [
    {
      "id": "status-ok",
      "layer": "crawlers",
      "level": "ok",
      "vars": {
        "status": 200
      }
    },
    {
      "id": "indexable",
      "layer": "crawlers",
      "level": "ok",
      "vars": {}
    },
    {
      "id": "text-ok",
      "layer": "people",
      "level": "ok",
      "vars": {
        "n": 3863
      }
    },
    {
      "id": "title-ok",
      "layer": "people",
      "level": "ok",
      "vars": {
        "len": 57
      }
    },
    {
      "id": "desc-ok",
      "layer": "people",
      "level": "ok",
      "vars": {
        "len": 150
      }
    },
    {
      "id": "h1-ok",
      "layer": "people",
      "level": "ok",
      "vars": {}
    },
    {
      "id": "canonical-ok",
      "layer": "crawlers",
      "level": "ok",
      "vars": {}
    },
    {
      "id": "robots-ok",
      "layer": "crawlers",
      "level": "ok",
      "vars": {}
    },
    {
      "id": "sitemap-ok",
      "layer": "crawlers",
      "level": "ok",
      "vars": {
        "url": "https://adjltechnology.com/sitemap.xml"
      }
    },
    {
      "id": "jsonld-ok",
      "layer": "machines",
      "level": "ok",
      "vars": {
        "types": "Organization, ImageObject, Person, OfferCatalog, ListItem, WebSite"
      }
    },
    {
      "id": "og-ok",
      "layer": "machines",
      "level": "ok",
      "vars": {}
    },
    {
      "id": "llms-ok",
      "layer": "machines",
      "level": "ok",
      "vars": {}
    }
  ]
};
