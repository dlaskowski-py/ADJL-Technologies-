/**
 * The curl -I panel: this page's response headers, with the content
 * security policy one directive per line and each directive annotated.
 *
 * BUILD: the policy as configured. The page renderer writes it from the
 * annotations in content-case-this-site.ts#csp, and scripts/stamp-sizes.mjs
 * rewrites the <pre> from netlify.toml itself once the page is final, so
 * what ships is the policy that's deployed, not a copy of it.
 * LIVE: motion/headers.ts sends a HEAD request for this page and prints
 * what the server actually answered, every readable header, with the
 * security ones highlighted. A header the server didn't send (a local
 * preview doesn't) says so.
 *
 * OWNER: WS2. Markup contract: [data-headers].
 */
import { status } from '../../content';
import { chip, esc } from '../html';

export type CspNote = { directive: string; note: string };

/** The response headers that matter for security, highlighted live. */
export const SECURITY = [
  'content-security-policy',
  'x-frame-options',
  'referrer-policy',
  'permissions-policy',
  'x-content-type-options',
];

/* Not in src/content*.ts yet (listed in WS2's report). */
const L = {
  missing: 'This preview server doesn’t send it. Production does.',
};

/** The policy, one directive per line, as `curl -I` would print it. */
export function cspLines(directives: string[]): string {
  return directives
    .map((d, i) => {
      const [name, ...rest] = d.trim().split(/\s+/);
      return `\n  <span data-dir>${esc(name)}</span>${rest.length ? ` <span data-val>${esc(rest.join(' '))}</span>` : ''}${
        i < directives.length - 1 ? ';' : ''
      }`;
    })
    .join('');
}

/** The headers block of the <pre>: CSP first, then the others as given.
 *  `others` are [name, value] pairs (from netlify.toml at build). */
export function headerLines(directives: string[], others: [string, string][] = []): string {
  const csp = `<span data-h="content-security-policy" data-sec><span data-hn>content-security-policy:</span>${cspLines(
    directives,
  )}</span>`;
  return [
    csp,
    ...others.map(
      ([n, v]) =>
        `<span data-h="${esc(n.toLowerCase())}"${SECURITY.includes(n.toLowerCase()) ? ' data-sec' : ''}><span data-hn>${esc(
          n.toLowerCase(),
        )}:</span> ${esc(v)}</span>`,
    ),
  ].join('\n');
}

export function renderHeaders(csp: CspNote[]): string {
  const copy = esc(JSON.stringify({ missing: L.missing }));
  return `<div class="panel headers" data-headers data-copy="${copy}">
    <div class="panel-head" data-chrome><span class="panel-title">curl -I</span>${chip('build')}</div>
    <pre class="headers-out" tabindex="0" data-chrome><span data-line="cmd"><span data-p aria-hidden="true">$</span> curl -I <span data-url></span></span>
<span data-line="status">HTTP <span data-k="status" title="${esc(status.needsJsTitle)}">${esc(status.needsJs)}</span></span>
<span data-headers-build>${headerLines(csp.map((c) => c.directive))}</span><span data-headers-live></span></pre>
    <dl class="headers-csp">${csp
      .map(
        (c) =>
          `<div class="headers-row" data-dir="${esc(c.directive.split(/\s+/)[0])}"><dt><code>${esc(
            c.directive,
          )}</code></dt><dd>${esc(c.note)}</dd></div>`,
      )
      .join('')}</dl>
  </div>`;
}
