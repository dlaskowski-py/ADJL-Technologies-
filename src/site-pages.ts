/**
 * Every route with its label and parent, for the visible breadcrumbs and
 * the ⌘K palette. Mirrors scripts/pages.mjs (the build's registry, which
 * emits the BreadcrumbList structured data); check-seo holds the two to
 * the same trail.
 */
export const SITE_PAGES: { route: string; label: string; parent?: string }[] = [
  { route: '/', label: 'Home' },
  { route: '/services/', label: 'Services', parent: '/' },
  { route: '/services/ai-engineering/', label: 'AI Engineering', parent: '/services/' },
  { route: '/services/seo/', label: 'SEO & AI Search', parent: '/services/' },
  { route: '/services/software/', label: 'Websites & Apps', parent: '/services/' },
  { route: '/work/', label: 'Work', parent: '/' },
  { route: '/work/real-estate-intelligence/', label: 'Real Estate Intelligence', parent: '/work/' },
  { route: '/work/trading-infrastructure/', label: 'Trading Infrastructure', parent: '/work/' },
  { route: '/work/ai-implementation/', label: 'AI Implementation', parent: '/work/' },
  { route: '/work/mobile-app/', label: 'Mobile App', parent: '/work/' },
  { route: '/work/private-site/', label: 'Private Site', parent: '/work/' },
  { route: '/work/this-site/', label: 'This Site', parent: '/work/' },
  { route: '/approach/', label: 'Approach', parent: '/' },
  { route: '/legal/privacy/', label: 'Privacy', parent: '/' },
  { route: '/legal/terms/', label: 'Terms', parent: '/' },
];
