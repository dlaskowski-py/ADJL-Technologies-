/* One page: its renderer and its meta. Imported by the prerender entry in
   scripts/ and, in the dev shell only, lazily by src/main.ts. */
import { notes } from '../content-notes';
import { renderNote } from '../sections/notes';

export const meta = notes.overclaim.meta;
export const render = () => renderNote('overclaim');
