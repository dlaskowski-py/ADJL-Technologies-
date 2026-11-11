/* One page: its renderer and its meta. Imported by the prerender entry in
   scripts/ and, in the dev shell only, lazily by src/main.ts.

   STUB from the foundation; WS-N owns the body. The generic renderer
   names each section's copy as `content.…` for Source view; this page's
   copy is `notes.crawlers`, so the paths are corrected here. */
import { notes } from '../content-notes';
import { renderSectionPage } from '../sections/sectionpage';

export const meta = notes.crawlers.meta;
export const render = () => {
  const page = renderSectionPage(notes.crawlers, { route: '/notes/what-ai-crawlers-read/', file: 'content-notes.ts' });
  return { ...page, pageHtml: page.pageHtml.replaceAll('"content-notes.ts#content.', '"content-notes.ts#notes.crawlers.') };
};
