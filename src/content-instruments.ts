/**
 * Instrument copy that src/content.ts doesn't carry: the labels, readouts
 * and stage notes inside the demos. One export per instrument, each owned
 * by the workstream that builds it. Same house rules as every content
 * module: US English, contractions, short plain sentences, ’ apostrophes.
 *
 * None of this ships as JavaScript. Renderers write what a module needs
 * into the page (a JSON block or attributes), so the copy stays in the HTML.
 */

/** Ask This Site (src/sections/instruments/ask.ts, src/motion/ask.ts,
 *  scripts/gen-machine.mjs). The question copy, chips, abstain sentence and
 *  announcements live in content.ts `ask`. */
export const askUi = {
  title: 'ask · retrieval console',
  /** The index status readout in the panel head. */
  index: {
    idle: 'index loads on first use',
    loading: 'loading index',
    ready: '{n} passages · {kb} kB',
    failed: 'index didn’t load',
  },
  tryLabel: 'Try',
  /** Under each stage name before the first question. */
  idle: {
    query: 'Your words, lowercased and cut to stems. Common words drop out.',
    retrieve: 'Every passage on this site, scored with BM25.',
    gate: 'Nothing under the floor gets quoted.',
    answer: 'Up to three passages from different sections, each with a link.',
  },
  /** Column heads in RETRIEVE. */
  cols: { passage: 'passage', conf: 'conf', score: 'bm25' },
  stop: 'stop',
  unseen: 'unseen',
  df: 'df {n}',
  /** A compound question's parts. */
  part: 'Q{n}',
  floorAt: 'floor {v}',
  above: '{n} above the floor',
  none: 'none above the floor',
  sections: '{n} cited from {s} sections',
  sectionsOne: '1 cited',
  noTerms: 'Every word in that question is a stopword. Try naming the thing you’re asking about.',
  noMatch: 'No passage on this site shares a word with that question.',
  /** ABSTAIN detail, under the content.ts abstain sentence. */
  abstainWhy: 'Best match {best}, floor {floor}.',
  abstainLabel: 'Abstained',
  answerLabel: 'Answered',
  /** The prerendered answers for JavaScript off. */
  preLabel: 'Q{n} · answered at build',
  preNote: 'With JavaScript off, these were answered when the site was built, by the same code your browser runs.',
  /** "Break the input": what each group has to do, checked at build. */
  expect: {
    answer: 'must answer',
    abstain: 'must abstain',
    'answer-2': 'must cite two sections',
  },
  /** Shown beside a group once it's run at the current floor. */
  verdict: { met: 'as expected', missed: 'not at this floor' },
  floorScale: { low: 'answers more', high: 'answers less' },
};
