/**
 * Copy for the home page's landing. Same house rules as every content module:
 * US English, contractions, short plain sentences, ’ apostrophes, exactly
 * one {em}…{/em} per headline, no hype words, no counts of clients or
 * projects, nothing claimed that hasn't happened.
 *
 * The reader here is a business owner, not an engineer, so nothing below
 * uses a word the practice pages have to explain. The practice names are
 * the site's own, spelled exactly as every other page spells them.
 *
 * The words inside the four drawings live here too (`art`). They're labels
 * in an illustration: values are masked, nothing in them is a measurement,
 * and each drawing carries an Illustration chip saying so.
 *
 * OWNER: WS-B.
 */
import { CONTACT } from './content';
import type { Link } from './content-types';

/** The four panels, in page order. Also the scene each one plays. */
export type OfferKey = 'ai' | 'seo' | 'web' | 'sys';

export type Offer = {
  key: OfferKey;
  /** The practice's name, exactly as the nav has it. */
  name: string;
  title: string;
  body: string;
  points: string[];
  link: Link;
};

export const landing = {
  /** The hero's typed line. `phrases` are typed after the prompt, one at a
   *  time; keep each to 42 characters and plain ASCII, so the longest one
   *  fits a phone's width in the mono face on one line, and keep "|" out
   *  of them (it separates them in the markup). `summary` is the one
   *  static sentence screen readers and text readers get. */
  typer: {
    prompt: 'now building',
    phrases: [
      'AI that reads your documents for you',
      'a website that loads in a blink',
      'iPhone and Android apps from one codebase',
      'pages search engines and AI can read',
      'automation for work nobody wants to do',
      'a dashboard that updates itself',
    ],
    summary:
      'We build AI that reads documents, fast websites, iPhone and Android apps, pages that search engines and AI can read, automation and dashboards.',
  },

  /** The moving line under the hero. */
  ticker: {
    items: [
      'AI assistants',
      'Document automation',
      'Websites',
      'SEO and AI search',
      'iPhone and Android apps',
      'Web apps',
      'Dashboards',
      'Data pipelines',
    ],
  },

  offers: {
    eyebrow: 'What we do',
    headline: ['What we can', '{em}build for you.{/em}'],
    intro:
      'You don’t need the jargon to work with us. Here’s what we build and what you get.',
    getLabel: 'You get',
    items: [
      {
        key: 'ai',
        name: 'AI Engineering',
        title: 'AI that does the busywork',
        body: 'We build assistants that read your documents, pull out what matters and fill in your systems. When a mistake would cost money, a person checks it first.',
        points: [
          'Invoices, contracts and forms read for you',
          'A person’s sign-off where it counts',
          'Code and tests, handed over',
        ],
        link: { label: 'How we build AI systems', href: '/services/ai-engineering/' },
      },
      {
        key: 'seo',
        name: 'SEO & AI Search',
        title: 'Easy to find, easy to quote',
        body: 'Search engines and AI assistants read your site’s code before they show you to anyone. We make that code clear, complete and fast.',
        points: [
          'Pages that load fast and read in full',
          'Labels that tell machines who you are',
          'A summary file for AI assistants',
        ],
        link: { label: 'How we do technical SEO', href: '/services/seo/' },
      },
      {
        key: 'web',
        name: 'Websites & Apps',
        title: 'One build, on every screen',
        body: 'We build websites, web apps and apps for iPhone and Android. The phone apps share one codebase, so a fix lands on both at once.',
        points: [
          'Fast before anyone tunes it',
          'One codebase for iOS and Android',
          'Strict security settings by default',
        ],
        link: { label: 'How we build sites and apps', href: '/services/software/' },
      },
      {
        key: 'sys',
        name: 'Systems we run',
        title: 'We run what we build',
        body: 'We built the engine behind ADJL Capital’s property decisions, and it’s still running. Paste in a listing link and it returns a file where every figure names its source.',
        points: [
          'Every number says where it came from',
          'Unaudited figures say so',
          'New methods tried on our own systems first',
        ],
        link: { label: 'See the systems', href: '/work/' },
      },
    ] satisfies Offer[],

    /** The strip that closes the section: a request in plain words, the
     *  code written for it, and the page that comes out. One made-up
     *  request, drawn as an illustration; `caption` says so in a sentence. */
    build: {
      steps: ['You say', 'We write', 'You get'],
      say: '“We need a booking page that takes a deposit.”',
      code: ['<BookingPage>', '  <Calendar />', '  <Deposit />', '</BookingPage>'],
      ui: { title: 'Book a time', button: 'Pay deposit', ready: 'ready' },
      caption: 'It starts with a sentence. We write the code, test it, and hand you something people can use.',
    },
  },

  /** Labels inside the four drawings. Mono, short, and never a result:
   *  every value is a bar or a row of dots. */
  art: {
    ai: {
      docs: 'documents',
      fields: 'fields',
      keys: ['name', 'date', 'total', 'terms'],
      gate: 'review',
      held: 'held',
      approved: 'approved',
    },
    seo: {
      page: 'your page',
      tags: ['<title>', '<h1>', '{ data }'],
      readers: ['search engine', 'AI answer'],
    },
    web: {
      source: 'one codebase',
      file: 'app.tsx',
      code: ['<Screen>', '  <Header />', '  <Chart />', '  <Button />', '</Screen>'],
      phone: 'iPhone · Android',
      site: 'website',
      same: 'same screen',
    },
    sys: {
      link: 'https://••••/listing/••••',
      in: 'listing link',
      engine: 'engine',
      file: 'sourced file',
      mask: '••••',
      rows: [
        { key: 'rent', source: 'rent listings' },
        { key: 'comps', source: 'recent sales' },
        { key: 'taxes', source: 'public record' },
      ],
      flag: { key: 'repairs', source: 'unaudited' },
    },
  },

  /** The band between the portfolio and the proof sections. */
  cta: {
    headline: ['Have something in mind?', 'Let’s {em}build it.{/em}'],
    body: 'Send a few lines about what you need, and Daniel will answer you himself.',
    button: { label: 'Start a conversation', href: '#contact' },
    email: CONTACT,
  },
};
