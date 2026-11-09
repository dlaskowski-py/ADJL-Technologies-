/**
 * Copy for the portfolio's animated previews (sections/landing/showcase.ts).
 * The cards themselves (kicker, status, title, body, link) come from
 * content.ts `systems`; this module only holds the labels drawn INSIDE each
 * preview, keyed by the card's link, so a card and its drawing can't be
 * paired wrong.
 *
 * Same house rules as every content module: US English, ’ apostrophes, no
 * hype words, no counts of clients or projects, nothing claimed that hasn't
 * happened. And three of the previews' own:
 *
 *   - A preview shows what a system DOES, never what it returned. Every
 *     value is the mask below. No tickers, no figures, no client names.
 *   - Labels are lowercase and short. They're set in the mono face at 10px
 *     inside a frame that can be 280px wide, so the lengths noted on each
 *     line are limits, not suggestions.
 *   - `bar` is the caption in the frame's title bar. It sits beside the
 *     provenance chip, so keep it to 18 characters.
 *
 * OWNER: WS-C (showcase).
 */

/** How a withheld value is drawn. */
const MASK = '••••';

export type ShowcaseTone = 'data' | 'model' | 'warn';

export const showcase = {
  mask: MASK,
  /* A state color never stands alone: the unaudited row gets this glyph
     and its word. */
  flag: '▲',

  '/work/real-estate-intelligence/': {
    bar: 'engine/file',
    /* The pasted link. example is a reserved name: it can't be a real listing. */
    url: `listing.example/${MASK}`,
    pasted: 'pasted',
    /* One row of the file each: the line, and the source it names (13
       characters at most). Teal for a record someone else keeps, violet
       for a figure the engine modeled. Exactly one row is `flag`: the one
       nobody has verified, which says so in amber. */
    rows: [
      { name: 'parcel', source: 'county record', tone: 'data' },
      { name: 'rents', source: 'live listing', tone: 'data' },
      { name: 'tax', source: 'estimate', tone: 'model' },
      { name: 'expenses', source: 'unaudited', tone: 'warn', flag: true },
    ] as { name: string; source: string; tone: ShowcaseTone; flag?: boolean }[],
  },

  '/work/trading-infrastructure/': {
    bar: 'feed/brief',
    feeds: 'feeds',
    normalize: 'normalize',
    stream: 'one stream',
    brief: 'evening brief',
  },

  '/work/mobile-app/': {
    bar: 'iOS · Android',
    offline: 'offline',
    /* Left of the phone: 10 characters at most. */
    net: 'no network',
    slider: 'assumption',
    result: 'result',
    /* Right of the phone: 10 characters at most. */
    done: 'recomputed',
  },

  '/work/private-site/': {
    bar: 'edge/session',
    edge: 'edge check',
    signed: 'signed',
    unknown: 'unknown',
    page: 'page',
    refused: 'refused',
  },

  '/work/this-site/': {
    bar: 'adjltechnology.com',
    /* Three of the status bar's readouts (content.ts status.metrics). The
       drawing shows the labels and masks the values: the real ones are in
       the bar at the bottom of this page. */
    readouts: ['html', 'css', 'LCP'],
    readoutMask: '••',
  },

  '/work/ai-implementation/': {
    bar: 'workflow/review',
    doc: 'document',
    fields: 'fields',
    gate: 'review gate',
    held: 'held',
    approved: 'approved',
  },
};
