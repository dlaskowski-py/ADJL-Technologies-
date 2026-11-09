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
import { renderPractices } from './top';
import { renderContact, renderFaq, renderFooter } from './bottom';
import { chip, esc, eyebrow, headline, linkRow, prose, rail, rich, sectionOpen } from './html';
import { renderMachine } from './instruments/machine';
import { renderAsk } from './instruments/ask';
import { renderPipeline } from './instruments/pipeline';

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

/** One card per running system. data-tags drives the /work/ filter. */
export function systemCards(): string {
  return `<div class="sys-grid">${C.systems.items
    .map(
      (it, i) => `<article class="sys panel bracket" data-reveal style="--i:${i % 3}" data-tags="${esc(it.tags.join(' '))}">
      <div class="sys-top">
        <span class="label">${esc(it.kicker)}</span>
        <span class="sys-status mono"><i aria-hidden="true">●</i> ${esc(it.status)}</span>
      </div>
      <h3 class="h3">${rich(it.title)}</h3>
      <p>${rich(it.body)}</p>
      <a class="alink sys-link" href="${esc(it.link.href)}"><span>${esc(it.link.label)}</span><span class="arw" aria-hidden="true">→</span></a>
    </article>`,
    )
    .join('')}</div>`;
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
      ${systemCards()}
      ${linkRow([s.more])}
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
        <aside class="team-card panel" data-reveal>
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
        <div class="stack-lock panel" data-reveal>
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
      pageHero({
        route: '/',
        hero: { eyebrow: h.eyebrow, headline: h.headline, lead: h.body, primary: h.primary, secondary: h.secondary },
        src: 'content.ts#hero',
        renderer: 'sections/home.ts#renderPage',
        figure: true,
      }),
      renderPractices(2),
      renderMachineSection(3),
      renderAskSection(4),
      renderProcess(5),
      renderSystems(6),
      renderTeam(7),
      renderFaq(C.faq, 8, 'content.ts#faq'),
      renderContact(9),
      renderFooter(),
    ].join(''),
  };
}
