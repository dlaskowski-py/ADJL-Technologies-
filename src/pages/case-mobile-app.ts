/* One page: its renderer and its meta. Imported by the prerender entry in
   scripts/ and, in the dev shell only, lazily by src/main.ts. */
import { content } from '../content-case-mobile-app';
import { renderSectionPage } from '../sections/sectionpage';

export const meta = content.meta;
export const render = () =>
  renderSectionPage(content, {
    route: '/work/mobile-app/',
    file: 'content-case-mobile-app.ts',
    heroLd: { ld: '#app', ldType: 'SoftwareApplication' },
  });
