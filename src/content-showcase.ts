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

  '/work/loep/': {
    bar: 'loep/scanner',
    /* Column heads, left and right: 7 and 8 characters at most. The number
       is the sheet's own (Loep's screens are numbered sheets), not a result. */
    place: 'address',
    sheet: 'sheet 01',
    /* One ruled line of the sheet each, and the sheet is ruled for three:
       the figure (5 characters at most) and the source printed beside it
       (7 at most). `step` is when the line arrives, 2 to 4, after the pin
       has landed on step 1. */
    rows: [
      { name: 'price', source: 'listing', step: 2 },
      { name: 'taxes', source: 'county', step: 3 },
      { name: 'area', source: 'census', step: 4 },
    ] as { name: string; source: string; step: number }[],
    /* Beside the box the person ticks, once it's ticked: 15 characters at most. */
    confirmed: 'price confirmed',
    /* The run that waits for that tick: 5 characters at most. */
    model: 'model',
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

  '/work/agentic-research/': {
    /* Short on purpose: beside the chip on a 320px phone, the bar has room
       for about a dozen characters before it clips. */
    bar: 'research/log',
    /* In the bar, before the mask: the question nobody outside sees.
       8 characters at most. */
    question: 'question',
    /* Beside it, after a tick, once the owner has approved the plan:
       8 characters at most. */
    approved: 'approved',
    /* Column heads, left to right: 4, 10 and 7 characters at most. The
       ideas are masked; the middle one is the blind control every idea
       is measured against, on the same days. */
    cols: ['idea', 'vs control', 'verdict'],
    /* A row's verdict: 4 characters at most. Most rows fail, and the log
       says so; which ones and by how much is the drawing's, not the
       research's. */
    fail: 'fail',
    pass: 'pass',
    /* The paper ledger under the log, left and right: 8 and 10 characters
       at most. */
    paper: 'on paper',
    close: 'each close',
  },

  '/work/mobile-app/': {
    bar: 'iPhone · Android',
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
