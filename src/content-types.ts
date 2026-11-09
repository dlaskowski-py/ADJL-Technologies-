/**
 * The shapes every content module conforms to.
 *
 * Content modules hold every human-readable sentence on the site; section
 * renderers turn these shapes into markup. The types are the contract
 * between the two, so a renderer can't silently ignore a field the copy
 * relies on, and a content edit can't invent a field no renderer reads.
 *
 * Conventions (unchanged from the original site):
 *   - Headlines are ARRAYS. Each entry renders as its own line.
 *   - {em}…{/em} marks exactly ONE emphasized phrase per headline.
 *   - {k}…{/k} marks a technical term in body copy only, never a headline.
 *   - Apostrophes are ’ (U+2019).
 */

export type Link = { label: string; href: string };

export type Meta = {
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
};

export type Spec = { label: string; value: string };

export type Hero = {
  eyebrow: string;
  headline: string[];
  lead: string;
  primary?: Link;
  /** Every hero's secondary CTA is "Talk to Daniel" → #contact. */
  secondary?: Link;
  /** Optional spec rail under the lead (service and case pages). */
  specs?: Spec[];
};

/** A titled item: an h3 and its paragraph. */
export type Item = { title: string; body: string };

export type FaqItem = { q: string; a: string };

export type Faq = { eyebrow: string; headline: string[]; items: FaqItem[] };

/**
 * Which instrument (if any) a section embeds below its copy. The renderer
 * for each lives in src/sections/instruments/ and reads its own fixed copy
 * from src/content.ts (ask, machineView, status, prov).
 */
export type Instrument =
  | 'machine-full'
  | 'machine-parity'
  | 'machine-schema'
  | 'machine-surfaces'
  | 'ask-home'
  | 'ask-full'
  | 'replay-full'
  | 'replay-compact'
  | 'telemetry'
  | 'leaders-parity'
  | 'leaders-seal'
  | 'leaders-pit'
  | 'leaders-clocks'
  | 'headers'
  | 'readers'
  | 'guards'
  | 'weights';

/**
 * The generic section. Every field after the headline is optional and
 * renders in this order: body paragraphs, items grid, plain list, table,
 * definition list, the instrument, then the links row.
 */
export type Section = {
  /** The section's id (no '#'): its anchor and its place in Source view. */
  id: string;
  eyebrow: string;
  headline: string[];
  body?: string[];
  items?: Item[];
  list?: string[];
  table?: { head: string[]; rows: string[][] };
  dl?: Spec[];
  /** Caption above the definition list. */
  dlLabel?: string;
  instrument?: Instrument;
  /** The section's content is hatched: "deliberately not shown". The
   *  string is the hatch label, e.g. "Withheld from this page". */
  hatch?: string;
  links?: Link[];
};

/** "Built under" and "Next" on every case page. */
export type CaseFoot = {
  builtUnder: Link[];
  next: Link;
};

/** A new page built entirely from sections: the services hub, the three
 *  service pages and the three new case pages. */
export type SectionPage = {
  meta: Meta;
  hero: Hero;
  sections: Section[];
  faq?: Faq;
  foot?: CaseFoot;
};

/** Sections an existing case page gains in the rebuild, by position. The
 *  three original case pages keep their own spine (hero, problem, build,
 *  detail) and slot these in around it. */
export type CaseExtras = {
  afterProblem?: Section[];
  afterBuild?: Section[];
};
