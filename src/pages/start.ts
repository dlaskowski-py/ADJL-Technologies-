/* One page: its renderer and its meta. Imported by the prerender entry in
   scripts/ and, in the dev shell only, lazily by src/main.ts.

   STUB from the foundation: the generic section page, with the
   assistant's mount ([data-assistant], the contract
   src/motion/assistant.ts loads on) set on the #intake section. WS-A
   replaces the body with its own renderer (src/sections/start.ts), which
   writes the form and [data-assistant] itself, and renders the contact
   block as renderContact(n, undefined, { start: false }).

   The shared contact block opens with "Start a project", which on this
   page would only link to itself, so the stub swaps it for the block
   without that button. renderSectionPage numbers the contact block after
   the hero, the sections, the FAQ and the foot; renderContact is pure, so
   the same number gives the same string, and a miss fails the build. */
import { content } from '../content-start';
import { renderContact } from '../sections/bottom';
import { renderSectionPage } from '../sections/sectionpage';

export const meta = content.meta;
export const render = () => {
  const page = renderSectionPage(content, { route: '/start/', file: 'content-start.ts' });
  const n = 2 + content.sections.length + (content.faq ? 1 : 0) + (content.foot ? 1 : 0);
  const shared = renderContact(n);
  if (!page.pageHtml.includes(shared)) throw new Error('src/pages/start.ts: the contact block isn’t where the stub expects it');
  const pageHtml = page.pageHtml
    .replace(/(<section [^>]*\bid="intake")/, '$1 data-assistant')
    .replace(shared, () => renderContact(n, undefined, { start: false }));
  return { ...page, pageHtml };
};
