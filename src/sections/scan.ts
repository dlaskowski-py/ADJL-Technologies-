/**
 * /scan/: "See what AI sees on your site".
 *
 *   #top     the hero, with the scanner's form under the lead
 *            ([data-scan="form"], data-js-only). With JavaScript off the
 *            form is hidden and a note points at the recorded scan below.
 *   #report  the report ([data-scan="report"]): until a visitor scans a
 *            page, a RECORDED scan of this site (content-scan.ts
 *            `example`), drawn by the same function the browser uses for a
 *            live one (scan-kit.ts renderReport). The sentence saying so
 *            ([data-scan="example-note"]) is hidden by the browser once a
 *            live scan replaces it. The copy the browser needs rides along
 *            as a JSON block.
 *   #how     what the scanner does and doesn't do.
 *   #audit   the way on: the website audit, and a quote for one.
 *
 * src/motion/scan.ts loads on [data-scan]. Markup it changes is styled by
 * attribute selectors in src/styles/pages/scan.css; the classes here are
 * prerendered, and every one has a rule there.
 *
 * Pure string functions, like every renderer: no DOM, no window.
 */

import { content as C, example, scanCopy, scanErrors } from '../content-scan';
import { chip, esc, eyebrow, headline, prose, rail, rich, sectionOpen } from './html';
import { pageHero, renderSection } from './kit';
import { renderNav } from './nav';
import { renderContact, renderFooter } from './bottom';
import { renderReport } from './scan-kit';

const FILE = 'content-scan.ts';
const ROUTE = '/scan/';

/** The day the example was recorded, in the words the page uses. */
const recorded = new Date(example.at).toLocaleDateString('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});
const dated = (s: string) => s.replace(/\{date\}/g, recorded);

/** JSON for a <script type="application/json"> block: nothing in it can
 *  close the element early. */
const json = (v: unknown) => JSON.stringify(v).replace(/</g, '\\u003c');

/** The form under the hero's lead, and what replaces it with no script. */
function form(): string {
  const f = C.form;
  const steps = (Object.keys(f.steps) as (keyof typeof f.steps)[])
    .map(
      (k) =>
        `<li data-step="${k}" data-state="wait"><span data-part="dot" aria-hidden="true"></span><span data-part="name">${esc(
          f.steps[k],
        )}</span> <span data-part="t">${esc(f.stepState.wait)}</span></li>`,
    )
    .join('');
  return `<div class="scan-entry">
    <form class="scan-form" data-scan="form" method="get" novalidate data-js-only>
      <label class="scan-label" for="scan-url">${esc(f.label)}</label>
      <div class="scan-field">
        <span class="scan-prompt" aria-hidden="true">›</span>
        <input class="scan-input" id="scan-url" name="url" type="url" placeholder="${esc(
          f.placeholder,
        )}" autocomplete="url" autocapitalize="off" spellcheck="false" enterkeyhint="go" maxlength="2048" aria-describedby="scan-note" data-scan-url>
        <button class="btn btn--primary scan-go" type="submit" data-scan-go>${esc(f.button)}</button>
      </div>
      <p class="scan-note" id="scan-note">${rich(f.note)}</p>
      <ol class="scan-steps" aria-label="${esc(f.stepsLabel)}" data-scan-steps data-chrome hidden>${steps}</ol>
      <div class="scan-error" data-scan-error role="alert" hidden></div>
      <p class="sr-only" data-scan-status role="status"></p>
    </form>
    <p class="scan-nojs">${rich(f.nojs)} <a class="tlink" href="${esc(f.nojsLink.href)}">${esc(f.nojsLink.label)}</a></p>
  </div>`;
}

/** The report section: the recorded example, and the copy for a live one. */
function report(n: number): string {
  const r = C.report;
  const copy = { form: C.form, report: scanCopy, errors: scanErrors };
  return `${sectionOpen({
    id: r.id,
    src: `${FILE}#content.report`,
    renderer: 'sections/scan.ts#renderScanPage',
    band: true,
    cls: 'scan-sec',
  })}
    <div class="wrap">
      ${rail(n, r.id)}
      <div class="sec-copy">
        ${eyebrow(r.eyebrow)}
        ${headline(r.headline)}
        <div class="prose sec-body" data-reveal>${(r.body ?? []).map((p) => `<p>${rich(dated(p))}</p>`).join('')}<p data-scan="example-note">${rich(
          dated(r.exampleNote),
        )}</p></div>
      </div>
      <div class="scan-out" data-scan="report" data-example>${renderReport(
        example,
        scanCopy,
        chip('recorded', dated(r.exampleChip)),
      )}</div>
      <script type="application/json" data-scan-copy>${json(copy)}</script>
    </div>
  </section>`;
}

/** The way on: the audit, with real buttons. */
function audit(n: number): string {
  const a = C.audit;
  return `${sectionOpen({ id: a.id, src: `${FILE}#content.audit`, renderer: 'sections/scan.ts#renderScanPage', band: true })}
    <div class="wrap">
      ${rail(n, a.id)}
      <div class="sec-copy sec-copy--split">
        <div class="sec-head">
          ${eyebrow(a.eyebrow)}
          ${headline(a.headline)}
        </div>
        <div class="sec-main">
          ${prose(a.body)}
          <div class="actions scan-cta" data-reveal>
            <a class="btn btn--primary" href="${esc(a.primary.href)}"><span>${esc(a.primary.label)}</span><span class="arw" aria-hidden="true">→</span></a>
            <a class="btn btn--ghost" href="${esc(a.secondary.href)}"><span>${esc(a.secondary.label)}</span></a>
          </div>
        </div>
      </div>
    </div>
  </section>`;
}

export function renderScanPage(): { navHtml: string; pageHtml: string } {
  let n = 1;
  const parts = [
    pageHero({
      route: ROUTE,
      hero: C.hero,
      src: `${FILE}#content.hero`,
      renderer: 'sections/scan.ts#renderScanPage',
      figure: true,
      after: form(),
    }),
    report(++n),
    renderSection(C.how, ++n, `${FILE}#content.how`),
    audit(++n),
    renderContact(++n),
    renderFooter(),
  ];
  return { navHtml: renderNav(ROUTE), pageHtml: parts.join('') };
}
