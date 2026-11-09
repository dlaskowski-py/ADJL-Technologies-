/**
 * ADJL Technology: /work/, the index over the case pages.
 *
 * The cards are the home page's `systems.items` (one source, in
 * src/content.ts), so a system can't be described two ways on two pages.
 * Each card carries `tags` (practice keys); the filter radios below select
 * on them with JS, and every card is visible without it. The contact block
 * is the shared one.
 *
 * Same conventions as src/content.ts: headlines are arrays of lines,
 * {em}…{/em} marks one emphasized phrase per headline, and {k}…{/k} marks a
 * technical term in body copy. Edit words here, never in a renderer.
 */

import type { Hero, Meta } from './content-types';
import { systems, type PracticeKey, type SystemCard } from './content';

export type WorkFilter = {
  legend: string;
  options: { value: 'all' | PracticeKey; label: string }[];
};

export type WorkContent = {
  meta: Meta;
  hero: Hero;
  filter: WorkFilter;
  items: SystemCard[];
};

/** The filter radios (#filter, JS only). Values match SystemCard.tags. */
export const filter: WorkFilter = {
  legend: 'Filter by practice',
  options: [
    { value: 'all', label: 'All' },
    { value: 'ai', label: 'AI' },
    { value: 'seo', label: 'SEO' },
    { value: 'software', label: 'Software' },
    { value: 'systems', label: 'Systems' },
  ],
};

export const content: WorkContent = {
  meta: {
    title: 'AI, Software and SEO Work | ADJL Technology',
    description:
      'Systems we built and run: property underwriting, trading and research pipelines, a native investor app, a gated members’ site and this website.',
    ogTitle: 'What we’ve built, and how it works.',
    ogDescription:
      'Each page walks one system stage by stage. What goes in, what each stage does, and the decisions a buyer would otherwise have to ask about.',
  },
  hero: {
    eyebrow: 'Work',
    headline: ['What we’ve built,', 'and how it {em}works.{/em}'],
    lead: 'Each page walks one system stage by stage. What goes in, what each stage does, and the decisions a buyer would otherwise have to ask about. No outcomes are quoted. The mechanism is the part you can check.',
    secondary: { label: 'Talk to Daniel', href: '#contact' },
  },
  filter,
  items: systems.items,
};

export const meta = content.meta;
