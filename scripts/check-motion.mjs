/**
 * Every motion module has to have something to animate.
 *
 * A module that ships, runs, queries for its markup contract and finds
 * nothing is dead weight that looks alive: it is imported, it is called, it
 * returns immediately, and nothing anywhere says so. This site shipped one —
 * a counter module with no [data-count] on any page — and it was only found
 * by reading the bundle.
 *
 * check-css already makes this argument about dead CSS rules. This is the
 * same argument about dead JavaScript, and the same fix: delete it, or use
 * it. There is no third option that leaves the check passing.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { PAGES } from './pages.mjs';

/** module → the selector it needs to find at least one of. */
const CONTRACTS = {
  'reveal.ts': '[data-reveal]',
  'scrub.ts': '[data-scrub]',
  'video.ts': 'data-video=',
  'flow.ts': '[data-flow]',
  'marquee.ts': '[data-marquee]',
  'typeline.ts': '[data-console]',
  'tilt.ts': '[data-tilt]',
  'wordmark.ts': 'wm-mark',
  'field.ts': 'id="field"',
};

const html = PAGES.map((p) => readFileSync(p.out, 'utf8')).join('\n');
const modules = readdirSync('src/motion').filter((f) => f.endsWith('.ts'));

let bad = 0;

for (const mod of modules) {
  // prefs.ts is the tier resolver — it has no markup of its own.
  if (mod === 'prefs.ts') continue;

  const needle = CONTRACTS[mod];
  if (!needle) {
    console.error(`check-motion: src/motion/${mod} has no declared markup contract in this file`);
    bad++;
    continue;
  }

  const token = needle.startsWith('[') ? needle.slice(1, -1) : needle;
  if (!html.includes(token)) {
    console.error(
      `check-motion: src/motion/${mod} looks for "${needle}", which appears on no built page — the module is dead. Use it or delete it.`,
    );
    bad++;
  }
}

// And the reverse: a contract listed here whose module was deleted.
for (const mod of Object.keys(CONTRACTS)) {
  if (!modules.includes(mod)) {
    console.error(`check-motion: this file lists ${mod}, which no longer exists in src/motion/`);
    bad++;
  }
}

if (bad) process.exit(1);
console.log(`check-motion: ${modules.length - 1} modules, every one has markup to animate`);
