/**
 * Every motion module has to have something to animate.
 *
 * A module that ships, runs, queries for its markup contract and finds
 * nothing is dead weight that looks alive: it's imported, it's called, it
 * returns immediately, and nothing anywhere says so. This site shipped one
 * (a counter module with no [data-count] on any page) and it was only found
 * by reading the bundle.
 *
 * check-css already makes this argument about dead CSS rules. This is the
 * same argument about dead JavaScript, and the same fix: delete it, or use
 * it. There's no third option that leaves the check passing.
 *
 * The module list is read from src/motion/ itself, so a new file can't
 * dodge the check by not being registered. The contracts are the final set
 * from the rebuild spec (§3.16). An attribute contract like `[data-ask]`
 * matches the attribute exactly: `data-ask-pre` on the page doesn't count
 * as `data-ask`.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { PAGES } from './pages.mjs';
import { pass } from './lib/report.mjs';

/** module → the selector it needs to find at least one of. */
const CONTRACTS = {
  'reveal.ts': '[data-reveal]',     'scrub.ts': '[data-scrub]',
  'wordmark.ts': 'wm-mark',         'flow.ts': '[data-flow]',
  'lattice.ts': '[data-lattice]',   'compile.ts': '[data-compile]',
  'decode.ts': '[data-decode]',     'telemetry.ts': '[data-telemetry]',
  'views.ts': '[data-views]',       'machine.ts': '[data-machine]',
  'ask.ts': '[data-ask]',           'pipeline.ts': '[data-pipeline]',
  'replay.ts': '[data-replay]',     'leaders.ts': '[data-leaders]',
  'headers.ts': '[data-headers]',   'palette.ts': '[data-palette]',
};

/** Files in src/motion/ that aren't modules with markup of their own. */
const INFRASTRUCTURE = new Set([
  'prefs.ts', // the tier resolver and whileVisible(); everything else imports it
]);

const html = PAGES.map((p) => readFileSync(p.out, 'utf8')).join('\n');
const modules = readdirSync('src/motion').filter((f) => f.endsWith('.ts') && !f.endsWith('.d.ts'));

/** Does the built HTML carry this contract? */
const present = (needle) => {
  if (needle.startsWith('[') && needle.endsWith(']')) {
    const attr = needle.slice(1, -1).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`\\s${attr}(?=[\\s=>/])`).test(html);
  }
  return html.includes(needle);
};

let bad = 0;

for (const mod of modules) {
  if (INFRASTRUCTURE.has(mod)) continue;

  const needle = CONTRACTS[mod];
  if (!needle) {
    console.error(`check-motion: src/motion/${mod} has no declared markup contract in this file`);
    bad++;
    continue;
  }
  if (!present(needle)) {
    console.error(
      `check-motion: src/motion/${mod} looks for "${needle}", which appears on no built page. The module is dead: use it or delete it.`,
    );
    bad++;
  }
}

// And the reverse: a contract listed here whose module was deleted.
for (const mod of Object.keys(CONTRACTS)) {
  if (!modules.includes(mod)) {
    console.error(
      `check-motion: this file lists ${mod}, which doesn't exist in src/motion/. Delete the module and its contract together.`,
    );
    bad++;
  }
}

if (bad) process.exit(1);
const count = modules.filter((m) => !INFRASTRUCTURE.has(m)).length;
pass('check-motion', `${count} modules, every one has markup to animate`);
