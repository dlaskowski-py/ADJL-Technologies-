/**
 * Pages built entirely from content Sections: the services hub, the three
 * service pages and the three new case pages. One renderer, so a service
 * page and a case page share their rhythm: hero, sections on alternating
 * bands, the FAQ, "Built under", contact.
 */

import type { SectionPage, Spec } from '../content-types';
import { renderNav } from './nav';
import { pageHero, renderCaseFoot, renderSection, type InstrumentCtx } from './kit';
import { renderPractices } from './top';
import { renderContact, renderFaq, renderFooter } from './bottom';

export type SectionPageOpts = {
  route: string;
  /** Content module file name, for Source view: "content-service-seo.ts". */
  file: string;
  ctx?: InstrumentCtx;
  /** Service pages: the hero and #covers are described by the Service node. */
  service?: boolean;
  /** Case pages with a SoftwareApplication node on the hero. */
  heroLd?: { ld: string; ldType: string };
  /** Services hub: spec rails per practice, joined to the home panels. */
  rails?: Record<string, Spec[]>;
};

export function renderSectionPage(c: SectionPage, o: SectionPageOpts): { navHtml: string; pageHtml: string } {
  let n = 1;
  const parts: string[] = [
    pageHero({
      route: o.route,
      hero: c.hero,
      src: `${o.file}#content.hero`,
      renderer: 'sections/sectionpage.ts#renderSectionPage',
      figure: true,
      ld: o.service ? '#service' : o.heroLd?.ld,
      ldType: o.service ? 'Service' : o.heroLd?.ldType,
    }),
  ];

  c.sections.forEach((s, i) => {
    n++;
    const src = `${o.file}#content.sections[${i}]`;
    /* The hub's #practices is the four home panels with spec rails, not a
       generic section: one source for the practice copy. */
    if (o.rails && s.id === 'practices') {
      parts.push(
        renderPractices(n, {
          src,
          rails: o.rails,
          copy: { eyebrow: s.eyebrow, headline: s.headline, body: s.body },
        }),
      );
      return;
    }
    const covers = o.service && s.id === 'covers';
    parts.push(
      renderSection(s, n, src, {
        band: n % 2 === 0,
        ctx: o.ctx,
        ld: covers ? '#service' : undefined,
        ldType: covers ? 'Service' : undefined,
      }),
    );
  });

  if (c.faq) parts.push(renderFaq(c.faq, ++n, `${o.file}#content.faq`));
  if (c.foot) parts.push(renderCaseFoot(c.foot, ++n, `${o.file}#content.foot`));
  parts.push(renderContact(++n), renderFooter());

  return { navHtml: renderNav(o.route), pageHtml: parts.join('') };
}
