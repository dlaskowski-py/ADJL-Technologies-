/**
 * ADJL Technology: /scan/, "See what AI sees on your site".
 *
 * STUB written by the foundation so the route builds. WS-S (scanner +
 * audit) replaces every word here, and the page module's body with it.
 * The section with id "scanner" is where the scanner mounts: the page
 * module gives it [data-scan], the contract src/motion/scan.ts loads on.
 *
 * Same conventions as src/content.ts: headlines are arrays of lines,
 * {em}…{/em} marks one emphasized phrase per headline, and {k}…{/k} marks a
 * technical term in body copy. Edit words here, never in a renderer.
 */

import type { SectionPage } from './content-types';

export const content: SectionPage = {
  meta: {
    title: 'See What AI Sees on Your Site | ADJL Technology',
    description:
      'Enter a web address and see the page the way a search crawler or an AI answer engine is handed it. The scanner is being built.',
    ogTitle: 'See what AI sees on your site.',
  },
  hero: {
    eyebrow: 'Scan your site',
    headline: ['See what AI', '{em}sees on your site.{/em}'],
    lead: 'Enter a web address and get the page the way a crawler or an AI answer engine reads it. The scanner isn’t switched on yet. Until it is, our SEO page says what we look for.',
    primary: { label: 'What we look for', href: '/services/seo/' },
    secondary: { label: 'Talk to Daniel', href: '#contact' },
  },
  sections: [
    {
      id: 'scanner',
      eyebrow: 'The scanner',
      headline: ['Not switched', '{em}on yet.{/em}'],
      body: [
        'This is where the scanner goes. It isn’t built yet, so there’s nothing to try here today. When it’s ready, it will fetch the page you name and show what a machine gets back.',
      ],
    },
  ],
};
