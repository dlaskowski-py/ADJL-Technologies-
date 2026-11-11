/* One page: its renderer and its meta. Imported by the prerender entry in
   scripts/ and, in the dev shell only, lazily by src/main.ts.

   STUB from the foundation; WS-R owns the body. */
import { content } from '../content-case-research';
import { renderSectionPage } from '../sections/sectionpage';

export const meta = content.meta;
export const render = () =>
  renderSectionPage(content, { route: '/work/agentic-research/', file: 'content-case-research.ts' });
