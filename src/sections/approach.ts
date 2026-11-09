/** /approach/ — the six steps in long form, the principles, the engagement
 *  shapes, and who owns what when it ends. */

import { esc, eyebrow, headline, rail, rich, sectionOpen } from './html';
import { renderContact, renderFooter } from './bottom';
import { renderNav } from './nav';
import { pageHero } from './kit';

export type ApproachContent = {
  meta: { title: string; description: string; ogTitle?: string; ogDescription?: string };
  hero: {
    eyebrow: string;
    headline: string[];
    body: string;
    back?: { label: string; href: string };
    primary?: { label: string; href: string };
    secondary?: { label: string; href: string };
  };
  /** The home page's six build steps, static, as long form. */
  steps?: {
    eyebrow: string;
    headline: string[];
    intro?: string;
    items: { num: string; title: string; body: string }[];
  };
  principles: {
    eyebrow: string;
    headline: string[];
    intro: string;
    items: { num: string; title: string; body: string }[];
  };
  engage: {
    eyebrow: string;
    headline: string[];
    intro: string;
    items: { tag: string; title: string; body: string; points: string[]; best: string }[];
  };
  ownership: { eyebrow: string; headline: string[]; body: string; points: string[] };
  /** Kept for the approach page's own contact copy. */
  cta?: {
    eyebrow: string;
    headline: string[];
    body: string;
    button: { label: string; href: string };
    email: string;
  };
  /** Label for the engagement cards' "suits" line. */
  bestLabel?: string;
};

const FILE = 'content-approach.ts';

function numbered(
  id: string,
  n: number,
  src: string,
  band: boolean,
  b: { eyebrow: string; headline: string[]; intro?: string; items: { num: string; title: string; body: string }[] },
): string {
  return `${sectionOpen({ id, src, renderer: 'sections/approach.ts#numbered', band })}
    <div class="wrap">
      ${rail(n, id)}
      <div class="sec-copy">
        ${eyebrow(b.eyebrow)}
        ${headline(b.headline)}
        ${b.intro ? `<p class="lead sec-intro" data-reveal>${rich(b.intro)}</p>` : ''}
      </div>
      <ol class="prin-list">
        ${b.items
          .map(
            (it, i) => `<li class="prin" data-reveal style="--i:${i % 3}">
          <span class="numeral" aria-hidden="true">${esc(it.num)}</span>
          <div class="prin-body">
            <h3 class="h3">${esc(it.title)}</h3>
            <p>${rich(it.body)}</p>
          </div>
        </li>`,
          )
          .join('')}
      </ol>
    </div>
  </section>`;
}

export function renderApproachPage(c: ApproachContent): { navHtml: string; pageHtml: string } {
  const h = c.hero;
  const e = c.engage;
  const o = c.ownership;
  let n = 1;
  const parts: string[] = [
    pageHero({
      route: '/approach/',
      hero: {
        eyebrow: h.eyebrow,
        headline: h.headline,
        lead: h.body,
        primary: h.primary,
        secondary: h.secondary ?? { label: 'Talk to Daniel', href: '#contact' },
      },
      src: `${FILE}#content.hero`,
      renderer: 'sections/approach.ts#renderApproachPage',
      figure: true,
    }),
  ];

  if (c.steps) parts.push(numbered('steps', ++n, `${FILE}#content.steps`, true, c.steps));
  parts.push(numbered('principles', ++n, `${FILE}#content.principles`, n % 2 === 0, c.principles));

  parts.push(`${sectionOpen({ id: 'engage', src: `${FILE}#content.engage`, renderer: 'sections/approach.ts#renderApproachPage', band: ++n % 2 === 0 })}
    <div class="wrap">
      ${rail(n, 'engage')}
      <div class="sec-copy">
        ${eyebrow(e.eyebrow)}
        ${headline(e.headline)}
        <p class="lead sec-intro" data-reveal>${rich(e.intro)}</p>
      </div>
      <div class="engage-grid">
        ${e.items
          .map(
            (it, i) => `<article class="engage-card panel bracket" data-reveal style="--i:${i}">
          <span class="label">${esc(it.tag)}</span>
          <h3 class="h3">${esc(it.title)}</h3>
          <p>${rich(it.body)}</p>
          <ul class="bullets">${it.points.map((pt) => `<li>${rich(pt)}</li>`).join('')}</ul>
          <p class="engage-best"><span class="label">${esc(c.bestLabel ?? 'Suits')}</span> ${esc(it.best)}</p>
        </article>`,
          )
          .join('')}
      </div>
    </div>
  </section>`);

  parts.push(`${sectionOpen({ id: 'ownership', src: `${FILE}#content.ownership`, renderer: 'sections/approach.ts#renderApproachPage', band: ++n % 2 === 0 })}
    <div class="wrap">
      ${rail(n, 'ownership')}
      <div class="split split--even">
        <div class="sec-copy">
          ${eyebrow(o.eyebrow)}
          ${headline(o.headline)}
          <div class="prose sec-body" data-reveal><p>${rich(o.body)}</p></div>
        </div>
        <ul class="checks own-list" data-reveal>
          ${o.points.map((pt) => `<li><span class="check" aria-hidden="true">✓</span><span>${rich(pt)}</span></li>`).join('')}
        </ul>
      </div>
    </div>
  </section>`);

  parts.push(renderContact(++n, c.cta), renderFooter());
  return { navHtml: renderNav('/approach/'), pageHtml: parts.join('') };
}
