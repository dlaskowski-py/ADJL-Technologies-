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
 *   - Labels are lowercase and short. They're set in the mono face at 11px
 *     inside a frame that can be 240px wide, where a full line is 32
 *     characters. The lengths noted on each line are limits, not
 *     suggestions: a longer label collides with its neighbor on a phone.
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
    /* The file's column heads: 6 characters at most. */
    cols: ['line', 'value', 'source'],
    /* One row of the file each: the line (8 characters at most) and the
       source it names (13 at most). Teal for a record someone else keeps,
       violet for a figure the engine modeled. Exactly one row is `flag`:
       the one nobody has verified, which says so in amber. `step` is when
       the row arrives, 2 to 6: rows that come from one source share one. */
    rows: [
      { name: 'parcel', source: 'county record', tone: 'data', step: 2 },
      { name: 'rents', source: 'live listing', tone: 'data', step: 3 },
      { name: 'comps', source: 'live listing', tone: 'data', step: 3 },
      { name: 'history', source: 'public record', tone: 'data', step: 4 },
      { name: 'tax', source: 'modeled', tone: 'model', step: 5 },
      { name: 'expenses', source: 'unaudited', tone: 'warn', step: 6, flag: true },
    ] as { name: string; source: string; tone: ShowcaseTone; step: number; flag?: boolean }[],
  },

  '/work/trading-infrastructure/': {
    bar: 'feed/brief',
    /* Column heads, left to right: 5, 9 and 13 characters at most. */
    feeds: 'feeds',
    normalize: 'normalize',
    brief: 'evening brief',
    /* Under the line between them: 10 characters at most. */
    stream: 'one stream',
  },

  '/work/mobile-app/': {
    bar: 'iOS · Android',
    /* On the phone's screen: 10 characters at most. */
    offline: 'offline',
    slider: 'assumption',
    result: 'result',
    /* The notes beside the phone, top to bottom: 12 characters at most. */
    net: 'no network',
    moved: 'input moved',
    done: 'recomputed',
  },

  '/work/private-site/': {
    bar: 'edge/session',
    /* Column heads, left to right: 7, 10 and 5 characters at most. */
    request: 'request',
    edge: 'edge check',
    page: 'page',
    /* The two requests, and what the second one gets: 7 characters at most. */
    signed: 'signed',
    unknown: 'unknown',
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
    /* Column heads, left to right: 8, 6 and 11 characters at most. */
    doc: 'document',
    fields: 'fields',
    gate: 'review gate',
    /* 4 and 8 characters at most. */
    held: 'held',
    approved: 'approved',
  },
};
