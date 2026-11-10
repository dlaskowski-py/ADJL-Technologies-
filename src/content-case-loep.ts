/**
 * ADJL Technology: /work/loep/, Loep, a research tool we built.
 *
 * Every statement here was checked against Loep's own code. What this page
 * must not carry, and why:
 *
 *   - A link to loep.ai, or the word "live". The site is deployed behind a
 *     sign-in gate, so a visitor following a link would meet a login wall.
 *     The status is "private preview". When the gate comes down: add the
 *     link (and the host to check-links' allowlist) and change the status.
 *   - Who operates Loep, or which firm its engines were first built for.
 *     Loep's own pages name neither, so this page says only that we built it.
 *   - The names of its data providers, its prices and plan limits, and the
 *     settings behind any signal or verdict. Loep keeps all of those off
 *     its own marketing pages.
 *   - A figure, as if a sheet had returned it. The numbers on Loep's own
 *     pages are samples and are stamped as samples.
 *   - Anything still planned. The phone app isn't built; the page says so.
 *
 * The role of the language model is stated exactly: it writes one optional
 * note from figures code has already computed. No number comes from it.
 *
 * Same conventions as src/content.ts: headlines are arrays of lines,
 * {em}…{/em} marks one emphasized phrase per headline, and {k}…{/k} marks a
 * technical term in body copy. Edit words here, never in a renderer.
 */

import type { SectionPage } from './content-types';

export const content: SectionPage = {
  meta: {
    title: 'Loep, a Research Tool for Property and Stocks | ADJL Technology',
    description:
      'How we built Loep: a property scanner, company reports read from SEC filings and a business analyst, with every figure labeled by how it was obtained.',
    ogTitle: 'The records behind a price, on one sheet.',
    ogDescription:
      'Loep is a research tool we built for people who aren’t professionals. Give it one US address, one stock ticker or one business for sale.',
  },
  hero: {
    eyebrow: 'Case study · Loep',
    headline: ['The records behind a price,', '{em}on one sheet.{/em}'],
    lead: 'Loep is a research tool we built for people who aren’t professionals. Give it one US address, one stock ticker or one business for sale. It reads the public records and company filings behind it and lays them out as numbered sheets, with each figure’s source beside it. It’s research, never advice.',
    secondary: { label: 'Talk to Daniel', href: '#contact' },
    specs: [
      { label: 'Takes', value: 'An address, a ticker or a business for sale' },
      { label: 'Built with', value: 'Static HTML, TypeScript, serverless functions' },
      { label: 'Engines', value: 'Pure modules that run in the browser' },
      { label: 'Status', value: 'Private preview' },
    ],
  },
  sections: [
    {
      id: 'sheets',
      eyebrow: 'What it does',
      headline: ['One tool,', '{em}a sheet for each question.{/em}'],
      body: [
        'Every screen in Loep is a numbered sheet, like a page in an atlas. Each one answers one kind of question and ends with a list of its sources.',
      ],
      items: [
        {
          title: 'Property Scanner',
          body: 'Type a US address or click a roof on the map. The survey brings back the listing, value and rent estimates, the county record, tax history and the ZIP’s Census figures.',
        },
        {
          title: 'Market Research',
          body: 'Enter one ticker. The report reads the company’s annual and quarterly filings from the SEC, builds its statements, and prints a mechanical signal beside the rule that produced it.',
        },
        {
          title: 'Business Analyst',
          body: 'Paste the listing for a business for sale, or type its figures. A parser with fixed rules reads them, and nothing becomes an input until you accept it.',
        },
        {
          title: 'Indicators',
          body: 'Chart scripts a person adds to their own charts. One is available today, with its method and its weaknesses written out. The rest are marked as in testing.',
        },
      ],
    },
    {
      id: 'scan',
      eyebrow: 'One property',
      headline: ['A scan,', '{em}start to finish.{/em}'],
      items: [
        {
          title: 'Nothing runs until asked',
          body: 'A click only outlines the building and drops a pin. No record is looked up until the person presses the survey button.',
        },
        {
          title: 'Resolved to one address',
          body: 'A typed address or a point on the map is reduced to one normalized address before any property record is requested.',
        },
        {
          title: 'Fetched together',
          body: 'Whatever is out of date is fetched at once, under one deadline. A part that doesn’t arrive is listed as unavailable, with the reason.',
        },
        {
          title: 'Sources on every sheet',
          body: 'The answer comes back as sheets. The last one lists each source and when it was read, and an answer served from {k}cache{/k} says so.',
        },
        {
          title: 'The price is confirmed first',
          body: 'The server returns facts and no verdict. The model won’t run until the person checks a box that says this is the price they would pay.',
        },
        {
          title: 'Underwritten in the browser',
          body: 'Then the engine runs on the person’s own inputs and reruns on every edit. Each assumption shows its default and where the default came from.',
        },
      ],
    },
    {
      id: 'rules',
      eyebrow: 'Its own rules',
      headline: ['What it', '{em}won’t do.{/em}'],
      body: [
        'Loep is held to a short list of refusals. These are the ones a reader runs into on every sheet.',
      ],
      list: [
        'Every figure carries a label for how it was obtained: retrieved, curated, modeled, an assumption, entered, computed or third party. The build fails if that list drifts.',
        'A value it didn’t read shows as a dash, never as a zero.',
        'A sample figure is stamped SAMPLE in its sheet’s header.',
        'Evidence from filed figures, from a company’s own risk headings and from a provider’s news score stays in three separate tiers. It’s never netted into one number.',
        'A language model writes one optional note, from figures the code has already computed. Its words are never read back into a number.',
      ],
    },
    {
      id: 'guards',
      eyebrow: 'How it’s built',
      headline: ['Checks that', '{em}stop the build.{/em}'],
      body: [
        'The calculation engines are pure modules. They fetch nothing and call no model, so the same arithmetic runs in the browser and on the server, and their tests need no network.',
      ],
      list: [
        'Each engine is checked against frozen fixtures that were produced by running the code, not typed by hand.',
        'An inline script in a built page fails the build. So does a privileged database key anywhere in the output.',
        'Only one server file may reach a language model. A check fails if a second one does.',
        'The plan rules are rebuilt from the database’s SQL and from the JavaScript, then run over the same profiles. A disagreement fails the build.',
        'Every table has {k}row-level security{/k}, deny by default. A person reads only their own rows.',
      ],
    },
    {
      id: 'ground',
      eyebrow: 'The drawing',
      headline: ['Contour lines,', '{em}computed.{/em}'],
      body: [
        'Loep’s hero is a terrain of contour lines, traced by {k}marching squares{/k} over seeded noise. The algorithm is pure, so one piece of code draws the canvas in the browser and the still picture the build prerenders. Under reduced motion the terrain is drawn complete in the first frame.',
      ],
    },
    {
      id: 'status',
      eyebrow: 'Where it stands',
      headline: ['Built, and', '{em}not open yet.{/em}'],
      body: [
        'Loep is deployed behind a sign-in gate today, so this page doesn’t link to it. Card checkout isn’t connected, and an iPhone app is planned and not built. When the gate comes down, the link goes here.',
        'This page leaves out Loep’s data providers, its prices and plan limits, and the settings behind any signal or verdict. Loep keeps those off its own marketing pages too.',
      ],
      hatch: 'Withheld from this page',
    },
  ],
  foot: {
    builtUnder: [
      { label: 'Websites & Apps', href: '/services/software/' },
      { label: 'AI Engineering', href: '/services/ai-engineering/' },
    ],
    next: { label: 'A private site that says no', href: '/work/private-site/' },
  },
};

export const meta = content.meta;
