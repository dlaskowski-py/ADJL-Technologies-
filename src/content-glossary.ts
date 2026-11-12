/**
 * The reading switch: Plain or Technical, for the whole site.
 *
 * Plain is the default. In it, every technical term marked {k}…{/k} in
 * body copy is followed by a short plain definition from `glossary`, so
 * the reader sees "row-level security (a database rule that decides who
 * can see each row)". In Technical the term stands on its own. rich() in
 * src/sections/html.ts renders both, and base CSS shows the one the reader
 * chose (html[data-read], set before first paint by public/js-on.js).
 *
 * Rules for a definition:
 *   - At most 12 words, plain, lowercase start, no full stop: it sits
 *     inside parentheses in the middle of someone else's sentence.
 *   - Say what the thing is or does for the reader's business, not how
 *     it works inside. No jargon to explain the jargon.
 *   - The key is the term as marked, lowercased, with spacing collapsed.
 *     Plural and singular are separate keys when both are marked.
 *
 * Mark a term once per page, at its first use in body copy that goes
 * through rich() (never a headline, a label or meta). If that first use
 * would split a phrase ("the llms.txt (…) file"), mark the whole phrase
 * as its own key, or mark the next use instead. Leave it unmarked where
 * the sentence already says what it is: the explanation would show twice.
 *
 * scripts/check-markers.mjs fails the build when a {k} term anywhere in
 * the content has no entry here, or an entry breaks the rules above.
 * Definitions are marked data-chrome, so the markdown twins, Ask's index
 * and check-voice never read them twice; check-claims and check-usage
 * still read every word.
 */

/** Plain definitions, keyed by the {k} term as marked, lowercased. */
export const glossary: Record<string, string> = {
  '429': 'the standard reply that means too many requests',
  'ai crawlers': 'programs AI companies send out to read web pages',
  'analytics script': 'code that tracks what visitors do on a site',
  apis: 'ways for one program to use another',
  'blind control': 'the same test run without the idea',
  cache: 'a stored copy from an earlier request',
  'canonical address': 'the one address a page names as its main copy',
  'canonical tags': 'tags naming which address is a page’s main copy',
  'canonical url': 'the one address a page names as its main copy',
  cdn: 'a network of servers that hands out a site’s files',
  commit: 'a saved, dated change in the code’s history',
  'confidence floor': 'the lowest match score an answer needs before it’s shown',
  'content policy': 'a list of rules for what a page may load and run',
  'content security policy': 'a list of rules for what a page may load and run',
  curl: 'a tool that fetches a web address from the command line',
  deploy: 'each time the site is published',
  'deployment path': 'the steps that take it from code to running',
  'design spec': 'a written plan of what to build and why',
  'design tokens': 'the named colors, sizes and fonts a design is built from',
  'deterministic core': 'plain rules that give the same answer every time',
  'document extraction': 'pulling the facts out of documents into fields',
  endpoint: 'the web address a program sends its requests to',
  'evaluation set': 'examples with known right answers, used to check the work',
  'evaluation sets': 'examples with known right answers, used to check the work',
  'first paint': 'the moment a page first shows anything',
  'intake step': 'the point where new work or paperwork comes in',
  'ip address': 'the number that identifies a device on the internet',
  'json-ld': 'a standard format for writing facts about a page for machines',
  'json-ld graph': 'one block of linked facts about the page, written for machines',
  'largest-contentful-paint entry': 'the browser’s record of when the main content appeared',
  'latency work': 'making it respond faster',
  'layout shift': 'content jumping around while the page loads',
  'layout-shift entries': 'the browser’s records of content jumping as the page loads',
  'llms.txt': 'a plain-text file written for AI tools to read',
  'marching squares': 'a standard way to draw contour lines from a grid',
  markdown: 'plain text with simple marks for headings and links',
  'market data': 'live prices and trades from the exchanges',
  'mcp client': 'the app that connects an AI assistant to a server',
  'mcp server': 'a service AI assistants can connect to and ask questions',
  monitoring: 'software that keeps watch on running systems',
  noindex: 'a tag asking search engines to leave a page out',
  normalized: 'reshaped to one consistent format',
  'one-way hashes': 'scrambled fingerprints that can’t be turned back into the original',
  'operating statement': 'a property’s income and expenses, line by line',
  'order routing': 'sending each order to the right exchange or broker',
  'orphan pages': 'pages no other page links to',
  'parcel records': 'public records that identify each piece of land',
  'performance apis': 'the browser’s built-in tools for timing a page',
  'permit filings': 'records of building permits on the property',
  'point-in-time': 'as it was known on each date, without later fixes',
  'random seed': 'the starting number a run’s random choices come from',
  'reassessment on sale': 'the tax value resetting when the property sells',
  repository: 'the code and its full history, kept in one place',
  retrieval: 'looking up the right passages before answering',
  'review gate': 'a step where a person signs off before anything goes out',
  'risk checks': 'automatic limits that can stop a bad order',
  'robots file': 'rules telling crawlers what they may read',
  'robots.txt': 'the file that tells crawlers what they may read',
  'row-level security': 'a database rule that decides who can see each row',
  runbook: 'written steps for running the system and fixing it',
  schema: 'a fixed list of fields and what each one must hold',
  'serverless and edge functions': 'small programs a host runs only when they’re called',
  'single-page app': 'a site whose pages are put together in the browser by scripts',
  sitemap: 'a file listing a site’s pages for search engines',
  'structured data': 'code that tells search engines what a page is about',
  'survivorship bias': 'the skew from studying only the companies that survived',
  'synthetic prices': 'invented price data built for testing',
  'unstructured records': 'documents with no set format, like emails and scans',
  vacancy: 'the share of units sitting empty',
};

/** The switch's own words: the nav control, the phone menu, the ⌘K
 *  palette and what a screen reader hears after a switch. */
export const reading = {
  /** The control's name, and its visible label in the phone menu. */
  label: 'Wording',
  plain: 'Plain',
  technical: 'Technical',
  /** The desktop control's tooltip. */
  hint: 'Plain explains each technical term where it appears. Technical shows the terms on their own.',
  /** Said politely after a switch. */
  say: {
    plain: 'Plain wording. Technical terms come with a short explanation.',
    technical: 'Technical wording. Terms appear without explanations.',
    /** Added after either line on a page that has nothing to switch. It
     *  shows no switch, so only the ⌘K palette can switch there. */
    same: 'This page reads the same either way.',
  },
  palette: {
    toPlain: 'Switch to plain wording',
    toTechnical: 'Switch to technical wording',
  },
};
