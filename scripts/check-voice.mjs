/**
 * The register guard.
 *
 * Every other check on this site tests a fact: does the class have a rule,
 * does the link resolve, does the color clear its floor. This one tests a
 * habit, and it exists because the habit was invisible from the inside.
 *
 * The first version of this site read, in the client's words, "too AI-ish".
 * He was right, and counting said exactly why: 53 em-dashes in 8,866 words
 * (published prose runs about one per thousand), 31 "rather than", 36
 * setup-then-payoff colons, uncontracted forms outnumbering contractions
 * more than two to one, and only 5% of sentences under eight words. Every
 * sentence was a polished aphorism carrying a reversal. No single sentence
 * was wrong; the density was.
 *
 * So this measures density, not vocabulary. The thresholds sit above where
 * the copy currently lands, with room for an edit that legitimately needs a
 * dash. They're there to catch a drift back to the reflex, not to ration
 * punctuation. If a threshold trips, the fix is to vary the writing, not to
 * raise the number.
 *
 * WHAT IT READS. Since the rebuild, the pages carry instruments: readouts,
 * provenance chips, a Machine View panel that lists every heading, the
 * precomputed Ask answers, code panes. None of that is writing, and a row
 * of "LCP 0.38 s · CLS 0.000 · dom 1,184" has no full stop, so it glues
 * itself onto the next paragraph as one enormous "sentence" and fails the
 * average-length check for reasons that have nothing to do with the copy.
 *
 * So the page is read through the site's one tokenizer and its one
 * exclusion set (src/lib/exclude.ts): script, style, svg, template and
 * noscript, and every subtree marked aria-hidden, data-chrome, data-machine,
 * data-ask-pre or data-source-sheet. This guard alone also drops pre, code,
 * samp and kbd. The <title> still counts. A title is copy, and the em-dash
 * the old titles carried in every tab was exactly the kind of thing this is
 * here to see.
 *
 * AN EXCLUSION IS NOT A HIDING PLACE. The set names containers, not words,
 * and the guard prints how many words it dropped and why. If the dropped
 * share passes 25% of the site's AUTHORED words, it fails: at that point
 * the "chrome" is the site, and the copy budget is being met by moving
 * prose out of view of the counter. check-claims and check-usage still read
 * every word, excluded or not.
 *
 * Derived text is kept out of that share entirely. Machine View's readout,
 * Ask's precomputed answers and Source view's sheets are generated FROM the
 * page: they quote its headings and passages, which are already counted as
 * prose where they were written. Counting the quote as "hidden prose" would
 * double-count the same sentence and make the cap measure how many
 * instruments a page has, not how much writing it hides. They're printed
 * on their own line so nothing disappears from the report.
 *
 * SOFT WORDS. The rebuild added one more density: the vocabulary of
 * generated marketing copy (seamless, leverage, empower, elevate, unlock,
 * harness, delve, robust, utilize). Each is a fine word once. Several per
 * thousand is a register, and it's the one the client heard.
 */
import { readFileSync } from 'node:fs';
import { PAGES } from './pages.mjs';
import { splitText } from './lib-text.mjs';
import { pass } from './lib/report.mjs';

/* Per 1,000 words of shipped copy, except where noted. */
const LIMITS = {
  emDash: { max: 2.2, label: 'em-dash asides', fix: 'Make it a full stop, a comma, or nothing.' },
  ratherThan: { max: 1.6, label: '"rather than"', fix: 'Use "not", or "instead of", or rebuild so the contrast is implied.' },
  setupColon: { max: 1.4, label: 'setup-then-payoff colons', fix: 'A colon before a list is fine. One before a restated clause is the tic. Use a full stop.' },
  uncontracted: { max: 7.5, label: 'uncontracted forms', fix: 'Write "don\'t", "it\'s", "isn\'t" the way a person writing about their own business would.' },
  /* The aphoristic closer. Stripping the em-dashes moved the reflex here
     instead of removing it: seventeen paragraphs ended on a short "That's
     the X", and "That's the trade" alone turned up three times. Occasional
     is fine and lands well. One every 450 words is the same tic wearing a
     different coat. */
  thatsCloser: { max: 1.3, label: '"That\'s the X" closers', fix: 'Fold it into the sentence before, or end on the point itself.' },
  soft: { max: 0.3, label: 'soft words (seamless, leverage, empower…)', fix: 'Say what the thing does. "Connects to your CRM", not "seamlessly integrates".' },
};

/** Share of sentences that are short and do nothing clever. */
const MIN_SHORT_PCT = 8;
const MAX_AVG_WORDS = 19.5;
/** Most of the site may not be "not prose". */
const MAX_EXCLUDED_PCT = 25;

let text = '';
let excludedWords = 0;
const byReason = {};
const perPage = [];

for (const page of PAGES) {
  const s = splitText(readFileSync(page.out, 'utf8'), { voice: true });
  text += s.text + '\n';
  excludedWords += s.excludedWords;
  for (const [r, n] of Object.entries(s.byReason)) byReason[r] = (byReason[r] ?? 0) + n;
  perPage.push({ route: page.route, words: s.words, excluded: s.excludedWords });
}
text = text.replace(/[ \t]+/g, ' ');

const words = text.split(/\s+/).filter(Boolean).length;
const per1k = (n) => (n / words) * 1000;
const count = (re) => (text.match(re) || []).length;

const measured = {
  emDash: count(/—/g),
  ratherThan: count(/\brather than\b/gi),
  /* A colon whose clause carries NO comma before the sentence ends.
     The first version of this counted every mid-sentence colon and flagged
     26 of them, of which about 22 were introducing a list, which is
     ordinary punctuation in any register and not a tell. What is a tell is
     the colon that sets up a single restated clause, and a list has commas
     in it while a punchline doesn't. Measuring the blunt version would have
     meant rewriting correct sentences to satisfy a bad metric. */
  setupColon: count(/[a-z]: [a-z][^.!?,]{0,120}[.!?]/g),
  uncontracted: count(/\b(do not|does not|did not|is not|are not|was not|cannot|will not|would not|it is|there is|that is)\b/gi),
  thatsCloser: count(/That[’']s [^.!?]{0,75}[.!?]/g),
  soft: count(
    /\b(seamless(ly)?|leverag(e|es|ed|ing)|empower(s|ed|ing)?|elevat(e|es|ed|ing)|unlock(s|ed|ing)?|harness(es|ed|ing)?|delv(e|es|ed|ing)|robust(ly)?|utiliz(e|es|ed|ing))\b/gi,
  ),
};

let bad = 0;
/** Containers whose text is generated from the page itself. */
const DERIVED = new Set(['data-machine', 'data-ask-pre', 'data-source-sheet']);
const derivedWords = Object.entries(byReason)
  .filter(([r]) => DERIVED.has(r))
  .reduce((a, [, n]) => a + n, 0);
const totalWords = words + excludedWords - derivedWords;
const excludedPct = totalWords ? ((excludedWords - derivedWords) / totalWords) * 100 : 0;
console.log(`check-voice: ${words} words of prose across ${PAGES.length} pages`);

for (const [key, limit] of Object.entries(LIMITS)) {
  const rate = per1k(measured[key]);
  const ok = rate <= limit.max;
  console.log(
    `  ${ok ? 'ok  ' : 'FAIL'} ${rate.toFixed(1).padStart(5)} / ${String(limit.max).padStart(4)} per 1k  ${limit.label} (${measured[key]} total)`,
  );
  if (!ok) {
    console.error(`        ${limit.fix}`);
    bad++;
  }
}

const sentences = text
  .split(/(?<=[.?!])\s+/)
  .map((s) => s.trim())
  .filter((s) => s.length > 25);
const lens = sentences.map((s) => s.split(/\s+/).length);
const avg = lens.length ? lens.reduce((a, b) => a + b, 0) / lens.length : 0;
const shortPct = lens.length ? (lens.filter((l) => l < 8).length / lens.length) * 100 : 0;

const avgOk = avg <= MAX_AVG_WORDS;
const shortOk = shortPct >= MIN_SHORT_PCT;
console.log(`  ${avgOk ? 'ok  ' : 'FAIL'} ${avg.toFixed(1).padStart(5)} / ${MAX_AVG_WORDS} words     average sentence length`);
console.log(`  ${shortOk ? 'ok  ' : 'FAIL'} ${shortPct.toFixed(1).padStart(5)} / ${MIN_SHORT_PCT}%       sentences under 8 words`);
if (!avgOk) {
  console.error('        Break the long ones up. Not every sentence needs a turn in it.');
  bad++;
}
if (!shortOk) {
  console.error('        Let some sentences be short and flat. "We build it. Then you own it."');
  bad++;
}

/* The exclusion cap, with the breakdown printed every time so a reviewer
   can see what was dropped without rerunning anything. */
const exclOk = excludedPct <= MAX_EXCLUDED_PCT;
const reasons = Object.entries(byReason)
  .filter(([r]) => !DERIVED.has(r))
  .sort((a, b) => b[1] - a[1])
  .map(([r, n]) => `${r} ${n}`)
  .join(', ');
console.log(
  `  ${exclOk ? 'ok  ' : 'FAIL'} ${excludedPct.toFixed(1).padStart(5)} / ${MAX_EXCLUDED_PCT}%      words excluded as not prose (${excludedWords - derivedWords} of ${totalWords}${reasons ? `: ${reasons}` : ''})`,
);
const derived = Object.entries(byReason)
  .filter(([r]) => DERIVED.has(r))
  .map(([r, n]) => `${r} ${n}`)
  .join(', ');
if (derivedWords) console.log(`       derived from the page, outside the cap: ${derivedWords} words (${derived})`);
if (!exclOk) {
  const worst = perPage
    .map((p) => ({ ...p, pct: (p.excluded / Math.max(1, p.words + p.excluded)) * 100 }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 3)
    .map((p) => `${p.route} ${p.pct.toFixed(0)}%`)
    .join(', ');
  console.error(`        More of the site is chrome than the cap allows. Heaviest pages: ${worst}.`);
  console.error('        Move real copy out of data-chrome / data-machine containers, or trim the instrument.');
  bad++;
}

if (bad) {
  console.error(`\ncheck-voice: ${bad} threshold(s) exceeded. The copy is drifting back toward the essay register.`);
  process.exit(1);
}
pass(
  'check-voice',
  `${words} words, em-dash ${per1k(measured.emDash).toFixed(1)}/1k, soft words ${per1k(measured.soft).toFixed(1)}/1k, average sentence ${avg.toFixed(1)} words, ${shortPct.toFixed(0)}% short, ${excludedPct.toFixed(0)}% excluded as chrome`,
);
