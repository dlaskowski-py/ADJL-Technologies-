/**
 * The last step of the build: /build-report.json.
 *
 *   { commit, date, node, guards: [{ name, line }] }
 *
 * Every guard that passed appended its summary line to dist/.guard-log.jsonl
 * through scripts/lib/report.mjs. This turns the log into the report and
 * deletes it. The Pipeline's step 5 on the home page and the guards panel on
 * /work/this-site/ fetch this file and print the lines (RECORDED), so the
 * page's "every check passed" is this deploy's own output, not a sentence.
 *
 * If you're reading the report, every check passed: a failing guard stops
 * the build before this runs. That's also why it refuses to write a report
 * that's missing a guard. A guard that ran and forgot to report would
 * otherwise vanish from the page without anyone noticing.
 *
 * The report says what ran and what it measured. It's served noindex: it's
 * evidence for the curious, not a page for search results.
 */
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { BUILD_SHA } from './build-stamp.mjs';
import { GUARD_LOG } from './lib/report.mjs';
import { addHeaders } from './lib/headers.mjs';

/** The guards `npm run build` runs, in build order. */
const EXPECTED = [
  'check-css', 'check-links', 'check-claims', 'check-contact', 'check-motion',
  'check-markers', 'check-usage', 'check-voice', 'check-seo', 'check-provenance',
  'check-budget',
];

if (!existsSync(GUARD_LOG)) {
  console.error(`gen-report: ${GUARD_LOG} is missing. Run the guards first (npm run build does).`);
  process.exit(1);
}

/* Last line wins per guard, so running one guard twice can't list it twice. */
const byName = new Map();
for (const line of readFileSync(GUARD_LOG, 'utf8').split('\n')) {
  if (!line.trim()) continue;
  try {
    const { name, line: text } = JSON.parse(line);
    if (name) byName.set(name, String(text ?? ''));
  } catch {
    console.error(`gen-report: unreadable line in ${GUARD_LOG}: ${line.slice(0, 80)}`);
    process.exit(1);
  }
}

const missing = EXPECTED.filter((n) => !byName.has(n));
if (missing.length) {
  console.error(`gen-report: ${missing.join(', ')} didn't report a pass. Every guard reports through scripts/lib/report.mjs.`);
  process.exit(1);
}

const order = [...EXPECTED, ...[...byName.keys()].filter((n) => !EXPECTED.includes(n))];
const report = {
  commit: BUILD_SHA,
  date: new Date().toISOString(),
  node: process.version,
  guards: order.map((name) => ({ name, line: byName.get(name) })),
};

writeFileSync('dist/build-report.json', JSON.stringify(report, null, 2) + '\n');
rmSync(GUARD_LOG);
addHeaders('/build-report.json', {
  'X-Robots-Tag': 'noindex',
  'Content-Type': 'application/json; charset=utf-8',
  /* Fetched live by the page it describes; a stale copy would describe a
     previous deploy. */
  'Cache-Control': 'no-cache',
});

console.log(`gen-report: build-report.json, ${report.guards.length} guards passed on ${report.commit}`);
