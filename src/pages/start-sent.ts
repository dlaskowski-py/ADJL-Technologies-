/* One page: its renderer and its meta. Imported by the prerender entry in
   scripts/ and, in the dev shell only, lazily by src/main.ts.

   /start/sent/ is the intake form's action, where a visitor lands when the
   form is sent without a script (noindex, scripts/pages.mjs). The generic
   section page renders it, and names each section's copy as `content.…`
   for Source view; this page's copy is the `sent` export, so the paths are
   corrected here. The contact block keeps its "Start a project" button:
   from here, it's the way back. */
import { sent } from '../content-start';
import { renderSectionPage } from '../sections/sectionpage';

export const meta = sent.meta;
export const render = () => {
  const page = renderSectionPage(sent, { route: '/start/sent/', file: 'content-start.ts' });
  return { ...page, pageHtml: page.pageHtml.replaceAll('"content-start.ts#content.', '"content-start.ts#sent.') };
};
