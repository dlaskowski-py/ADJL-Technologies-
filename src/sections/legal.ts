/** The legal pages. One renderer, one entry per document. No hero figure:
 *  a privacy policy is read, not demonstrated. */

import { esc, eyebrow, rich } from './html';
import { renderFooter } from './bottom';
import { renderNav } from './nav';
import { breadcrumbs } from './kit';

export type LegalDoc = {
  meta: { title: string; description: string; ogTitle?: string; ogDescription?: string };
  route: string;
  eyebrow: string;
  title: string;
  updated: string;
  intro: string;
  /** "Last updated" and "On this page", kept with the copy. */
  labels?: { updated: string; toc: string };
  /** "Talk to Daniel" → /#contact. */
  secondary?: { label: string; href: string };
  sections: {
    id: string;
    heading: string;
    paragraphs: string[];
    list?: string[];
    /* An outbound reference. A typed field, not a marker, so a malformed
       link is a compile error; check-links holds the host allowlist. */
    link?: { label: string; href: string };
  }[];
};

export function renderLegalPage(doc: LegalDoc): { navHtml: string; pageHtml: string } {
  const labels = doc.labels ?? { updated: 'Last updated', toc: 'On this page' };
  const body = `<section class="sec legal" id="top" data-src="content-legal.ts#${
    doc.route.includes('privacy') ? 'privacy' : 'terms'
  }" data-renderer="sections/legal.ts#renderLegalPage">
    <div class="wrap">
      ${breadcrumbs(doc.route)}
      ${eyebrow(doc.eyebrow, false)}
      <h1 class="display legal-title" data-compile><span class="hl-line">${esc(doc.title)}</span></h1>
      <p class="label legal-updated">${esc(labels.updated)} ${esc(doc.updated)}</p>
      <p class="lead legal-intro">${rich(doc.intro)}</p>
      ${
        doc.secondary
          ? `<div class="actions"><a class="btn btn--ghost" href="${esc(doc.secondary.href)}"><span>${esc(doc.secondary.label)}</span></a></div>`
          : ''
      }

      <div class="legal-layout">
        <nav class="legal-toc panel" aria-label="${esc(labels.toc)}">
          <p class="label">${esc(labels.toc)}</p>
          <ol>${doc.sections.map((s) => `<li><a href="#${esc(s.id)}">${esc(s.heading)}</a></li>`).join('')}</ol>
        </nav>
        <div class="legal-body">
          ${doc.sections
            .map(
              (s) => `<section class="legal-sec" id="${esc(s.id)}">
            <h2 class="h3">${esc(s.heading)}</h2>
            ${s.paragraphs.map((p) => `<p>${rich(p)}</p>`).join('')}
            ${s.list ? `<ul class="bullets">${s.list.map((l) => `<li>${rich(l)}</li>`).join('')}</ul>` : ''}
            ${s.link ? `<p><a class="tlink" href="${esc(s.link.href)}">${esc(s.link.label)}</a></p>` : ''}
          </section>`,
            )
            .join('')}
        </div>
      </div>
    </div>
  </section>`;

  return { navHtml: renderNav(doc.route), pageHtml: [body, renderFooter()].join('') };
}
