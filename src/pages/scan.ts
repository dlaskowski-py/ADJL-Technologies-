/* One page: its renderer and its meta. Imported by the prerender entry in
   scripts/ and, in the dev shell only, lazily by src/main.ts.

   STUB from the foundation: the generic section page, with the scanner's
   mount ([data-scan], the contract src/motion/scan.ts loads on) set on the
   #scanner section. WS-S replaces the body with its own renderer
   (src/sections/scan.ts), which writes [data-scan] itself. */
import { content } from '../content-scan';
import { renderSectionPage } from '../sections/sectionpage';

export const meta = content.meta;
export const render = () => {
  const page = renderSectionPage(content, { route: '/scan/', file: 'content-scan.ts' });
  return { ...page, pageHtml: page.pageHtml.replace(/(<section [^>]*\bid="scanner")/, '$1 data-scan') };
};
