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
 * dash — they are there to catch a drift back to the reflex, not to ration
 * punctuation. If a threshold trips, the fix is to vary the writing, not to
 * raise the number.
 */
import { readFileSync } from 'node:fs';
import { PAGES } from './pages.mjs';

/* Per 1,000 words of shipped copy, except where noted. */
const LIMITS = {
  emDash: { max: 2.2, label: 'em-dash asides', fix: 'Make it a full stop, a comma, or nothing.' },
  ratherThan: { max: 1.6, label: '"rather than"', fix: 'Use "not", or "instead of", or rebuild so the contrast is implied.' },
  setupColon: { max: 1.4, label: 'setup-then-payoff colons', fix: 'A colon before a list is fine. One before a restated clause is the tic — use a full stop.' },
  uncontracted: { max: 7.5, label: 'uncontracted forms', fix: 'Write "don\'t", "it\'s", "isn\'t" the way a person writing about their own business would.' },
  /* The aphoristic closer. Stripping the em-dashes moved the reflex here
     instead of removing it: seventeen paragraphs ended on a short "That's
     the X", and "That's the trade" alone turned up three times. Occasional
     is fine and lands well. One every 450 words is the same tic wearing a
     different coat. */
  thatsCloser: { max: 1.3, label: '"That\'s the X" closers', fix: 'Fold it into the sentence before, or end on the point itself.' },
};

/** Share of sentences that are short and do nothing clever. */
const MIN_SHORT_PCT = 8;
const MAX_AVG_WORDS = 19.5;

let text = '';
for (const page of PAGES) {
  text +=
    readFileSync(page.out, 'utf8')
      .replace(/<script[\s\S]*?<\/script>/g, ' ')
      .replace(/<style[\s\S]*?<\/style>/g, ' ')
      .replace(/<[^>]+>/g, ' ') + '\n';
}
text = text.replace(/&[a-z]+;/g, ' ').replace(/[ \t]+/g, ' ');

const words = text.split(/\s+/).filter(Boolean).length;
const per1k = (n) => (n / words) * 1000;
const count = (re) => (text.match(re) || []).length;

const measured = {
  emDash: count(/—/g),
  ratherThan: count(/\brather than\b/gi),
  /* A colon whose clause carries NO comma before the sentence ends.
     The first version of this counted every mid-sentence colon and flagged
     26 of them, of which about 22 were introducing a list — which is
     ordinary punctuation in any register, not a tell. What is a tell is the
     colon that sets up a single restated clause, and a list has commas in
     it while a punchline does not. Measuring the blunt version would have
     meant rewriting correct sentences to satisfy a bad metric. */
  setupColon: count(/[a-z]: [a-z][^.!?,]{0,120}[.!?]/g),
  uncontracted: count(/\b(do not|does not|did not|is not|are not|was not|cannot|will not|would not|it is|there is|that is)\b/gi),
  thatsCloser: count(/That[’']s [^.!?]{0,75}[.!?]/g),
};

let bad = 0;
console.log(`check-voice: ${words} words across ${PAGES.length} pages`);

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
const avg = lens.reduce((a, b) => a + b, 0) / lens.length;
const shortPct = (lens.filter((l) => l < 8).length / lens.length) * 100;

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

if (bad) {
  console.error(`\ncheck-voice: ${bad} threshold(s) exceeded — the copy is drifting back toward the essay register.`);
  process.exit(1);
}
console.log('check-voice: register is within budget');
