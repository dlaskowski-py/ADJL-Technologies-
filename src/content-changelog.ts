/**
 * ADJL Technology: /changelog/, what changed on this site, and when.
 *
 * STUB written by the foundation so the route builds. WS-N (notes +
 * changelog) replaces every word here, and the page module's body with it.
 * The repository is public, so entries may link to commits on GitHub
 * (check-links has to allowlist that host first).
 *
 * Same conventions as src/content.ts: headlines are arrays of lines,
 * {em}…{/em} marks one emphasized phrase per headline, and {k}…{/k} marks a
 * technical term in body copy. Edit words here, never in a renderer.
 */

import type { SectionPage } from './content-types';

export const content: SectionPage = {
  meta: {
    title: 'Changelog | ADJL Technology',
    description: 'What changed on this site, and when. The changelog is being written, and its entries will link to the commits behind them.',
    ogTitle: 'What changed, and when.',
  },
  hero: {
    eyebrow: 'Changelog',
    headline: ['What changed,', 'and {em}when.{/em}'],
    lead: 'Every change to this site, dated, with the commit behind it. The first entries are being written.',
    secondary: { label: 'Talk to Daniel', href: '#contact' },
  },
  sections: [],
};
