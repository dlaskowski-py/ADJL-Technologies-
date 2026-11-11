/**
 * The home page, in ONE place. Both the dev shell and the build-time
 * prerender call renderPage(), so they can't disagree about the order.
 *
 * The shape: what we do (hero, with this page's own structure beside it) →
 * the practices → three instruments that demonstrate them (what a crawler
 * reads, retrieval that cites or abstains, the build sequence) → the
 * systems that are running → who you work with → the objections → contact.
 */

import * as C from '../content';
import { renderNav } from './nav';
import { pageHero } from './kit';
import { renderContact, renderFaq, renderFooter } from './bottom';
import { chip, esc, eyebrow, headline, linkRow, prose, rail, rich, sectionOpen } from './html';
import { renderMachine } from './instruments/machine';
import { renderAsk } from './instruments/ask';
import { renderPipeline } from './instruments/pipeline';
import { renderIntro } from './landing/intro';
import { renderTyper } from './landing/typer';
import { renderOffers } from './landing/offers';
import { renderCtaBand } from './landing/cta';
import { showcaseCards } from './landing/showcase';

function renderMachineSection(n: number): string {
  const m = C.machineView;
  return `${sectionOpen({ id: 'machine', src: 'content.ts#machineView', renderer: 'sections/home.ts#renderMachineSection' })}
    <div class="wrap">
      ${rail(n, 'machine', chip('build'))}
      <div class="sec-copy">
        ${eyebrow(m.eyebrow)}
        ${headline(m.headline)}
        ${prose([m.body], 'prose sec-body')}
      </div>
      <div class="sec-inst sec-inst--wide" data-reveal>${renderMachine('full')}</div>
      <p class="sec-foot" data-reveal>${rich(m.foot)}</p>
      ${linkRow([m.link])}
    </div>
  </section>`;
}

function renderAskSection(n: number): string {
  const a = C.ask;
  return `${sectionOpen({ id: 'ask', src: 'content.ts#ask', renderer: 'sections/home.ts#renderAskSection', band: true })}
    <div class="wrap">
      ${rail(n, 'ask')}
      <div class="sec-copy">
        ${eyebrow(a.eyebrow)}
        ${headline(a.headline)}
        ${prose([a.body], 'prose sec-body')}
      </div>
      <div class="sec-inst sec-inst--wide" data-reveal>${renderAsk('home')}</div>
      <p class="sec-foot" data-reveal>${rich(a.foot)}</p>
      ${linkRow([a.link])}
    </div>
  </section>`;
}

function renderProcess(n: number): string {
  const p = C.pipeline;
  return `${sectionOpen({ id: 'process', src: 'content.ts#pipeline', renderer: 'sections/home.ts#renderProcess' })}
    <div class="wrap">
      ${rail(n, 'process')}
      <div class="sec-copy">
        ${eyebrow(p.eyebrow)}
        ${headline(p.headline)}
        ${prose([p.intro], 'prose sec-body')}
        <a class="skip-seq alink" href="#systems">${esc(p.skip)}</a>
      </div>
      ${renderPipeline()}
      ${linkRow([p.link])}
    </div>
  </section>`;
}

function renderSystems(n: number): string {
  const s = C.systems;
  return `${sectionOpen({ id: 'systems', src: 'content.ts#systems', renderer: 'sections/home.ts#renderSystems', band: true })}
    <div class="wrap">
      ${rail(n, 'systems')}
      <div class="sec-copy">
        ${eyebrow(s.eyebrow)}
        ${headline(s.headline)}
        ${prose([s.intro], 'prose sec-body')}
      </div>
      ${showcaseCards({ home: true })}
      ${linkRow([s.more, C.systemsPractice])}
    </div>
  </section>`;
}

function renderTeam(n: number): string {
  const t = C.team;
  return `${sectionOpen({ id: 'team', src: 'content.ts#team', renderer: 'sections/home.ts#renderTeam' })}
    <div class="wrap">
      ${rail(n, 'team')}
      <div class="team-grid">
        <div class="sec-copy">
          ${eyebrow(t.eyebrow)}
          ${headline(t.headline)}
          ${prose(t.body, 'prose sec-body')}
        </div>
        <aside class="panel" data-reveal>
          <div class="panel-head" data-chrome><span class="panel-title">founder</span></div>
          <div class="team-card-body">
            <p class="team-name">${esc(t.name)}</p>
            <p class="label">${esc(t.role)}</p>
          </div>
        </aside>
      </div>
      <div class="engage">
        <p class="lead engage-intro" data-reveal>${rich(t.engagementIntro)}</p>
        <ol class="engage-steps">
          ${t.steps
            .map(
              (s, i) => `<li class="engage-step" data-reveal style="--i:${i}">
            <span class="numeral" aria-hidden="true">${esc(s.num)}</span>
            <p class="label">${esc(s.when)}</p>
            <h3 class="h3">${esc(s.title)}</h3>
            <p>${rich(s.body)}</p>
          </li>`,
            )
            .join('')}
        </ol>
      </div>
      <div class="stack">
        <p class="stack-label" data-reveal>${rich(t.stackLabel)}</p>
        <div class="panel" data-reveal>
          <div class="panel-head" data-chrome><span class="panel-title">stack.lock</span></div>
          <dl class="stack-list" data-chrome>
            ${t.stack
              .map(
                (g) => `<div class="stack-row"><dt>${esc(g.name)}</dt><dd>${g.items
                  .map((x) => `<span class="stack-item">${esc(x)}</span>`)
                  .join('')}</dd></div>`,
              )
              .join('')}
          </dl>
        </div>
      </div>
    </div>
  </section>`;
}

export function renderPage(): { navHtml: string; pageHtml: string } {
  const h = C.hero;
  return {
    navHtml: renderNav('/'),
    pageHtml: [
      /* The opening sequence: an overlay, shown only on the first visit of
         a session (see public/js-on.js). The page under it is complete. */
      renderIntro(),
      pageHero({
        route: '/',
        hero: { eyebrow: h.eyebrow, headline: h.headline, lead: h.body, primary: h.primary, secondary: h.secondary },
        src: 'content.ts#hero',
        renderer: 'sections/home.ts#renderPage',
        figure: true,
        after: renderTyper(),
      }),
      /* What we do and what we've built, in plain words… */
      renderOffers(2),
      renderSystems(3),
      renderCtaBand(),
      /* …then the proof, for anyone who wants to check it. */
      renderMachineSection(4),
      renderAskSection(5),
      renderProcess(6),
      renderTeam(7),
      renderFaq(C.faq, 8, 'content.ts#faq'),
      renderContact(9),
      renderFooter(),
    ].join(''),
  };
}
