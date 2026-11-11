/* One page: its renderer and its meta. Imported by the prerender entry in
   scripts/ and, in the dev shell only, lazily by src/main.ts.

   /start/sent/ is noindex (scripts/pages.mjs). STUB from the foundation;
   WS-A owns the body. */
import { sent } from '../content-start';
import { renderSectionPage } from '../sections/sectionpage';

export const meta = sent.meta;
export const render = () => renderSectionPage(sent, { route: '/start/sent/', file: 'content-start.ts' });
