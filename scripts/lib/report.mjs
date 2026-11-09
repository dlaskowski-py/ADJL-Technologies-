/**
 * Every guard reports its success the same way.
 *
 *   pass('check-css', '412 classes, all styled, no dead rules');
 *
 * prints "check-css: 412 classes, all styled, no dead rules" and appends
 * {name, line} to dist/.guard-log.jsonl. The last step of the build,
 * gen-report.mjs, turns that log into /build-report.json and deletes it.
 * The Pipeline's step 5 and /work/this-site/#guards print those lines from
 * the deployed file, so what the page says passed is what actually ran on
 * this deploy, not a sentence somebody typed.
 *
 * Only successes are logged. A failing guard exits non-zero, the build
 * stops, and no report is written, which is the point.
 */
import { appendFileSync, mkdirSync } from 'node:fs';

export const GUARD_LOG = 'dist/.guard-log.jsonl';

/** Record a guard's summary line and print it. `line` is the summary
 *  without the guard's name; the name is printed in front of it. */
export function pass(name, line) {
  const clean = String(line).replace(/\s+/g, ' ').trim();
  mkdirSync('dist', { recursive: true });
  appendFileSync(GUARD_LOG, JSON.stringify({ name, line: clean }) + '\n');
  console.log(`${name}: ${clean}`);
}

/** A failure counter that prints with the guard's prefix. */
export function failures(name) {
  let n = 0;
  const fail = (msg) => {
    console.error(`${name}: ${msg}`);
    n++;
  };
  return { fail, count: () => n };
}
