/* One page: its renderer and its meta. Imported by the prerender entry in
   scripts/ and, in the dev shell only, lazily by src/main.ts. */
import { hub } from '../content-notes';
import { renderNotesHub } from '../sections/notes';

export const meta = hub.meta;
export const render = () => renderNotesHub();
