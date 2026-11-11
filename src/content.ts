/**
 * ADJL Technology: home page and site-wide copy.
 *
 * EVERY HUMAN-READABLE SENTENCE ON THIS SITE LIVES IN A content*.ts FILE.
 * Edit words here; markup, styling and motion live elsewhere and read from
 * these objects. If you find yourself editing a sentence inside a section
 * renderer or an instrument, the renderer is wrong.
 *
 * This file holds the home page and everything every page shares: the nav,
 * the status bar, the provenance chips, the fixed copy of the instruments
 * (Machine View, Ask This Site, the build pipeline), the shared contact
 * block and the footer. Each other page has its own content module, and
 * the shapes they share are in content-types.ts.
 *
 * House conventions, carried from ADJL Capital:
 *
 *   - Headlines are ARRAYS. Each entry renders as its own line.
 *   - {em}…{/em} marks exactly ONE emphasized phrase per headline, set in
 *     copper at a lighter weight. Put it on the words that carry the meaning.
 *   - {k}…{/k} marks a technical term in BODY copy only. Never in a headline.
 *   - Apostrophes are ’ (U+2019). US English. The firm is "ADJL Technology",
 *     singular.
 *   - Titles separate with " | ", never an em-dash, and nothing in any meta
 *     field carries an em-dash. ogTitle is the h1 lines joined with a space;
 *     ogDescription is the lead's first two sentences.
 *   - Write plainly and contracted. check-voice measures em-dashes,
 *     "rather than", uncontracted forms, "That's" closers, soft words and
 *     sentence length across the whole built site, so one padded page
 *     counts against every other.
 *
 * And one rule that isn't stylistic:
 *
 *   NOTHING ON THIS SITE MAY CLAIM SOMETHING THAT HASN'T HAPPENED. No client
 *   names, no testimonials, no performance figures, and no counts of
 *   clients, projects, systems or builds, including headcount. A number on
 *   the page is either measured (in the visitor's browser, or from the
 *   built HTML) and labeled so, or it isn't there. A drawing that explains
 *   something is labeled Illustration and never dressed up as data. The firm
 *   is new; a site that pretends otherwise gets found out in the first
 *   conversation, and the restraint is a better pitch than the invention
 *   would have been. scripts/check-claims.mjs fails the build over the
 *   specific words and number patterns that tend to smuggle a claim in.
 */

import type { Faq, Link, Meta } from './content-types';

/** The four practices. The same keys tag the systems cards, drive the
 *  /work/ filter and key the services hub's spec rails. */
export type PracticeKey = 'ai' | 'seo' | 'software' | 'systems';

export const meta: Meta = {
  title: 'AI Engineering, SEO and Software Studio | ADJL Technology',
  description:
    'ADJL Technology builds AI agents and automation, websites and native apps, and the technical SEO that gets them found by search and AI answer engines.',
  ogTitle: 'AI, websites and apps, built for what’s next.',
  ogDescription:
    'ADJL Technology builds AI that handles the busywork, websites people can find, and apps for iPhone and Android. Everything on the page was built by us.',
};

/** The address on every page. One string, one place to change it. */
export const CONTACT = 'daniel@adjlcapital.com';

/** The tagline. It's ADJL Capital's line, and the two firms share it: it
 *  sits under the name at the end of the opening sequence and under the
 *  wordmark in every page's footer, and scripts/seo.mjs gives the same
 *  words to the Organization's `slogan` (check-seo holds the two together). */
export const TAGLINE = 'Today’s investment, tomorrow’s legacy.';

export const nav = {
  wordmark: { lead: 'ADJL', tail: 'Technology' },
  links: [
    { label: 'AI Engineering', href: '/services/ai-engineering/' },
    { label: 'SEO & AI Search', href: '/services/seo/' },
    { label: 'Websites & Apps', href: '/services/software/' },
    { label: 'Work', href: '/work/' },
    { label: 'Approach', href: '/approach/' },
  ],
  cta: { label: 'Start a project', href: '/start/' },
  jump: 'Jump to',
  menu: { open: 'Open menu', close: 'Close menu' },
};

/** The provenance chips. Every figure on the site carries one, and the
 *  definition is the chip's title. LIVE is set by JS only, after the
 *  measuring module has actually produced its value. */
export const prov = {
  live: { label: 'Live', def: 'Measured in your browser, now.' },
  build: { label: 'Build', def: 'Measured from this page’s HTML when the site was built.' },
  recorded: { label: 'Recorded', def: 'A replay of a real run.' },
  illustration: { label: 'Illustration', def: 'Drawn to explain. Not a measurement.' },
};

/** The status bar on every page, and the labels the telemetry panels share. */
export const status = {
  label: 'Page status and telemetry',
  views: { legend: 'View this page as', render: 'Render', source: 'Source', machine: 'Machine' },
  metrics: {
    html: 'html',
    css: 'css',
    js: 'js',
    thirdparty: '3rd-party',
    lcp: 'LCP',
    cls: 'CLS',
    inp: 'slowest input',
    tier: 'tier',
    /* The large panels (/work/this-site/#telemetry, /services/software/#telemetry)
       also show these. */
    ttfb: 'time to first byte',
    transfer: 'transfer',
    requests: 'requests',
    dom: 'DOM elements',
    cookies: 'cookies',
  },
  needsJs: 'needs JS',
  needsJsTitle: 'Measured when JavaScript runs.',
  notReported: 'n/r',
  notReportedTitle: 'Your browser doesn’t report this. We won’t guess.',
  cached: 'cached',
  ratings: { good: 'good', ok: 'ok', poor: 'poor' },
  how: { label: 'How we measure', href: '/work/this-site/#telemetry' },
  pause: 'Pause motion',
  announce: {
    render: 'Render view.',
    source: 'Source view. Each section shows the code that produced it.',
    machine: 'Machine view. Headings, links and structured data are labeled.',
  },
};

export const hero = {
  eyebrow: 'AI · Websites · Apps · SEO',
  /* The no-break space keeps "what’s next." together, so a phone never
     leaves "next." alone on a fourth line. */
  headline: ['AI, websites and apps,', 'built for {em}what’s next.{/em}'],
  body: 'ADJL Technology builds AI that handles the busywork, websites people can find, and apps for iPhone and Android. Everything on this page was built by us. Scroll down and try it.',
  primary: { label: 'See what we’ve built', href: '#systems' },
  secondary: { label: 'See what AI sees on your site', href: '/scan/' },
  figure: {
    captionBuild: 'This page’s own structure, drawn at build from its HTML.',
    /* JS fills {ms} after the live graph draws. Never prerendered. */
    captionLive: 'This page’s own structure, parsed by your browser in {ms}.',
    layers:
      'People read the top layer, crawlers follow the middle one and machines parse the bottom one.',
    planes: { read: 'What people read', link: 'What crawlers follow', machine: 'What machines parse' },
    counts: '{h} headings · {l} links · {e} schema nodes',
    openMachine: 'See this page as a crawler does',
  },
};

export type Practice = {
  glyph: PracticeKey;
  title: string;
  sub: string;
  body: string;
  points: string[];
  link: Link;
};

export const practices: { eyebrow: string; headline: string[]; intro: string; items: Practice[] } = {
  eyebrow: 'What we build',
  headline: ['Different jobs.', 'The same {em}habit.{/em}'],
  intro:
    'AI, search, software and the systems we run ourselves look like different jobs. They share a habit. We decide what right looks like before we build, and we check it after we ship.',
  items: [
    {
      glyph: 'ai',
      title: 'AI Engineering',
      sub: 'Agents, retrieval, extraction, automation',
      body: 'Agents that call real tools. Retrieval that cites its sources. Extraction from documents nobody structured. Each build ships with an evaluation set, and a person signs off wherever a mistake costs money.',
      points: [
        '{k}Evaluation sets{/k} written before the build',
        'A {k}review gate{/k} where being wrong is expensive',
        'Code, prompts and evals handed over',
      ],
      link: { label: 'How we build AI systems', href: '/services/ai-engineering/' },
    },
    {
      glyph: 'seo',
      title: 'SEO & AI Search',
      sub: 'Technical SEO for two kinds of reader',
      body: 'Search has two readers now. One ranks pages and one quotes them. Both read your markup first, so we fix that layer. Prerendered HTML, structured data about real entities, clean crawl paths and fast pages.',
      points: [
        '{k}Structured data{/k} that matches the copy',
        'Pages that read in full without JavaScript',
        'Machine-readable summaries like {k}llms.txt{/k}',
      ],
      link: { label: 'How we do technical SEO', href: '/services/seo/' },
    },
    {
      glyph: 'software',
      title: 'Websites & Apps',
      sub: 'Sites, web apps, native apps, backends',
      body: 'Marketing sites like this one. Web apps and the APIs behind them. Native iOS and Android apps from one React Native codebase. The data pipelines and scheduled jobs underneath.',
      points: [
        'Fast before anyone tunes it',
        'Strict security headers by default',
        'One codebase for iOS and Android',
      ],
      link: { label: 'Websites & Apps', href: '/services/software/' },
    },
    {
      glyph: 'systems',
      title: 'Systems we run',
      sub: 'Property and market infrastructure',
      body: 'We built the underwriting engine behind ADJL Capital’s property decisions and the market-data plumbing under its research. They’re still running, and new methods get tested on them first.',
      points: [
        'A listing URL in, a sourced file out',
        '{k}Point-in-time{/k} market history',
        'Backtests on the production code path',
      ],
      link: { label: 'See the systems', href: '/work/' },
    },
  ],
};

/** Machine View: the SEO demo on home and /services/seo/. The instrument
 *  renders these labels; the values are measured. */
export const machineView = {
  eyebrow: 'SEO, demonstrated',
  headline: ['What a machine', 'reads {em}on this page.{/em}'],
  body: 'Nobody outside a search engine can tell you what it’ll do with a page. We can show you exactly what it’s handed. When scripts run, the panel below fetches this page again and reads the raw HTML with no script run. Switch readers to see what an answer engine gets.',
  readers: {
    legend: 'Read this page as',
    people: 'People',
    crawlers: 'Crawlers',
    answer: 'Answer engines',
  },
  rows: {
    status: 'status',
    ttfb: 'time to first byte',
    title: 'title',
    description: 'description',
    canonical: 'canonical',
    robots: 'robots',
    h1: 'h1 count',
    outline: 'outline',
    words: 'Words readable without JavaScript',
    links: 'internal links',
    graph: 'structured data',
    surfaces: 'machine-readable files',
    twin: 'markdown copy',
    tokens: 'tokens (estimate: characters ÷ 4)',
    llms: 'llms.txt entry',
    budget: 'of {n}',
  },
  changed: 'Changed since build',
  announce: 'Crawler readout updated from a live fetch.',
  foot: 'Nobody can promise you a place in an AI answer. We can make your pages easy to read, quote and credit, and then measure what changes.',
  open: 'See the whole page as a crawler does',
  link: { label: 'How we do technical SEO', href: '/services/seo/' },
};

/** Ask This Site: retrieval over this site's own text, run in the browser.
 *  gen-machine.mjs precomputes every chip's answer in Node and fails the
 *  build if any `expect` below is broken. */
export type AskExpect = 'answer' | 'abstain' | 'answer-2';

export const ask = {
  eyebrow: 'Retrieval, demonstrated',
  headline: ['Ask this site.', 'It {em}cites{/em} or it stays quiet.'],
  body: 'This is the pattern under most of our AI work, small enough to run in your browser. Your question is matched against every paragraph on this site. The best passages come back quoted, with links. If nothing scores well enough, it says so and points you to a person.',
  label: 'Ask a question about ADJL Technology',
  placeholder: 'Who owns the code when you’re done?',
  button: 'Ask',
  /** Home chips. Every one must answer. */
  chips: [
    'Who owns the code?',
    'Do you build mobile apps?',
    'What happens to our data?',
    'What’s llms.txt?',
  ],
  /** "Break the input" on /services/ai-engineering/ (the full variant).
   *  expect: 'answer' cites ≥1 passage; 'abstain' cites none; 'answer-2'
   *  cites ≥2 passages from different sections. */
  groups: {
    legend: 'Break the input',
    items: [
      { label: 'A fair question', q: 'Who owns the code when you’re done?', expect: 'answer' },
      { label: 'Outside what’s here', q: 'Do you sell a chatbot subscription?', expect: 'abstain' },
      { label: 'Misspelled', q: 'Who ownes the code?', expect: 'answer' },
      {
        label: 'Two questions at once',
        q: 'Do you build iOS apps, and who owns the code?',
        expect: 'answer-2',
      },
    ] satisfies { label: string; q: string; expect: AskExpect }[],
  },
  stages: ['Query', 'Retrieve', 'Gate', 'Answer'],
  floor: {
    label: 'Confidence floor',
    hint: 'Raise it and it answers less often. It’s also wrong less often.',
    /* aria-valuetext for the slider. {v} is the floor to 2 decimals and
       {pct} the same value as a whole percentage. */
    valuetext: '{v}. Answers when the best passage covers at least {pct}% of the question.',
  },
  abstain: 'Nothing on this site answers that well enough. Ask Daniel at daniel@adjlcapital.com.',
  announce: {
    cited: '{n} passages cited.',
    one: '1 passage cited.',
    none: 'No answer. Below the confidence floor.',
  },
  foot: 'Retrieval only. No language model writes these answers, and your question never leaves this page.',
  link: { label: 'How we build AI systems', href: '/services/ai-engineering/' },
};

export type PipelineStep = { num: string; tag: string; title: string; body: string };

/** The scroll-driven build sequence on home #process. /approach/#steps
 *  reuses the same steps as static cards. */
export const pipeline: {
  eyebrow: string;
  headline: string[];
  intro: string;
  skip: string;
  steps: PipelineStep[];
  guardFallback: string;
  artifacts: {
    map: string[];
    pickNote: string;
    evalHead: string[];
    siteRows: string[];
    diff: string[];
    review: string[];
    tree: string[];
  };
  chip: string;
  link: Link;
} = {
  eyebrow: 'How we build',
  headline: ['Every build runs', 'the same {em}six steps.{/em}'],
  intro:
    'It barely matters whether the thing is an agent, a website or an app. We define right before we write code. Then we build the smallest version we can check, and hand it over running.',
  skip: 'Skip the build sequence',
  steps: [
    {
      num: '01',
      tag: 'trace',
      title: 'Trace the work',
      body: 'We follow the real process with the people who do it. Every workflow has a step nobody wrote down.',
    },
    {
      num: '02',
      tag: 'pick',
      title: 'Pick one step',
      body: 'Expensive, repetitive, and survivable when it’s wrong now and then. Picking a glamorous one is how projects stall.',
    },
    {
      num: '03',
      tag: 'define',
      title: 'Write down what right looks like',
      body: 'For an AI system it’s an evaluation set built from real cases. For a site it’s a speed budget and a crawl test. Either way, it exists before the build does.',
    },
    {
      num: '04',
      tag: 'build',
      title: 'Build it narrow',
      body: 'One step, one system, one output you can measure. It runs on your data, as code your team can read.',
    },
    {
      num: '05',
      tag: 'guard',
      title: 'Put guards where mistakes cost',
      body: 'A person reviews anything that’s expensive to get wrong. The build fails on anything a machine can check. This site won’t deploy if its copy uses a hype word, counts clients or puts a number on a result nobody measured.',
    },
    {
      num: '06',
      tag: 'handover',
      title: 'Hand it over running',
      body: 'You get the code, the prompts, the evaluation set and the docs. Your team can change it without calling us.',
    },
  ],
  guardFallback: 'If you’re reading this, every check passed.',
  /* The artifacts beside each step. All rendered data-chrome. No hours, no
     counts, and the evaluation values are masked. */
  artifacts: {
    map: ['intake', 'by hand', 'waits on email', 'copy and paste', 'review', 'filed', 'reported'],
    pickNote: 'expensive · repetitive · survivable when wrong',
    evalHead: ['input', 'expected', 'got'],
    siteRows: [
      'LCP ≤ 2.5 s, Google’s “good” threshold',
      'crawl test · every page reachable from home',
    ],
    diff: [
      '+ const fields = await extract(doc, InvoiceSchema)',
      "+ if (!fields.total) return review(doc, 'no total found')",
    ],
    review: ['needs review', 'approved by reviewer'],
    tree: ['/code', '/prompts', '/evals', '/docs', '/runbook', 'owner · your org'],
  },
  chip: 'Illustration · step 5 recorded from this deploy’s build',
  link: { label: 'The full method, with pricing', href: '/approach/' },
};

export type SystemCard = {
  kicker: string;
  title: string;
  status: string;
  tags: PracticeKey[];
  body: string;
  /** The same facts as `title` and `body` in a business owner's words.
   *  The home page prints these; /work/ and the case pages keep the
   *  engineer's version. Nothing here may say more than `body` does. */
  plainTitle?: string;
  plain?: string;
  /** 'practice': a service, not a system we built. /work/ lists it; the
   *  home page's "things we built" grid leaves it out and links to it. */
  kind?: 'practice';
  link: Link;
};

/** The systems in production. Home #systems shows them (in plain words,
 *  and without the practice card, which isn't a running system), and
 *  /work/ uses the same items for its cards, so the two can't describe a
 *  system two different ways. */
export const systems: {
  eyebrow: string;
  headline: string[];
  intro: string;
  items: SystemCard[];
  more: Link;
} = {
  /* Not "running now": one of these (Loep) is deployed behind a sign-in
     gate, in private preview, and the heading has to be true of every card. */
  eyebrow: 'What we’ve built',
  headline: ['Things we built,', 'and {em}how they work.{/em}'],
  intro:
    'Each card opens a page that walks one system step by step. We show how each one works. We don’t publish what it returned, and since the firm is new, you won’t find client logos here either.',
  items: [
    {
      kicker: 'Real estate',
      title: 'A listing URL in, a sourced file out.',
      status: 'Running · ADJL Capital',
      tags: ['ai', 'systems'],
      body: 'Resolves the parcel, pulls live rents and comparables, reads years of public record and models tax through reassessment. Every figure names its source. Anything unaudited says so.',
      plainTitle: 'A listing link in, a sourced file out.',
      plain: 'Paste a property listing link. It finds the property, pulls current rents and similar properties, reads years of public records and estimates the property tax after a sale. Every figure names its source.',
      link: { label: 'How the engine works', href: '/work/real-estate-intelligence/' },
    },
    {
      /* Deployed behind a sign-in gate, so "private preview" and no link
         out; see the note at the top of content-case-loep.ts. */
      kicker: 'Loep',
      title: 'The records behind a price, on one sheet.',
      status: 'Private preview',
      tags: ['software', 'ai'],
      body: 'A property scanner, company reports read from SEC filings and an analyst for a business for sale. The engines are pure modules that run in the browser. A language model writes one optional note, and no figure comes from it.',
      plain: 'A research tool for people who aren’t professionals. Give it an address, a stock ticker or a business for sale. It shows the records behind the price and where each figure came from.',
      link: { label: 'How Loep works', href: '/work/loep/' },
    },
    {
      kicker: 'Trading and research',
      title: 'From the feed to the evening brief.',
      status: 'Running · ADJL Capital',
      tags: ['software', 'systems'],
      body: 'Market-data ingestion, execution pipelines and backtests that share the production code path. Plus a daily research pipeline built on {k}point-in-time{/k} index membership.',
      plain: 'It takes in market data and sends orders out. Tests replay recorded data through the same code that trades live, and each evening it writes a research brief.',
      link: { label: 'How the pipeline works', href: '/work/trading-infrastructure/' },
    },
    {
      kicker: 'Native app',
      title: 'The whole engine, offline, on a phone.',
      status: 'Private distribution',
      tags: ['software'],
      body: 'One Expo and React Native codebase for iOS and Android. The underwriting engine runs on the device, and tests hold it to the same answers as the web.',
      plain: 'An iPhone and Android app. The full property math runs on the phone with no signal, and tests hold it to the same answers as the website.',
      link: { label: 'How the app works', href: '/work/mobile-app/' },
    },
    {
      kicker: 'Private website',
      title: 'Sealed at build. Checked at the edge.',
      status: 'Private · gated',
      tags: ['software'],
      body: 'Members’ pages are kept out of the public build. An edge function checks a signed session before it serves any of them.',
      plainTitle: 'Private pages that stay private.',
      plain: 'A website with a members’ area. Those pages are never published to the public web, and each request is checked before one is served.',
      link: { label: 'How the lock works', href: '/work/private-site/' },
    },
    {
      kicker: 'This website',
      title: 'Prerendered, strict and self-checking.',
      status: 'Public · you’re on it',
      tags: ['seo', 'software'],
      body: 'Static HTML, a content policy that allows nothing from other origins, structured data on every page, and a build that fails on hype.',
      plainTitle: 'A site that checks its own claims.',
      plain: 'The site you’re on. Every page is complete before any code runs, nothing is loaded from other companies, and the build stops if the copy overclaims.',
      link: { label: 'How this site is built', href: '/work/this-site/' },
    },
    {
      kicker: 'AI Engineering',
      title: 'Into the workflow you already run.',
      status: 'Service',
      kind: 'practice',
      tags: ['ai'],
      body: 'Retrieval, extraction, routing and drafting, with a review gate where mistakes cost money and an evaluation set from day one.',
      link: { label: 'How a rollout runs', href: '/work/ai-implementation/' },
    },
  ],
  more: { label: 'All work', href: '/work/' },
};

/** Home #systems, beside "All work": the way to the practice card the
 *  grid leaves out. */
export const systemsPractice: Link = { label: 'How an AI rollout runs', href: '/work/ai-implementation/' };

/** Home #team: the founder, the engagement and the stack, in one section. */
export const team = {
  eyebrow: 'Working with us',
  headline: ['You talk to Daniel.', 'A team {em}builds it.{/em}'],
  name: 'Daniel Laskowski',
  role: 'Chief Executive Officer & Founder',
  body: [
    'ADJL Technology is Daniel Laskowski and a small senior development team. He takes the first call, writes the scope and reads every message sent to the address on this page. Nobody stands between you and the person accountable for the work.',
    'The team builds AI systems, websites, native apps and the search work around them. The software behind ADJL Capital was built here, including its underwriting engine, its investor app and its private website. Client work is held to the same standard.',
  ],
  engagementIntro:
    'Four steps, and the first one’s free. After the second you have a written scope with a price on it. After the fourth your team owns a running system.',
  steps: [
    {
      num: '01',
      when: 'A conversation',
      title: 'You describe the problem',
      body: 'A call with Daniel and whoever will lead the build. No qualifying call first, and no salesperson.',
    },
    {
      num: '02',
      when: 'Week one',
      title: 'We watch it happen',
      body: 'Time with the people doing the work and the systems holding the data. The real problem often turns out to be somewhere else.',
    },
    {
      num: '03',
      when: 'Written down',
      title: 'A scope, in writing',
      body: 'The one step we’d build, what it costs, how long it takes and what has to be true for it to work. Priced and dated before anyone commits.',
    },
    {
      num: '04',
      when: 'Then it ships',
      title: 'Built, measured, handed over',
      body: 'It runs against an evaluation set from day one and goes live behind the review gate the risk deserves. It ends with your team owning it.',
    },
  ],
  stackLabel:
    'What the work is built out of. The constraint decides the tool.',
  /* Rendered as a lockfile-styled <dl data-chrome>. */
  stack: [
    { name: 'Languages & runtime', items: ['TypeScript', 'Python', 'Node.js', 'Rust', 'SQL', 'C++'] },
    {
      name: 'Models & retrieval',
      items: ['Claude', 'OpenAI', 'Local / open weights', 'Vector search', 'Structured extraction', 'Evaluation harnesses'],
    },
    {
      name: 'Web & apps',
      items: ['Vite', 'React Native', 'Expo', 'Netlify Edge Functions', 'Serverless functions', 'WebGL'],
    },
    {
      name: 'Data & infrastructure',
      items: ['Postgres', 'Supabase', 'Redis', 'Kafka', 'Parquet', 'Time-series stores'],
    },
    {
      name: 'Delivery',
      items: ['AWS', 'Netlify', 'Docker', 'Terraform', 'GitHub Actions', 'Observability'],
    },
  ],
};

export const faq: Faq = {
  eyebrow: 'Fair questions',
  headline: ['The things you’re', 'actually {em}thinking.{/em}'],
  items: [
    /* 1–6: the six original items, unchanged. */
    {
      q: 'How big is the team, and who actually does the work?',
      a: 'Daniel founded the firm and leads every engagement. He scopes the work and stays on it through delivery. The build is done by a small senior development team, and you meet the people who are on yours. There’s no bench of juniors a brief gets handed down to, and nobody translating between you and the engineers.',
    },
    {
      q: 'Is this just a wrapper around someone else’s model?',
      a: 'The model is one component, and usually the least interesting one. The work is in getting your data to a state where a model can act on it, deciding where a human has to stay in the loop, and building the evaluation that tells you whether any of it works. Swap the model out in a year and that scaffolding is what you keep.',
    },
    {
      q: 'We already have developers. Where do you fit?',
      a: 'Usually alongside them. We’re not there to replace anyone. An in-house team knows the business far better than we will in week one. What they often don’t have is spare capacity, or a reason to have built this particular thing before. We build the piece, work in your repository against your conventions, and hand it to your people to carry. They’re the ones who’ll still be here in a year.',
    },
    {
      q: 'Who owns the code when we’re done?',
      a: 'You do. The code, the prompts, the evaluation set and the documentation, in your repository, with no license back to us and no runtime dependency on anything we host. There’s no version of this where you have to keep paying to keep using what you paid to have built.',
    },
    {
      q: 'What about our data?',
      a: 'It stays in your environment wherever that’s possible. Where it isn’t, you’re told exactly what leaves, where it goes and how long it lives there. You get that before anything is built, not in an appendix afterward.',
    },
    {
      q: 'How is this related to ADJL Capital?',
      a: 'ADJL Capital is a private investment firm with three partners. ADJL Technology is a separate company, founded and led by Daniel Laskowski with its own development team. The software the fund runs on was built here, which is why we can describe it in this much detail. It’s our own. Neither firm owns the other, and nothing on this site is an offer of any security.',
    },
    /* 7–9: new with the rebuild. */
    {
      q: 'Can you get us into AI answers?',
      a: 'Nobody can promise that, and you should be wary of anyone who does. We can make your site easy to read and hard to misquote. That means prerendered pages, structured data that matches the copy, one clear name for each thing you sell and a plain-text summary for machines. Then we check what the engines actually say.',
    },
    {
      q: 'Do you build mobile apps?',
      a: 'Yes. Native iOS and Android from one codebase, with Expo and React Native. The app we built for ADJL Capital runs its whole underwriting engine on the phone, offline.',
    },
    {
      q: 'Do you only work in finance and real estate?',
      a: 'No. Those are the systems we built for ourselves first, so they’re the ones we can describe in detail. The patterns carry over to any business that runs on documents, data and decisions.',
    },
  ],
};

/** The shared contact block (`#contact`). Every page uses it; /approach/
 *  says its own first lines. `start` is the way in (/start/, the form);
 *  the address stays on show beside it as the way in with no form. */
export const cta = {
  eyebrow: 'Start here',
  headline: ['Tell us what’s slow,', 'or what {em}can’t be found.{/em}'],
  body: 'One paragraph is plenty. Tell us what you want built, the step that costs the most, or the page that should rank and doesn’t. If you know why the obvious fix hasn’t worked, say that too.',
  start: { label: 'Start a project', href: '/start/' },
  button: { label: 'Email Daniel', href: `mailto:${CONTACT}` },
  email: CONTACT,
  copy: 'Copy address',
  copied: 'Copied',
  note: 'Daniel reads and answers these himself, usually within a day or two. No sequence, no drip, and nothing sold to anyone.',
};

export type FooterGroup = { name: string; links: Link[] };

export const footer: {
  tagline: string;
  blurb: string;
  groups: FooterGroup[];
  stamp: string;
  legal: string;
} = {
  tagline: TAGLINE,
  blurb:
    'ADJL Technology builds AI systems, websites and apps, and the technical SEO that gets them found. Founded and led by Daniel Laskowski.',
  groups: [
    {
      name: 'Services',
      links: [
        { label: 'AI Engineering', href: '/services/ai-engineering/' },
        { label: 'SEO & AI Search', href: '/services/seo/' },
        { label: 'Websites & Apps', href: '/services/software/' },
        { label: 'Website audit', href: '/services/seo/audit/' },
        { label: 'All services', href: '/services/' },
      ],
    },
    {
      name: 'Work',
      links: [
        { label: 'Real Estate Intelligence', href: '/work/real-estate-intelligence/' },
        { label: 'Trading Infrastructure', href: '/work/trading-infrastructure/' },
        { label: 'AI Implementation', href: '/work/ai-implementation/' },
        { label: 'Mobile App', href: '/work/mobile-app/' },
        { label: 'Loep', href: '/work/loep/' },
        { label: 'Private Site', href: '/work/private-site/' },
        { label: 'This Site', href: '/work/this-site/' },
        { label: 'Agentic Research', href: '/work/agentic-research/' },
        { label: 'All work', href: '/work/' },
      ],
    },
    {
      name: 'Firm',
      links: [
        { label: 'Approach', href: '/approach/' },
        { label: 'Notes', href: '/notes/' },
        { label: 'Changelog', href: '/changelog/' },
        { label: 'Scan your site', href: '/scan/' },
        { label: 'For AI agents', href: '/agents/' },
        { label: 'Start a project', href: '/start/' },
      ],
    },
    {
      name: 'Machine-readable',
      links: [
        { label: 'llms.txt', href: '/llms.txt' },
        { label: 'llms-full.txt', href: '/llms-full.txt' },
        { label: 'sitemap.xml', href: '/sitemap.xml' },
        { label: 'Build report', href: '/build-report.json' },
      ],
    },
    {
      name: 'Legal',
      links: [
        { label: 'Privacy', href: '/legal/privacy/' },
        { label: 'Terms', href: '/legal/terms/' },
      ],
    },
  ],
  /* Prose, prerendered. {date} and {sha} are filled at render from
     __BUILD_DATE__ and __BUILD_SHA__. */
  stamp: 'Built {date} from commit {sha}. No cookies, no trackers, no third-party scripts.',
  legal:
    'ADJL Technology. Nothing on this site is an offer to sell or a solicitation of any security, and nothing here is investment advice. Descriptions of internal systems are general by design and omit parameters and thresholds.',
};
