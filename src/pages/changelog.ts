/* One page: its renderer and its meta. Imported by the prerender entry in
   scripts/ and, in the dev shell only, lazily by src/main.ts. */
import { content } from '../content-changelog';
import { renderChangelog } from '../sections/changelog';

export const meta = content.meta;
export const render = () => renderChangelog();
