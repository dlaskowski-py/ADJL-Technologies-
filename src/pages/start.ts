/* One page: its renderer and its meta. Imported by the prerender entry in
   scripts/ and, in the dev shell only, lazily by src/main.ts.

   STUB from the foundation: the generic section page, with the
   assistant's mount ([data-assistant], the contract
   src/motion/assistant.ts loads on) set on the #intake section. WS-A
   replaces the body with its own renderer (src/sections/start.ts), which
   writes the form and [data-assistant] itself. */
import { content } from '../content-start';
import { renderSectionPage } from '../sections/sectionpage';

export const meta = content.meta;
export const render = () => {
  const page = renderSectionPage(content, { route: '/start/', file: 'content-start.ts' });
  return { ...page, pageHtml: page.pageHtml.replace(/(<section [^>]*\bid="intake")/, '$1 data-assistant') };
};
