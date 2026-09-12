/**
 * Every class used in the built HTML must have a rule, and every rule must
 * match something.
 *
 * The first direction catches typos — a class renamed in CSS and not in a
 * renderer produces an unstyled element, which on a light site frequently
 * looks *almost* right and ships. The second catches dead rules, which is
 * how a stylesheet grows to twice the size of the site it styles.
 *
 * Classes applied only by JavaScript are invisible to both directions, so
 * they are listed here explicitly. That list is the point of friction that
 * makes someone think before adding a stateful class.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const JS_APPLIED = new Set([
  /* Set on <html> by public/js-on.js. It is the gate the reveal styles hang
     off, so that hiding content is opt-in and a page without scripting shows
     everything instead of nothing. */
  'js',
  'is-in', 'is-stuck', 'is-playing', 'is-lit', 'is-current', 'is-typing', 'is-done',
  'is-running', 'is-paused', 'is-static', 'is-copied', 'is-pulsing', 'con-line',
  'con-in', 'con-note', 'con-result', 'con-kv', 'con-k', 'con-v', 'con-dots',
  'con-prompt', 'con-text',
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
  console.error('check-css: no CSS in dist — did the build emit a stylesheet?');
  process.exit(1);
}

const used = new Set(JS_APPLIED);
for (const m of html.matchAll(/class="([^"]+)"/g)) {
  for (const c of m[1].split(/\s+/)) if (c) used.add(c);
}

const defined = new Set();
// Strip declaration blocks first so a value like `content: '.foo'` cannot be
// mistaken for a selector.
const selectors = css.replace(/\{[^{}]*\}/g, '{}');
for (const m of selectors.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) defined.add(m[1]);

const missing = [...used].filter((c) => !defined.has(c)).sort();
const unused = [...defined].filter((c) => !used.has(c)).sort();

let bad = false;
if (missing.length) {
  console.error(`check-css: ${missing.length} class(es) used in markup with no rule:`);
  for (const c of missing) console.error(`  .${c}`);
  bad = true;
}
if (unused.length) {
  console.error(`check-css: ${unused.length} rule(s) matching nothing:`);
  for (const c of unused) console.error(`  .${c}`);
  bad = true;
}
if (bad) process.exit(1);

console.log(`check-css: ${used.size} classes, all styled, no dead rules`);
