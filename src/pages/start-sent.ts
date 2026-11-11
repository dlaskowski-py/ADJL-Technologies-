/* One page: its renderer and its meta. Imported by the prerender entry in
   scripts/ and, in the dev shell only, lazily by src/main.ts.

   /start/sent/ is noindex (scripts/pages.mjs). STUB from the foundation;
   WS-A owns the body. The generic renderer names each section's copy as
   `content.…` for Source view; this page's copy is `sent`, so the paths
   are corrected here. */
import { sent } from '../content-start';
import { renderSectionPage } from '../sections/sectionpage';

export const meta = sent.meta;
export const render = () => {
  const page = renderSectionPage(sent, { route: '/start/sent/', file: 'content-start.ts' });
  return { ...page, pageHtml: page.pageHtml.replaceAll('"content-start.ts#content.', '"content-start.ts#sent.') };
};
