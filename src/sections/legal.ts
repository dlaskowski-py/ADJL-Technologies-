/** The legal pages. One renderer, one entry per document. */

import { esc, eyebrow, rich } from './html';
import { renderFooter } from './bottom';
import { renderNav } from './nav';

export type LegalDoc = {
  meta: { title: string; description: string; ogTitle?: string; ogDescription?: string };
  route: string;
  eyebrow: string;
  title: string;
  updated: string;
  intro: string;
  sections: {
    id: string;
    heading: string;
    paragraphs: string[];
    list?: string[];
    /* An outbound reference. A typed field rather than a rich() marker on
       purpose: `tsc --noEmit` runs first in the build, so a malformed link
       is a compile error, where a malformed marker ships as braces on the
       page — which this repo has done twice. scripts/check-links.mjs holds
       the host allowlist and the rules about what the label may say. */
    link?: { label: string; href: string };
  }[];
};

export function renderLegalPage(doc: LegalDoc): { navHtml: string; pageHtml: string } {
  const body = `<section class="legal" id="top">
    <div class="wrap wrap--narrow legal-inner">
      ${eyebrow(doc.eyebrow)}
      <h1 class="h2 legal-title">${esc(doc.title)}</h1>
      <p class="legal-updated label">Last updated ${esc(doc.updated)}</p>
      <p class="lede legal-intro">${rich(doc.intro)}</p>

      <nav class="legal-toc" aria-label="On this page">
        <p class="label">On this page</p>
        <ul>
          ${doc.sections
            .map((s) => `<li><a href="#${esc(s.id)}">${esc(s.heading)}</a></li>`)
            .join('')}
        </ul>
      </nav>

      ${doc.sections
        .map(
          (s) => `<section class="legal-sec" id="${esc(s.id)}">
        <h2 class="h3">${esc(s.heading)}</h2>
        ${s.paragraphs.map((p) => `<p>${rich(p)}</p>`).join('')}
        ${s.list ? `<ul class="legal-list">${s.list.map((l) => `<li>${rich(l)}</li>`).join('')}</ul>` : ''}
        ${
          /* No target="_blank". A new tab would be a decision made on the
             reader's behalf, and rel="noopener" only means anything with
             one — shipping it here would be a no-op attribute. The guard
             enforces the pairing if a target is ever added. */
          s.link
            ? `<p><a class="tlink" href="${esc(s.link.href)}">${esc(s.link.label)}</a></p>`
            : ''
        }
      </section>`,
        )
        .join('')}
    </div>
  </section>`;

  return { navHtml: renderNav(doc.route), pageHtml: [body, renderFooter()].join('') };
}
