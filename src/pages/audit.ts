/* One page: its renderer and its meta. Imported by the prerender entry in
   scripts/ and, in the dev shell only, lazily by src/main.ts.

   /services/seo/audit/: a service page built from content sections, like
   the three practice pages. The hero and #covers are described by the
   page's Service node; the FAQ is the FAQPage's visible counterpart. */
import { content } from '../content-audit';
import { renderSectionPage } from '../sections/sectionpage';

export const meta = content.meta;
export const faq = content.faq;
export const render = () =>
  renderSectionPage(content, { route: '/services/seo/audit/', file: 'content-audit.ts', service: true });
