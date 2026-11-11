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

type Loader = () => Promise<{ render: () => { navHtml: string; pageHtml: string } }>;

/* DEV ONLY. In a production build every page is prerendered, so this map
   is dead code; gating it on import.meta.env.DEV lets the bundler drop it
   and with it every page's copy and renderers. Production JavaScript
   carries no page content at all. */
const PAGES: Record<string, Loader> = import.meta.env.DEV ? {
  '/': () => import('./pages/home'),
  '/services/': () => import('./pages/services'),
  '/services/ai-engineering/': () => import('./pages/service-ai'),
  '/services/seo/': () => import('./pages/service-seo'),
  '/services/software/': () => import('./pages/service-software'),
  '/services/seo/audit/': () => import('./pages/audit'),
  '/work/': () => import('./pages/work'),
  '/work/real-estate-intelligence/': () => import('./pages/case-real-estate'),
  '/work/trading-infrastructure/': () => import('./pages/case-trading'),
  '/work/ai-implementation/': () => import('./pages/case-ai'),
  '/work/mobile-app/': () => import('./pages/case-mobile-app'),
  '/work/loep/': () => import('./pages/case-loep'),
  '/work/private-site/': () => import('./pages/case-private-site'),
  '/work/this-site/': () => import('./pages/case-this-site'),
  '/work/agentic-research/': () => import('./pages/case-research'),
  '/notes/': () => import('./pages/notes'),
  '/notes/what-ai-crawlers-read/': () => import('./pages/note-crawlers'),
  '/notes/a-build-that-refuses-to-overclaim/': () => import('./pages/note-overclaim'),
  '/notes/research-that-cannot-fool-itself/': () => import('./pages/note-research'),
  '/approach/': () => import('./pages/approach'),
  '/scan/': () => import('./pages/scan'),
  '/start/': () => import('./pages/start'),
  '/start/sent/': () => import('./pages/start-sent'),
  '/agents/': () => import('./pages/agents'),
  '/changelog/': () => import('./pages/changelog'),
  '/legal/privacy/': () => import('./pages/legal-privacy'),
  '/legal/terms/': () => import('./pages/legal-terms'),
} : {};

start(PAGES[location.pathname] ?? PAGES[location.pathname + '/'] ?? PAGES['/']);
