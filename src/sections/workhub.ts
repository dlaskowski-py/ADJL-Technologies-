/**
 * /work/ — every system we built, one card each, with a filter.
 *
 * The cards are the same objects the home page's "In production" section
 * renders (content.ts systems), so the two can't drift. The filter is a
 * row of radios that only a script can operate; without it every card is
 * visible, which is the right failure.
 */

import type { Meta } from '../content-types';
import { esc, rail, sectionOpen } from './html';
import { renderContact, renderFooter } from './bottom';
import { renderNav } from './nav';
import { pageHero } from './kit';
import { systemCards } from './home';

export type WorkHubContent = {
  meta: Meta;
  hero: {
    eyebrow: string;
    headline: string[];
    lead?: string;
    body?: string;
    primary?: { label: string; href: string };
    secondary?: { label: string; href: string };
  };
  filter: { legend: string; options: { value: string; label: string }[] };
};

export function renderWorkHubPage(c: WorkHubContent): { navHtml: string; pageHtml: string } {
  const h = c.hero;
  const filter = `<fieldset class="filter" id="filter" data-filter data-js-only>
      <legend class="label">${esc(c.filter.legend)}</legend>
      <div class="filter-track">${c.filter.options
        .map(
          (o, i) =>
            `<label class="filter-opt"><input type="radio" name="work-filter" value="${esc(o.value)}"${
              i === 0 ? ' checked' : ''
            } /><span>${esc(o.label)}</span></label>`,
        )
        .join('')}</div>
      <p class="sr-only" aria-live="polite" data-filter-announce></p>
    </fieldset>`;

  const list = `${sectionOpen({ id: 'systems', src: 'content.ts#systems', renderer: 'sections/workhub.ts#renderWorkHubPage', band: true })}
    <div class="wrap">
      ${rail(2, 'systems')}
      ${filter}
      ${systemCards()}
    </div>
  </section>`;

  return {
    navHtml: renderNav('/work/'),
    pageHtml: [
      pageHero({
        route: '/work/',
        hero: {
          eyebrow: h.eyebrow,
          headline: h.headline,
          lead: h.lead ?? h.body ?? '',
          primary: h.primary,
          secondary: h.secondary ?? { label: 'Talk to Daniel', href: '#contact' },
        },
        src: 'content-work.ts#content.hero',
        renderer: 'sections/workhub.ts#renderWorkHubPage',
        figure: true,
      }),
      list,
      renderContact(3),
      renderFooter(),
    ].join(''),
  };
}
