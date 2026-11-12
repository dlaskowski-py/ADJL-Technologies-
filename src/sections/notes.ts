/**
 * Field notes: the /notes/ hub and each note under it.
 *
 * A note is an article, so it reads like one: the hero carries the title,
 * the summary and a byline (author, date, reading time), then one column
 * of prose at a reading measure beside a short contents list, then
 * "Related" and the other notes. The article is pinned to the page's
 * BlogPosting (data-ld="#article"), whose datePublished comes from
 * scripts/pages.mjs; the <time> here comes from the content module, and
 * the two must agree.
 *
 * Pure string functions, like every renderer: nothing here touches the DOM.
 */

import { hub, labels, notes, order, type Note, type NoteBlock } from '../content-notes';
import type { Link } from '../content-types';
import { renderNav } from './nav';
import { pageHero } from './kit';
import { renderContact, renderFooter } from './bottom';
import { esc, eyebrow, headline, linkRow, plain, prose, rail, rich, sectionOpen } from './html';

type Key = keyof typeof notes;

const RENDERER = 'sections/notes.ts';

/* ── Inline copy ─────────────────────────────────────────────────────
   Body text may carry `code` and [label](/href) on top of rich()'s
   markers. Anything that looks like half of one fails the build here,
   so a typo can't ship as literal brackets or backticks. */
const INLINE = /\[([^\]\n]+)\]\(([^)\s]+)\)|`([^`\n]+)`/g;

export function inline(s: string): string {
  let out = '';
  let at = 0;
  for (const m of s.matchAll(INLINE)) {
    out += rich(s.slice(at, m.index));
    out +=
      m[3] !== undefined
        ? `<code class="nt-code">${esc(m[3])}</code>`
        : `<a class="tlink" href="${esc(m[2])}">${rich(m[1])}</a>`;
    at = (m.index ?? 0) + m[0].length;
  }
  out += rich(s.slice(at));
  const text = out.replace(/<[^>]*>/g, '');
  if (/\]\(|`/.test(text)) throw new Error(`notes: unparsed link or code marker in "${s.slice(0, 80)}…"`);
  return out;
}

/** "2026-11-11" → "November 11, 2026". UTC, so the day never shifts. */
export function longDate(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) throw new Error(`notes: "${iso}" isn't a YYYY-MM-DD date`);
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export const timeTag = (iso: string): string => `<time datetime="${esc(iso)}">${esc(longDate(iso))}</time>`;

/** Words a reader reads in the body, markers and link syntax removed. */
function words(n: Note): number {
  const text = n.parts
    .flatMap((p) => [p.heading, ...p.body.flatMap((b) => (typeof b === 'string' ? [b] : b.list))])
    .join(' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`/g, '');
  return plain(text).split(/\s+/).filter(Boolean).length;
}

/** Minutes at an unhurried 230 words a minute, never under one. */
export const readingMinutes = (n: Note): number => Math.max(1, Math.ceil(words(n) / 230));

const minutes = (n: Note): string => labels.minutes.replace('{n}', String(readingMinutes(n)));

/** A note's title as one line of plain text, for links and lists. */
const titleOf = (n: Note): string => plain(n.hero.headline.join(' '));
/** The same, without its closing full stop, for a link label. */
const labelOf = (n: Note): string => titleOf(n).replace(/\.$/, '');

function block(b: NoteBlock): string {
  if (typeof b === 'string') return `<p>${inline(b)}</p>`;
  return `<ul class="bullets nt-list">${b.list.map((li) => `<li>${inline(li)}</li>`).join('')}</ul>`;
}

/** Author, date and reading time, under the summary. Not chrome: the
 *  markdown copy and Machine View should say who wrote it, and when. */
function byline(n: Note): string {
  return `<dl class="specs hero-specs nt-byline">
          <div class="spec"><dt>${esc(labels.by)}</dt><dd>${esc(labels.author)}</dd></div>
          <div class="spec"><dt>${esc(labels.published)}</dt><dd>${timeTag(n.published)}</dd></div>
          <div class="spec"><dt>${esc(labels.reading)}</dt><dd>${esc(minutes(n))}</dd></div>
        </dl>`;
}

/** One note: hero with byline, the article, related links, contact.
 *  "Related" and "More notes" are h2s styled as labels, so a screen
 *  reader's list of headings and Machine View's outline both reach them. */
export function renderNote(key: Key): { navHtml: string; pageHtml: string } {
  const n = notes[key];
  const src = `content-notes.ts#notes.${key}`;
  const renderer = `${RENDERER}#renderNote`;
  const ids = new Set<string>();
  for (const p of n.parts) {
    if (ids.has(p.id)) throw new Error(`notes: ${n.route} uses the id "${p.id}" twice`);
    ids.add(p.id);
  }

  const hero = pageHero({
    route: n.route,
    hero: { ...n.hero, specs: undefined },
    src: `${src}.hero`,
    renderer,
    figure: true,
    after: byline(n),
  });

  const article = `${sectionOpen({ id: 'note', src: `${src}.parts`, renderer })}
    <div class="wrap">
      ${rail(2, 'note')}
      <div class="nt-layout">
        <nav class="nt-toc" aria-label="${esc(labels.toc)}" data-chrome>
          <p class="label">${esc(labels.toc)}</p>
          <ol>${n.parts
            .map((p) => `<li><a href="#${esc(p.id)}">${rich(p.heading.replace(/\.$/, ''))}</a></li>`)
            .join('')}</ol>
        </nav>
        <article class="nt-body" data-ld="#article" data-ld-type="BlogPosting">
          ${n.parts
            .map((p) => `<h2 class="nt-h" id="${esc(p.id)}">${rich(p.heading)}</h2>${p.body.map(block).join('')}`)
            .join('\n          ')}
        </article>
      </div>
    </div>
  </section>`;

  const others: Link[] = order
    .filter((k) => k !== key)
    .map((k) => ({ label: labelOf(notes[k]), href: notes[k].route }));

  const foot = `${sectionOpen({ id: 'related', src: `${src}.related`, renderer, cls: 'nt-foot' })}
    <div class="wrap">
      ${rail(3, 'related')}
      <div class="nt-foot-grid">
        <div>
          <h2 class="label">${esc(labels.related)}</h2>
          ${linkRow(n.related)}
        </div>
        <div>
          <h2 class="label">${esc(labels.more)}</h2>
          ${linkRow([...others, labels.all])}
        </div>
      </div>
    </div>
  </section>`;

  return { navHtml: renderNav(n.route), pageHtml: [hero, article, foot, renderContact(4), renderFooter()].join('') };
}

/** /notes/: the hero, then every note as a card, newest first. */
export function renderNotesHub(): { navHtml: string; pageHtml: string } {
  const route = '/notes/';
  const renderer = `${RENDERER}#renderNotesHub`;
  const ix = hub.index;

  const cards = order
    .map((k) => {
      const n = notes[k];
      return `<li class="nt-card" data-reveal>
          <p class="label nt-card-meta" data-chrome>${timeTag(n.published)}<span aria-hidden="true"> · </span>${esc(minutes(n))}</p>
          <h3 class="h3 nt-card-title"><a class="nt-card-link" href="${esc(n.route)}">${rich(titleOf(n))}</a></h3>
          <p class="nt-card-blurb">${rich(n.blurb)}</p>
          <span class="nt-card-more" aria-hidden="true">${esc(labels.read)} <span class="arw">→</span></span>
        </li>`;
    })
    .join('');

  const index = `${sectionOpen({ id: ix.id, src: 'content-notes.ts#hub.index', renderer })}
    <div class="wrap">
      ${rail(2, ix.id)}
      <div class="nt-hub-grid">
        <div class="nt-hub-head">
          ${eyebrow(ix.eyebrow)}
          ${headline(ix.headline)}
          ${prose([ix.body], 'prose nt-hub-body')}
        </div>
        <ol class="nt-cards">${cards}</ol>
      </div>
    </div>
  </section>`;

  const hero = pageHero({ route, hero: hub.hero, src: 'content-notes.ts#hub.hero', renderer, figure: true });
  return { navHtml: renderNav(route), pageHtml: [hero, index, renderContact(3), renderFooter()].join('') };
}
