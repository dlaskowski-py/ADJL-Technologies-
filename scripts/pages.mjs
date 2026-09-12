/**
 * The single list of pages. Adding one means adding it here AND to
 * `rollupOptions.input` in vite.config.ts — nothing else knows the set, and
 * check-links.mjs asserts that everything linked from the site is in it.
 *
 * Each page also carries what the search engines and the social cards need:
 *
 *   film       which clip's frame the share card is built from. Sharing the
 *              same image across eight pages makes every link preview look
 *              like the same link.
 *   crumb      its label in the breadcrumb trail, and `parent` its route.
 *   service    present on the three practice pages, which are the pages
 *              somebody could actually be shopping for. Marks the page as a
 *              Service in the structured data with a named serviceType.
 *   noindex    kept off the legal pages' priority but still crawlable — a
 *              privacy policy should be findable, it just should not compete
 *              with the pages that sell.
 */

/** Where the site lives. Set SITE_ORIGIN when the real domain lands and
 *  every canonical, share card and sitemap entry follows it. */
export const ORIGIN = (process.env.SITE_ORIGIN ?? 'https://adjl-technology.netlify.app').replace(/\/$/, '');
export const PAGES = [
  {
    out: 'dist/index.html',
    entry: 'scripts/entry-home.ts',
    route: '/',
    film: 'lumen',
    crumb: 'Home',
    faq: true,
    priority: '1.0',
  },
  {
    out: 'dist/work/index.html',
    entry: 'scripts/entry-work.ts',
    route: '/work/',
    film: 'bloom',
    crumb: 'Work',
    parent: '/',
    priority: '0.9',
  },
  {
    out: 'dist/approach/index.html',
    entry: 'scripts/entry-approach.ts',
    route: '/approach/',
    film: 'weave',
    crumb: 'Approach',
    parent: '/',
    priority: '0.8',
  },
  {
    out: 'dist/work/real-estate-intelligence/index.html',
    entry: 'scripts/entry-case-real-estate.ts',
    route: '/work/real-estate-intelligence/',
    film: 'survey',
    crumb: 'Real Estate Intelligence',
    parent: '/work/',
    priority: '0.9',
    service: {
      name: 'Real estate underwriting software',
      serviceType: 'Property underwriting automation',
    },
  },
  {
    out: 'dist/work/trading-infrastructure/index.html',
    entry: 'scripts/entry-case-trading.ts',
    route: '/work/trading-infrastructure/',
    film: 'latency',
    crumb: 'Trading Infrastructure',
    parent: '/work/',
    priority: '0.9',
    service: {
      name: 'Trading infrastructure engineering',
      serviceType: 'Market data, execution and network engineering',
    },
  },
  {
    out: 'dist/work/ai-implementation/index.html',
    entry: 'scripts/entry-case-ai.ts',
    route: '/work/ai-implementation/',
    film: 'mesh',
    crumb: 'AI Implementation',
    parent: '/work/',
    priority: '0.9',
    service: {
      name: 'AI implementation consulting',
      serviceType: 'AI consulting and custom software development',
    },
  },
  {
    out: 'dist/legal/privacy/index.html',
    entry: 'scripts/entry-legal-privacy.ts',
    route: '/legal/privacy/',
    film: 'bloom',
    crumb: 'Privacy',
    parent: '/',
    priority: '0.3',
  },
  {
    out: 'dist/legal/terms/index.html',
    entry: 'scripts/entry-legal-terms.ts',
    route: '/legal/terms/',
    film: 'bloom',
    crumb: 'Terms',
    parent: '/',
    priority: '0.3',
  },
];
