/**
 * Finds a Chromium for the two browser-driven checks (verify.mjs and
 * check-contrast.mjs).
 *
 * Playwright is deliberately kept out of devDependencies: these are local
 * chores, and keeping them out spares every Netlify build a large install
 * and a browser download. So the library is looked for in three places, in
 * order: `playwright-core` installed next to the repo (`npm i --no-save
 * playwright-core`), `playwright` installed next to the repo, and a global
 * `playwright`. The browser binary is the pinned one under
 * /opt/pw-browsers when it exists (resolved by glob, because the revision
 * suffix changes with the image), else whatever Playwright resolves itself.
 */
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { globSync } from 'node:fs';
import { join } from 'node:path';

export async function chromiumLauncher() {
  for (const name of ['playwright-core', 'playwright']) {
    try {
      return (await import(name)).chromium;
    } catch {
      /* try the next one */
    }
  }
  try {
    const root = execSync('npm root -g', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    return createRequire(join(root, 'noop.js'))('playwright').chromium;
  } catch {
    console.error('No Playwright found. Install it without saving: npm i --no-save playwright-core');
    process.exit(2);
  }
}

/** The pinned Chromium, if this environment ships one. */
export const CHROME =
  globSync('/opt/pw-browsers/chromium-*/chrome-linux*/chrome')[0] ?? process.env.CHROME_PATH ?? undefined;

/** Launch options shared by both checks. SwiftShader gives headless Chrome
 *  a WebGL context, so the hero graph's full tier can actually run. */
export const launchOptions = {
  ...(CHROME ? { executablePath: CHROME } : {}),
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
};
