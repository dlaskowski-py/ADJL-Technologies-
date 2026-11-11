/**
 * Every route with its label and parent, for the visible breadcrumbs and
 * the ⌘K palette. Mirrors scripts/pages.mjs (the build's registry, which
 * emits the BreadcrumbList structured data); check-seo holds the two to
 * the same trail. `noindex` mirrors pages.mjs too.
 */
export const SITE_PAGES: { route: string; label: string; parent?: string; noindex?: boolean }[] = [
  { route: '/', label: 'Home' },
  { route: '/services/', label: 'Services', parent: '/' },
  { route: '/services/ai-engineering/', label: 'AI Engineering', parent: '/services/' },
  { route: '/services/seo/', label: 'SEO & AI Search', parent: '/services/' },
  { route: '/services/software/', label: 'Websites & Apps', parent: '/services/' },
  { route: '/services/seo/audit/', label: 'Website audit', parent: '/services/seo/' },
  { route: '/work/', label: 'Work', parent: '/' },
  { route: '/work/real-estate-intelligence/', label: 'Real Estate Intelligence', parent: '/work/' },
  { route: '/work/trading-infrastructure/', label: 'Trading Infrastructure', parent: '/work/' },
  { route: '/work/ai-implementation/', label: 'AI Implementation', parent: '/work/' },
  { route: '/work/mobile-app/', label: 'Mobile App', parent: '/work/' },
  { route: '/work/loep/', label: 'Loep', parent: '/work/' },
  { route: '/work/private-site/', label: 'Private Site', parent: '/work/' },
  { route: '/work/this-site/', label: 'This Site', parent: '/work/' },
  { route: '/work/agentic-research/', label: 'Agentic Research', parent: '/work/' },
  { route: '/notes/', label: 'Notes', parent: '/' },
  { route: '/notes/what-ai-crawlers-read/', label: 'What AI crawlers read', parent: '/notes/' },
  { route: '/notes/a-build-that-refuses-to-overclaim/', label: 'A build that refuses to overclaim', parent: '/notes/' },
  { route: '/notes/research-that-cannot-fool-itself/', label: 'Research that can’t fool itself', parent: '/notes/' },
  { route: '/approach/', label: 'Approach', parent: '/' },
  { route: '/scan/', label: 'Scan your site', parent: '/' },
  { route: '/start/', label: 'Start a project', parent: '/' },
  /* noindex: the form's thank-you page. It needs a trail like any page,
     but nothing should offer it as a place to go (the ⌘K palette). */
  { route: '/start/sent/', label: 'Message sent', parent: '/start/', noindex: true },
  { route: '/agents/', label: 'For AI agents', parent: '/' },
  { route: '/changelog/', label: 'Changelog', parent: '/' },
  { route: '/legal/privacy/', label: 'Privacy', parent: '/' },
  { route: '/legal/terms/', label: 'Terms', parent: '/' },
];
