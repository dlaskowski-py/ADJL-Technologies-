/**
 * The contact address is the only thing on this site a visitor can act on,
 * so it has to be present, correct, and the same everywhere.
 *
 * This exists because the address is about to change: the firm does not own
 * its domain yet and is borrowing ADJL Capital's. When it moves, this check
 * is what proves every one of the places it appears actually moved with it.
 */
import { readFileSync } from 'node:fs';
import { PAGES } from './pages.mjs';

const EXPECTED = 'daniel@adjlcapital.com';
/** Addresses that would mean the move was done halfway. */
const WRONG = /[\w.+-]+@(?!adjlcapital\.com)[\w.-]*adjl[\w.-]*\.\w+/gi;

let bad = 0;
let seen = 0;

for (const page of PAGES) {
  const html = readFileSync(page.out, 'utf8');

  if (!html.includes(EXPECTED)) {
    console.error(`check-contact: ${page.route} does not carry ${EXPECTED}`);
    bad++;
  } else {
    seen += (html.match(new RegExp(EXPECTED, 'g')) ?? []).length;
  }

  if (!html.includes(`mailto:${EXPECTED}`)) {
    console.error(`check-contact: ${page.route} shows the address but never links it`);
    bad++;
  }

  for (const m of html.matchAll(WRONG)) {
    console.error(`check-contact: ${page.route} carries a stale address "${m[0]}"`);
    bad++;
  }
}

if (bad) process.exit(1);
console.log(`check-contact: ${EXPECTED} on all ${PAGES.length} pages, ${seen} occurrences`);
