/**
 * ADJL Technology: /services/software/, websites, apps and the systems
 * behind them.
 *
 * Every claim here can be checked on the page itself: the telemetry panel
 * measures this page in the visitor's browser, the parity diagram shows the
 * shared engine files, and the guard list is this site's own.
 *
 * Same conventions as src/content.ts: headlines are arrays of lines,
 * {em}…{/em} marks one emphasized phrase per headline, and {k}…{/k} marks a
 * technical term in body copy. Edit words here, never in a renderer.
 */

import type { SectionPage } from './content-types';

export const content: SectionPage = {
  meta: {
    title: 'Web, Mobile App and Backend Development | ADJL Technology',
    description:
      'Marketing sites, web apps, native iOS and Android apps in React Native, backends and data pipelines. Fast, measured, and handed over with the code.',
    ogTitle: 'Websites, apps and the systems behind them.',
    ogDescription:
      'Marketing sites, web apps, native iOS and Android apps, APIs and data pipelines. We build them fast to load, strict about security and easy for the next developer to read.',
  },
  hero: {
    eyebrow: 'Websites & Apps',
    headline: ['Websites, apps', 'and the {em}systems behind them.{/em}'],
    lead: 'Marketing sites, web apps, native iOS and Android apps, {k}APIs{/k} and data pipelines. We build them fast to load, strict about security and easy for the next developer to read. Then we hand over the {k}repository{/k}.',
    primary: { label: 'See this page measured', href: '#telemetry' },
    secondary: { label: 'Talk to Daniel', href: '#contact' },
    specs: [
      { label: 'Inputs', value: 'A problem, a brand and whatever already exists' },
      { label: 'Builds', value: 'Sites, web apps, native apps, APIs, pipelines' },
      { label: 'Measures', value: 'Speed budgets, security headers, tests that pin outputs' },
      { label: 'Hands over', value: 'The repository, the tests and the build guards' },
    ],
  },
  sections: [
    {
      id: 'ship',
      eyebrow: 'What we ship',
      headline: ['From the page', 'to the {em}pipeline.{/em}'],
      items: [
        {
          title: 'Marketing sites',
          body: 'Static HTML that renders before any script runs, a strict {k}content policy{/k} and {k}structured data{/k} on every page. This site is one.',
        },
        {
          title: 'Web apps',
          body: 'Customer portals, internal tools and dashboards. Quick to open, honest about loading, and clear about where every number came from.',
        },
        {
          title: 'Native apps',
          body: 'iOS and Android from one Expo and React Native codebase. Logic that matters is shared with the web version and pinned by tests, so the phone and the website can’t disagree.',
        },
        {
          title: 'Backends and APIs',
          body: '{k}Serverless and edge functions{/k}, scheduled jobs and the APIs your front ends call. Every function checks who’s asking before it spends anything.',
        },
        {
          title: 'Data pipelines',
          body: 'Daily jobs that fetch, check and store data. They record when each fact was true, and they fail loudly when a source changes shape.',
        },
      ],
    },
    {
      /* The large telemetry panel (data-telemetry). */
      id: 'telemetry',
      eyebrow: 'Live readout',
      headline: ['This page,', '{em}measured.{/em}'],
      body: [
        'The readout below comes from your browser’s own {k}performance APIs{/k}. We didn’t type any of the numbers. If your browser doesn’t report a metric, the field says so instead of guessing.',
      ],
      instrument: 'telemetry',
    },
    {
      /* The parity diagram, teaser variant. */
      id: 'parity',
      eyebrow: 'Shared logic',
      headline: ['One engine,', '{em}two platforms.{/em}'],
      body: [
        'The investor app we built for ADJL Capital runs its underwriting engine on the phone. The engine files are the same ones the website runs, byte for byte, and tests hold both to the same answers.',
      ],
      instrument: 'leaders-parity',
      links: [{ label: 'How the app works', href: '/work/mobile-app/' }],
    },
    {
      /* Plus a <pre> of this site's guard names (the guards instrument;
         the names are content-case-this-site.ts `guards`). */
      id: 'guards',
      eyebrow: 'Build guards',
      headline: ['Checks your team', '{em}inherits.{/em}'],
      body: [
        'Every site we ship comes with checks that fail the build. Dead CSS, broken links, missing structured data, pages over budget and copy that claims what it can’t back up. Your team gets the checks along with the code.',
      ],
      instrument: 'guards',
    },
    {
      id: 'handover',
      eyebrow: 'Handover',
      headline: ['What you get', '{em}at the end.{/em}'],
      body: ['Everything needed to run it without us.'],
      list: [
        'The repository, with its history',
        'Tests that pin the outputs that matter',
        'The build guards, already wired in',
        'Deployment config and security headers',
        'A {k}runbook{/k} for when something breaks',
        '{k}Design tokens{/k}, so the next page matches',
      ],
    },
    {
      id: 'proof',
      eyebrow: 'Proof',
      headline: ['Software that’s', '{em}running now.{/em}'],
      body: ['Each of these runs today.'],
      links: [
        { label: 'How the app works', href: '/work/mobile-app/' },
        { label: 'How the private site’s lock works', href: '/work/private-site/' },
        { label: 'How this site is built', href: '/work/this-site/' },
      ],
    },
  ],
  faq: {
    eyebrow: 'Fair questions',
    headline: ['Questions about', '{em}software builds.{/em}'],
    items: [
      {
        q: 'Which stack do you use?',
        a: 'Whatever fits the job. This site is Vite and plain TypeScript with no framework. The investor app is Expo and React Native. Backends run as serverless and edge functions. The scope explains each choice.',
      },
      {
        q: 'Can you work with our existing site?',
        a: 'Yes. Most of the time the cheapest fix lives inside what you already have. We work in your repository, to your conventions, and leave it easier to change than we found it.',
      },
      {
        q: 'Do you maintain what you build?',
        a: 'The handover is built so your own team can take it over. If you’d like us to stay on, that’s a separate written agreement with its own scope.',
      },
    ],
  },
};

export const meta = content.meta;
export const faq = content.faq;
