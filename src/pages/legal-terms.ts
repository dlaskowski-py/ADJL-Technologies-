/* One page: its renderer and its meta. Imported by the prerender entry in
   scripts/ and, in the dev shell only, lazily by src/main.ts. */
import { terms } from '../content-legal';
import { renderLegalPage } from '../sections/legal';

export const meta = terms.meta;
export const render = () => renderLegalPage(terms);
