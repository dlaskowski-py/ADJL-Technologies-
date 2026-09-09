import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  build: {
    target: 'es2020',
    assetsInlineLimit: 2048,
    cssCodeSplit: false,
    rollupOptions: {
      /* One entry per page. Adding a page means a line here, an entry in
         scripts/pages.mjs so it gets prerendered, and a build-time entry
         module — scripts/check-links.mjs fails the build if a page is
         reachable but was never prerendered. */
      input: {
        main: resolve(__dirname, 'index.html'),
        work: resolve(__dirname, 'work/index.html'),
        approach: resolve(__dirname, 'approach/index.html'),
        case_real_estate: resolve(__dirname, 'work/real-estate-intelligence/index.html'),
        case_trading: resolve(__dirname, 'work/trading-infrastructure/index.html'),
        case_ai: resolve(__dirname, 'work/ai-implementation/index.html'),
        legal_privacy: resolve(__dirname, 'legal/privacy/index.html'),
        legal_terms: resolve(__dirname, 'legal/terms/index.html'),
      },
    },
  },
});
