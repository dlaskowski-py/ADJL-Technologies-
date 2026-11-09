/* One page: its renderer and its meta. Imported by the prerender entry in
   scripts/ and, in the dev shell only, lazily by src/main.ts. */
export { renderPage as render } from '../sections/home';
export { meta, faq } from '../content';
