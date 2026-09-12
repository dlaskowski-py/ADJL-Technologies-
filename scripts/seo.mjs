/**
 * Everything a crawler or a share card reads, built from the page's own
 * content module.
 *
 * Three things were wrong before this file existed, and the first is the one
 * that actually cost traffic:
 *
 *   og:image was a ROOT-RELATIVE path. Open Graph requires an absolute URL,
 *   so every link to this site posted in LinkedIn, Slack or X rendered with
 *   no image at all. It looks correct in the markup and fails silently
 *   everywhere it matters.
 *
 *   Every page shared one image, so eight different links all previewed
 *   identically.
 *
 *   There was no structured data at all. A search engine had to infer from
 *   prose that this is a company, who runs it, and what it sells.
 *
 * On FAQ markup, honestly: Google restricted FAQ rich results in 2023 to
 * government and health sites, so the FAQPage block below will almost
 * certainly NOT produce the expandable questions in a Google result. It is
 * still correct, still parsed by other engines, and increasingly what answer
 * engines read to summarise a company. It is here for that, not for a
 * snippet we are not going to get.
 */

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** JSON-LD is script content, not markup: the only thing that can break out
 *  of it is a literal </script>, so that is the only thing escaped. */
const jsonld = (obj) =>
  `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;

const abs = (origin, path) => `${origin}${path}`;

/** Route to share-card filename. Exported because scripts/gen-og.mjs writes
 *  the files this names, and a mismatch between the two is a broken preview
 *  that nothing on the page would reveal. */
export const slugOf = (route) =>
  route === '/' ? 'home' : route.replace(/^\/|\/$/g, '').replace(/\//g, '-');

export function buildHead({ origin, page, pages, meta, faq }) {
  const url = abs(origin, page.route);
  const orgId = `${origin}/#organization`;
  const siteId = `${origin}/#website`;
  const pageId = `${url}#webpage`;
  const image = abs(origin, `/og/${slugOf(page.route)}.jpg`);

  /* ── Meta tags ──────────────────────────────────────────────────── */
  const tags = [
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:site_name" content="ADJL Technology" />`,
    `<meta property="og:locale" content="en_US" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${esc(meta.ogTitle ?? meta.title)}" />`,
    `<meta name="twitter:image" content="${image}" />`,
    `<meta name="twitter:title" content="${esc(meta.ogTitle ?? meta.title)}" />`,
    `<meta name="twitter:description" content="${esc(meta.ogDescription ?? meta.description)}" />`,
  ];

  /* ── Structured data ────────────────────────────────────────────── */
  const graph = [];

  graph.push({
    '@type': 'Organization',
    '@id': orgId,
    name: 'ADJL Technology',
    alternateName: 'ADJL Tech',
    url: `${origin}/`,
    email: 'daniel@adjlcapital.com',
    description:
      'An AI consulting and software engineering practice. Finds where AI belongs in a business that already runs, builds it, and hands over the code.',
    logo: { '@type': 'ImageObject', url: abs(origin, '/favicon.svg') },
    image,
    founder: {
      '@type': 'Person',
      name: 'Daniel Laskowski',
      jobTitle: 'Chief Executive Officer & Founder',
    },
    parentOrganization: { '@type': 'Organization', name: 'ADJL Capital' },
    knowsAbout: [
      'AI implementation',
      'AI consulting',
      'Retrieval-augmented generation',
      'Real estate underwriting automation',
      'Property data and public records',
      'Trading infrastructure',
      'Market data engineering',
      'Order execution systems',
      'Backtesting',
      'Custom software development',
    ],
    /* No sameAs. It takes a list of profiles the company actually controls,
       and inventing one is how structured data becomes a liability. Add the
       LinkedIn and GitHub URLs here when they exist. */
  });

  graph.push({
    '@type': 'WebSite',
    '@id': siteId,
    url: `${origin}/`,
    name: 'ADJL Technology',
    publisher: { '@id': orgId },
    inLanguage: 'en-US',
  });

  /* Breadcrumbs. Google shows these in place of the raw URL, so a case page
     reads "ADJL Technology › Work › Real Estate Intelligence" instead of a
     path. Home has no trail of its own. */
  if (page.parent !== undefined) {
    const trail = [{ name: 'Home', item: `${origin}/` }];
    if (page.parent !== '/') {
      const parent = pages.find((p) => p.route === page.parent);
      if (parent) trail.push({ name: parent.crumb, item: abs(origin, parent.route) });
    }
    trail.push({ name: page.crumb, item: url });

    graph.push({
      '@type': 'BreadcrumbList',
      '@id': `${url}#breadcrumb`,
      itemListElement: trail.map((t, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: t.name,
        item: t.item,
      })),
    });
  }

  graph.push({
    '@type': 'WebPage',
    '@id': pageId,
    url,
    name: meta.title,
    description: meta.description,
    isPartOf: { '@id': siteId },
    about: { '@id': orgId },
    primaryImageOfPage: { '@type': 'ImageObject', url: image },
    inLanguage: 'en-US',
    ...(page.parent !== undefined ? { breadcrumb: { '@id': `${url}#breadcrumb` } } : {}),
  });

  if (page.service) {
    graph.push({
      '@type': 'Service',
      '@id': `${url}#service`,
      name: page.service.name,
      serviceType: page.service.serviceType,
      description: meta.description,
      provider: { '@id': orgId },
      areaServed: { '@type': 'Country', name: 'United States' },
      mainEntityOfPage: { '@id': pageId },
    });
  }

  if (page.faq && faq?.items?.length) {
    graph.push({
      '@type': 'FAQPage',
      '@id': `${url}#faq`,
      mainEntity: faq.items.map((it) => ({
        '@type': 'Question',
        name: it.q,
        acceptedAnswer: { '@type': 'Answer', text: it.a },
      })),
    });
  }

  tags.push(jsonld({ '@context': 'https://schema.org', '@graph': graph }));

  return tags.map((t) => `    ${t}`).join('\n');
}
