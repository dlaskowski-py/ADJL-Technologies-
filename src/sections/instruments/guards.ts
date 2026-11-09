/**
 * The names of the checks that fail this site's build, as a terminal
 * block. Names only: what each one stops is prose and lives in the
 * content module's table.
 */
import { guards } from '../../content-case-this-site';
import { chip, esc } from '../html';

/** One list of guards: the this-site table and this terminal both read it. */
export const GUARDS = guards.map((g) => g.name);

export function renderGuards(): string {
  return `<div class="panel term guards" data-chrome>
    <div class="panel-head" data-chrome><span class="panel-title">npm run build</span>${chip('build')}</div>
    <pre class="term-body"><code>${GUARDS.map((g) => `<span class="term-ok">✓</span> ${esc(g)}`).join('\n')}</code></pre>
  </div>`;
}
