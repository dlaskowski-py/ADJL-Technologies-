/* One page: its renderer and its meta. Imported by the prerender entry in
   scripts/ and, in the dev shell only, lazily by src/main.ts.

   STUB from the foundation; WS-N owns the body. */
import { notes } from '../content-notes';
import { renderSectionPage } from '../sections/sectionpage';

export const meta = notes.crawlers.meta;
export const render = () => renderSectionPage(notes.crawlers, { route: '/notes/what-ai-crawlers-read/', file: 'content-notes.ts' });
