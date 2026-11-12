/**
 * /changelog/: what changed on this site, newest first.
 *
 * Entries are grouped by day on a timeline: the date on the left (above,
 * on a phone), that day's entries beside it, each linking to its commits
 * on GitHub. Each entry carries an id (`c-` and its newest hash), so Ask
 * can cite it and anyone can link straight to it.
 *
 * Pure string functions, like every renderer: nothing here touches the DOM.
 */

import { content, repo, type ChangelogEntry } from '../content-changelog';
import { renderNav } from './nav';
import { pageHero, renderSection } from './kit';
import { renderContact, renderFooter } from './bottom';
import { esc, eyebrow, headline, prose, rail, rich, sectionOpen } from './html';
import { timeTag } from './notes';

const RENDERER = 'sections/changelog.ts#renderChangelog';
const HASH = /^[0-9a-f]{7,40}$/;

function entry(e: ChangelogEntry, ids: Set<string>): string {
  if (!e.commits.length) throw new Error(`changelog: "${e.title}" links no commit`);
  for (const h of e.commits) if (!HASH.test(h)) throw new Error(`changelog: "${h}" isn't a commit hash`);
  const id = `c-${e.commits[0]}`;
  if (ids.has(id)) throw new Error(`changelog: two entries start with ${e.commits[0]}`);
  ids.add(id);
  const c = content.log.commit;
  return `<article class="cl-entry" id="${esc(id)}">
            <h3 class="h3 cl-title">${rich(e.title)}</h3>
            <p class="cl-body">${rich(e.body)}</p>
            <div class="cl-foot">
              <p class="label cl-commits"><span>${esc(e.commits.length === 1 ? c.one : c.many)}</span> ${e.commits
                .map((h) => `<a class="cl-hash" href="${esc(`${repo}/commit/${h}`)}">${esc(h)}</a>`)
                .join(' ')}</p>
              ${e.link ? `<p class="cl-see"><a class="alink" href="${esc(e.link.href)}"><span>${esc(e.link.label)}</span><span class="arw" aria-hidden="true">→</span></a></p>` : ''}
            </div>
          </article>`;
}

export function renderChangelog(): { navHtml: string; pageHtml: string } {
  const route = '/changelog/';
  const log = content.log;

  /* Days, newest first, in the order the entries are written. An entry
     dated after the one above it is an ordering mistake: fail. */
  const days: { date: string; entries: ChangelogEntry[] }[] = [];
  for (const e of log.entries) {
    const last = days[days.length - 1];
    if (last && e.date > last.date) throw new Error(`changelog: "${e.title}" (${e.date}) sits below an older entry`);
    if (last?.date === e.date) last.entries.push(e);
    else days.push({ date: e.date, entries: [e] });
  }
  const ids = new Set<string>();

  const list = `${sectionOpen({ id: log.id, src: 'content-changelog.ts#content.log', renderer: RENDERER })}
    <div class="wrap">
      ${rail(2, log.id)}
      <div class="cl-head">
        ${eyebrow(log.eyebrow)}
        ${headline(log.headline)}
        ${prose([log.body], 'prose cl-intro')}
      </div>
      <ol class="cl-days">
        ${days
          .map(
            (d) => `<li class="cl-day">
          <p class="label cl-date">${timeTag(d.date)}</p>
          <div class="cl-entries">
          ${d.entries.map((e) => entry(e, ids)).join('')}
          </div>
        </li>`,
          )
          .join('')}
      </ol>
    </div>
  </section>`;

  const hero = pageHero({ route, hero: content.hero, src: 'content-changelog.ts#content.hero', renderer: RENDERER, figure: true });
  const source = renderSection(content.source, 3, 'content-changelog.ts#content.source', { band: true });

  return { navHtml: renderNav(route), pageHtml: [hero, list, source, renderContact(4), renderFooter()].join('') };
}
