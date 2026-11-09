/**
 * ADJL Technology: /services/seo/, technical SEO and AI search visibility.
 *
 * The practice is called "SEO & AI Search" everywhere a buyer looks for
 * it: the eyebrow, the nav, the practices and this page's h1. The page
 * promises only the work we control, and it measures itself: the Machine
 * View panel reads this page's own raw HTML.
 *
 * Same conventions as src/content.ts: headlines are arrays of lines,
 * {em}…{/em} marks one emphasized phrase per headline, and {k}…{/k} marks a
 * technical term in body copy. Edit words here, never in a renderer.
 */

import type { SectionPage } from './content-types';

export const content: SectionPage = {
  meta: {
    title: 'Technical SEO and AI Search Visibility | ADJL Technology',
    description:
      'Technical SEO for search engines and AI answer engines: prerendering, structured data, entity clarity, crawl paths, Core Web Vitals and llms.txt.',
    ogTitle: 'Technical SEO for search and AI answer engines.',
    ogDescription: 'Search has two readers now. Search engines rank pages.',
  },
  hero: {
    eyebrow: 'SEO & AI Search',
    headline: ['Technical SEO for search', 'and {em}AI answer engines.{/em}'],
    lead: 'Search has two readers now. Search engines rank pages. Answer engines read them and decide what to quote. Both start from the same HTML, and most sites hand them a mess. We fix that layer, then measure what changed.',
    primary: { label: 'See what a crawler reads', href: '#machine' },
    secondary: { label: 'Talk to Daniel', href: '#contact' },
    specs: [
      { label: 'Inputs', value: 'Your site, its templates and its build' },
      { label: 'Fixes', value: 'Rendering, structured data, entities, crawl paths, speed' },
      { label: 'Measures', value: 'What a crawler is served, and how fast real visitors get it' },
      { label: 'Hands over', value: 'The changes, the checks and the reasons, in your repository' },
    ],
  },
  sections: [
    {
      /* Diagram: one HTML document feeding two lanes, crawl → rank → link
         and read → extract → quote. Illustration. */
      id: 'readers',
      eyebrow: 'Two readers',
      headline: ['One ranks.', 'One {em}quotes.{/em}'],
      body: [
        'A search engine crawls your pages, ranks them and shows a link. An answer engine reads them, lifts out claims and may or may not credit you. Many AI crawlers never run your JavaScript, and the ones that do run it later. Both trust pages that say the same thing in the markup and in the copy.',
      ],
      instrument: 'readers',
    },
    {
      id: 'fix',
      eyebrow: 'What we fix',
      headline: ['The layer', '{em}both of them read.{/em}'],
      items: [
        {
          title: 'Prerendering',
          body: 'Every page arrives as complete HTML. A reader with JavaScript off, a crawler in a hurry and a screen reader all get the same words.',
        },
        {
          title: 'Structured data',
          body: 'JSON-LD that describes real entities and matches the visible copy. Your company, its people, its services and the pages about them, joined by stable IDs.',
        },
        {
          title: 'Entity clarity',
          body: 'One name for each thing you sell, used the same way on every page. Answer engines stitch claims together across pages, and two names for one service reads as two services.',
        },
        {
          title: 'Crawl paths',
          body: 'Every page reachable in a few clicks from the home page, with link text that says where it goes. No orphan pages, no redirect chains and one canonical URL per page.',
        },
        {
          title: 'Core Web Vitals',
          body: 'Fast first paint, no layout shift and quick response to input. We set a budget, and the build fails when a page goes over it.',
        },
        {
          title: 'Machine-readable surfaces',
          body: 'A sitemap with real dates, a robots file that says what you mean, and {k}llms.txt{/k}, a proposed plain-text summary some AI tools read. We’re clear that it’s a proposal and not a standard.',
        },
      ],
    },
    {
      id: 'machine',
      eyebrow: 'Measured, not described',
      headline: ['Here’s what a crawler', 'gets {em}from this page.{/em}'],
      body: [
        'This page practices what it describes. When scripts run, the panel fetches it again and reads the raw HTML with no script run. Compare the readers. Then open the whole page in Machine view.',
      ],
      instrument: 'machine-full',
    },
    {
      id: 'limits',
      eyebrow: 'Honest limits',
      headline: ['What we', '{em}won’t{/em} promise.'],
      body: [
        'Nobody outside a search engine controls rankings, and nobody controls what an AI answer says. Anyone who guarantees either one is guessing. We promise the work we control. Pages that are fast, complete without JavaScript, consistent and easy to quote. Then we report what changed, with the measurements.',
      ],
    },
    {
      id: 'proof',
      eyebrow: 'Proof',
      headline: ['The proof is', '{em}the page you’re on.{/em}'],
      body: [
        'This site was built as the case study. Every claim on this page can be checked against the page itself, and the build notes are public.',
      ],
      links: [
        { label: 'How this site is built for search', href: '/work/this-site/' },
        { label: 'The home page’s live readout', href: '/#machine' },
      ],
    },
  ],
  faq: {
    eyebrow: 'Fair questions',
    headline: ['Questions about', '{em}SEO and AI search.{/em}'],
    items: [
      {
        q: 'What’s llms.txt, and does it matter?',
        a: 'It’s a proposed convention, a plain-text file at the root of a site that summarizes it for language models. Some AI tools read it and many don’t. It’s cheap to generate from pages you already have, so we do, and we don’t oversell it. This site’s own file is rebuilt from its pages on every deploy.',
      },
      {
        q: 'Do you do traditional SEO too?',
        a: 'Yes. Technical SEO is most of the work either way. Titles, descriptions, headings, internal links, speed and structured data help ranked results and quoted answers alike. We don’t write bulk content to chase keywords.',
      },
      {
        q: 'Will you rebuild our site?',
        a: 'Only if that’s the cheapest fix. Most technical SEO work happens inside the site you already have, in its templates and its build. When a rebuild is the honest answer, we’ll say so and price it separately.',
      },
      {
        q: 'How do you measure results?',
        a: 'With tools anyone can run. What a crawler is served, how fast real pages load, which pages get indexed and what the search consoles report. We report what changed and leave out what we can’t attribute.',
      },
    ],
  },
};

export const meta = content.meta;
export const faq = content.faq;
