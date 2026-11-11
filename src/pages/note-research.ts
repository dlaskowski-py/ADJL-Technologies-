/* One page: its renderer and its meta. Imported by the prerender entry in
   scripts/ and, in the dev shell only, lazily by src/main.ts.

   STUB from the foundation; WS-N owns the body. */
import { notes } from '../content-notes';
import { renderSectionPage } from '../sections/sectionpage';

export const meta = notes.research.meta;
export const render = () => renderSectionPage(notes.research, { route: '/notes/research-that-cannot-fool-itself/', file: 'content-notes.ts' });
