/**
 * The shared tail of every page: the FAQ, the contact block, and the footer
 * with its status bar.
 */

import { cta as CTA, CONTACT, footer, status } from '../content';
import type { Faq } from '../content-types';
import { esc, eyebrow, headline, rail, rich, sectionOpen } from './html';
import { markSvg } from './nav';
import { renderStatusReadouts } from './instruments/telemetry';
import { renderViews } from './instruments/views';

/**
 * The FAQ. Native <details>, so it opens and closes with no script; the
 * section is the FAQPage's visible counterpart and each item a Question.
 */
export function renderFaq(f: Faq, n: number, src: string): string {
  return `${sectionOpen({
    id: 'faq',
    src,
    renderer: 'sections/bottom.ts#renderFaq',
    ld: '#webpage',
    ldType: 'FAQPage',
  })}
    <div class="wrap faq-wrap">
      ${rail(n, 'faq')}
      <div class="faq-head">
        ${eyebrow(f.eyebrow)}
        ${headline(f.headline)}
      </div>
      <div class="faq-list">
        ${f.items
          .map(
            (it, i) => `<details class="faq-item" data-ld-type="Question" data-reveal${i === 0 ? ' open' : ''}>
          <summary class="faq-q"><span>${esc(it.q)}</span><span class="faq-icon" aria-hidden="true"></span></summary>
          <div class="faq-a"><p>${rich(it.a)}</p></div>
        </details>`,
          )
          .join('')}
      </div>
    </div>
  </section>`;
}

/**
 * The contact block, id="contact" on every page. Its first action is
 * "Start a project" (/start/, the intake form). The address stays beside
 * it as a real mailto: link and visible text, the way in that needs no
 * form; Copy is an addition to it, never a replacement, because clipboard
 * access is refused more often than people expect.
 *
 * `opts.start: false` drops the Start button, for a page that IS the way
 * in (/start/ itself), where it would only link to itself.
 */
export function renderContact(
  n: number,
  override?: { eyebrow: string; headline: string[]; body: string },
  opts: { start?: boolean } = {},
): string {
  /* A page may say its own first line about getting in touch (the
     approach page does); the address, buttons and note are always the
     shared ones. */
  const c = { ...CTA, ...(override ?? {}) };
  const start = opts.start !== false;
  return `${sectionOpen({
    id: 'contact',
    src: 'content.ts#cta',
    renderer: 'sections/bottom.ts#renderContact',
    band: true,
  })}
    <div class="wrap">
      ${rail(n, 'contact')}
      <div class="contact-grid">
        <div>
          ${eyebrow(c.eyebrow)}
          ${headline(c.headline)}
          <p class="lead contact-body" data-reveal>${rich(c.body)}</p>
          ${
            start
              ? `<div class="actions" data-reveal>
            <a class="btn btn--primary" href="${esc(c.start.href)}"><span>${esc(c.start.label)}</span><span class="arw" aria-hidden="true">→</span></a>
          </div>`
              : ''
          }
        </div>
        <div class="contact-card panel" data-reveal>
          <div class="panel-head" data-chrome><span class="panel-title">Email</span></div>
          <div class="contact-card-body">
            <a class="contact-mail mono" href="mailto:${esc(c.email)}">${esc(c.email)}</a>
            <div class="actions">
              <a class="btn ${start ? 'btn--ghost' : 'btn--primary'}" href="${esc(c.button.href)}"><span>${esc(c.button.label)}</span>${
                start ? '' : '<span class="arw" aria-hidden="true">→</span>'
              }</a>
              <button class="btn btn--ghost" type="button" data-copy="${esc(c.email)}" data-js-only>
                <span class="copy-idle">${esc(c.copy)}</span><span class="copy-done" aria-live="polite">${esc(c.copied)}</span>
              </button>
            </div>
            <p class="contact-note">${rich(c.note)}</p>
          </div>
        </div>
      </div>
    </div>
  </section>`;
}

/** The status bar: view switch, live readouts, how we measure, the build
 *  stamp and Pause. Fixed to the bottom of the viewport from 1024px; in
 *  the footer's flow below that. */
function renderStatusBar(): string {
  return `<aside class="status" aria-label="${esc(status.label)}" data-telemetry="status" data-chrome>
    <div class="status-inner">
      ${renderViews('status')}
      <div class="status-meter">${renderStatusReadouts()}</div>
      <a class="status-how" href="${esc(status.how.href)}">${esc(status.how.label)}</a>
      <span class="status-sha mono" title="Build commit">${esc(__BUILD_SHA__)}</span>
      <button class="pause-btn" type="button" data-pause data-js-only aria-pressed="false">${esc(status.pause)}</button>
      <p class="sr-only" aria-live="polite" data-views-announce></p>
    </div>
  </aside>`;
}

export function renderFooter(): string {
  const stamp = footer.stamp.replace('{date}', __BUILD_DATE__).replace('{sha}', __BUILD_SHA__);
  return `<footer class="foot" data-ld="#organization" data-ld-type="Organization">
    ${renderStatusBar()}
    <div class="wrap foot-inner">
      <div class="foot-brand">
        <a class="wordmark" href="/" aria-label="ADJL Technology, home">
          ${markSvg()}
          <span class="wm-text"><span>ADJL</span> <b>Technology</b></span>
        </a>
        <p class="foot-tagline">${esc(footer.tagline)}</p>
        <p class="foot-blurb">${rich(footer.blurb)}</p>
        <a class="foot-mail mono" href="mailto:${esc(CONTACT)}">${esc(CONTACT)}</a>
        <button class="pause-btn" type="button" data-pause data-js-only aria-pressed="false">${esc(status.pause)}</button>
      </div>
      <nav class="foot-groups" aria-label="Footer">
        ${footer.groups
          .map(
            (g) => `<div class="foot-group">
          <p class="label">${esc(g.name)}</p>
          <ul>${g.links.map((l) => `<li><a href="${esc(l.href)}">${esc(l.label)}</a></li>`).join('')}</ul>
        </div>`,
          )
          .join('')}
      </nav>
    </div>
    <div class="wrap foot-base">
      <p class="foot-stamp mono">${esc(stamp)}</p>
      <p class="foot-legal">${rich(footer.legal)}</p>
    </div>
  </footer>`;
}
