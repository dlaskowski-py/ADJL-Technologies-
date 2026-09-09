/** The legal pages. One renderer, one entry per document. */

import { em, esc, eyebrow } from './html';
import { renderFooter } from './bottom';
import { renderNav } from './nav';

export type LegalDoc = {
  meta: { title: string; description: string; ogTitle?: string; ogDescription?: string };
  route: string;
  eyebrow: string;
  title: string;
  updated: string;
  intro: string;
  sections: { id: string; heading: string; paragraphs: string[]; list?: string[] }[];
};

export function renderLegalPage(doc: LegalDoc): { navHtml: string; pageHtml: string } {
  const body = `<section class="legal" id="top">
    <div class="wrap wrap--narrow legal-inner">
      ${eyebrow(doc.eyebrow)}
      <h1 class="h2 legal-title">${esc(doc.title)}</h1>
      <p class="legal-updated label">Last updated ${esc(doc.updated)}</p>
      <p class="lede legal-intro">${em(doc.intro)}</p>

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
        ${s.paragraphs.map((p) => `<p>${em(p)}</p>`).join('')}
        ${s.list ? `<ul class="legal-list">${s.list.map((l) => `<li>${em(l)}</li>`).join('')}</ul>` : ''}
      </section>`,
        )
        .join('')}
    </div>
  </section>`;

  return { navHtml: renderNav(doc.route), pageHtml: [body, renderFooter()].join('') };
}
