/** The selected-work band, shared in spirit by / and /work/. */

import { backdrop, em, esc, eyebrow, headline, kw } from './html';

export type WorkItem = {
  num: string;
  kicker: string;
  title: string[];
  sub: string;
  body: string;
  linkLabel: string;
  href: string;
  media: string;
};

export function renderWorkBand(w: {
  eyebrow: string;
  headline: string[];
  intro: string;
  items: WorkItem[];
  more?: { label: string; href: string };
}): string {
  return `<section class="work sec-line" id="work">
    <div class="wrap work-head">
      ${eyebrow(w.eyebrow)}
      ${headline(w.headline)}
      <p class="lede" data-reveal style="--i:1">${em(w.intro)}</p>
    </div>
    <div class="work-list">
      ${w.items
        .map(
          (it, i) => `<article class="wcard" data-reveal style="--n:${i}">
        <a class="wcard-link" href="${esc(it.href)}" aria-label="${esc(it.title.join(' '))}">
          <div class="wcard-film">
            ${backdrop(it.media, 'backdrop--plate')}
            <span class="wcard-num num">${esc(it.num)}</span>
          </div>
          <div class="wcard-body">
            <span class="label wcard-kicker">${esc(it.kicker)}</span>
            <h3 class="wcard-title">${it.title.map((t) => `<span>${esc(t)}</span>`).join('')}</h3>
            <p class="wcard-sub">${esc(it.sub)}</p>
            <p class="wcard-text">${kw(it.body)}</p>
            <span class="wcard-cta"><span>${esc(it.linkLabel)}</span><span class="arw">&rarr;</span></span>
          </div>
        </a>
      </article>`,
        )
        .join('')}
    </div>
    ${
      w.more
        ? `<div class="wrap work-more" data-reveal>
      <a class="btn btn--ghost" href="${esc(w.more.href)}"><span>${esc(w.more.label)}</span><span class="arw">&rarr;</span></a>
    </div>`
        : ''
    }
  </section>`;
}
