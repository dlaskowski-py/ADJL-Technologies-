/**
 * The single list of pages. Adding one means adding it here AND to
 * `rollupOptions.input` in vite.config.ts — nothing else knows the set, and
 * check-links.mjs asserts that everything linked from the site is in it.
 */
export const PAGES = [
  { out: 'dist/index.html', entry: 'scripts/entry-home.ts', route: '/' },
  { out: 'dist/work/index.html', entry: 'scripts/entry-work.ts', route: '/work/' },
  { out: 'dist/approach/index.html', entry: 'scripts/entry-approach.ts', route: '/approach/' },
  {
    out: 'dist/work/real-estate-intelligence/index.html',
    entry: 'scripts/entry-case-real-estate.ts',
    route: '/work/real-estate-intelligence/',
  },
  {
    out: 'dist/work/trading-infrastructure/index.html',
    entry: 'scripts/entry-case-trading.ts',
    route: '/work/trading-infrastructure/',
  },
  {
    out: 'dist/work/ai-implementation/index.html',
    entry: 'scripts/entry-case-ai.ts',
    route: '/work/ai-implementation/',
  },
  { out: 'dist/legal/privacy/index.html', entry: 'scripts/entry-legal-privacy.ts', route: '/legal/privacy/' },
  { out: 'dist/legal/terms/index.html', entry: 'scripts/entry-legal-terms.ts', route: '/legal/terms/' },
];
