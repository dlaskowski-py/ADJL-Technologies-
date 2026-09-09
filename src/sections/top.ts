/** Hero, the capability strip, and the three practices. */

import * as C from '../content';
import { backdrop, checklist, displayHeadline, em, esc, eyebrow, headline, kw } from './html';

export function renderHero(): string {
  const h = C.hero;
  return `<section class="hero is-clear" id="top" data-scrub>
    ${backdrop('lumen')}
    <div class="wrap hero-inner">
      <p class="eyebrow" data-reveal>${esc(h.eyebrow)}</p>
      ${displayHeadline(h.headline)}
      <p class="hero-body" data-reveal style="--i:3">${kw(h.body)}</p>
      <div class="hero-actions" data-reveal style="--i:4">
        <a class="btn btn--solid" href="${h.primary.href}"><span>${esc(h.primary.label)}</span><span class="arw">&rarr;</span></a>
        <a class="btn btn--ghost" href="${h.secondary.href}"><span>${esc(h.secondary.label)}</span></a>
      </div>
    </div>
    <div class="hero-scroll" aria-hidden="true"><span>${esc(h.scrollHint)}</span><i></i></div>
  </section>`;
}

/** The four capability chips. Deliberately not statistics — see content.ts. */
export function renderStrip(): string {
  const s = C.strip;
  return `<section class="strip" aria-label="What we do, in short">
    <div class="wrap strip-inner">
      <p class="strip-line" data-reveal>${em(s.line)}</p>
      <ul class="chips" data-stagger>
        ${s.chips
          .map(
            (c) => `<li class="chip" data-reveal>
          <span class="chip-k label">${esc(c.k)}</span>
          <span class="chip-v">${esc(c.v)}</span>
        </li>`,
          )
          .join('')}
      </ul>
    </div>
  </section>`;
}

export function renderPractices(): string {
  const p = C.practices;
  return `<section class="practices sec-line" id="practices">
    <div class="wrap">
      ${eyebrow(p.eyebrow)}
      ${headline(p.headline)}
      <p class="lede" data-reveal style="--i:1">${em(p.intro)}</p>
      <div class="practice-grid">
        ${p.items
          .map(
            (it, i) => `<article class="practice" data-reveal style="--i:${i + 2}" data-tilt data-spotlight>
          <span class="practice-num num">${esc(it.num)}</span>
          <h3 class="practice-title h3">${esc(it.title)}</h3>
          <p class="practice-sub label">${esc(it.sub)}</p>
          <p class="practice-body">${kw(it.body)}</p>
          ${checklist(it.points)}
          <a class="tlink practice-link" href="${esc(it.link.href)}">
            <span>${esc(it.link.label)}</span><span class="arw">&rarr;</span>
          </a>
        </article>`,
          )
          .join('')}
      </div>
    </div>
  </section>`;
}
