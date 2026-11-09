/* One page: its renderer and its meta. Imported by the prerender entry in
   scripts/ and, in the dev shell only, lazily by src/main.ts. */
import { content, csp } from '../content-case-this-site';
import { renderSectionPage } from '../sections/sectionpage';

export const meta = content.meta;
export const render = () =>
  renderSectionPage(content, { route: '/work/this-site/', file: 'content-case-this-site.ts', ctx: { csp } });
