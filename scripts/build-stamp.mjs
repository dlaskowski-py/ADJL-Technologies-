/**
 * The commit and date the footer prints: "Built 2026-11-09 from commit
 * a1b2c3d." Read once here and handed to both bundlers as `define`s (Vite
 * for the browser, esbuild in prerender.mjs for the HTML), so the two can't
 * print different commits.
 *
 * Netlify sets COMMIT_REF; locally it's the checkout's HEAD; with no git at
 * all it says "local" rather than inventing a hash.
 */
import { execSync } from 'node:child_process';

function sha() {
  const ref = process.env.COMMIT_REF;
  if (ref) return ref.slice(0, 7);
  try {
    return execSync('git rev-parse --short=7 HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return 'local';
  }
}

export const BUILD_SHA = sha();
export const BUILD_DATE = new Date().toISOString().slice(0, 10);

/** For a bundler's `define` option. */
export const DEFINE = {
  __BUILD_SHA__: JSON.stringify(BUILD_SHA),
  __BUILD_DATE__: JSON.stringify(BUILD_DATE),
};
