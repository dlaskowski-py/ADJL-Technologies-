/**
 * ADJL Technology: /start/ (start a project) and /start/sent/ (the form's
 * thank-you page, noindex).
 *
 * STUB written by the foundation so the routes build. WS-A (assistant +
 * intake) replaces every word here, and the page modules' bodies with it.
 * The section with id "intake" is where the assistant and the form mount:
 * the page module gives it [data-assistant], the contract
 * src/motion/assistant.ts loads on. Its link to /start/sent/ is only there
 * so the stub reaches that page; the form's action does it for real.
 *
 * Same conventions as src/content.ts: headlines are arrays of lines,
 * {em}…{/em} marks one emphasized phrase per headline, and {k}…{/k} marks a
 * technical term in body copy. Edit words here, never in a renderer.
 */

import { CONTACT } from './content';
import type { SectionPage } from './content-types';

export const content: SectionPage = {
  meta: {
    title: 'Start a Project | ADJL Technology',
    description:
      'Tell ADJL Technology what you want built. The form and the scoping assistant are on their way. Until then, email Daniel.',
    ogTitle: 'Tell us what you want built.',
  },
  hero: {
    eyebrow: 'Start a project',
    headline: ['Tell us what', 'you {em}want built.{/em}'],
    lead: 'A few lines is plenty. The form, and an assistant that helps you write them, are being built. Until they’re here, email Daniel. He reads every message himself.',
    primary: { label: 'Email Daniel', href: `mailto:${CONTACT}` },
  },
  sections: [
    {
      id: 'intake',
      eyebrow: 'The form',
      headline: ['The form', '{em}comes next.{/em}'],
      body: ['There’s no form on this page yet. The address above reaches Daniel today, and it always will.'],
      links: [{ label: 'What happens after you send', href: '/start/sent/' }],
    },
  ],
};

/** /start/sent/: where the form lands. */
export const sent: SectionPage = {
  meta: {
    title: 'Message Sent | ADJL Technology',
    description: 'Your message is on its way to Daniel. He reads every one himself and answers by email.',
    ogTitle: 'Your message is on its way.',
  },
  hero: {
    eyebrow: 'Message sent',
    headline: ['Your message', '{em}is on its way.{/em}'],
    lead: 'Daniel reads every message himself and answers by email, usually within a day or two.',
    primary: { label: 'See what we’ve built', href: '/work/' },
  },
  sections: [],
};
