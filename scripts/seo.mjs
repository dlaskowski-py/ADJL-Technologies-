/**
 * Everything a crawler or a share card reads, built from the page's own
 * content module and its entry in pages.mjs.
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
 * The graph is one set of stable @ids across the whole site. The company,
 * its founder, the site, each page and what each page is about all keep
 * the same @id everywhere they appear, so a machine reading two pages knows
 * they describe one company. check-seo resolves every reference: each
 * `{"@id": …}` must point at a node defined on the page it names, and every
 * `data-ld` in the markup must point at a node in its own page's graph.
 *
 * On FAQ markup, honestly: Google restricted FAQ rich results in 2023 to
 * government and health sites, so the FAQPage type below will almost
 * certainly NOT produce the expandable questions in a Google result. It's
 * still correct, still parsed by other engines, and it's what answer engines
 * read when they summarize a company. It's here for that, not for a snippet
 * we aren't going to get.
 */
import { execFileSync } from 'node:child_process';
import { slugOf } from './pages.mjs';

/** Re-exported from pages.mjs: route → share-card, source-sheet and twin
 *  slug. gen-og and check-seo import it from here. */
export { slugOf };

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** JSON-LD is script content, not markup: the only thing that can break out
 *  of it is a literal </script>, so that's the only thing escaped. */
const jsonld = (obj) =>
  `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;

const abs = (origin, path) => `${origin}${path}`;

/** The markdown twin of a route, written by gen-llms.mjs. Home is /index.md. */
export const twinOf = (route) => `${route}index.md`;

/** A page's <title> without the firm suffix, for list entries. */
export const shortTitle = (title) => String(title).replace(/\s*\|\s*ADJL Technology\s*$/, '').trim();

/** This page's line in /llms.txt. Exported so Machine View's "Answer
 *  engines" reader can quote the exact line gen-llms writes. */
export const llmsLine = ({ origin, route, title, description }) =>
  `- [${shortTitle(title)}](${origin}${route}): ${description}`;

/** Resolve an `article.about` entry to an absolute @id. '#frag' is relative
 *  to the page; '/path#frag' is relative to the origin. */
export const resolveRef = (origin, route, ref) =>
  ref.startsWith('#') ? `${origin}${route}${ref}` : ref.startsWith('/') ? `${origin}${ref}` : ref;

/** The pages a hub lists, by its pages.mjs `collection`. check-seo reads
 *  the same function, so the ItemList and the check can't disagree. */
export function collectionOf(name, pages) {
  if (name === 'services') return [...pages.filter((p) => p.kind === 'service'), ...pages.filter((p) => p.route === '/work/')];
  if (name === 'work') return pages.filter((p) => p.kind === 'case');
  if (name === 'notes') return pages.filter((p) => p.kind === 'note');
  throw new Error(`seo: unknown collection "${name}"`);
}

/* ── dateModified ─────────────────────────────────────────────────────
   The last commit that touched any of the page's content modules. Falls
   back to the HEAD commit's date (a checkout with no history for the file,
   such as one not yet committed), then to the build date (no git at all).
   The same value is the page's TechArticle dateModified and its sitemap
   <lastmod>, so the two can't disagree. */

const git = (args) => {
  try {
    return execFileSync('git', args, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return '';
  }
};

const BUILD_TIME = new Date().toISOString().replace(/\.\d{3}Z$/, '+00:00');
let headDate;
const modified = new Map();

/** ISO 8601 (with offset) of the last change to a page's content.
 *
 *  A field note can't have changed before it was published, but git can
 *  say it did (its words were committed, then it went live), so a note's
 *  date is never earlier than its pages.mjs `published`. */
export function dateModifiedOf(page) {
  const key = (page.content ?? []).join('\n');
  let date = modified.get(key);
  if (!date) {
    date = page.content?.length ? git(['log', '-1', '--format=%cI', '--', ...page.content]) : '';
    if (!date) {
      headDate ??= git(['log', '-1', '--format=%cI']);
      date = headDate || BUILD_TIME;
    }
    modified.set(key, date);
  }
  const published = page.note?.published;
  return published && Date.parse(date) < Date.parse(published) ? published : date;
}

/* ── The firm ─────────────────────────────────────────────────────── */

/** The firm in one sentence pair: the Organization description and the
 *  blockquote at the top of /llms.txt. */
export const ORG_DESCRIPTION =
  'An AI engineering, technical SEO and software studio. Builds AI agents and automation, websites and native apps, and makes them readable to search engines and AI answer engines.';

/** The tagline, word for word as src/content.ts has it (TAGLINE): the
 *  Organization's `slogan`. check-seo fails the build if the line in a
 *  page's footer and this one ever differ. */
export const ORG_SLOGAN = 'Today’s investment, tomorrow’s legacy.';

const KNOWS_ABOUT = [
  'AI implementation',
  'AI agents',
  'Retrieval-augmented generation',
  'LLM evaluation',
  'Document extraction',
  'Technical SEO',
  'Structured data',
  'AI search visibility',
  'Core Web Vitals',
  'Web performance',
  'React Native',
  'Expo',
  'Edge functions',
  'Custom software development',
  'Real estate underwriting automation',
  'Property data and public records',
  'Trading infrastructure',
  'Market data engineering',
  'Order execution systems',
  'Backtesting',
];

/**
 * The <head> additions for one page: canonical, the markdown twin, share
 * tags and the JSON-LD graph.
 *
 *   origin  ORIGIN from pages.mjs
 *   page    this page's entry in PAGES
 *   pages   all of PAGES (breadcrumbs, collections, cross-page @ids)
 *   meta    the page's content `meta`
 *   faq     the page's FAQ ({ items: [{q, a}] }), when page.faq
 *   h1      the page's h1 as plain text, for TechArticle.headline. The
 *           prerender passes it; without it, meta.ogTitle stands in.
 */
export function buildHead({ origin, page, pages, meta, faq, h1 }) {
  const url = abs(origin, page.route);
  const orgId = `${origin}/#organization`;
  const siteId = `${origin}/#website`;
  const personId = `${origin}/#daniel`;
  const pageId = `${url}#webpage`;
  const serviceId = `${url}#service`;
  const articleId = `${url}#article`;
  const listId = `${url}#itemlist`;
  const appId = `${url}#app`;
  const image = abs(origin, `/og/${slugOf(page.route)}.jpg`);
  const dateModified = dateModifiedOf(page);
  const servicePages = pages.filter((p) => p.kind === 'service');

  /* ── Tags ───────────────────────────────────────────────────────── */
  const tags = [
    `<link rel="canonical" href="${url}" />`,
    /* A noindex page (the form's thank-you page) says so, and has no
       markdown twin to advertise: gen-llms writes twins only for INDEXED. */
    ...(page.noindex
      ? [`<meta name="robots" content="noindex, follow" />`]
      : [
          /* The same page as markdown, for answer engines and anything else
             that would rather not parse our markup. gen-llms writes it;
             check-seo fails if this points at a file that wasn't written. */
          `<link rel="alternate" type="text/markdown" href="${twinOf(page.route)}" title="${esc(shortTitle(meta.title))} (markdown)" />`,
        ]),
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
    description: ORG_DESCRIPTION,
    slogan: ORG_SLOGAN,
    /* A raster logo on a plain ground. Google's Organization logo wants
       real pixel dimensions, and the favicon is a 32-unit SVG with no
       intrinsic size: technically a URL, practically unusable. */
    logo: {
      '@type': 'ImageObject',
      url: abs(origin, '/og/logo-512.png'),
      width: 512,
      height: 512,
    },
    /* Pinned, NOT the page's own card. The Organization node has one @id
       across every page; giving it the current page's image would describe
       one entity fifteen different ways. */
    image: abs(origin, '/og/home.jpg'),
    /* The two firms are siblings, not parent and subsidiary, so the join
       runs through the person who founded one and holds an interest in the
       other. `parentOrganization` used to sit here with a bare name, and it
       was wrong twice over: it asserted corporate control that doesn't
       exist, and a bare name is a blank node no crawler can tell from any
       other firm sharing the word. schema.org has no property for a sibling
       company, and inventing a shape to imply one would be worse than this.

       The @id on the affiliation is the one ADJL Capital publishes in its
       own @graph, so the two graphs resolve to a single entity instead of
       two strings that happen to match. Its legalName is deliberately not
       copied across: that's Capital's assertion to make on Capital's
       domain. */
    founder: {
      '@type': 'Person',
      '@id': personId,
      name: 'Daniel Laskowski',
      jobTitle: 'Chief Executive Officer & Founder',
      worksFor: { '@id': orgId },
      affiliation: {
        '@type': 'Organization',
        '@id': 'https://adjlcapital.com/#organization',
        name: 'ADJL Capital',
        url: 'https://adjlcapital.com/',
      },
    },
    knowsAbout: KNOWS_ABOUT,
    /* What the firm sells, by reference. Each item is the Service node on
       its own page, so the catalog and the pages can't describe different
       services. */
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Services',
      itemListElement: servicePages.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: { '@id': `${origin}${p.route}#service` },
      })),
    },
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
     reads "ADJL Technology › Work › Mobile App" instead of a path. Home has
     no trail of its own. The trail walks every parent, so a service page
     reads Home › Services › AI Engineering. */
  if (page.parent !== undefined) {
    const trail = [];
    for (let p = page; p; p = p.parent !== undefined ? pages.find((q) => q.route === p.parent) : null) {
      trail.unshift({ name: p.crumb, item: abs(origin, p.route) });
      if (p.route === '/') break;
    }
    if (trail[0]?.item !== `${origin}/`) trail.unshift({ name: 'Home', item: `${origin}/` });

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

  /* The WebPage. It is never replaced: a hub is ['WebPage','CollectionPage']
     and a page with an FAQ is ['WebPage','FAQPage'], with one @id, so the
     page stays one entity whatever else it also is. */
  const types = ['WebPage'];
  if (page.collection) types.push('CollectionPage');
  if (page.faq && faq?.items?.length) types.push('FAQPage');

  const webpage = {
    '@type': types.length === 1 ? 'WebPage' : types,
    '@id': pageId,
    url,
    name: meta.title,
    description: meta.description,
    isPartOf: { '@id': siteId },
    about: { '@id': page.service && page.kind === 'service' ? serviceId : orgId },
    primaryImageOfPage: { '@type': 'ImageObject', url: image },
    inLanguage: 'en-US',
    dateModified,
    ...(page.parent !== undefined ? { breadcrumb: { '@id': `${url}#breadcrumb` } } : {}),
  };
  /* What the page is chiefly about. An FAQPage's mainEntity has to be its
     Questions, so the Service on a service page is reached through `about`
     instead. Elsewhere it points at the page's subject, so no node sits in
     the graph with nothing referencing it. */
  if (types.includes('FAQPage')) {
    webpage.mainEntity = faq.items.map((it) => ({
      '@type': 'Question',
      name: it.q,
      acceptedAnswer: { '@type': 'Answer', text: it.a.replace(/\{\/?(em|k)\}/g, '') },
    }));
  } else if (page.collection) webpage.mainEntity = { '@id': listId };
  else if (page.article || page.note) webpage.mainEntity = { '@id': articleId };
  else if (page.service) webpage.mainEntity = { '@id': serviceId };
  graph.push(webpage);

  /* Collections: the services hub lists the service pages and the work
     hub; the work hub lists the case pages; the notes hub, the notes. */
  if (page.collection) {
    const members = collectionOf(page.collection, pages);
    graph.push({
      '@type': 'ItemList',
      '@id': listId,
      name: page.crumb,
      numberOfItems: members.length,
      itemListElement: members.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: p.crumb,
        url: abs(origin, p.route),
      })),
    });
  }

  if (page.service) {
    /* A service page's Service is evidenced by the case pages whose
       TechArticle is about it. Derived from pages.mjs, so adding a case
       page with `about: ['/services/seo/#service']` links it here too. */
    const evidence =
      page.kind === 'service'
        ? pages
            .filter((p) => p.article?.about?.some((ref) => resolveRef(origin, p.route, ref) === serviceId))
            .map((p) => ({ '@id': `${origin}${p.route}#article` }))
        : [];
    graph.push({
      '@type': 'Service',
      '@id': serviceId,
      name: page.service.name,
      /* The one display name the nav, eyebrows and breadcrumbs use, so a
         machine reading the page can join the Service to how the site
         actually refers to it. The name stays descriptive for search. */
      ...(page.service.alternateName ? { alternateName: page.service.alternateName } : {}),
      serviceType: page.service.serviceType,
      description: meta.description,
      url,
      provider: { '@id': orgId },
      areaServed: { '@type': 'Country', name: 'United States' },
      mainEntityOfPage: { '@id': pageId },
      ...(evidence.length ? { subjectOf: evidence } : {}),
    });
  }

  if (page.app) {
    /* No offers and no ratings. It's privately distributed, so there's no
       price to state, and there are no public reviews to count. */
    graph.push({
      '@type': 'SoftwareApplication',
      '@id': appId,
      name: page.app.name,
      operatingSystem: page.app.operatingSystem,
      applicationCategory: page.app.applicationCategory,
      creator: { '@id': orgId },
      mainEntityOfPage: { '@id': pageId },
    });
  }

  if (page.article) {
    graph.push({
      '@type': 'TechArticle',
      '@id': articleId,
      headline: String(h1 ?? meta.ogTitle ?? meta.title).replace(/\s+/g, ' ').trim(),
      description: meta.description,
      author: { '@id': personId },
      publisher: { '@id': orgId },
      about: page.article.about.map((ref) => ({ '@id': resolveRef(origin, page.route, ref) })),
      mainEntityOfPage: { '@id': pageId },
      image,
      dateModified,
      inLanguage: 'en-US',
    });
  }

  if (page.note) {
    /* A field note: a dated post by Daniel. BlogPosting, not the case
       pages' TechArticle, because what sets a note apart is that it was
       published on a day and says so. datePublished is set once in
       pages.mjs; dateModified is the git date every page carries. */
    graph.push({
      '@type': 'BlogPosting',
      '@id': articleId,
      headline: String(h1 ?? meta.ogTitle ?? meta.title).replace(/\s+/g, ' ').trim(),
      description: meta.description,
      author: { '@id': personId },
      publisher: { '@id': orgId },
      datePublished: page.note.published,
      dateModified,
      about: page.note.about.map((ref) => ({ '@id': resolveRef(origin, page.route, ref) })),
      isPartOf: { '@id': `${origin}${page.parent}#webpage` },
      mainEntityOfPage: { '@id': pageId },
      image,
      inLanguage: 'en-US',
    });
    tags.push(`<meta property="article:published_time" content="${esc(page.note.published)}" />`);
    tags.push(`<meta property="article:modified_time" content="${esc(dateModified)}" />`);
  }

  tags.push(jsonld({ '@context': 'https://schema.org', '@graph': graph }));

  return tags.map((t) => `    ${t}`).join('\n');
}
