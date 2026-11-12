/**
 * ADJL Technology: /notes/ (field notes) and each note under it.
 *
 * A note is a short, dated write-up of work we can show, by Daniel. Every
 * claim in one has to be true and checkable: the first two describe this
 * site's own code (public on GitHub), the third describes the research
 * method as the verified fact sheet allows it to be described. Method
 * only there: no results, counts, names, settings or dates beyond the
 * note's own.
 *
 * `published` is the day a note went live. It must equal the note's
 * `note.published` in scripts/pages.mjs, which is what its BlogPosting and
 * article:published_time say. The first three share FIRST_THREE below:
 * before they deploy, set it and their three `note.published` values to
 * the deploy date. After that it's never moved.
 *
 * The guards read these notes like every other page, so the note about
 * them can't quote what they ban: it paraphrases, the way
 * content-case-this-site.ts does.
 *
 * Same conventions as src/content.ts: headlines are arrays of lines and
 * {em}…{/em} marks one emphasized phrase per headline. Article headings are
 * plain sentences. In body copy, `backticks` set a file or command in mono,
 * and [label](/route/) is a link; the renderer fails the build on a link
 * it can't parse. Edit words here, never in a renderer.
 */

import type { Hero, Link, Meta } from './content-types';

/** A paragraph, or a bulleted list. */
export type NoteBlock = string | { list: string[] };

/** One part of a note: an h2 with an id (its anchor, and what Ask cites),
 *  then its blocks. */
export type NotePart = { id: string; heading: string; body: NoteBlock[] };

export type Note = {
  meta: Meta;
  route: string;
  /** YYYY-MM-DD. Equals scripts/pages.mjs note.published. */
  published: string;
  /** The hero. Its lead is the note's summary. */
  hero: Hero;
  /** The line under the note's title on /notes/. */
  blurb: string;
  parts: NotePart[];
  related: Link[];
};

/** The fixed words around every note. {n} is a number of minutes. */
/** The day the first three notes went live. Set at deploy (see above). */
const FIRST_THREE = '2026-11-12';

export const labels = {
  /* AI agents helped draft these notes. Daniel chose to sign them with his
     own name, having read them and taking responsibility for every line,
     and the structured data names him too (#daniel in scripts/seo.mjs). */
  author: 'Daniel Laskowski',
  by: 'Written by',
  published: 'Published',
  reading: 'Reading time',
  minutes: '{n} min',
  toc: 'In this note',
  related: 'Related',
  more: 'More notes',
  all: { label: 'All field notes', href: '/notes/' },
  read: 'Read the note',
};

export type NotesHub = {
  meta: Meta;
  hero: Hero;
  index: { id: string; eyebrow: string; headline: string[]; body: string };
};

export const hub: NotesHub = {
  meta: {
    title: 'Field Notes | ADJL Technology',
    description:
      'Short write-ups of real work: how machines read this site, how its build checks its own words, and how our research keeps from fooling itself.',
    ogTitle: 'Field notes from real work.',
  },
  hero: {
    eyebrow: 'Field notes',
    headline: ['Field notes', 'from {em}real work.{/em}'],
    lead: 'Short write-ups of work we can show. How machines read this site, how its build checks its own words, and how our research keeps from fooling itself. Each one sticks to what we did and how.',
    secondary: { label: 'Talk to Daniel', href: '#contact' },
  },
  index: {
    id: 'notes',
    eyebrow: 'The notes',
    headline: ['What we’ve', '{em}written so far.{/em}'],
    body: 'Each one takes a few minutes. The notes about this site describe code anyone can read in its public {k}repository{/k}.',
  },
};

const crawlers: Note = {
  meta: {
    title: 'What AI Crawlers Read | ADJL Technology',
    description:
      'What a search crawler or an AI answer engine gets when it fetches a page: the raw HTML, title and headings, structured data, robots.txt and llms.txt.',
    ogTitle: 'What AI crawlers read.',
  },
  route: '/notes/what-ai-crawlers-read/',
  published: FIRST_THREE,
  hero: {
    eyebrow: 'Field note',
    headline: ['What AI', '{em}crawlers read.{/em}'],
    lead: 'Many {k}AI crawlers{/k} read your page the way your server sends it, before any script runs. Here’s what that copy holds, what each part is for, and how this site makes sure it’s the whole page.',
  },
  blurb:
    'What a search crawler or an AI answer engine is handed when it fetches a page, and how this site makes sure that’s the whole page.',
  parts: [
    {
      id: 'raw-html',
      heading: 'The page before any script runs.',
      body: [
        'A browser downloads a page, then runs its scripts, and the scripts often fill in the words. A crawler starts the same way. Many AI crawlers stop there. They read the HTML your server sent and never run the scripts. The ones that do run them often get to it later.',
        'So the first question about any site is a plain one. What’s in the HTML before JavaScript runs? On a site built as a {k}single-page app{/k}, the answer can be an empty shell and a script tag. A person sees a full page. A crawler that doesn’t run scripts sees almost nothing.',
        'Every page on this site is rendered to complete HTML when the site is built. Small functions turn the copy into markup, and the result is saved as a plain file. Scripts add motion, measurement and the tools you use, like the site scan. Turn JavaScript off and every word of the page is still there. Our browser tests check exactly that on every page, with scripts on and off.',
      ],
    },
    {
      id: 'outline',
      heading: 'The parts a machine reads first.',
      body: [
        'Some parts of a page do more work than their size suggests. The title and the description are often what a search result or an AI answer shows. The headings are the outline a machine uses to tell what each part of the page covers. Links tell a crawler where else to go.',
        'Every page here has one main heading, a {k}canonical address{/k} and a description of its own. The build fails if any of them goes missing, or if two pages share a description.',
        'You can see this reading on any page here. Switch the view to Machine, in the status bar or in the menu on a phone. The page labels itself the way a crawler takes it in, with its headings numbered as an outline and its links and structured data marked.',
      ],
    },
    {
      id: 'structured-data',
      heading: 'Structured data says who you are.',
      body: [
        'Structured data is a block of JSON-LD in the page’s HTML that names things outright. Here, it says the page is an article. It names Daniel Laskowski as the author. ADJL Technology published it on this date. A person works all that out from the layout. A machine can read it from the data and doesn’t have to guess.',
        'Every page here carries one graph of it, with the company, its founder, the site, the page and what the page is about. The company, its founder and the site each have an ID that stays the same on every page, so a machine reading two pages knows they describe one company. The build checks that every reference in the graph points at something that exists.',
      ],
    },
    {
      id: 'robots',
      heading: 'robots.txt says who may read.',
      body: [
        '`robots.txt` is a short file at the root of a site that tells crawlers what they may fetch. AI companies publish names for their crawlers, so a site can allow or block each one by name. Some fetch pages to train models. Some fetch a page when a person asks a question that needs it. Blocking the wrong one can keep your pages out of answers you wanted to be in.',
        'It’s a request, not a lock. The bigger AI companies say in their documentation how each of their crawlers treats it, and the answers differ.',
        'Our `robots.txt` names the AI crawlers in a group of their own. Today that group allows everything, the same as the default. It’s written out so the choice is on record, and it takes one line to change it.',
      ],
    },
    {
      id: 'llms-txt',
      heading: 'llms.txt is a summary, and only a proposal.',
      body: [
        '`llms.txt` is a newer idea. It’s a plain markdown file at the root of a site that lists the pages, each with a line about what it covers. It’s a proposed convention and not a standard. Some AI tools read it and many don’t.',
        'This site writes one on every deploy, from the built pages, so it can’t describe a page that’s gone. Each page also has a markdown copy of its own words, linked from the page’s head, and `llms-full.txt` holds all of them in one file. It costs almost nothing to produce, so we do it, and we don’t claim more for it than that.',
      ],
    },
    {
      id: 'check-yours',
      heading: 'Check your own site.',
      body: [
        'You can take the same reading of your own pages. The [site scan](/scan/) fetches a page from our server with no scripts run, the way many AI crawlers do. It reads your `robots.txt` and looks for a {k}sitemap{/k} and an `llms.txt`. Then it lists what to fix first.',
        'Nobody can promise you a place in an AI answer. What you can control is what a machine is handed when it asks for your page. On this site, the markdown copy is made from the built page (in its Technical wording), so it can’t drift from what the page says. The title and description are written in the same file as the words on the page.',
      ],
    },
  ],
  related: [
    { label: 'Scan your own site', href: '/scan/' },
    { label: 'How this site is built for search', href: '/work/this-site/' },
    { label: 'SEO & AI Search', href: '/services/seo/' },
  ],
};

const overclaim: Note = {
  meta: {
    title: 'A Build That Refuses to Overclaim | ADJL Technology',
    description:
      'How this site’s build fails on hype words, unmeasured numbers and counts of clients, why we set it up that way, and what writing under it costs.',
    ogTitle: 'A build that refuses to overclaim.',
  },
  route: '/notes/a-build-that-refuses-to-overclaim/',
  published: FIRST_THREE,
  hero: {
    eyebrow: 'Field note',
    headline: ['A build that refuses', 'to {em}overclaim.{/em}'],
    lead: 'This site won’t deploy if its copy uses a hype word, counts clients or puts a number on a result nobody measured. Here’s how those checks work, why they’re there, and what they cost us.',
  },
  blurb:
    'How this site’s build stops on hype, invented numbers and counts of clients, and what writing under those checks costs.',
  parts: [
    {
      id: 'why',
      heading: 'Why the build checks the words.',
      body: [
        'ADJL Technology is new. We don’t have published clients, metrics or awards to point to yet. A site that hints otherwise gets found out in the first conversation, and after that nobody believes the rest of it.',
        'Good intentions don’t survive every small edit. Someone adds a line to a page that felt thin. A number from a draft makes it into the final copy. So the rules are written as code, and the code runs on every {k}deploy{/k}. If a check fails, the new version doesn’t ship, and the last good one stays live.',
      ],
    },
    {
      id: 'claims',
      heading: 'Hype and invented numbers stop the build.',
      body: [
        'The first check, `check-claims`, holds a list of phrases that sell without saying anything. Claims to be the best or the newest. Stock lines about experience. Trust borrowed from people we can’t name. If one turns up anywhere on the site, the build stops and prints the words around it.',
        'It also looks for numbers doing a job they haven’t earned. A percentage next to a word like faster or cheaper. A sum next to saved. A count of clients, customers or projects, in digits or spelled out in words. We have no measured results to report yet, so any sentence like that would be invented.',
        'It reads more than the visible page. It reads the labels a screen reader speaks, image descriptions, the structured data search engines quote, and the files written for AI tools. A claim isn’t acceptable because it sits where a person rarely looks.',
        'And it fails if the site ever loads an {k}analytics script{/k}. The privacy page says there are none, so the policy has to change first.',
      ],
    },
    {
      id: 'voice',
      heading: 'A check on how the copy sounds.',
      body: [
        'The first version of this site read as machine-written. Counting showed why. It leaned on dashes, on sentences that turned on a reversal, and on long polished lines with nothing short between them. Each sentence was fine on its own. Together they sounded like a template.',
        'So `check-voice` measures how often things happen, not which words appear. For every thousand words of copy, it counts:',
        {
          list: [
            'Dashes used as asides.',
            'Sentences built on a reversal.',
            'Colons that set up a punchline.',
            'Phrases spelled out in full where a person would contract them.',
            'A short list of soft marketing words.',
          ],
        },
        'It also checks that sentences stay short on average and that a fair share are very short. Over any limit, the build fails.',
        'Hiding words doesn’t get around it. Interface labels are skipped, since they aren’t sentences. But if the skipped text grows past a set share of the site, the check fails anyway.',
      ],
    },
    {
      id: 'labels',
      heading: 'Real numbers carry a label.',
      body: [
        'Some numbers on this site are real. Page sizes are measured when the site is built. Load times are measured in your browser while you read. Those are allowed, as long as they say what they are.',
        'A third check, `check-provenance`, makes every figure and demo carry a small label that reads Live, Build, Recorded or Illustration. Live means measured in your browser just now. So no page may ship with a Live label already in its HTML, and only the script that did the measuring can set one. Anything left out on purpose is drawn hatched and labeled, so a withheld value never looks like a missing one.',
      ],
    },
    {
      id: 'cost',
      heading: 'What it costs.',
      body: [
        'Writing under these checks is slower. A true sentence sometimes has to be rewritten because it looks like a false one. A count of something we really did would still fail. When something becomes true, the fix is to change the check on purpose and write down why in the {k}commit{/k}.',
        'The checks read their own descriptions too. This note can’t quote the phrases it describes, because the build would stop on them. The page about [how this site is built](/work/this-site/) paraphrases each check for the same reason.',
        'And the checks miss things. A list of phrases can’t tell a careful claim from a careless one, and a limit on dashes can’t make dull writing good. A person reviews anything that’s expensive to get wrong. The checks catch what a machine can, on every deploy.',
      ],
    },
    {
      id: 'see-it',
      heading: 'See it run.',
      body: [
        'Every check runs on every deploy. The [build guards](/work/this-site/#guards) section lists each one and what it stops, and shows the output of the run that built the page you’re on. The code is public too, in [the site’s repository on GitHub](https://github.com/dlaskowski-py/ADJL-Technologies-).',
      ],
    },
  ],
  related: [
    { label: 'How this site is built', href: '/work/this-site/' },
    { label: 'What changed, and when', href: '/changelog/' },
    { label: 'How we work', href: '/approach/' },
  ],
};

const research: Note = {
  meta: {
    title: 'Research That Can’t Fool Itself | ADJL Technology',
    description:
      'How our market research with AI agents guards against fooling itself: blind controls, the index as it stood, changes declared first, both halves of history.',
    ogTitle: 'Research that can’t fool itself.',
  },
  route: '/notes/research-that-cannot-fool-itself/',
  published: FIRST_THREE,
  hero: {
    eyebrow: 'Field note',
    headline: ['Research that', '{em}can’t fool itself.{/em}'],
    lead: 'We research stock-market ideas working with AI agents, and a person decides at every step. The easy mistake in this work is a result that only looks good because of how it was tested. These are the checks we use against that. Method only, no numbers.',
  },
  blurb:
    'The checks our market research runs against fooling itself, with AI agents doing the work and a person deciding at every step. Method only, no numbers.',
  parts: [
    {
      id: 'who-decides',
      heading: 'A person decides at every gate.',
      body: [
        'The agents write the code, run the studies and review each other’s work. A person sets each question. An agent asks focused questions and writes a {k}design spec{/k}, and the workflow requires a person to approve the spec and the plan before any code is written. A person can also choose to shorten that path.',
        'A reviewer agent checks the finished work, and a person chooses which of its findings to act on. Nothing an agent finds is adopted on its own say-so. Whether a change goes forward is a person’s call, made after the results are in.',
      ],
    },
    {
      id: 'known-answers',
      heading: 'Code is tested where the answer is known.',
      body: [
        'Before a strategy meets real history, its code is tested on made-up prices where the right trades are known in advance. If the code doesn’t make exactly those trades, it’s wrong, whatever its results look like later.',
        'One test cuts the price history off at a given day and checks that nothing decided before that day changes. Code that quietly peeks at the future fails it. The agents run these tests as they build and again in review.',
      ],
    },
    {
      id: 'blind-control',
      heading: 'Every idea faces a blind control.',
      body: [
        'A signal can look good just because the market went up. So each idea is compared with a blind control on the same days. The control keeps the same exits and holding rules, and enters without the signal. If the idea doesn’t beat entering blind, the signal isn’t doing the work.',
        'Entries can bunch up on the same bad days for the whole market. The test allows for that, so one bad day isn’t counted as many separate wins.',
      ],
    },
    {
      id: 'as-it-stood',
      heading: 'The index as it stood on each day.',
      body: [
        'Test a strategy on today’s list of large companies and you’ve quietly picked the winners. The companies that shrank, failed or were bought out aren’t on today’s list. A test that never meets them looks better than real life would have been.',
        'So our later studies use the index as it stood on each day, with the companies that later left it still in. A strategy may buy a stock only on days it was really in the index. A separate study measured how much this matters, with companies that had dropped out of the market added back, some of them found by hand.',
        'Every test also charges trading costs.',
      ],
    },
    {
      id: 'declared-first',
      heading: 'Changes are written down before the run.',
      body: [
        'The easiest way to fool yourself is to try a lot of tweaks and keep the one that worked. So the candidates are fixed in writing before any data runs.',
        'When a recent study tuned the settings of textbook strategies, the full set of settings to try was written down before any test. When another tested changes to the indicator Loep offers, each candidate change was declared in its spec first.',
        'Near misses aren’t adopted after the fact.',
      ],
    },
    {
      id: 'both-halves',
      heading: 'A result has to hold in both halves.',
      body: [
        'Some ideas work in one stretch of history and nowhere else. To catch that, the history is split in two, and a result has to hold in both halves. Where a test uses random draws, it has to hold for every {k}random seed{/k} too.',
        'When settings are tuned, each year of the test runs on settings chosen only from the years before it. The test never borrows from its own future.',
      ],
    },
    {
      id: 'failures',
      heading: 'Failures go in the log.',
      body: [
        'Most ideas fail. The findings log says so, in the same plain terms it uses for the ones that hold up. When an earlier conclusion turns out to be wrong, the log records the correction.',
        'A log of failures is what makes a success worth reading. It shows the bar every idea had to clear.',
      ],
    },
    {
      id: 'on-paper',
      heading: 'Then it runs on paper.',
      body: [
        'A person chooses what goes forward, from the research’s recommendations, after the testing. Automated paper-trading programs, built with our AI agents, then follow those strategies on paper after every market close. They’re plain rules-based programs. No AI model makes a decision when they run, and no order is ever sent to a broker.',
        'The programs run the research’s own code, or check that the published version still matches it. What survives can reach [Loep](/work/loep/) as an indicator, with its method and its weaknesses written out and its settings withheld.',
        'There are no numbers in this note, on purpose. Results are the easiest part of research to fool yourself with, and the method is the part you can judge. The [agentic research](/work/agentic-research/) case study walks through the whole process.',
      ],
    },
  ],
  related: [
    { label: 'How we research with AI agents', href: '/work/agentic-research/' },
    { label: 'Loep', href: '/work/loep/' },
    { label: 'AI Engineering', href: '/services/ai-engineering/' },
  ],
};

export const notes: Record<'crawlers' | 'overclaim' | 'research', Note> = { crawlers, overclaim, research };

/** The order /notes/ lists them in, newest first. */
export const order: (keyof typeof notes)[] = ['crawlers', 'overclaim', 'research'];
