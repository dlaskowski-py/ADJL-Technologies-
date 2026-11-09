/**
 * The hero poster: this page's structure graph drawn as a static SVG at
 * build time (layout B, exploded), and the counts line under it.
 *
 * OWNER: WS1 (hero). STUB until WS1 lands: returns an empty drawing and
 * zero counts so the hook plumbing can run.
 */
export type PosterResult = { svg: string; counts: { headings: number; links: number; entities: number } };

export function renderPoster(_html: string, _route: string): PosterResult {
  return {
    svg: '<svg viewBox="0 0 600 600" aria-hidden="true" focusable="false"></svg>',
    counts: { headings: 0, links: 0, entities: 0 },
  };
}
