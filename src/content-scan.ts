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
 *     `scanCopy` from a JSON block the page carries (so this module never
 *     ships as JavaScript);
 *   - netlify/functions/scan.mjs reads `crawlers` (which crawlers to check
 *     robots.txt for) and `scanErrors` (what to say when a scan can't run).
 *
 * The crawler list was checked against each operator's own documentation
 * in November 2026: OpenAI (developers.openai.com/api/docs/bots), Anthropic
 * (support.claude.com, "Does Anthropic crawl data from the web"),
 * Perplexity (docs.perplexity.ai/guides/bots), Google ("Google's common
 * crawlers"), Apple (support.apple.com/119829) and Common Crawl
 * (commoncrawl.org/ccbot). ByteDance publishes little about Bytespider, so
 * its line says what's reported, not what's documented. Recheck it when
 * adding a crawler: names and purposes change.
 *
 * Same conventions as src/content.ts: headlines are arrays of lines,
 * {em}…{/em} marks one emphasized phrase per headline, and {k}…{/k} marks a
 * technical term in body copy (page copy only; the report's copy is plain
 * text, since the browser draws it). {name} in the report copy is a value
 * filled in from the scan. Edit words here, never in a renderer.
 */

import type { Hero, Link, Meta, Section } from './content-types';
import type { Crawler, ScanCopy, ScanResult } from './sections/scan-kit';

export type ScanPage = {
  meta: Meta;
  hero: Hero;
  form: {
    label: string;
    placeholder: string;
    button: string;
    busy: string;
    note: string;
    /* Shown instead of the form when JavaScript is off. */
    nojs: string;
    nojsLink: Link;
    steps: Record<'fetch' | 'parse' | 'robots' | 'files', string>;
    stepsLabel: string;
    /* Announced and shown under the steps. {host}, {ms}, {fix}, {improve}. */
    status: { start: string; done: string; failed: string };
  };
  report: Section & { exampleChip: string; liveChip: string; liveTitle: string };
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
    status: {
      start: 'Scanning {host}. This takes a few seconds.',
      done: 'Done. {fix} to fix and {improve} to improve. The report is below.',
      failed: 'The scan stopped.',
    },
  },
  report: {
    id: 'report',
    eyebrow: 'The report',
    headline: ['Every page has', '{em}three readers.{/em}'],
    body: [
      'People read the words. Crawlers follow the links and the rules. Machines parse the structured data. The report reads your page the way each one does, then lists what to fix first.',
      'Until you scan a page, it shows a recorded scan of this site.',
    ],
    exampleChip: 'a scan of this site',
    liveChip: 'Live · fetched just now',
    liveTitle: 'Fetched by our server when you pressed Scan, read the same way, and not kept.',
  },
  how: {
    id: 'how',
    eyebrow: 'What it does',
    headline: ['A first look,', '{em}not an audit.{/em}'],
    body: [
      'The scanner fetches one page from our server and reads the HTML it gets back, with no scripts run. Many AI crawlers read pages the same way. It also reads your {k}robots.txt{/k} and looks for a sitemap and an {k}llms.txt{/k} file.',
      'It can’t see your rankings, your traffic or what an AI answer says about you today. Nobody outside those companies can. It doesn’t check every page or judge your writing.',
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
    primary: { label: 'Ask for an audit quote', href: '/start/?topic=audit' },
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
    { token: 'Bingbot', by: 'Microsoft', group: 'search', what: 'Crawls pages for Bing search.' },
    {
      token: 'OAI-SearchBot',
      by: 'OpenAI',
      group: 'answers',
      what: 'Finds pages to show and link in ChatGPT search. OpenAI says it isn’t used for training.',
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
      token: 'ChatGPT-User',
      by: 'OpenAI',
      group: 'fetch',
      what: 'Visits a page when someone asks ChatGPT about it. OpenAI says robots.txt may not apply.',
    },
    {
      token: 'Claude-User',
      by: 'Anthropic',
      group: 'fetch',
      what: 'Visits a page when someone’s question to Claude needs it.',
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
      what: 'Not a crawler. A switch for whether Google may use your pages to train Gemini. It doesn’t affect Google Search.',
    },
    {
      token: 'Applebot-Extended',
      by: 'Apple',
      group: 'training',
      what: 'Not a crawler. A switch for whether Apple may use your pages to train its AI models. Apple’s search isn’t affected.',
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
      what: 'The crawler of TikTok’s parent company. Widely reported to gather data for its AI models.',
    },
  ],
};

/* ── The report's words ─────────────────────────────────────────────── */

export const scanCopy: ScanCopy = {
  title: 'Scan report',
  request: { method: 'GET', status: 'Status', time: 'Answered in', size: 'HTML', redirects: 'Redirects', none: 'none' },
  summary: {
    label: 'Start here',
    tally: { fix: 'to fix', improve: 'to improve', note: 'worth a look', ok: 'already right' },
    clear: 'Nothing to fix. Here’s what we checked.',
    checked: 'What we checked',
  },
  levels: { fix: 'Fix', improve: 'Improve', note: 'Worth a look', ok: 'Right' },
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
    robotsFound: 'found · {n} sitemap lines',
    declared: 'named in robots.txt',
    missing: 'not found ({status})',
    unreadable: 'answers, but not with a usable file',
    timeout: 'didn’t answer in time',
    error: 'server error ({status})',
    unreachable: 'couldn’t be fetched',
    found: 'found',
    blocks: '{n} JSON-LD blocks · {bad} broken',
    items: '{n} items',
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
      why: 'The words are added by JavaScript after the page loads. Crawlers that don’t run scripts, and many AI crawlers don’t, see an almost empty page.',
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
    'answers-blocked': {
      title: 'robots.txt blocks AI search crawlers: {names}.',
      why: 'These crawlers find the pages AI answers quote and link to. Blocking them keeps you out of those answers. Blocking only the training crawlers doesn’t.',
      fix: 'If you want to show up in AI answers, allow these. You can keep the training crawlers blocked.',
    },
    'robots-error': {
      title: 'robots.txt didn’t load.',
      why: 'When robots.txt answers with a server error, Google stops crawling the site until it loads again. Other crawlers may hold off too.',
      fix: 'Make /robots.txt answer 200 with your rules, or 404 if you don’t want any.',
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
    'canonical-other': {
      title: 'The canonical points to another address.',
      why: 'That’s right for a duplicate page. If this is the main page, it tells search engines to index the other address.',
      fix: 'Check that {url} is the address you want indexed.',
    },
    redirects: {
      title: 'The address went through {n} redirects.',
      why: 'Each hop adds time, and crawlers give up after a few.',
      fix: 'Link straight to the final address, and point old addresses at it in one hop.',
    },
    refresh: {
      title: 'The page redirects with a meta refresh.',
      why: 'Some crawlers don’t follow it, and people see a flash of the wrong page first.',
      fix: 'Use a server redirect (301).',
    },
    'title-long': {
      title: 'The title is {len} characters long.',
      why: 'Search results show about the first 60 characters, so the end of yours may be cut off.',
      fix: 'Put the words that matter first.',
    },
    'desc-long': {
      title: 'The description is {len} characters long.',
      why: 'Search results usually show about 160 characters of it.',
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
    /* Already right: a line each. */
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

/** By error code. {host}, {type} and {n} are filled in by the function. */
export const scanErrors: Record<string, { title: string; body: string }> = {
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
    body: 'We wait up to 8 seconds for a scan. A page that slow is worth a look on its own.',
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
  bad_request: { title: 'That request wasn’t understood.', body: 'Send a JSON body with the address in a field called url.' },
  network: { title: 'We couldn’t reach the scanner.', body: 'Check your connection and try again.' },
  failed: { title: 'Something went wrong on our side.', body: 'Try again in a minute.' },
};

/* ── The example ────────────────────────────────────────────────────── */

/**
 * A recorded scan: netlify/functions/scan.mjs run against
 * https://adjltechnology.com/ on the date in `at`, its JSON pasted here
 * unchanged. The page labels it Recorded, with that date. Re-record it
 * after a change the scan would see (a new title, a robots.txt edit):
 * import the function in Node 22 and paste the `result` of
 * `await (await handler(new Request(...))).json()`.
 */
export const example: ScanResult = null as unknown as ScanResult;
