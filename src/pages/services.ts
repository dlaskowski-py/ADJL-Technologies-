/* One page: its renderer and its meta. Imported by the prerender entry in
   scripts/ and, in the dev shell only, lazily by src/main.ts. */
import { content, rails } from '../content-services';
import { renderSectionPage } from '../sections/sectionpage';

export const meta = content.meta;
export const faq = content.faq;
export const render = () =>
  renderSectionPage(content, { route: '/services/', file: 'content-services.ts', rails });
