/**
 * The names of the checks that fail this site's build, as a terminal
 * block. Names only: what each one stops is prose and lives in the
 * content module's table.
 */
import { chip, esc } from '../html';

export const GUARDS = [
  'check-css',
  'check-links',
  'check-claims',
  'check-contact',
  'check-motion',
  'check-markers',
  'check-usage',
  'check-voice',
  'check-seo',
  'check-provenance',
  'check-budget',
];

export function renderGuards(): string {
  return `<div class="panel term guards" data-chrome>
    <div class="panel-head"><span class="panel-title">npm run build</span>${chip('build')}</div>
    <pre class="term-body"><code>${GUARDS.map((g) => `<span class="term-ok">✓</span> ${esc(g)}`).join('\n')}</code></pre>
  </div>`;
}
