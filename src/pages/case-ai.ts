/* One page: its renderer and its meta. Imported by the prerender entry in
   scripts/ and, in the dev shell only, lazily by src/main.ts. */
import { content } from '../content-case-ai';
import { renderCasePage } from '../sections/case';

export const meta = content.meta;
export const render = () => renderCasePage(content, '/work/ai-implementation/', 'content-case-ai.ts');
