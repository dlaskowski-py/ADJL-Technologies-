/**
 * Copy for the home page's opening sequence. Same house rules as every
 * content module: US English, contractions, short plain sentences,
 * ’ apostrophes, no hype words, no counts of clients or projects, nothing
 * claimed that hasn't happened.
 *
 * Everything the sequence shows is this site's own: the code is a
 * shortened excerpt of renderPage() in src/sections/home.ts, the command
 * and its steps are the ones in package.json, and the renderer reads the
 * page count (src/site-pages.ts) and the guard names
 * (src/content-case-this-site.ts) from the registries the build uses. The
 * firm's name comes from `nav.wordmark` in src/content.ts, and the line
 * under it is the site's tagline, from the same module.
 *
 * OWNER: WS-A.
 */
import { TAGLINE } from './content';

export const intro = {
  /** The one control in the overlay. Escape does the same. */
  skip: 'Skip intro',

  /** The editor pane. Real function names in their real order, with the
   *  proof sections folded into one comment. Plain text: the renderer
   *  colors keywords, strings and comments, and an authoring marker must
   *  never appear here (check-markers reads the built page). */
  code: {
    file: 'src/sections/home.ts',
    lines: [
      'export function renderPage() {',
      '  return [',
      '    renderIntro(),',
      "    pageHero({ route: '/', figure: true }),",
      '    renderOffers(2),',
      '    renderSystems(3),',
      '    renderCtaBand(),',
      '    // …then the proof sections',
      '    renderFooter(),',
      "  ].join('');",
      '}',
    ],
  },

  /** The build, as package.json runs it. {n} is the number of pages in
   *  src/site-pages.ts; the guards tick off after these. */
  build: {
    command: 'npm run build',
    steps: ['tsc', 'vite build', 'prerender · {n} pages'],
    /** The pane's title once the wireframe draws: the file the build wrote. */
    out: 'dist/index.html',
  },

  /** The three beats, named on the rail under the pane (intro.css lights
   *  them in turn, so it expects three). */
  beats: ['Write', 'Build', 'Assemble'],

  /** Set under the mark, just before the overlay opens: the firm's
   *  tagline (content.ts TAGLINE, the line it shares with ADJL Capital). */
  tagline: TAGLINE,
};
