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
 * scripts/check-markers.mjs fails the build when a {k} term anywhere in
 * the content has no entry here, or an entry breaks the rules above.
 * Definitions are marked data-chrome, so the markdown twins, Ask's index
 * and check-voice never read them twice; check-claims and check-usage
 * still read every word.
 */

/** Plain definitions, keyed by the {k} term as marked, lowercased. */
export const glossary: Record<string, string> = {
  'blind control': 'the same test run without the idea',
  cache: 'a stored copy from an earlier request',
  'deployment path': 'the steps that take it from code to running',
  'deterministic core': 'plain rules that give the same answer every time',
  'document extraction': 'pulling the facts out of documents into fields',
  'evaluation set': 'examples with known right answers, used to check the work',
  'evaluation sets': 'examples with known right answers, used to check the work',
  'intake step': 'the point where new work or paperwork comes in',
  'latency work': 'making it respond faster',
  'llms.txt': 'a plain-text file written for AI tools to read',
  'marching squares': 'a standard way to draw contour lines from a grid',
  'market data': 'live prices and trades from the exchanges',
  monitoring: 'software that keeps watch on running systems',
  normalized: 'reshaped to one consistent format',
  'operating statement': 'a property’s income and expenses, line by line',
  'order routing': 'sending each order to the right exchange or broker',
  'parcel records': 'public records that identify each piece of land',
  'permit filings': 'records of building permits on the property',
  'point-in-time': 'as it was known on each date, without later fixes',
  'reassessment on sale': 'the tax value resetting when the property sells',
  retrieval: 'looking up the right passages before answering',
  'review gate': 'a step where a person signs off before anything goes out',
  'risk checks': 'automatic limits that can stop a bad order',
  'robots.txt': 'the file that tells crawlers what they may read',
  'row-level security': 'a database rule that decides who can see each row',
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
  },
  palette: {
    toPlain: 'Switch to plain wording',
    toTechnical: 'Switch to technical wording',
  },
};
