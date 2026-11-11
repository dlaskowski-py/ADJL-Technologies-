/* One page: its renderer and its meta. Imported by the prerender entry in
   scripts/ and, in the dev shell only, lazily by src/main.ts.

   /start/ has its own renderer (src/sections/start.ts): the assistant and
   the intake form, then the shared contact block without its "Start a
   project" button, which on this page would only link to itself. */
import { content } from '../content-start';
import { renderStart } from '../sections/start';

export const meta = content.meta;
export const render = () => renderStart(content);
