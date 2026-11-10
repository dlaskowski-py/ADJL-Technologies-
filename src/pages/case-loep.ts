/* One page: its renderer and its meta. Imported by the prerender entry in
   scripts/ and, in the dev shell only, lazily by src/main.ts. */
import { content } from '../content-case-loep';
import { renderSectionPage } from '../sections/sectionpage';

export const meta = content.meta;
export const render = () =>
  renderSectionPage(content, {
    route: '/work/loep/',
    file: 'content-case-loep.ts',
    heroLd: { ld: '#app', ldType: 'SoftwareApplication' },
  });
