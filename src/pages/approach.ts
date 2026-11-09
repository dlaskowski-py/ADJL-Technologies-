/* One page: its renderer and its meta. Imported by the prerender entry in
   scripts/ and, in the dev shell only, lazily by src/main.ts. */
import { content } from '../content-approach';
import { renderApproachPage } from '../sections/approach';

export const meta = content.meta;
export const render = () => renderApproachPage(content);
