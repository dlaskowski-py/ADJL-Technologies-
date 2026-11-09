/**
 * ADJL Technology: /services/, the hub over the three service pages.
 *
 * The four practice panels are the home page's `practices.items` (one
 * source, in src/content.ts). This module adds the spec rail each panel
 * carries here: what goes in, what we build, how it's measured and what
 * you keep. The renderer joins the two by practice key.
 *
 * Same conventions as src/content.ts: headlines are arrays of lines,
 * {em}…{/em} marks one emphasized phrase per headline, and {k}…{/k} marks a
 * technical term in body copy. Edit words here, never in a renderer.
 */

import type { SectionPage, Spec } from './content-types';
import type { PracticeKey } from './content';

export const content: SectionPage = {
  meta: {
    title: 'AI, SEO and Software Development Services | ADJL Technology',
    description:
      'AI engineering, technical SEO for search and AI answers, and websites, apps and backends, from one team that measures what it ships.',
    ogTitle: 'AI, SEO and software, from one team.',
    ogDescription:
      'The practices share people, tools and a habit of measuring. Most projects touch more than one.',
  },
  hero: {
    eyebrow: 'Services',
    headline: ['AI, SEO and software,', 'from {em}one team.{/em}'],
    lead: 'The practices share people, tools and a habit of measuring. Most projects touch more than one. A new web app needs to be found. An agent needs somewhere to live.',
    primary: { label: 'See the work', href: '/work/' },
    secondary: { label: 'Talk to Daniel', href: '#contact' },
  },
  sections: [
    {
      /* No items: the renderer draws the four panels from practices.items
         (src/content.ts) and pairs each with rails[glyph] below. */
      id: 'practices',
      eyebrow: 'What each practice does',
      headline: ['What each practice', '{em}hands over.{/em}'],
      body: [
        'Each practice has its own page. Here’s what goes in, what we build, how we measure it and what you keep.',
      ],
    },
    {
      id: 'meet',
      eyebrow: 'Where they meet',
      headline: ['Most work', '{em}crosses a line.{/em}'],
      body: [
        'This site is a software build and an SEO build at the same time. The investor app is software with the underwriting engine inside it. The underwriting engine is an AI system where the model writes the narrative and never a figure. We scope the work as one job, so nothing gets lost between teams.',
      ],
      links: [
        { label: 'How this site is built', href: '/work/this-site/' },
        { label: 'The engine on a phone', href: '/work/mobile-app/' },
        {
          label: 'A model that writes prose, never figures',
          href: '/work/real-estate-intelligence/#replay',
        },
      ],
    },
  ],
};

/** The spec rail under each practice panel, keyed like practices.items. */
export const rails: Record<PracticeKey, Spec[]> = {
  ai: [
    { label: 'Inputs', value: 'Documents, records and tools' },
    { label: 'Builds', value: 'Agents, retrieval, extraction, routing' },
    { label: 'Measures', value: 'An evaluation set and a trace of every run' },
    { label: 'Hands over', value: 'Code, prompts, evals and docs' },
  ],
  seo: [
    { label: 'Inputs', value: 'Your site and its build' },
    { label: 'Builds', value: 'Prerendering, structured data, crawl paths' },
    { label: 'Measures', value: 'What crawlers are served, and real page speed' },
    { label: 'Hands over', value: 'The changes and the checks' },
  ],
  software: [
    { label: 'Inputs', value: 'A problem and whatever already exists' },
    { label: 'Builds', value: 'Sites, web apps, native apps, APIs' },
    { label: 'Measures', value: 'Speed budgets, security headers, pinned outputs' },
    { label: 'Hands over', value: 'Repository, tests, build guards' },
  ],
  systems: [
    { label: 'Inputs', value: 'Listings, public records, market data' },
    { label: 'Builds', value: 'Underwriting, research pipelines, execution' },
    { label: 'Measures', value: 'Provenance on every figure' },
    { label: 'Hands over', value: 'Running for ADJL Capital today' },
  ],
};

export const meta = content.meta;
