/**
 * ADJL Technology: /work/private-site/, the gated ADJL Capital site.
 *
 * High level only. This page describes the design of the two locks and
 * the functions behind the pages. It never names a path, a token format,
 * a rule or a key, for the same reason the members' pages stay private.
 * The omission is drawn as a labeled hatch, so it reads as a decision and
 * not a gap.
 *
 * Same conventions as src/content.ts: headlines are arrays of lines,
 * {em}…{/em} marks one emphasized phrase per headline, and {k}…{/k} marks a
 * technical term in body copy. Edit words here, never in a renderer.
 */

import type { SectionPage } from './content-types';

export const content: SectionPage = {
  meta: {
    title: 'Private Members Website with Edge Auth | ADJL Technology',
    description:
      'A private, gated website. Members’ pages are sealed out of the public build, and an edge function verifies a signed session before serving them.',
    ogTitle: 'A private site that says no by default.',
    ogDescription:
      'Most of ADJL Capital’s site is for its investors. The build seals members’ pages out of the public output.',
  },
  hero: {
    eyebrow: 'Case study · Private site',
    headline: ['A private site', 'that {em}says no by default.{/em}'],
    lead: 'Most of ADJL Capital’s site is for its investors. The build seals members’ pages out of the public output. An edge function checks for a signed session before it serves any of them, and when it can’t tell, it refuses. Serverless functions handle property lookups, market data and scheduled email briefs.',
    secondary: { label: 'Talk to Daniel', href: '#contact' },
    specs: [
      { label: 'Locks', value: 'Sealed at build, checked at the edge' },
      { label: 'Default', value: 'Refuse when unsure' },
      { label: 'Functions', value: 'Property lookup, market data, scheduled briefs' },
      { label: 'Shown here', value: 'The design only. No keys, paths or rules' },
    ],
  },
  sections: [
    {
      id: 'locks',
      eyebrow: 'Build and edge',
      headline: ['Two locks,', '{em}one rule.{/em}'],
      body: [
        'The first lock runs at build time. Members’ pages never reach the public files at all. The second runs at the edge on every request, before any cache. It checks a signed session and serves the page only when the check passes.',
      ],
      instrument: 'leaders-seal',
    },
    {
      id: 'refuse',
      eyebrow: 'Failure mode',
      headline: ['When unsure,', '{em}refuse.{/em}'],
      body: [
        'If the edge function can’t decide, it serves an error and not the page. If the lock were ever missing from a deploy, the members’ pages wouldn’t exist in it. That trade is deliberate. A confusing error now and then is cheap next to a members’ page served to a stranger.',
      ],
    },
    {
      id: 'functions',
      eyebrow: 'Serverless functions',
      headline: ['Functions behind', '{em}the pages.{/em}'],
      items: [
        {
          title: 'Property lookup',
          body: 'Takes a pasted listing URL and returns what’s known about the address, with each figure labeled by its source. It checks access and rate limits before it spends anything.',
        },
        {
          title: 'Market data',
          body: 'Quotes, filings and news, fetched with server-side keys the browser never sees.',
        },
        {
          title: 'Scheduled briefs',
          body: 'Email briefs that run on a schedule and go only to people who asked for them, with a working unsubscribe.',
        },
      ],
    },
    {
      id: 'omitted',
      eyebrow: 'Not shown',
      headline: ['Left out', '{em}on purpose.{/em}'],
      body: [
        'This page describes the design and leaves out the paths, the token format, the rules and the keys. Those stay private for the same reason the members’ pages do.',
      ],
      hatch: 'Withheld from this page',
    },
  ],
  foot: {
    builtUnder: [{ label: 'Websites & Apps', href: '/services/software/' }],
    next: { label: 'How this site is built', href: '/work/this-site/' },
  },
};

export const meta = content.meta;
