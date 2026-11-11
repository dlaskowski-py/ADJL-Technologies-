/**
 * ADJL Technology: /work/agentic-research/, how the team researches with
 * AI agents, and the paper-trading agents that test what it finds.
 *
 * STUB written by the foundation so the route builds. WS-R (research +
 * Loep) replaces every word here, and the page module's body with it.
 * Method only, no numbers: no returns, no comparison with an index, no
 * counts, amounts, parameters, tickers or strategy names. Facts come only
 * from the verified fact sheet.
 *
 * Same conventions as src/content.ts: headlines are arrays of lines,
 * {em}…{/em} marks one emphasized phrase per headline, and {k}…{/k} marks a
 * technical term in body copy. Edit words here, never in a renderer.
 */

import type { SectionPage } from './content-types';

export const content: SectionPage = {
  meta: {
    title: 'Agentic Research with AI Agents | ADJL Technology',
    description:
      'How ADJL Technology’s team researches with AI agents, and the paper-trading agents that test what it finds. The method only, no numbers.',
    ogTitle: 'Research run with AI agents.',
  },
  hero: {
    eyebrow: 'Case study · Agentic research',
    headline: ['Research run', 'with {em}AI agents.{/em}'],
    lead: 'How our team researches with AI agents, and the paper-trading agents that test what it finds. This page is being written. It will describe the method and leave the numbers out.',
    secondary: { label: 'Talk to Daniel', href: '#contact' },
  },
  sections: [
    {
      id: 'method',
      eyebrow: 'Method',
      headline: ['The method,', '{em}coming next.{/em}'],
      body: ['Loep is the research tool this work feeds. Its page describes the tool today.'],
      links: [{ label: 'Loep', href: '/work/loep/' }],
    },
  ],
  foot: {
    builtUnder: [{ label: 'AI Engineering', href: '/services/ai-engineering/' }],
    next: { label: 'Loep', href: '/work/loep/' },
  },
};
