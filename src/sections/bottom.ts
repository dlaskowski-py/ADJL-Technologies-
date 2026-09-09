/** The console demo, the method, the stack, the founder, the FAQ, the close. */

import * as C from '../content';
import { backdrop, esc, eyebrow, headline, rich } from './html';

/**
 * The recorded console.
 *
 * The transcript is emitted as a JSON <script> rather than as markup so the
 * lines stay in content.ts with the rest of the copy, and so the animation
 * module owns how they appear. The caption is NOT part of the animation: it
 * says this is a recording, and it has to be readable whether or not the
 * script ever runs.
 */
export function renderDemo(): string {
  const d = C.demo;
  return `<section class="demo sec-line sec-tint" id="scanner">
    <div class="wrap demo-inner">
      <div class="demo-copy">
        ${eyebrow(d.eyebrow)}
        ${headline(d.headline)}
        <p class="lede" data-reveal style="--i:1">${rich(d.body)}</p>
      </div>
      <figure class="console" data-console data-reveal>
        <div class="con-chrome" aria-hidden="true">
          <span class="con-dot"></span><span class="con-dot"></span><span class="con-dot"></span>
          <span class="con-title mono">adjl · underwrite</span>
        </div>
        <div class="con-out mono" role="img" aria-label="A recorded transcript of the underwriting engine analyzing a property listing"></div>
        <script type="application/json" class="con-script">${JSON.stringify(d.script).replace(
          /</g,
          '\\u003c',
        )}</script>
        <figcaption class="con-cap">
          <span>${esc(d.caption)}</span>
          <button type="button" class="con-replay" data-console-replay>${esc(d.replay)}</button>
        </figcaption>
      </figure>
    </div>
  </section>`;
}

export function renderMethod(): string {
  const m = C.method;
  return `<section class="method sec-line" id="method">
    <div class="wrap">
      ${eyebrow(m.eyebrow)}
      ${headline(m.headline)}
      <p class="lede" data-reveal style="--i:1">${rich(m.intro)}</p>
      <ol class="steps" data-stagger>
        ${m.steps
          .map(
            (s) => `<li class="step" data-reveal>
          <span class="step-when label">${esc(s.when)}</span>
          <span class="step-num num">${esc(s.num)}</span>
          <h3 class="step-title h3">${esc(s.title)}</h3>
          <p class="step-body">${rich(s.body)}</p>
        </li>`,
          )
          .join('')}
      </ol>
    </div>
  </section>`;
}

/** The stack marquee. The rows are real lists; motion/marquee.ts clones each
 *  track for the loop and hides the clone from assistive tech. */
export function renderStack(): string {
  const s = C.stack;
  return `<section class="stack sec-line sec-tint" id="stack">
    <div class="wrap">
      ${eyebrow(s.eyebrow)}
      <p class="stack-label lede" data-reveal>${rich(s.label)}</p>
    </div>
    <div class="mq-rows">
      ${s.groups
        .map(
          (g, i) => `<div class="mq-row" data-marquee style="--dir:${i % 2 === 0 ? 1 : -1}">
        <span class="mq-name label">${esc(g.name)}</span>
        <div class="mq-viewport">
          <ul class="mq-track">
            ${g.items.map((it) => `<li class="mq-item">${esc(it)}</li>`).join('')}
          </ul>
        </div>
      </div>`,
        )
        .join('')}
    </div>
  </section>`;
}

export function renderFounder(): string {
  const f = C.founder;
  return `<section class="founder sec-line" id="founder">
    <div class="wrap founder-inner">
      <div class="founder-copy">
        ${eyebrow(f.eyebrow)}
        ${headline(f.headline)}
        ${f.body
          .map(
            (p, i) =>
              `<p class="founder-p${i === 0 ? ' lede' : ''}" data-reveal style="--i:${i + 1}">${rich(p)}</p>`,
          )
          .join('')}
      </div>
      <aside class="founder-card" data-reveal data-tilt data-spotlight>
        <div class="founder-mark" aria-hidden="true">
          <span></span><span></span><span></span>
        </div>
        <p class="founder-name h3">${esc(f.name)}</p>
        <p class="founder-role label">${esc(f.role)}</p>
        <ul class="founder-points">
          ${f.points.map((p) => `<li>${rich(p)}</li>`).join('')}
        </ul>
        <a class="tlink founder-mail" href="mailto:${esc(C.CONTACT)}">${esc(C.CONTACT)}</a>
      </aside>
    </div>
  </section>`;
}

/** <details>/<summary>, so it works with scripting off. ui.ts only adds the
 *  one-open-at-a-time behaviour. */
export function renderFaq(): string {
  const f = C.faq;
  return `<section class="faq sec-line sec-tint" id="faq">
    <div class="wrap wrap--narrow">
      ${eyebrow(f.eyebrow)}
      ${headline(f.headline)}
      <div class="faq-list" data-stagger>
        ${f.items
          .map(
            (it) => `<details class="faq-item" data-reveal>
          <summary class="faq-q"><span>${esc(it.q)}</span><i aria-hidden="true"></i></summary>
          <div class="faq-a"><p>${rich(it.a)}</p></div>
        </details>`,
          )
          .join('')}
      </div>
    </div>
  </section>`;
}

/** The closing call to action. Shared by every page, so it takes its copy as
 *  an argument rather than reading the home page's. */
export function renderCta(c: {
  eyebrow: string;
  headline: string[];
  body: string;
  button: { label: string; href: string };
  email: string;
  note?: string;
}): string {
  return `<section class="cta is-clear" id="contact" data-scrub>
    ${backdrop('bloom')}
    <div class="wrap wrap--narrow cta-inner">
      ${eyebrow(c.eyebrow)}
      ${headline(c.headline)}
      <p class="lede cta-body" data-reveal style="--i:1">${rich(c.body)}</p>
      <div class="cta-actions" data-reveal style="--i:2">
        <a class="btn btn--solid" href="${esc(c.button.href)}"><span>${esc(c.button.label)}</span><span class="arw">&rarr;</span></a>
        <a class="mail" href="mailto:${esc(c.email)}">${esc(c.email)}</a>
        <button class="copy-btn" type="button" data-copy="${esc(c.email)}" aria-label="Copy email address">
          <span class="copy-idle">${esc(C.cta.copy)}</span><span class="copy-done">${esc(C.cta.copied)}</span>
        </button>
      </div>
      ${c.note ? `<p class="cta-note" data-reveal style="--i:3">${rich(c.note)}</p>` : ''}
    </div>
  </section>`;
}

export function renderFooter(): string {
  const f = C.footer;
  return `<footer class="foot">
    <div class="wrap foot-inner">
      <div class="foot-brand">
        <span class="wm-mark" aria-hidden="true">
          <i class="wm-bar"></i><i class="wm-bar wm-bar--signal"></i><i class="wm-bar"></i>
        </span>
        <p class="foot-blurb">${rich(f.blurb)}</p>
      </div>
      <nav class="foot-nav" aria-label="Footer">
        ${f.groups
          .map(
            (g) => `<div class="foot-group">
          <p class="label foot-group-name">${esc(g.name)}</p>
          <ul>${g.links.map((l) => `<li><a href="${esc(l.href)}">${esc(l.label)}</a></li>`).join('')}</ul>
        </div>`,
          )
          .join('')}
      </nav>
    </div>
    <div class="wrap foot-legal">
      <p>${rich(f.legal)}</p>
      <p class="foot-mail"><a class="tlink" href="mailto:${esc(C.CONTACT)}">${esc(C.CONTACT)}</a></p>
    </div>
  </footer>`;
}
