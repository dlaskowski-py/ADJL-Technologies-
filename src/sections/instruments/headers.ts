/**
 * The curl -I panel: this page's real response headers, with the CSP one
 * directive per line. Prerendered from netlify.toml's policy (BUILD);
 * motion/headers.ts HEAD-fetches the page and swaps in what the server sent.
 *
 * OWNER: WS2. STUB until WS2 lands. Markup contract: [data-headers].
 */
import { chip, esc } from '../html';

export function renderHeaders(csp: { directive: string; note: string }[]): string {
  return `<div class="panel headers" data-headers>
    <div class="panel-head"><span class="panel-title">curl -I</span>${chip('build')}</div>
    <dl class="headers-csp" data-chrome>${csp
      .map((c) => `<div><dt><code>${esc(c.directive)}</code></dt><dd>${esc(c.note)}</dd></div>`)
      .join('')}</dl>
  </div>`;
}
