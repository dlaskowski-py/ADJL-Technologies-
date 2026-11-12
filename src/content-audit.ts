/**
 * ADJL Technology: /services/seo/audit/, the website audit, priced by quote.
 *
 * The audit is the free scan's three layers (/scan/: what people read,
 * what crawlers follow, what machines parse), read across the whole site,
 * and then the parts one page can't show. It promises the work and the
 * report, never a ranking or traffic: nobody outside a search engine
 * controls those, and /services/seo/#limits says so too. No price on the
 * page and no checkout: a quote comes first, by email, after a look.
 *
 * pages.mjs marks this page `faq: true` and `service` (the Service node
 * describes the hero and #covers), so the FAQ and the #covers id stay.
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
      'A website audit of how people, search crawlers and AI answer engines read your site, with a written report of fixes in order of impact. Priced by quote.',
    ogTitle: 'A website audit, priced by quote.',
    ogDescription: 'Your whole site, read the way people, search crawlers and AI answer engines read it.',
  },
  hero: {
    eyebrow: 'SEO & AI Search · Website audit',
    headline: ['A website audit,', '{em}priced by quote.{/em}'],
    lead: 'We read your whole site the way people, search crawlers and AI answer engines do. You get a written report with the fixes in order of impact, and a call to walk through it. Ask, and Daniel replies with a price after a look at the site.',
    primary: { label: 'Ask for a quote', href: '/start/?topic=audit#form' },
    secondary: { label: 'Talk to Daniel', href: '#contact' },
    specs: [
      { label: 'Reads', value: 'Every kind of page on your site, from the outside' },
      { label: 'You get', value: 'A written report, fixes in order of impact, and a call' },
      { label: 'Price', value: 'By quote, after a look at the site' },
      { label: 'Payment', value: 'None online. The quote comes by email first' },
    ],
  },
  sections: [
    {
      id: 'covers',
      eyebrow: 'What it covers',
      headline: ['The scan’s three layers,', '{em}across every page.{/em}'],
      body: [
        'The free scan reads one page. The audit starts from the same three layers and reads them across your site: the home page, each kind of page you have, and the templates behind them.',
      ],
      items: [
        {
          title: 'What people read',
          body: 'Titles, descriptions and headings on every kind of page, and whether each page says plainly what it offers. We check that the words are there before any script runs.',
        },
        {
          title: 'What crawlers follow',
          body: 'Status codes, redirects, {k}canonical tags{/k}, robots.txt, {k}noindex{/k} and the sitemap. Whether search and AI crawlers may reach each page, and whether they’re told to skip ones you want found.',
        },
        {
          title: 'What machines parse',
          body: 'Structured data, share tags and {k}llms.txt{/k}. Whether the {k}JSON-LD{/k} parses, describes real things and matches what the page says.',
        },
      ],
      links: [{ label: 'Try the free scan on one page', href: '/scan/' }],
    },
    {
      id: 'deeper',
      eyebrow: 'Then deeper',
      headline: ['Then the parts', '{em}one page can’t show.{/em}'],
      items: [
        {
          title: 'Rendering',
          body: 'How each kind of page is built: sent as complete HTML, or put together in the browser by JavaScript. We compare what arrives with what a person ends up seeing.',
        },
        {
          title: 'Content without JavaScript',
          body: 'Many AI crawlers don’t run scripts. We read every template with scripts off and list the words, links and prices that only appear once JavaScript runs.',
        },
        {
          title: 'Structured data',
          body: 'Your business, its services and its pages, and whether the JSON-LD joins them up. Missing types, broken blocks and claims the visible page doesn’t make.',
        },
        {
          title: 'Internal links',
          body: 'How many clicks each page is from the home page, which pages nothing links to, and link text that doesn’t say where it goes.',
        },
        {
          title: 'AI crawler access',
          body: 'What your {k}robots.txt{/k} tells each AI crawler, page by page. Which ones fetch pages for AI answers and which collect training data, so you can choose on purpose.',
        },
        {
          title: 'llms.txt',
          body: 'Whether you have one, whether it matches the site, and whether it’s worth keeping up. It’s a proposed convention, and we say so.',
        },
        {
          title: 'Speed basics',
          body: 'How fast each kind of page answers and how heavy it is: the server’s response time, page weight, images and the scripts that hold up the first paint.',
        },
      ],
    },
    {
      id: 'report',
      eyebrow: 'What you get',
      headline: ['A report,', 'and {em}a call.{/em}'],
      body: [
        'The report goes through what we found, most important first. Each finding says what we saw, why it matters and what to change, in words you can hand to whoever runs your site.',
      ],
      list: [
        'A written report, with the fixes in order of impact.',
        'For each fix: what we found, where, why it matters and what to change.',
        'A call to walk through it and answer your questions.',
        'If you’d like us to make the fixes, we quote that separately.',
      ],
    },
    {
      id: 'price',
      eyebrow: 'How it’s priced',
      headline: ['Priced by quote,', '{em}after a look.{/em}'],
      body: [
        'Sites differ in size and in what’s wrong with them, so there’s no list price. Tell us the site and what worries you. Daniel looks at it and replies with a quote by email.',
        'There’s no checkout on this site and nothing to pay online. You decide after you’ve seen the quote.',
      ],
    },
    {
      id: 'limits',
      eyebrow: 'Honest limits',
      headline: ['No promises', 'we {em}can’t keep.{/em}'],
      body: [
        'No audit can guarantee a ranking, more traffic or a mention in an AI answer. Search engines and AI companies decide those, and anyone who promises them is guessing. We promise a careful read of your site and a clear list of what to fix.',
      ],
    },
    {
      id: 'start',
      eyebrow: 'Getting started',
      headline: ['It starts', 'with {em}a short form.{/em}'],
      list: [
        'Send the form with the topic set to Website audit. Add your site’s address and what you’d like to know.',
        'Daniel looks at the site and replies with a quote by email.',
        'If you go ahead, you get the written report and then the call.',
      ],
      links: [
        { label: 'Ask for an audit quote', href: '/start/?topic=audit#form' },
        { label: 'Run the free scan first', href: '/scan/' },
      ],
    },
  ],
  faq: {
    eyebrow: 'Questions',
    headline: ['Before you', '{em}ask.{/em}'],
    items: [
      {
        q: 'How much does an audit cost?',
        a: 'It’s priced by quote. Sites differ in size and in what’s wrong with them. Ask, and Daniel will reply with a price after a look at the site.',
      },
      {
        q: 'Can I pay online?',
        a: 'No. There’s no checkout on this site. You get a quote by email first.',
      },
      {
        q: 'How is it different from the free scan?',
        a: 'The scan reads one page in a few seconds and lists what it finds. The audit reads every kind of page on your site, checks the parts one page can’t show, and comes with a written report and a call.',
      },
      {
        q: 'Will it get my site to the top of Google?',
        a: 'Nobody can promise that, and we won’t. The audit tells you what stands between your site and the people and machines reading it, in order of what matters most.',
      },
      {
        q: 'Do you need access to my site?',
        a: 'No. We read it from the outside, the way search engines and AI crawlers do. If you share access to Google Search Console, we can also look at what Google reports about it.',
      },
    ],
  },
};
