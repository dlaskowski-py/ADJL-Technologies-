/**
 * ADJL Technology: /services/seo/audit/, the website audit, priced by quote.
 *
 * STUB written by the foundation so the route builds. WS-S (scanner +
 * audit) replaces every word here, and the page module's body with it.
 * pages.mjs marks this page `faq: true` (every service page carries one),
 * so keep an FAQ with at least one question, or ask for the flag to go.
 *
 * Same conventions as src/content.ts: headlines are arrays of lines,
 * {em}…{/em} marks one emphasized phrase per headline, and {k}…{/k} marks a
 * technical term in body copy. Edit words here, never in a renderer.
 */

import type { SectionPage } from './content-types';

export const content: SectionPage = {
  meta: {
    title: 'Website Audit for Search and AI | ADJL Technology',
    description:
      'A website audit of how search engines and AI answer engines read your site. Priced by quote, and there’s no online payment.',
    ogTitle: 'A website audit, priced by quote.',
  },
  hero: {
    eyebrow: 'SEO & AI Search · Website audit',
    headline: ['A website audit,', '{em}priced by quote.{/em}'],
    lead: 'We read your site the way search engines and AI answer engines do. This page is being written. Every audit is priced by quote, so ask and Daniel will reply with a price.',
    primary: { label: 'Ask for a quote', href: '/start/' },
    secondary: { label: 'Talk to Daniel', href: '#contact' },
  },
  sections: [
    {
      id: 'covers',
      eyebrow: 'The audit',
      headline: ['What it covers', 'is {em}coming next.{/em}'],
      body: ['This page is being written. Until it’s done, the SEO page describes the work an audit draws on.'],
      links: [{ label: 'SEO & AI Search', href: '/services/seo/' }],
    },
  ],
  faq: {
    eyebrow: 'Questions',
    headline: ['Before you', '{em}ask.{/em}'],
    items: [
      {
        q: 'How much does an audit cost?',
        a: 'It’s priced by quote. Sites differ in size and in what’s wrong with them. Ask, and Daniel will reply with a price.',
      },
      {
        q: 'Can I pay online?',
        a: 'No. There’s no checkout on this site. You get a quote by email first.',
      },
    ],
  },
};
