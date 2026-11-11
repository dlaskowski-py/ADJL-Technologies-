/* One page: its renderer and its meta. Imported by the prerender entry in
   scripts/ and, in the dev shell only, lazily by src/main.ts.

   STUB from the foundation; WS-S owns the body. A service page: the hero
   and #covers are described by the page's Service node. */
import { content } from '../content-audit';
import { renderSectionPage } from '../sections/sectionpage';

export const meta = content.meta;
export const faq = content.faq;
export const render = () =>
  renderSectionPage(content, { route: '/services/seo/audit/', file: 'content-audit.ts', service: true });
