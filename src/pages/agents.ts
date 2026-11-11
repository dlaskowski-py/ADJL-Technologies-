/* One page: its renderer and its meta. Imported by the prerender entry in
   scripts/ and, in the dev shell only, lazily by src/main.ts.

   STUB from the foundation; WS-M owns the body. */
import { content } from '../content-agents';
import { renderSectionPage } from '../sections/sectionpage';

export const meta = content.meta;
export const render = () => renderSectionPage(content, { route: '/agents/', file: 'content-agents.ts' });
