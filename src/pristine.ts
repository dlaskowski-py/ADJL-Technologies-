/**
 * The page exactly as it arrived, before any module touched the DOM.
 * Captured as the first line of boot(); the hero lattice parses this to
 * draw the page's own structure, and it must not include its own canvas,
 * a decode in flight or anything else a script added.
 */
export let pristine = '';

export function capturePristine(): void {
  pristine = document.documentElement.outerHTML;
}
