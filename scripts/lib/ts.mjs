/**
 * Loads the site's TypeScript into Node scripts.
 *
 * The pure libraries in src/lib/ (the tokenizer, the exclusion set, the
 * measurement, the graph) are TypeScript, and the guards, generators and
 * prerender are plain Node. A loader flag would work today and break on the
 * next Node release (it has twice), and a separate compile step would be
 * one more thing to forget. So this does what prerender.mjs already does:
 * bundle the module with esbuild in memory and import the result from a
 * data: URL. Every import is resolved at bundle time, so the data: module
 * has nothing relative left to resolve.
 *
 *   const { textOf } = await loadTs('src/lib/exclude.ts');
 *
 * It also bundles the same files for the browser, for verify.mjs, which
 * needs the exclusion predicate inside the page it's measuring.
 */
import { build } from 'esbuild';
import { readdirSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** The repository root, whatever directory the script was started from. */
export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

const abs = (p) => (isAbsolute(p) ? p : join(ROOT, p));

/* Build-time constants the browser code reads. Prerender defines them from
   build-stamp.mjs; a guard loading a module that mentions one only needs
   it to be defined. */
const DEFINE = {
  __BUILD_SHA__: JSON.stringify(process.env.COMMIT_REF?.slice(0, 7) ?? 'local'),
  __BUILD_DATE__: JSON.stringify(new Date().toISOString().slice(0, 10)),
};

const cache = new Map();

/** Import a TypeScript module (and everything it imports) into Node. */
export async function loadTs(path) {
  const file = abs(path);
  if (cache.has(file)) return cache.get(file);
  const job = (async () => {
    const out = await build({
      entryPoints: [file],
      absWorkingDir: ROOT,
      bundle: true,
      format: 'esm',
      platform: 'node',
      target: 'node20',
      write: false,
      logLevel: 'silent',
      external: ['*.css'],
      define: DEFINE,
    });
    const code = out.outputFiles[0].text;
    return import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
  })();
  cache.set(file, job);
  return job;
}

/** The same module bundled as a classic script that assigns its exports to
 *  `globalThis[name]`, for injecting into a page under test. */
export async function bundleForBrowser(path, name) {
  const out = await build({
    entryPoints: [abs(path)],
    absWorkingDir: ROOT,
    bundle: true,
    format: 'iife',
    globalName: name,
    platform: 'browser',
    target: 'es2020',
    write: false,
    logLevel: 'silent',
    define: DEFINE,
  });
  return `${out.outputFiles[0].text}\nglobalThis.${name} = ${name};`;
}

/* ── Content checks ────────────────────────────────────────────────── */

/** Every content module: src/content*.ts except the shared types. */
export const contentFiles = () =>
  readdirSync(join(ROOT, 'src'))
    .filter((f) => /^content.*\.ts$/.test(f) && f !== 'content-types.ts')
    .sort()
    .map((f) => `src/${f}`);

/**
 * The unit check the content conventions call for: every headline array
 * carries exactly ONE {em}…{/em}, and no headline carries {k}. It reads the
 * content exports themselves, so it fails on the copy, before any renderer
 * is involved. Returns one message per problem; empty means clean.
 *
 * A "headline" is any array of strings stored under a key named
 * `headline` or `h1`, anywhere in an export.
 */
export async function headlineProblems() {
  const problems = [];
  for (const file of contentFiles()) {
    let mod;
    try {
      mod = await loadTs(file);
    } catch (e) {
      problems.push(`${file} doesn't load: ${String(e?.message ?? e).split('\n')[0]}`);
      continue;
    }
    const seen = new Set();
    const visit = (v, path) => {
      if (!v || typeof v !== 'object' || seen.has(v)) return;
      seen.add(v);
      for (const [k, val] of Object.entries(v)) {
        const at = `${path}.${k}`;
        if ((k === 'headline' || k === 'h1') && Array.isArray(val) && val.every((s) => typeof s === 'string')) {
          const joined = val.join(' ');
          const open = (joined.match(/\{em\}/g) ?? []).length;
          const close = (joined.match(/\{\/em\}/g) ?? []).length;
          if (open !== 1 || close !== 1) {
            problems.push(`${file} ${at} has ${open} {em} (needs exactly one): ${JSON.stringify(val)}`);
          } else if (joined.indexOf('{em}') > joined.indexOf('{/em}')) {
            problems.push(`${file} ${at} closes {/em} before it opens: ${JSON.stringify(val)}`);
          }
          if (/\{\/?k\}/.test(joined)) {
            problems.push(`${file} ${at} uses {k} in a headline (body copy only): ${JSON.stringify(val)}`);
          }
        } else {
          visit(val, at);
        }
      }
    };
    for (const [name, value] of Object.entries(mod)) visit(value, name);
  }
  return problems;
}
