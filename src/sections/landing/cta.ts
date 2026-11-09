/**
 * The mid-page call to action: one line, one sentence, one button to
 * #contact, and the address itself for anyone who'd rather just write.
 * It sits between the portfolio and the proof sections, so a reader who
 * has seen enough doesn't have to scroll through the proof to get in touch.
 *
 * A band without a rail: it's a pause in the page, not a numbered section.
 *
 * OWNER: WS-B (landing).
 */
import { landing } from '../../content-landing';
import { esc, headline, rich, sectionOpen } from '../html';

export function renderCtaBand(): string {
  const c = landing.cta;
  return `${sectionOpen({
    id: 'start',
    src: 'content-landing.ts#landing.cta',
    renderer: 'sections/landing/cta.ts#renderCtaBand',
    cls: 'lp-cta',
  })}
    <div class="wrap">
      <div class="lp-cta-box panel" data-reveal>
        <div class="lp-cta-copy">
          ${headline(c.headline)}
          <p class="lead">${rich(c.body)}</p>
        </div>
        <div class="lp-cta-act">
          <a class="btn btn--primary" href="${esc(c.button.href)}"><span>${esc(c.button.label)}</span><span class="arw" aria-hidden="true">→</span></a>
          <a class="alink" href="mailto:${esc(c.email)}">${esc(c.email)}</a>
        </div>
      </div>
    </div>
  </section>`;
}
