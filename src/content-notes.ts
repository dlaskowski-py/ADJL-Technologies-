/**
 * ADJL Technology: /notes/ (field notes) and each note under it.
 *
 * STUB written by the foundation so the routes build. WS-N (notes +
 * changelog) replaces every word here, and the page modules' bodies with
 * it. Each note's datePublished lives in scripts/pages.mjs (`note.published`).
 *
 * Same conventions as src/content.ts: headlines are arrays of lines,
 * {em}…{/em} marks one emphasized phrase per headline, and {k}…{/k} marks a
 * technical term in body copy. Edit words here, never in a renderer.
 */

import type { SectionPage } from './content-types';

export const hub: SectionPage = {
  meta: {
    title: 'Field Notes | ADJL Technology',
    description: 'Field notes from ADJL Technology. Short write-ups of real work on this site and our own systems. The first ones are being written.',
    ogTitle: 'Field notes from real work.',
  },
  hero: {
    eyebrow: 'Notes',
    headline: ['Field notes', 'from {em}real work.{/em}'],
    lead: 'Short write-ups of things we built and checked. The first notes are being written.',
    secondary: { label: 'Talk to Daniel', href: '#contact' },
  },
  sections: [
    {
      id: 'notes',
      eyebrow: 'Notes',
      headline: ['The first notes', '{em}are coming.{/em}'],
      links: [
        { label: 'What AI crawlers read', href: '/notes/what-ai-crawlers-read/' },
        { label: 'A build that refuses to overclaim', href: '/notes/a-build-that-refuses-to-overclaim/' },
        { label: 'Research that can’t fool itself', href: '/notes/research-that-cannot-fool-itself/' },
      ],
    },
  ],
};

export const notes: Record<'crawlers' | 'overclaim' | 'research', SectionPage> = {
  crawlers: {
    meta: {
      title: 'What AI Crawlers Read | ADJL Technology',
      description: 'A field note on what search crawlers and AI answer engines are handed when they fetch a page. This note is being written.',
      ogTitle: 'What AI crawlers read.',
    },
    hero: {
      eyebrow: 'Field note',
      headline: ['What AI', '{em}crawlers read.{/em}'],
      lead: 'A field note on what search crawlers and AI answer engines are handed when they fetch a page. This note is being written.',
    },
    sections: [],
  },
  overclaim: {
    meta: {
      title: 'A Build That Refuses to Overclaim | ADJL Technology',
      description: 'A field note on the checks that stop this site from saying more than it can show. This note is being written.',
      ogTitle: 'A build that refuses to overclaim.',
    },
    hero: {
      eyebrow: 'Field note',
      headline: ['A build that refuses', 'to {em}overclaim.{/em}'],
      lead: 'A field note on the checks that stop this site from saying more than it can show. This note is being written.',
    },
    sections: [],
  },
  research: {
    meta: {
      title: 'Research That Can’t Fool Itself | ADJL Technology',
      description: 'A field note on how our research keeps itself honest, and why we show the method and leave out the numbers. This note is being written.',
      ogTitle: 'Research that can’t fool itself.',
    },
    hero: {
      eyebrow: 'Field note',
      headline: ['Research that', '{em}can’t fool itself.{/em}'],
      lead: 'A field note on how our research keeps itself honest, and why we show the method and leave out the numbers. This note is being written.',
    },
    sections: [],
  },
};
