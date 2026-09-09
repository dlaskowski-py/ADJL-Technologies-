/**
 * House style, enforced: US English, and the firm's actual name.
 *
 * Both of these were wrong on the first version of this site and both were
 * invisible to every other guard — a British spelling and a stale company
 * name are perfectly valid markup, they link fine, and they measure fine.
 * The only thing that catches them is a list.
 *
 * The spelling list is deliberately short. It holds the words this site
 * actually uses and got wrong (modelled, normalised, labelled, behaviour,
 * judgement, licence, programme, summarising) plus the near neighbours a
 * writer reaching for the same register would reach for next. It is not an
 * attempt at a dictionary, and a word only belongs here when it has actually
 * appeared in the copy.
 */
import { readFileSync } from 'node:fs';
import { PAGES } from './pages.mjs';

const SPELLINGS = [
  ['labelled', 'labeled'], ['labelling', 'labeling'],
  ['behaviour', 'behavior'], ['judgement', 'judgment'],
  ['modelled', 'modeled'], ['modelling', 'modeling'],
  ['normalised', 'normalized'], ['normalisation', 'normalization'], ['normalise', 'normalize'],
  ['licence', 'license'], ['programme', 'program'],
  ['summarise', 'summarize'], ['summarising', 'summarizing'], ['summarised', 'summarized'],
  ['organisation', 'organization'], ['organised', 'organized'],
  ['recognise', 'recognize'], ['recognised', 'recognized'],
  ['analyse', 'analyze'], ['analysed', 'analyzed'],
  ['optimise', 'optimize'], ['optimised', 'optimized'],
  ['prioritise', 'prioritize'], ['specialised', 'specialized'],
  ['emphasise', 'emphasize'], ['realise', 'realize'],
  ['centre', 'center'], ['defence', 'defense'], ['favour', 'favor'], ['labour', 'labor'],
  ['catalogue', 'catalog'], ['artefact', 'artifact'],
  ['sceptic', 'skeptic'], ['sceptical', 'skeptical'],
  ['signalling', 'signaling'], ['cancelled', 'canceled'], ['travelled', 'traveled'],
  ['whilst', 'while'], ['amongst', 'among'], ['learnt', 'learned'],
  ['fulfil', 'fulfill'], ['enrolment', 'enrollment'], ['instalment', 'installment'],
  /* The -ing forms. The first version of this list held "normalise",
     "normalised" and "normalisation" but not "normalising", and the copy
     shipped "ingesting and normalising market data" on the home page — two
     spellings of the same word on one page, because a conjugation was
     missing from a list rather than because anyone disagreed about it. */
  ['normalising', 'normalizing'], ['analysing', 'analyzing'],
  ['summarising', 'summarizing'], ['organising', 'organizing'],
  ['recognising', 'recognizing'], ['optimising', 'optimizing'],
  ['prioritising', 'prioritizing'], ['specialising', 'specializing'],
  ['emphasising', 'emphasizing'], ['realising', 'realizing'],
  /* Idiom rather than spelling, and both appeared. */
  ['afterwards', 'afterward'], ['the other way round', 'the other way around'],
];

/** The firm is ADJL Technology, singular. The plural was the original name
 *  and it is still the repository's name, so it is an easy thing to type. */
const NAMES = [['ADJL Technologies', 'ADJL Technology']];

let bad = 0;

/* Meta descriptions. Nobody sees these while editing — they live in a slot
   rather than on the page — so they are exactly the strings that drift.
   Google truncates a snippet near 160 characters, and two pages sharing a
   description makes them compete for the same result. */
const descriptions = new Map();
for (const page of PAGES) {
  const html = readFileSync(page.out, 'utf8');
  const d = /<meta name="description" content="([^"]*)"/.exec(html)?.[1] ?? '';

  if (!d) {
    console.error(`check-usage: ${page.route} has no meta description`);
    bad++;
  } else if (d.length > 160) {
    console.error(
      `check-usage: ${page.route} meta description is ${d.length} chars — search results truncate near 160`,
    );
    bad++;
  }
  if (d && descriptions.has(d)) {
    console.error(
      `check-usage: ${page.route} has the same meta description as ${descriptions.get(d)}`,
    );
    bad++;
  }
  descriptions.set(d, page.route);
}

for (const page of PAGES) {
  const html = readFileSync(page.out, 'utf8');
  const stripped = html
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ');

  /* Read the words, not the markup — but the words are not only between the
     tags. aria-label, alt and title are prose that a screen reader speaks,
     and stripping all attributes hid an aria-label reading "analysing a
     property listing" while the visible copy beside it said "analyzing". */
  const spoken = [...stripped.matchAll(/\s(?:aria-label|alt|title)="([^"]*)"/g)]
    .map((m) => m[1])
    .join(' \n ');
  const text = stripped.replace(/<[^>]+>/g, ' ') + ' \n ' + spoken;

  for (const [wrong, right] of SPELLINGS) {
    const hits = text.match(new RegExp(`\\b${wrong}\\b`, 'gi'));
    if (hits) {
      console.error(
        `check-usage: ${page.route} uses "${hits[0]}" ${hits.length} time(s) — this site is US English, use "${right}"`,
      );
      bad += hits.length;
    }
  }

  for (const [wrong, right] of NAMES) {
    const hits = text.match(new RegExp(wrong, 'g'));
    if (hits) {
      console.error(
        `check-usage: ${page.route} says "${wrong}" ${hits.length} time(s) — the firm is "${right}"`,
      );
      bad += hits.length;
    }
  }
}

if (bad) {
  console.error(`\ncheck-usage: ${bad} problem(s).`);
  process.exit(1);
}
console.log(
  `check-usage: ${PAGES.length} pages, US English throughout, name consistent, meta descriptions in range`,
);
