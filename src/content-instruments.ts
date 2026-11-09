/**
 * Instrument copy that src/content.ts doesn't carry: the labels, readouts
 * and stage notes inside the demos. One export per instrument, each owned
 * by the workstream that builds it. Same house rules as every content
 * module: US English, contractions, short plain sentences, ’ apostrophes.
 *
 * None of this ships as JavaScript. Renderers write what a module needs
 * into the page (a JSON block or attributes), so the copy stays in the HTML.
 */

/** Ask This Site (src/sections/instruments/ask.ts, src/motion/ask.ts,
 *  scripts/gen-machine.mjs). The question copy, chips, abstain sentence and
 *  announcements live in content.ts `ask`. */
export const askUi = {
  title: 'ask · retrieval console',
  /** The index status readout in the panel head. */
  index: {
    idle: 'index loads on first use',
    loading: 'loading index',
    /** Measured in the browser: the postings build, timed. */
    ready: '{n} passages · indexed in {ms} ms',
    failed: 'index didn’t load',
    /** The file's N and avgdl don't match what this code computes. */
    mismatch: 'index and code disagree',
  },
  /** Stage readouts, right of each stage name. */
  read: {
    query: '{w} words · {t} terms',
    retrieve: '{m} of {n} match',
  },
  tryLabel: 'Try',
  /** Under each stage name before the first question. */
  idle: {
    query: 'Your words, lowercased and cut to stems. Common words drop out.',
    retrieve: 'Every passage on this site, scored with BM25.',
    gate: 'Nothing under the floor gets quoted.',
    answer: 'Up to three passages from different sections, each with a link.',
  },
  /** Column heads in RETRIEVE. */
  cols: { passage: 'passage', conf: 'conf' },
  stop: 'stop',
  unseen: 'unseen',
  df: 'df {n}',
  /** A compound question's parts. */
  part: 'Q{n}',
  floorAt: 'floor {v}',
  above: '{n} above the floor',
  none: 'none above the floor',
  sections: '{n} cited from {s} sections',
  sectionsOne: '1 cited',
  /** ABSTAIN detail, under the content.ts abstain sentence. */
  abstainWhy: 'Best match {best}, floor {floor}.',
  abstainLabel: 'Abstained',
  answerLabel: 'Answered',
  /** The prerendered answers for JavaScript off. */
  preLabel: 'Q{n} · answered at build',
  preNote: 'With JavaScript off, these were answered when the site was built, by the same code your browser runs.',
  /** "Break the input": what each group has to do, checked at build. */
  expect: {
    answer: 'must answer',
    abstain: 'must abstain',
    'answer-2': 'must cite two sections',
  },
  /** Shown beside a group once it's run at the current floor. */
  verdict: { build: 'checked at build', met: 'as expected', missed: 'not at this floor' },
  floorScale: { low: 'answers more', high: 'answers less' },
};

/* ── WS4: the build sequence, the run replay and the diagrams ──────────
   Everything below is read by src/sections/instruments/{pipeline,replay,
   leaders}.ts. Labels, trace names and readouts render inside data-chrome;
   the `facts` lists and the replay's `wrong` outcomes are prose and count
   toward check-voice like any other copy. No figures anywhere: the replay
   names where each value comes from and masks the value itself. */

/** The artifacts beside each step of home #process. The step copy, map
 *  labels, eval heads, diff lines and repo tree live in content.ts
 *  `pipeline`. */
export const pipelineUi = {
  title: 'build sequence',
  /** One per step: the artifact's file name in its title bar. */
  files: ['process.map', 'process.map', 'evals/set.jsonl', 'src/extract.ts', 'review.log', 'your-repo/'],
  /** Shown under the map in step 01, beside the friction chips. */
  mapKey: 'friction',
  /** The got column before the build exists. */
  notRun: 'not run',
  /** The masked evaluation rows, and the site's own checks below them. */
  evalLabel: 'from real cases',
  siteLabel: 'for a site',
  /** The diff hunk header. */
  hunk: '@@ extract()',
  /** The review queue row. */
  reviewItem: 'invoice ••••',
  termTitle: 'build-report.json',
  termCmd: '$ npm run build',
  /** {commit} and {date} come from /build-report.json, read live. */
  termStamp: 'commit {commit} · {date}',
  termFailed: 'The report didn’t load, so these are the guard names this build runs.',
};

/** Run Replay. The order is verified against the engine's source; the
 *  names are simplified. Kinds: g guard, d data, p person, c compute, m
 *  model. `f` lists each field with the key of its source in `sources`. */
export const replayUi = {
  title: 'run replay',
  sub: 'underwriting engine',
  chip: 'stage order and branches from the engine’s source · names simplified · values withheld · timings not to scale',
  withheld: 'Values withheld from this page',
  controls: {
    label: 'Replay controls',
    play: 'Play',
    pause: 'Pause',
    step: 'Step',
    restart: 'Restart',
    scrub: 'Position in the run',
    at: 'step {n} of {total}, {name}',
    start: 'step 0 of {total}, not started',
  },
  inputsLegend: 'Try a different input',
  spansLegend: 'Inspect a stage',
  /** Column heads over the trace. */
  cols: { span: 'stage' },
  timeline: 'timeline · not to scale',
  inspector: {
    /** The root span's place in the run. */
    whole: 'every stage',
    stage: 'stage {n} of {total}',
    fields: 'fields',
    sources: 'where each value comes from',
    none: 'No figures from this stage.',
    derived: 'Built from the fields above. Withheld here like the rest.',
    blank: 'blank',
  },
  /** A status word always travels with its glyph. */
  states: {
    done: 'done',
    gate: 'confirmed by a person',
    stop: 'stopped',
    held: 'held for a person',
    flag: 'labeled fallback',
    skip: 'not run',
    idle: 'waiting',
    run: 'running',
  },
  kinds: { p: 'person', m: 'model' },
  sources: {
    county: 'county record',
    listing: 'live listing',
    rent: 'rent estimate',
    rate: 'published rate table',
    assume: 'your assumption',
    national: 'national average (labeled)',
    unaudited: 'unaudited',
  },
  spans: [
    { id: 'run', name: 'run', d: 0, k: 'c', n: 'one listing URL, start to finish' },
    { id: 'check_access', name: 'check_access', d: 1, k: 'g', n: 'before anything is read' },
    { id: 'rate_limit', name: 'rate_limit', d: 1, k: 'g', n: 'before any paid call' },
    { id: 'parse_listing_url', name: 'parse_listing_url', d: 1, k: 'g', n: 'refuses anything that isn’t one property' },
    { id: 'resolve_zip_city', name: 'resolve_zip_city', d: 1, k: 'd', n: 'matches the ZIP code to its city' },
    { id: 'fetch', name: 'fetch', d: 1, k: 'd', n: 'three requests, sent together' },
    {
      id: 'listing',
      name: 'listing',
      d: 2,
      k: 'd',
      n: 'what the listing says',
      f: [['list price', 'listing'], ['living area', 'listing']],
    },
    {
      id: 'parcel',
      name: 'parcel record',
      d: 2,
      k: 'd',
      n: 'what the county has on file',
      f: [['assessed value', 'county'], ['sale history', 'county']],
    },
    {
      id: 'rent',
      name: 'rent estimate',
      d: 2,
      k: 'd',
      n: 'what similar units rent for',
      f: [['market rent', 'rent']],
    },
    { id: 'energy_rates', name: 'energy_rates', d: 1, k: 'd', n: 'published state rates', f: [['electricity rate', 'rate']] },
    {
      id: 'confirm_price',
      name: 'confirm_price',
      d: 1,
      k: 'p',
      n: 'the analysis never runs on an unconfirmed price',
      f: [['purchase price', 'assume']],
    },
    {
      id: 'costs',
      name: 'costs',
      d: 1,
      k: 'c',
      n: 'every line carries a provenance',
      f: [['current tax', 'county'], ['electricity', 'rate'], ['water', 'rate'], ['maintenance', 'assume']],
    },
    {
      id: 'reassessment',
      name: 'reassessment',
      d: 1,
      k: 'c',
      n: 'the tax bill after a sale',
      f: [['assessment after sale', 'county'], ['tax rate', 'rate']],
    },
    {
      id: 'hazard',
      name: 'hazard',
      d: 1,
      k: 'c',
      n: 'expected annual loss, for the insurance line',
      f: [['expected annual loss', 'unaudited']],
    },
    {
      id: 'loan',
      name: 'loan',
      d: 1,
      k: 'c',
      n: 'what a lender would lend, and which cap binds',
      f: [['rate and term', 'assume']],
    },
    { id: 'underwrite', name: 'underwrite', d: 1, k: 'c', n: 'the scenario engine', x: 'derived' },
    { id: 'stress', name: 'stress', d: 1, k: 'c', n: 'what has to go wrong first', x: 'derived' },
    { id: 'narrative', name: 'narrative', d: 1, k: 'm', n: 'prose only, never parsed back into a field' },
  ],
  /** "Break the input". `stop` ends the run there with state `st`; `flag`
   *  marks a span that ran on a labeled fallback, re-sourcing one field. */
  inputs: [
    { id: 'clean', label: 'A listing URL', out: 'Run complete. Every figure names its source.' },
    {
      id: 'search',
      label: 'A search-results URL',
      stop: 'parse_listing_url',
      st: 'stop',
      out: 'Not one property. Nothing was fetched and nothing was spent.',
    },
    {
      id: 'unknown',
      label: 'A listing the provider doesn’t know',
      stop: 'listing',
      st: 'held',
      out: 'The provider had nothing on this listing. The fields are left blank for a person to fill in, and no figure is guessed.',
    },
    {
      id: 'skip',
      label: 'Skip the price check',
      stop: 'confirm_price',
      st: 'held',
      out: 'Held at the price check. The analysis doesn’t run on a price nobody confirmed.',
    },
    {
      id: 'water',
      label: 'A city with no water schedule on file',
      flag: 'costs',
      field: 'water',
      src: 'national',
      out: 'No local water schedule on file. The line uses the national average and says so.',
    },
  ],
  /** JavaScript off: the clean run as nested details, then the outcomes. */
  staticTitle: 'The clean run, stage by stage',
  wrongTitle: 'When the input is wrong',
};

/** The leader-line diagrams. `facts` is the prose list beside each one,
 *  saying in sentences what the drawing shows. */
export const leadersUi = {
  parity: {
    title: 'one engine · two platforms',
    web: 'website',
    phone: 'phone',
    online: 'online',
    offline: 'offline',
    chip: 'byte-identical',
    golden: 'golden scenarios',
    recompute: 'recomputed on the device',
    modules: ['underwrite', 'costs', 'loan', 'stress', 'analysis-state', 'reassessment', 'tax-rates', 'hazard', 'water-rates'],
    facts: [
      'The website and the app run the same engine files.',
      'Each module is copied byte for byte. None of them is ported.',
      'Golden scenarios run against both copies, so any drift fails a test.',
      'The phone needs no network to compute. Take it offline and it still recomputes.',
    ],
  },
  seal: {
    title: 'build seal · edge check',
    edge: 'edge function',
    edgeSub: 'before any cache',
    lanes: [
      { from: ['a signed', 'session'], to: ['the members’', 'page'] },
      { from: ['anything it', 'can’t verify'], to: ['Refused.', 'Nothing served.'] },
      { from: ['a deploy with', 'the lock missing'], to: ['the members’ pages', 'don’t exist in it'] },
    ],
    build: 'public build',
    sealed: 'members’ pages sealed out',
    facts: [
      'Members’ pages are sealed out of the public build, so they never reach the public files.',
      'Every request for one meets an edge function first, before any cache.',
      'A request with a valid signed session gets the page.',
      'Anything the function can’t verify gets an error, and nothing is served.',
      'If the lock were ever missing from a deploy, the members’ pages wouldn’t exist in it.',
    ],
  },
  pit: {
    title: 'point-in-time membership',
    toggle: 'Survivors only',
    hides: 'What survivorship bias hides',
    dates: 'trading dates',
    slots: 'index slots',
    member: 'member on that date',
    left: 'left the index later',
    facts: [
      'Each column is a trading date and each row is a place in the index.',
      'Companies join the index and leave it over time.',
      'The point-in-time record keeps every company for the dates it was a member, the ones that left included.',
      'A survivors-only view keeps today’s members and drops the rest. The gap it leaves is the bias.',
    ],
  },
  clocks: {
    title: 'two clocks · one path',
    legend: 'Clock source',
    replay: { label: 'Replay', sub: 'a recording, in bursts' },
    live: { label: 'Live', sub: 'the market, a steady stream' },
    path: ['feed', 'normalize', 'book', 'rules', 'orders'],
    same: 'one path · the same code',
    facts: [
      'Market data takes one path from the feed through normalize, the book and the rules to orders.',
      'In a backtest the clock is a recording, and data arrives in bursts.',
      'In live trading the clock is the market, and data arrives as a steady stream.',
      'Only the clock source changes. The path and its code stay the same.',
    ],
  },
};

/** The two-readers diagram on /services/seo/#readers. */
export const readersUi = {
  title: 'one document · two readers',
  doc: 'index.html',
  docSub: 'one HTML document',
  lanes: [
    { name: 'search engine', steps: ['crawl', 'rank', 'link'], out: 'shows a link' },
    { name: 'answer engine', steps: ['read', 'extract', 'quote'], out: 'may credit you' },
  ],
  facts: [
    'Both readers start from the same HTML document.',
    'A search engine crawls it, ranks it and shows a link.',
    'An answer engine reads it, lifts out claims and decides what to quote.',
    'Both trust a page more when its markup and its copy say the same thing.',
  ],
};
