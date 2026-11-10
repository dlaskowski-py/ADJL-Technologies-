/**
 * The single list of pages. Adding one means adding it here AND to
 * `rollupOptions.input` in vite.config.ts, plus a shell, a browser entry and
 * a prerender entry. check-links asserts that everything linked from the
 * site is in this list.
 *
 * Each page carries what the build, the search engines and the share cards
 * need:
 *
 *   kind        home | hub | service | case | firm | legal — drives which
 *               structured-data nodes the page gets and how it's grouped in
 *               llms.txt.
 *   content     the content modules the page is written from. Their last
 *               git commit is the page's dateModified and sitemap lastmod,
 *               and Source view shows them.
 *   lattice     the hero carries the page-structure figure (everything but
 *               legal).
 *   crumb       its label in the breadcrumb trail, and `parent` its route.
 *   faq         the page carries an FAQ, so its WebPage is also a FAQPage.
 *   service     marks a page somebody could be shopping for: a Service node
 *               with a named serviceType.
 *   article     case pages: a TechArticle node, `about` listing the @ids it
 *               describes. '#frag' is relative to this page; '/path#frag' is
 *               relative to the origin.
 *   collection  hubs: the WebPage is also a CollectionPage with an ItemList.
 */

/** Where the site lives. ONE definition — the canonicals, the share cards,
 *  the sitemap, robots.txt and security.txt all read it, so moving the site
 *  is this line (or the SITE_ORIGIN env var for a preview build).
 *
 *  Apex, not www, because that is what Netlify has set as the primary
 *  domain; it 301s www and the .netlify.app subdomain here. */
export const ORIGIN = (process.env.SITE_ORIGIN ?? 'https://adjltechnology.com').replace(/\/$/, '');

export const PAGES = [
  {
    out: 'dist/index.html',
    entry: 'scripts/entry-home.ts',
    route: '/',
    kind: 'home',
    content: ['src/content.ts'],
    crumb: 'Home',
    lattice: true,
    faq: true,
    priority: '1.0',
  },

  /* ── Services ─────────────────────────────────────────────────────── */
  {
    out: 'dist/services/index.html',
    entry: 'scripts/entry-services.ts',
    route: '/services/',
    kind: 'hub',
    content: ['src/content-services.ts', 'src/content.ts'],
    crumb: 'Services',
    parent: '/',
    lattice: true,
    collection: 'services',
    priority: '0.8',
  },
  {
    out: 'dist/services/ai-engineering/index.html',
    entry: 'scripts/entry-service-ai.ts',
    route: '/services/ai-engineering/',
    kind: 'service',
    content: ['src/content-service-ai.ts'],
    crumb: 'AI Engineering',
    parent: '/services/',
    lattice: true,
    faq: true,
    service: {
      name: 'AI engineering',
      alternateName: 'AI Engineering',
      serviceType: 'AI agent development, retrieval-augmented generation and workflow automation',
    },
    priority: '0.9',
  },
  {
    out: 'dist/services/seo/index.html',
    entry: 'scripts/entry-service-seo.ts',
    route: '/services/seo/',
    kind: 'service',
    content: ['src/content-service-seo.ts'],
    crumb: 'SEO & AI Search',
    parent: '/services/',
    lattice: true,
    faq: true,
    service: {
      name: 'Technical SEO and AI search visibility',
      alternateName: 'SEO & AI Search',
      serviceType: 'Technical search engine optimization',
    },
    priority: '0.9',
  },
  {
    out: 'dist/services/software/index.html',
    entry: 'scripts/entry-service-software.ts',
    route: '/services/software/',
    kind: 'service',
    content: ['src/content-service-software.ts'],
    crumb: 'Websites & Apps',
    parent: '/services/',
    lattice: true,
    faq: true,
    service: {
      name: 'Web, mobile app and backend development',
      alternateName: 'Websites & Apps',
      serviceType: 'Custom software development',
    },
    priority: '0.9',
  },

  /* ── Work ─────────────────────────────────────────────────────────── */
  {
    out: 'dist/work/index.html',
    entry: 'scripts/entry-work.ts',
    route: '/work/',
    kind: 'hub',
    content: ['src/content-work.ts', 'src/content.ts'],
    crumb: 'Work',
    parent: '/',
    lattice: true,
    collection: 'work',
    priority: '0.9',
  },
  {
    out: 'dist/work/real-estate-intelligence/index.html',
    entry: 'scripts/entry-case-real-estate.ts',
    route: '/work/real-estate-intelligence/',
    kind: 'case',
    content: ['src/content-case-real-estate.ts'],
    crumb: 'Real Estate Intelligence',
    parent: '/work/',
    lattice: true,
    service: {
      name: 'Real estate underwriting software',
      serviceType: 'Property underwriting automation',
    },
    article: { about: ['#service', '/services/ai-engineering/#service'] },
    priority: '0.9',
  },
  {
    out: 'dist/work/trading-infrastructure/index.html',
    entry: 'scripts/entry-case-trading.ts',
    route: '/work/trading-infrastructure/',
    kind: 'case',
    content: ['src/content-case-trading.ts'],
    crumb: 'Trading Infrastructure',
    parent: '/work/',
    lattice: true,
    service: {
      name: 'Trading infrastructure engineering',
      serviceType: 'Market data, execution and network engineering',
    },
    article: { about: ['#service', '/services/software/#service'] },
    priority: '0.9',
  },
  {
    out: 'dist/work/ai-implementation/index.html',
    entry: 'scripts/entry-case-ai.ts',
    route: '/work/ai-implementation/',
    kind: 'case',
    content: ['src/content-case-ai.ts'],
    crumb: 'AI Implementation',
    parent: '/work/',
    lattice: true,
    service: {
      name: 'AI implementation consulting',
      serviceType: 'AI consulting and custom software development',
    },
    article: { about: ['#service', '/services/ai-engineering/#service'] },
    priority: '0.9',
  },
  {
    out: 'dist/work/mobile-app/index.html',
    entry: 'scripts/entry-case-mobile-app.ts',
    route: '/work/mobile-app/',
    kind: 'case',
    content: ['src/content-case-mobile-app.ts'],
    crumb: 'Mobile App',
    parent: '/work/',
    lattice: true,
    article: { about: ['#app', '/services/software/#service'] },
    app: {
      name: 'ADJL Capital investor app',
      operatingSystem: 'iOS, Android',
      applicationCategory: 'BusinessApplication',
    },
    priority: '0.8',
  },
  {
    out: 'dist/work/loep/index.html',
    entry: 'scripts/entry-case-loep.ts',
    route: '/work/loep/',
    kind: 'case',
    content: ['src/content-case-loep.ts'],
    crumb: 'Loep',
    parent: '/work/',
    lattice: true,
    article: { about: ['#app', '/services/software/#service', '/services/ai-engineering/#service'] },
    app: {
      name: 'Loep',
      operatingSystem: 'Web',
      applicationCategory: 'FinanceApplication',
    },
    priority: '0.8',
  },
  {
    out: 'dist/work/private-site/index.html',
    entry: 'scripts/entry-case-private-site.ts',
    route: '/work/private-site/',
    kind: 'case',
    content: ['src/content-case-private-site.ts'],
    crumb: 'Private Site',
    parent: '/work/',
    lattice: true,
    article: { about: ['/services/software/#service'] },
    priority: '0.8',
  },
  {
    out: 'dist/work/this-site/index.html',
    entry: 'scripts/entry-case-this-site.ts',
    route: '/work/this-site/',
    kind: 'case',
    content: ['src/content-case-this-site.ts'],
    crumb: 'This Site',
    parent: '/work/',
    lattice: true,
    article: { about: ['/#website', '/services/seo/#service', '/services/software/#service'] },
    priority: '0.8',
  },

  /* ── Firm and legal ───────────────────────────────────────────────── */
  {
    out: 'dist/approach/index.html',
    entry: 'scripts/entry-approach.ts',
    route: '/approach/',
    kind: 'firm',
    content: ['src/content-approach.ts', 'src/content.ts'],
    crumb: 'Approach',
    parent: '/',
    lattice: true,
    priority: '0.8',
  },
  {
    out: 'dist/legal/privacy/index.html',
    entry: 'scripts/entry-legal-privacy.ts',
    route: '/legal/privacy/',
    kind: 'legal',
    content: ['src/content-legal.ts'],
    crumb: 'Privacy',
    parent: '/',
    priority: '0.3',
  },
  {
    out: 'dist/legal/terms/index.html',
    entry: 'scripts/entry-legal-terms.ts',
    route: '/legal/terms/',
    kind: 'legal',
    content: ['src/content-legal.ts'],
    crumb: 'Terms',
    parent: '/',
    priority: '0.3',
  },
];

/** Route → filename slug, used for share cards, source JSON and the
 *  markdown twins. '/' is 'home'. */
export const slugOf = (route) =>
  route === '/' ? 'home' : route.replace(/^\/|\/$/g, '').replace(/\//g, '-');

/** Where gen-og records which headline each share card was drawn for, and
 *  how it and check-seo both read a page's og:title: the attribute as
 *  written, so the two compare like with like. The file isn't under
 *  public/, so it's committed and never served. */
export const OG_MANIFEST = 'scripts/og-cards.json';
export const ogTitleOf = (html) => html.match(/<meta property="og:title" content="([^"]*)"/)?.[1] ?? '';
