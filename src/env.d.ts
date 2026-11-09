/** Stamped at build time (vite.config.ts `define`, and the same values in
 *  scripts/prerender.mjs's esbuild `define`), so the footer's "Built … from
 *  commit …" line is true by construction. */
declare const __BUILD_SHA__: string;
declare const __BUILD_DATE__: string;
