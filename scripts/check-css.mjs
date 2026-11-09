/**
 * Every class used in the built HTML must have a rule, and every rule must
 * match something.
 *
 * The first direction catches typos: a class renamed in CSS and not in a
 * renderer produces an unstyled element, which frequently looks *almost*
 * right and ships. The second catches dead rules, which is how a stylesheet
 * grows to twice the size of the site it styles.
 *
 * Classes applied only by JavaScript are invisible to both directions, so
 * they're listed here explicitly. That list is the point of friction that
 * makes someone think before adding a stateful class, and since the rebuild
 * it's meant to stay short: DOM that JavaScript BUILDS (Machine View's
 * annotations, Ask's results, the replay inspector) is styled by attribute
 * selectors scoped under its module root, like `[data-machine] [data-k]`,
 * never by classes. Only state toggled on prerendered markup is a class.
 *
 * The list is checked in the other direction too: every entry must still be
 * applied somewhere in src/ (or by public/js-on.js). A class nobody sets any
 * more is a permission nobody remembered to revoke, and it would let a dead
 * rule for it pass forever.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { pass } from './lib/report.mjs';

const JS_APPLIED = new Set([
  /* Set on <html> by public/js-on.js. It's the gate the reveal styles hang
     off, so hiding content is opt-in and a page without scripting shows
     everything instead of nothing. */
  'js',
  'is-in', // reveal.ts: a [data-reveal] element has entered the viewport
  'is-stuck', // ui.ts: the nav has scrolled past its resting position
  'is-copied', // ui.ts: the copy-address button, for 1.8s after a copy
  'is-lit', // flow.ts: a stage the trace has reached
  'is-current', // flow.ts: the stage the trace is on
  'is-pulsing', // wordmark.ts: the mark's one-shot pulse
]);

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const files = walk('dist');
const html = files.filter((f) => f.endsWith('.html')).map((f) => readFileSync(f, 'utf8')).join('\n');
const css = files.filter((f) => f.endsWith('.css')).map((f) => readFileSync(f, 'utf8')).join('\n');

if (!css.trim()) {
  console.error('check-css: no CSS in dist. Did the build emit a stylesheet?');
  process.exit(1);
}

const used = new Set(JS_APPLIED);
for (const m of html.matchAll(/class="([^"]+)"/g)) {
  for (const c of m[1].split(/\s+/)) if (c) used.add(c);
}

const defined = new Set();
// Strip comments, then declaration blocks, so a value like `content: '.foo'`
// or a commented-out rule can't be mistaken for a selector.
const selectors = css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\{[^{}]*\}/g, '{}');
for (const m of selectors.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) defined.add(m[1]);

const missing = [...used].filter((c) => !defined.has(c)).sort();
const unused = [...defined].filter((c) => !used.has(c)).sort();

/* JS_APPLIED, the other way: each entry must still be set by some script. */
const sources = [
  ...walk('src').filter((f) => /\.(ts|js|mjs)$/.test(f)),
  ...(existsSync('public/js-on.js') ? ['public/js-on.js'] : []),
]
  .map((f) => readFileSync(f, 'utf8'))
  .join('\n');
const stale = [...JS_APPLIED].filter((c) => !new RegExp(`['"\`\\s]${c}['"\`\\s]`).test(sources)).sort();

let bad = false;
if (missing.length) {
  console.error(`check-css: ${missing.length} class(es) used in markup with no rule:`);
  for (const c of missing) console.error(`  .${c}`);
  bad = true;
}
if (unused.length) {
  console.error(`check-css: ${unused.length} rule(s) matching nothing in the built HTML:`);
  for (const c of unused) console.error(`  .${c}`);
  console.error(
    '  If JavaScript builds that element, style it with an attribute selector under its module root ([data-x] [data-y]) instead of a class.',
  );
  bad = true;
}
if (stale.length) {
  console.error(`check-css: ${stale.length} JS_APPLIED class(es) that no script sets any more:`);
  for (const c of stale) console.error(`  .${c}`);
  bad = true;
}
if (bad) process.exit(1);

pass('check-css', `${used.size} classes, all styled, no dead rules, ${JS_APPLIED.size} set by JavaScript`);
