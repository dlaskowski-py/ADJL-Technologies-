/**
 * ADJL Technology: /changelog/, what changed on this site, and when.
 *
 * Written for a visitor, not a developer: each entry says what you'd
 * notice, in plain words, and links to the commit (or commits) behind it in
 * the site's public repository. The rules for an entry:
 *
 *   - Newest first. `date` is the date of the newest commit in `commits`
 *     (`git log --format='%h %ad %s' --date=short`), and `commits` lists
 *     short hashes newest first.
 *   - Small commits that make one visible change are grouped into one entry.
 *   - Work-in-progress commits and internal-only ones (tooling, scratch
 *     files) get no entry. One exception, on purpose: the redesign
 *     (8a4c923) landed in a work-in-progress checkpoint, and without it
 *     the log would skip the biggest change a visitor saw. The second
 *     build is the other: much of it landed in checkpoints, so its entry
 *     links two of them (1d61b16, 242b89e) beside the commit that
 *     finished it (4423f1c).
 *   - An entry says no more than its commits did. Check the commit message
 *     and the diff before writing one.
 *
 * Same conventions as src/content.ts: headlines are arrays of lines and
 * {em}…{/em} marks one emphasized phrase per headline. Edit words here,
 * never in a renderer.
 */

import type { Hero, Link, Meta, Section } from './content-types';

/** The site's public repository. Commit links are `${repo}/commit/<hash>`. */
export const repo = 'https://github.com/dlaskowski-py/ADJL-Technologies-';

export type ChangelogEntry = {
  /** YYYY-MM-DD: the newest commit's date. */
  date: string;
  /** One sentence, ending in a full stop. */
  title: string;
  body: string;
  /** Short commit hashes, newest first. */
  commits: string[];
  /** Where to see the change on the site, when there's one place. */
  link?: Link;
};

export type Changelog = {
  meta: Meta;
  hero: Hero;
  log: {
    id: string;
    eyebrow: string;
    headline: string[];
    body: string;
    /** "Commit" or "Commits", before the hashes. */
    commit: { one: string; many: string };
    entries: ChangelogEntry[];
  };
  source: Section;
};

export const content: Changelog = {
  meta: {
    title: 'Changelog | ADJL Technology',
    description:
      'What changed on this site, and when, newest first. Each entry is written for visitors and links to the commit behind it in the site’s public repository.',
    ogTitle: 'What changed, and when.',
  },
  hero: {
    eyebrow: 'Changelog',
    headline: ['What changed,', 'and {em}when.{/em}'],
    lead: 'Changes to this site, newest first, in plain words. Each entry links to the commit behind it, so you can see exactly what changed in the code.',
    secondary: { label: 'Talk to Daniel', href: '#contact' },
  },
  log: {
    id: 'log',
    eyebrow: 'Newest first',
    headline: ['The changes', '{em}you’d notice.{/em}'],
    body: 'Small fixes are grouped, and work in progress isn’t listed. Each hash opens its commit on GitHub.',
    commit: { one: 'Commit', many: 'Commits' },
    entries: [
      /* ── NEW ENTRIES GO HERE, at the top, once their commits exist. ── */
      {
        date: '2026-11-12',
        title: 'A site scan, a start page and a page for AI agents.',
        body: 'You can now scan a public web page and see what search crawlers and AI answer engines get from it, with plain fixes for what’s missing. For a deeper look, there’s a website audit, priced by quote. The new start page has a form that goes straight to Daniel and works with JavaScript off. It also has a scoping assistant that runs on Anthropic’s Claude, so what you type goes to Anthropic. The assistant drafts your message into the form and never sends anything itself. It stays off until it’s switched on. AI agents get their own {k}endpoint{/k} at /mcp, with a page that explains how to connect. Pages with technical terms have a new Plain/Technical switch. Plain, the default, explains each term where it first appears. There’s also a case study on how we research with AI agents, updated copy on Loep, field notes, and this changelog.',
        commits: ['7172cfb', '4423f1c', '1d61b16', '242b89e'],
        link: { label: 'See what the new parts collect', href: '/legal/privacy/' },
      },
      {
        date: '2026-11-11',
        title: 'The scrolling banner is gone.',
        body: 'The home page no longer has a moving line of what we build under its headline. The code the opening animation types out lost that line too, since it shows the page as it really is.',
        commits: ['f1de6b9'],
        link: { label: 'See the home page', href: '/' },
      },
      {
        date: '2026-11-10',
        title: 'Phones get the full animations.',
        body: 'A touch screen no longer means a lighter version of the site. Phones now get the live drawing in the hero and animations that keep playing. The lighter version is kept for devices that need it, such as ones low on memory or set to save data. Pause motion now lasts for your visit, not forever, and the opening animation is slower and smoother.',
        commits: ['6771721'],
      },
      {
        date: '2026-11-10',
        title: 'Loep joins the portfolio.',
        body: 'Loep, a research tool we built, has a card on the home page and the work page, with an animated preview. Its own case page walks through what each part of it does and the checks that stop its build.',
        commits: ['06da87c', '9102c95'],
        link: { label: 'Read about Loep', href: '/work/loep/' },
      },
      {
        date: '2026-11-10',
        title: 'Fixes from a review of the new home page.',
        body: 'An independent review of the new home page led to plainer portfolio cards for people who aren’t engineers, and a slower reveal of the name in the opening animation. Smaller fixes made the pause buttons big enough to tap and put keyboard focus in the right place after the animation. The build now fails when a page’s share image no longer matches its headline.',
        commits: ['59c0bce', 'fca9862', 'f808222'],
      },
      {
        date: '2026-11-10',
        title: 'A tagline shared with ADJL Capital.',
        body: 'Every page’s footer now carries ADJL Capital’s tagline, “Today’s investment, tomorrow’s legacy.” The opening animation ends on it, and the company’s {k}structured data{/k} uses it as its slogan.',
        commits: ['0f32cbb'],
      },
      {
        date: '2026-11-09',
        title: 'A home page written for business owners.',
        body: 'The home page now speaks to business owners, not only to engineers. Under the headline come what we build, in plain words, and then the portfolio, each system with an animated preview of it doing its job. The live demos stay further down, as proof. On small phones, the headline keeps its last words together and nothing spills off the side.',
        commits: ['bd86bc9', 'ef68f07', 'b8c6ffa', 'fe68271'],
        link: { label: 'See the home page', href: '/' },
      },
      {
        date: '2026-11-09',
        title: 'An opening animation.',
        body: 'When a visit starts on the home page, a short animation plays once. Code types, the build runs, and the site assembles into the ADJL Technology mark before the page opens. You can skip it, and it never plays if you’ve asked your device for reduced motion. The privacy page says what it stores, which is one note in your browser that it has played.',
        commits: ['b4acf7e', '7a3ee26', '37b0f0a'],
      },
      {
        date: '2026-11-09',
        title: 'Fixes from a review of the rebuilt site.',
        body: 'A review of the rebuilt site covered the experience, accessibility and the honesty of the copy. The menu now stays pinned, links to a section land on it, keyboard focus never hides behind the status bar, and each service has one name everywhere. Copy that said more than the site could show was rewritten, and the drawing at the top of each page now says what it counts.',
        commits: ['86afa5b', '8335c99'],
      },
      {
        date: '2026-11-09',
        title: 'Three ways to view any page.',
        body: 'On the rebuilt site, every page can be viewed three ways. As rendered, as the source behind each section, or the way a machine reads it. The status bar measures how the page loaded on your device. Machine View, on the home page and the SEO page, fetches the page again and shows what a crawler gets.',
        commits: ['df5cdd9'],
        link: { label: 'Try Machine View', href: '/services/seo/#machine' },
      },
      {
        date: '2026-11-09',
        title: 'A drawing of each page’s structure.',
        body: 'Most pages now open with a drawing of their own structure, made from their HTML. Each page’s share image, the picture that shows when someone shares a link to it, now carries that drawing.',
        commits: ['2c8a8c6'],
      },
      {
        date: '2026-11-09',
        title: 'Diagrams that show the work.',
        body: 'New diagrams walk through how things run. The steps that turn this site’s copy into pages, a replay of the underwriting engine with its values withheld, and line diagrams of how our systems work.',
        commits: ['6762562'],
      },
      {
        date: '2026-11-09',
        title: 'Ask This Site.',
        body: 'Ask a question about ADJL Technology and get an answer quoted from this site’s own pages, with a link to where each quote came from. It runs in your browser. If nothing on the site answers well enough, it says so and points you to a person.',
        commits: ['972a37a'],
        link: { label: 'Ask a question', href: '/#ask' },
      },
      {
        date: '2026-11-09',
        title: 'Jump anywhere with ⌘K.',
        body: 'Press ⌘K, or Ctrl+K, to open a command palette. It jumps to any page or section, switches views, pauses motion and copies the email address.',
        commits: ['930bf87'],
      },
      {
        date: '2026-11-09',
        title: 'A new design, and new pages.',
        body: 'The site was rebuilt on a dark background, without the films, and with new copy on every page. Each service got its own page, and the work page gained new case studies.',
        commits: ['8a4c923'],
      },
      {
        date: '2026-11-09',
        title: 'An llms.txt for AI tools.',
        body: 'The site now writes llms.txt, a plain summary of every page for AI tools, and llms-full.txt, the full text of each. They’re made from the built pages on every {k}deploy{/k}, so they can’t drift from what a browser gets.',
        commits: ['3868548'],
        link: { label: 'Read the note on what crawlers read', href: '/notes/what-ai-crawlers-read/' },
      },
      {
        date: '2026-09-13',
        title: 'A link to ADJL Capital, where it belongs.',
        body: 'The terms page now links to ADJL Capital’s site, in the section about how ADJL Technology and ADJL Capital are related. The structured data no longer calls ADJL Capital our parent company. The firms are siblings, joined through their founder.',
        commits: ['5a25e88'],
        link: { label: 'Read the terms', href: '/legal/terms/' },
      },
      {
        date: '2026-09-13',
        title: 'The site moves to adjltechnology.com.',
        body: 'The site now lives at adjltechnology.com. Its old netlify.app address sends you here, so there’s one copy of each page.',
        commits: ['3d820f9', '3a00a05'],
      },
      {
        date: '2026-09-12',
        title: 'Readable by search engines, with or without JavaScript.',
        body: 'Every page now describes itself in structured data, has its own share image, and has a title that leads with its subject. A bug that hid most of the home page from anyone without JavaScript is fixed, and a browser test now loads every page with scripts off.',
        commits: ['22b4428', 'cacaa31'],
      },
      {
        date: '2026-09-10',
        title: 'The copy, rewritten in plain English.',
        body: 'The first version read as machine-written. The copy on every page was rewritten in shorter, plainer sentences, and a new check fails the build if the writing drifts back.',
        commits: ['13c9a66'],
        link: { label: 'Read how the checks work', href: '/notes/a-build-that-refuses-to-overclaim/' },
      },
      {
        date: '2026-09-09',
        title: 'ADJL Technology, by its right name.',
        body: 'The firm’s name is ADJL Technology everywhere, the spelling is US English throughout, and the site describes the team accurately, as Daniel and a small senior development team. The work page no longer lists the kinds of work we turn down.',
        commits: ['3a2a08f', 'ac673d1'],
      },
      {
        date: '2026-09-09',
        title: 'The first fixes.',
        body: 'A review of the first version found a heading on the work page showing its formatting markers, text too faint to read, and a phone menu that could lock the page. All fixed. The build now fails if a formatting marker ever reaches a page, and the contrast check measures faded text it used to skip.',
        commits: ['b37019c'],
      },
      {
        date: '2026-09-09',
        title: 'The first version.',
        body: 'The first version of ADJL Technology’s site is built, on a light background with short looping films. Every page is prerendered as plain HTML, and the build fails on broken links, unstyled markup and hype.',
        commits: ['396cb64'],
      },
    ],
  },
  source: {
    id: 'source',
    eyebrow: 'Source',
    headline: ['The code', 'is {em}public.{/em}'],
    body: [
      'This site’s code is public on GitHub, with its full history. That includes the work in progress this page leaves out, and the checks that run before every deploy.',
    ],
    links: [
      { label: 'The repository on GitHub', href: repo },
      { label: 'How this site is built', href: '/work/this-site/' },
    ],
  },
};

export const meta = content.meta;
