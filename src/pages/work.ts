/* One page: its renderer and its meta. Imported by the prerender entry in
   scripts/ and, in the dev shell only, lazily by src/main.ts. */
import { content } from '../content-work';
import { renderWorkHubPage } from '../sections/workhub';

export const meta = content.meta;
export const render = () => renderWorkHubPage(content);
