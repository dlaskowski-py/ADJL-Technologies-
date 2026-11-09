import { defineConfig } from 'vite';
import { resolve } from 'node:path';
// @ts-expect-error plain .mjs helper, no types
import { DEFINE } from './scripts/build-stamp.mjs';

export default defineConfig({
  define: DEFINE,
  build: {
    target: 'es2020',
    assetsInlineLimit: 2048,
    cssCodeSplit: false,
    rollupOptions: {
      /* One shell per page. Adding a page means a line here, an entry in
         scripts/pages.mjs (so it's prerendered), a page module in
         src/pages/, its route in src/main.ts and its prerender entry in
         scripts/. check-links fails the build if a page is reachable but
         was never prerendered. */
      input: {
        'home': resolve(__dirname, 'index.html'),
        'services': resolve(__dirname, 'services/index.html'),
        'service-ai': resolve(__dirname, 'services/ai-engineering/index.html'),
        'service-seo': resolve(__dirname, 'services/seo/index.html'),
        'service-software': resolve(__dirname, 'services/software/index.html'),
        'work': resolve(__dirname, 'work/index.html'),
        'case-real-estate': resolve(__dirname, 'work/real-estate-intelligence/index.html'),
        'case-trading': resolve(__dirname, 'work/trading-infrastructure/index.html'),
        'case-ai': resolve(__dirname, 'work/ai-implementation/index.html'),
        'case-mobile-app': resolve(__dirname, 'work/mobile-app/index.html'),
        'case-private-site': resolve(__dirname, 'work/private-site/index.html'),
        'case-this-site': resolve(__dirname, 'work/this-site/index.html'),
        'approach': resolve(__dirname, 'approach/index.html'),
        'legal-privacy': resolve(__dirname, 'legal/privacy/index.html'),
        'legal-terms': resolve(__dirname, 'legal/terms/index.html'),
      },
    },
  },
});
