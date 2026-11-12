/**
 * ADJL Technology: /work/this-site/, the site you're on, as the case study.
 *
 * We can't name clients yet, so this is the build we can open all the way.
 * Every number on the page is measured: sizes when the page was built,
 * timings in the visitor's browser, headers from a live fetch. The guard
 * descriptions paraphrase what each check stops and never quote a banned
 * phrase, "rather than", an em-dash or a capitalized "That's", because the
 * guards read this page too.
 *
 * Same conventions as src/content.ts: headlines are arrays of lines,
 * {em}…{/em} marks one emphasized phrase per headline, and {k}…{/k} marks a
 * technical term in body copy. Edit words here, never in a renderer.
 */

import type { Section, SectionPage } from './content-types';

/** The build guards: name, then what it stops. Rendered as the #guards
 *  table here, and its names as the <pre> on /services/software/#guards. */
export const guards: { name: string; stops: string }[] = [
  { name: 'check-css', stops: 'A class with no style, or a style nothing uses' },
  {
    name: 'check-links',
    stops: 'A link to a page or fragment that doesn’t exist, or a page nothing links to',
  },
  { name: 'check-claims', stops: 'Hype words, and any number attached to a performance claim' },
  { name: 'check-contact', stops: 'The contact address missing, unlinked or half-changed' },
  { name: 'check-motion', stops: 'An animation module with nothing on any page to animate' },
  { name: 'check-markers', stops: 'An authoring marker shipped as visible text' },
  {
    name: 'check-usage',
    stops: 'British spellings, the wrong firm name, or a description that’s too long',
  },
  { name: 'check-voice', stops: 'Copy drifting into the padded register we don’t write in' },
  {
    name: 'check-seo',
    stops: 'A missing canonical, a second h1, a relative share image or broken structured data',
  },
  { name: 'check-provenance', stops: 'A demo without a label saying whether it’s live' },
  { name: 'check-budget', stops: 'A page over its byte budget, or a file nothing uses' },
];

/** One annotation per CSP directive, for the curl -I panel (#headers). The
 *  directives themselves are read from netlify.toml at build. */
export const csp: { directive: string; note: string }[] = [
  { directive: "default-src 'self'", note: 'Nothing loads from anywhere else.' },
  { directive: "script-src 'self'", note: 'No inline script and no eval.' },
  {
    directive: "style-src 'self' 'unsafe-inline'",
    note: 'Inline style attributes, used for animation offsets.',
  },
  { directive: "img-src 'self' data:", note: 'Images from this site and inline data images.' },
  { directive: "font-src 'self'", note: 'Fonts are self-hosted.' },
  { directive: "media-src 'none'", note: 'No video or audio at all.' },
  {
    directive: "connect-src 'self'",
    note: 'The live readouts fetch from this site and nowhere else.',
  },
  { directive: "frame-src 'none'", note: 'No embeds.' },
  { directive: "object-src 'none'", note: 'No plugins.' },
  { directive: "frame-ancestors 'none'", note: 'Nobody can frame this site.' },
  { directive: "base-uri 'self'", note: 'Relative links can’t be pointed elsewhere.' },
  { directive: "form-action 'self'", note: 'A form can post only back to this site.' },
  { directive: 'upgrade-insecure-requests', note: 'Any plain http request is upgraded.' },
];

/** #telemetry carries a <dl> with its own caption. `dlLabel` isn't on
 *  Section yet, so the section is typed with it here. */
const telemetry: Section = {
  id: 'telemetry',
  eyebrow: 'Telemetry',
  headline: ['Measured on', '{em}your visit.{/em}'],
  body: [
    'The sizes below were measured when this page was built. The timings come from your browser’s {k}performance APIs{/k}, measured now, on your device. If a browser doesn’t report a metric, the field says so instead of guessing.',
  ],
  dlLabel: 'How each one is measured',
  dl: [
    { label: 'html, css, js', value: 'gzip sizes of this page’s own files, measured at build' },
    { label: 'LCP', value: 'the {k}largest-contentful-paint entry{/k}' },
    {
      label: 'CLS',
      value: '{k}layout-shift entries{/k} in session windows, ignoring shifts right after input',
    },
    { label: 'slowest input', value: 'the longest event duration per interaction' },
    { label: '3rd-party', value: 'resources from any origin that isn’t this one' },
    { label: 'cookies', value: 'read from document.cookie' },
  ],
  instrument: 'telemetry',
};

export const content: SectionPage = {
  meta: {
    title: 'How This Site Is Built for Search | ADJL Technology',
    description:
      'How this site is built for search and answer engines: prerendered HTML, a strict CSP, JSON-LD on every page, llms.txt and build-time guards.',
    ogTitle: 'The site you’re on is the SEO case study.',
    ogDescription:
      'We can’t name clients yet, so here’s a build we can open all the way. Every page is HTML before any script runs.',
  },
  hero: {
    eyebrow: 'Case study · This website',
    headline: ['The site you’re on', 'is the {em}SEO case study.{/em}'],
    lead: 'We can’t name clients yet, so here’s a build we can open all the way. Every page is HTML before any script runs. Nothing loads from another origin. Each page describes itself in {k}structured data{/k}, and the build fails if the copy uses a hype word or an unmeasured number. The numbers on this page are measured in your browser.',
    secondary: { label: 'Talk to Daniel', href: '#contact' },
    specs: [
      { label: 'Rendering', value: 'Static HTML, prerendered at build' },
      { label: 'Scripts', value: 'Same origin only, no inline script' },
      { label: 'Data', value: 'One JSON-LD graph per page' },
      { label: 'Checks', value: 'The build fails on any guard' },
    ],
  },
  sections: [
    telemetry,
    {
      id: 'static',
      eyebrow: 'Prerendering',
      headline: ['Readable before', '{em}any script runs.{/em}'],
      body: [
        'Every page is rendered to complete HTML at build time by plain string functions. Scripts add motion and measurement, and run the two tools that call a server: the scanner and the scoping assistant. Turn JavaScript off and every word is still there. The meter below compares the words in the raw HTML with the words your browser rendered.',
      ],
      instrument: 'machine-parity',
    },
    {
      /* The curl -I panel. Its CSP annotations are `csp` above. */
      id: 'headers',
      eyebrow: 'Response headers',
      headline: ['Nothing loads from', '{em}anywhere else.{/em}'],
      body: [
        'No font host, no {k}CDN{/k}, no analytics and no embeds. The {k}content security policy{/k} says so, and your browser enforces it. When scripts run, the panel fetches this page’s real response headers as it comes into view. Without them, it shows the policy this site ships.',
      ],
      instrument: 'headers',
    },
    {
      id: 'graph',
      eyebrow: 'Structured data',
      headline: ['Every page', '{em}describes itself.{/em}'],
      body: [
        'Each page carries one {k}JSON-LD graph{/k}. The company, its founder, the site, the page and what the page is about, joined by stable IDs. The same IDs appear on every page, so a machine reading two pages knows they describe one company.',
      ],
      instrument: 'machine-schema',
    },
    {
      id: 'surfaces',
      eyebrow: 'Machine-readable files',
      headline: ['Files written', '{em}for machines.{/em}'],
      body: [
        'Each of these is generated from the built pages on every deploy, so none of them can describe a site that no longer exists.',
      ],
      list: [
        'sitemap.xml (dates from git history)',
        '{k}robots.txt{/k}',
        '{k}llms.txt{/k}',
        'llms-full.txt',
        'A markdown copy of every page',
        'build-report.json',
      ],
      instrument: 'machine-surfaces',
    },
    {
      /* The table, then a RECORDED terminal block fetched live from
         /build-report.json (the guards instrument). */
      id: 'guards',
      eyebrow: 'Build guards',
      headline: ['Checks that', '{em}fail the build.{/em}'],
      body: [
        'These run on every deploy. If one fails, the previous version stays live. If you’re reading this, every check passed.',
      ],
      table: {
        head: ['Guard', 'What it stops'],
        rows: guards.map((g) => [g.name, g.stops]),
      },
      instrument: 'guards',
    },
    {
      /* Plus a <dl> of module weights (gz, BUILD, from stamp-sizes). */
      id: 'motion',
      eyebrow: 'Motion tiers',
      headline: ['Motion that knows', '{em}when to stop.{/em}'],
      body: [
        'Every animation here runs at one of three levels. Full on a desktop, lighter on phones and low-memory devices, and none at all if you’ve asked your system for reduced motion. Anything that loops pauses when it’s off screen. The Pause button stops all of it.',
      ],
      instrument: 'weights',
    },
    {
      id: 'not',
      eyebrow: 'Left out',
      headline: ['What it', '{em}doesn’t do.{/em}'],
      body: [
        'No cookies. No trackers. No third-party scripts. A form can post only back to this site. Ask This Site is retrieval only, and no language model writes its answers. The one place a model runs is the scoping assistant on the start page. It’s called from a server function, so no key ever reaches your browser.',
      ],
    },
  ],
  foot: {
    builtUnder: [
      { label: 'SEO & AI Search', href: '/services/seo/' },
      { label: 'Websites & Apps', href: '/services/software/' },
    ],
    next: { label: 'How the trading pipeline works', href: '/work/trading-infrastructure/' },
  },
};

export const meta = content.meta;
