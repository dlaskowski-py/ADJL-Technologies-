/**
 * The one browser entry, shared by every page.
 *
 * In production every page is already prerendered, so this only boots the
 * motion and interaction modules. In the dev shell the page is empty, and
 * this loads that page's renderer lazily and mounts it first. Because the
 * import is dynamic and only taken on an empty shell, production never
 * downloads a page's copy as JavaScript.
 */
import { start } from './boot';

const PAGES: Record<string, () => Promise<{ render: () => { navHtml: string; pageHtml: string } }>> = {
  '/': () => import('./pages/home'),
  '/services/': () => import('./pages/services'),
  '/services/ai-engineering/': () => import('./pages/service-ai'),
  '/services/seo/': () => import('./pages/service-seo'),
  '/services/software/': () => import('./pages/service-software'),
  '/work/': () => import('./pages/work'),
  '/work/real-estate-intelligence/': () => import('./pages/case-real-estate'),
  '/work/trading-infrastructure/': () => import('./pages/case-trading'),
  '/work/ai-implementation/': () => import('./pages/case-ai'),
  '/work/mobile-app/': () => import('./pages/case-mobile-app'),
  '/work/private-site/': () => import('./pages/case-private-site'),
  '/work/this-site/': () => import('./pages/case-this-site'),
  '/approach/': () => import('./pages/approach'),
  '/legal/privacy/': () => import('./pages/legal-privacy'),
  '/legal/terms/': () => import('./pages/legal-terms'),
};

start(PAGES[location.pathname] ?? PAGES[location.pathname + '/'] ?? PAGES['/']);
