/* One page: its renderer and its meta. Imported by the prerender entry in
   scripts/ and, in the dev shell only, lazily by src/main.ts.

   STUB from the foundation; WS-N owns the body. */
import { hub } from '../content-notes';
import { renderSectionPage } from '../sections/sectionpage';

export const meta = hub.meta;
export const render = () => renderSectionPage(hub, { route: '/notes/', file: 'content-notes.ts' });
