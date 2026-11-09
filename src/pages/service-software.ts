/* One page: its renderer and its meta. Imported by the prerender entry in
   scripts/ and, in the dev shell only, lazily by src/main.ts. */
import { content } from '../content-service-software';
import { renderSectionPage } from '../sections/sectionpage';

export const meta = content.meta;
export const faq = content.faq;
export const render = () =>
  renderSectionPage(content, { route: '/services/software/', file: 'content-service-software.ts', service: true });
