/**
 * ADJL Technologies — home page and site-wide copy.
 *
 * EVERY HUMAN-READABLE SENTENCE ON THIS SITE LIVES IN A content*.ts FILE.
 * Edit words here; markup, styling and motion live elsewhere and read from
 * these objects. If you find yourself editing a sentence inside a section
 * renderer, the renderer is wrong.
 *
 * House conventions, carried from ADJL Capital:
 *
 *   - Headlines are ARRAYS. Each entry renders as its own line.
 *   - {em}…{/em} marks one emphasised phrase per headline, set in copper at a
 *     lighter weight. Exactly one, and put it on the word that carries the
 *     meaning.
 *   - {k}…{/k} marks a technical term in BODY copy only. Never in a headline.
 *
 * And one rule that is not stylistic:
 *
 *   NOTHING ON THIS SITE MAY CLAIM SOMETHING THAT HAS NOT HAPPENED. No client
 *   names, no testimonials, no performance figures, no counts of anything.
 *   The firm is new and one person runs it; a site that pretends otherwise
 *   gets found out in the first conversation, and the honesty is a better
 *   pitch than the invention would have been. scripts/check-claims.mjs fails
 *   the build over the specific words that tend to smuggle a claim in.
 */

export const meta = {
  title: 'ADJL Technologies — AI consulting and applied engineering',
  description:
    'An AI consulting and engineering practice: we find where AI actually belongs in a business that already runs, then build it, ship it, and hand over the code. Real estate underwriting, trading infrastructure, and AI implementation.',
  ogTitle: 'ADJL Technologies — We build the system, not the slide deck',
  ogDescription:
    'AI consulting and applied engineering from the team behind ADJL Capital’s underwriting software. Real estate intelligence, trading infrastructure, and AI built into the workflow you already run.',
};

/** The address on every page. One string, one place to change it. */
export const CONTACT = 'daniel@adjlcapital.com';

export const nav = {
  wordmark: { lead: 'ADJL', tail: 'Technologies' },
  links: [
    { label: 'Work', href: '/work/' },
    { label: 'Approach', href: '/approach/' },
  ],
  cta: { label: 'Start a conversation', href: '/#contact' },
};

export const hero = {
  eyebrow: 'AI Consulting · Applied Engineering',
  headline: ['We build the system.', 'Not the {em}slide deck.{/em}'],
  body: 'ADJL Technologies works out where AI actually belongs inside a business that already runs — and then builds that thing, puts it into production, and hands it over with the code. The first client was our own firm. The underwriting engine behind ADJL Capital’s property deals is ours, and it ran on our own capital before it ran on anyone else’s.',
  primary: { label: 'See the work', href: '/work/' },
  secondary: { label: 'How we work', href: '/approach/' },
  scrollHint: 'Scroll',
};

/** Four capability facts. Not metrics — there are no metrics to report yet,
 *  and inventing four would be the fastest way to lose the reader who checks. */
export const strip = {
  line: 'Three practices. One operator. Software that is already running on the firm’s own money.',
  chips: [
    { k: 'Real estate', v: 'A listing URL in, a full underwriting out' },
    { k: 'Trading firms', v: 'Market data, execution and network work' },
    { k: 'AI implementation', v: 'Built into the workflow you already run' },
    { k: 'Ownership', v: 'You keep the code, the data and the models' },
  ],
};

export const practices = {
  eyebrow: 'What We Do',
  headline: ['Three practices,', 'one {em}discipline.{/em}'],
  intro:
    'The three look unrelated until you notice they are the same job: take a decision somebody is currently making slowly, by hand, out of incomplete information — and build the thing that makes it faster, repeatable and checkable. The domain changes. The work does not.',
  items: [
    {
      num: '01',
      title: 'AI Implementation',
      sub: 'For businesses that already work',
      body: 'We start at your workflow, not at a model. Somewhere in a business that already runs there are capable people spending their best hours reading, sorting, extracting and routing — work that is expensive precisely because it is repetitive and still needs judgement. We build the narrow thing that does one of those steps, put a human where being wrong is costly, and instrument it so you can tell whether it is helping.',
      points: [
        '{k}Retrieval{/k} over the documents you already have',
        '{k}Extraction{/k} from records that were never structured',
        'A {k}review gate{/k} wherever the cost of being wrong is real',
      ],
      link: { label: 'How we implement', href: '/work/ai-implementation/' },
    },
    {
      num: '02',
      title: 'Real Estate Intelligence',
      sub: 'The underwriting engine',
      body: 'Paste a listing URL. The system resolves the address, pulls live rents and comparables, reads years of public records, models tax including the reassessment that lands on sale, and returns the underwriting an analyst would have spent a day on. Every figure carries its source, and anything unaudited says so on its face.',
      points: [
        'Live {k}market data{/k} and comparables, not a national average',
        '{k}Public records{/k} read directly, going back years',
        'Every number carries {k}provenance{/k} or it does not ship',
      ],
      link: { label: 'How the scanner works', href: '/work/real-estate-intelligence/' },
    },
    {
      num: '03',
      title: 'Trading Infrastructure',
      sub: 'Programming and network solutions',
      body: 'The plumbing a trading firm runs on: market data ingestion and normalisation, order and execution pipelines, network and latency work, and backtesting harnesses that run the same code path as production so a backtest cannot quietly diverge from the thing it is supposed to predict. We describe what a system is for and how it behaves — never how to rebuild it.',
      points: [
        '{k}Market data{/k} ingestion, normalisation and storage',
        '{k}Execution{/k} pipelines and order routing',
        'Backtests that share a {k}code path{/k} with live',
      ],
      link: { label: 'What we build', href: '/work/trading-infrastructure/' },
    },
  ],
};

/**
 * The flow section — the animated centrepiece.
 *
 * Five stages, each with a one-word `tag` that becomes a node in the
 * diagram. The tags have to work as single words on a chart, so they are
 * chosen for that as much as for the prose.
 */
export const flow = {
  eyebrow: 'The Process',
  headline: ['How a problem becomes', 'something that {em}runs.{/em}'],
  intro:
    'Most AI projects die between the demo and the Tuesday after it. This is the sequence that avoids that, and the reason it works is that nothing is built until the thing it is replacing has been watched in the wild.',
  stages: [
    {
      num: '01',
      tag: 'watch',
      title: 'Sit with the work',
      body: 'We watch the actual process, with the people who actually do it, before proposing anything. Almost every workflow has a step nobody documented because it lives in one person’s head.',
    },
    {
      num: '02',
      tag: 'map',
      title: 'Find the one step',
      body: 'One step gets chosen: expensive, repetitive, and survivable if it is occasionally wrong. Choosing the step is most of the job, and choosing a glamorous one is how these projects fail.',
    },
    {
      num: '03',
      tag: 'build',
      title: 'Build the narrow thing',
      body: 'A system that does that one step and nothing else. Narrow is what makes it possible to say whether it works, and a narrow thing that ships beats a broad one that is still in review.',
    },
    {
      num: '04',
      tag: 'measure',
      title: 'Instrument it',
      body: 'Before it goes live it gets an evaluation set and a way to see what it did and why. A system nobody is measuring is a system nobody can defend when it is questioned.',
    },
    {
      num: '05',
      tag: 'handover',
      title: 'Hand it over running',
      body: 'You get the code, the prompts, the evaluation set and the documentation. The engagement ends with your team able to change the thing without calling us.',
    },
  ],
  foot: 'This sequence is slower to start than buying a tool, and that is the trade: the first two stages produce no software at all, and skipping them is how you end up with the demo that nobody owns.',
};

export const work = {
  eyebrow: 'Selected Work',
  headline: ['Systems that are', 'actually {em}running.{/em}'],
  intro:
    'Three builds, described by mechanism rather than by outcome. Where a system has limits, they are written down on its page beside what it does well — a system described only by its wins is not being described.',
  items: [
    {
      num: '01',
      kicker: 'Real Estate',
      title: ['A listing URL in,', 'an underwriting out'],
      sub: 'Built for ADJL Capital · run on the firm’s own capital',
      body: 'The engine behind ADJL Capital’s property decisions. It resolves an address, pulls live market data, reads public records going back years, models taxes, insurance, hazard exposure and financing, and produces the analysis a person would have produced by hand — with sources attached to every figure.',
      linkLabel: 'Read the build',
      href: '/work/real-estate-intelligence/',
      media: 'survey',
    },
    {
      num: '02',
      kicker: 'Trading Infrastructure',
      title: ['From the feed', 'to the fill'],
      sub: 'Market data, execution, network and backtesting',
      body: 'Programming and network solutions for trading firms: ingesting and normalising market data, moving orders, keeping latency honest, and building backtest harnesses that cannot silently diverge from production because they run the same code. Described by behaviour, never by parameter.',
      linkLabel: 'Read the build',
      href: '/work/trading-infrastructure/',
      media: 'latency',
    },
    {
      num: '03',
      kicker: 'AI Implementation',
      title: ['Into the workflow', 'you already run'],
      sub: 'Retrieval, extraction, routing, drafting — with a review gate',
      body: 'The consulting-and-build practice. We find the step in your process where a person is doing expensive, repetitive judgement work, build the narrow system that does it, put a human decision point where the cost of being wrong is high, and instrument the whole thing before it goes live.',
      linkLabel: 'Read the practice',
      href: '/work/ai-implementation/',
      media: 'mesh',
    },
  ],
  more: { label: 'All work', href: '/work/' },
};

/**
 * The console demo.
 *
 * A recording of the scanner, not a live product — and the caption says so.
 * The whole site is built on not overstating what exists, and this is the
 * one section a reader is most likely to take at face value.
 */
export const demo = {
  eyebrow: 'The Scanner',
  headline: ['Watch it', 'do the {em}work.{/em}'],
  body: 'A sentence like “it underwrites the property” is easy to disbelieve. This is the same claim with its working shown — the address resolving, the records coming back, and the numbers landing.',
  caption: 'A recorded transcript of the underwriting engine, not a live tool.',
  replay: 'Play again',
  script: [
    { kind: 'in', text: 'scan https://listing.example/1420-maple-ave', wait: 300 },
    { kind: 'note', text: 'resolving address · Tuscaloosa County, AL', wait: 500 },
    { kind: 'note', text: 'parcel matched · pulling public records 2019–2025', wait: 700 },
    { kind: 'note', text: 'rent comparables · 14 within 1.2 miles', wait: 700 },
    { kind: 'out', text: 'Underwriting complete. 3 assumptions flagged for review.', wait: 800 },
    { kind: 'kv', k: 'Gross yield', v: '8.4%', wait: 260 },
    { kind: 'kv', k: 'Tax, post-reassessment', v: '3.1× current', wait: 180 },
    { kind: 'kv', k: 'DSCR at 7.1%', v: '1.18', wait: 180 },
    { kind: 'kv', k: 'Figures with a source', v: '31 of 34', wait: 180 },
    { kind: 'note', text: '3 figures unaudited and labelled as such', wait: 400 },
  ],
};

export const method = {
  eyebrow: 'Working Together',
  headline: ['What it is like', 'to {em}hire us.{/em}'],
  intro:
    'Four steps, and the first one is free. If at the end of it the honest answer is that you do not need what we build, that is what you will be told — an engagement that should not have started is worse for us than one we never won.',
  steps: [
    {
      num: '01',
      when: 'A conversation',
      title: 'You describe the problem',
      body: 'A call, and it is with the person who will do the work. No qualifying call before the real call.',
    },
    {
      num: '02',
      when: 'Week one',
      title: 'We watch it happen',
      body: 'Time with the people doing the work today, and with the systems holding the data. This is where the actual problem usually turns out to be somewhere else.',
    },
    {
      num: '03',
      when: 'Written down',
      title: 'A scope, or a no',
      body: 'You get a written scope: the one step we would build, what it would cost, and what would have to be true for it to work. Sometimes the honest deliverable is that the problem is a process problem and no software will fix it.',
    },
    {
      num: '04',
      when: 'Then it ships',
      title: 'Built, measured, handed over',
      body: 'The build runs against an evaluation set from the start. It goes live behind whatever review gate the risk deserves, and it ends with your team owning it.',
    },
  ],
};

export const stack = {
  eyebrow: 'The Stack',
  label: 'What the work is actually built out of. No preference is a religion — the constraint picks the tool.',
  groups: [
    {
      name: 'Languages & runtime',
      items: ['TypeScript', 'Python', 'Node.js', 'Rust', 'SQL', 'C++'],
    },
    {
      name: 'Models & retrieval',
      items: ['Claude', 'OpenAI', 'Local / open weights', 'Vector search', 'Structured extraction', 'Evaluation harnesses'],
    },
    {
      name: 'Data & infrastructure',
      items: ['Postgres', 'Supabase', 'Redis', 'Kafka', 'Parquet', 'Time-series stores'],
    },
    {
      name: 'Delivery',
      items: ['AWS', 'Netlify', 'Docker', 'Terraform', 'GitHub Actions', 'Observability'],
    },
  ],
};

export const founder = {
  eyebrow: 'Who You Get',
  headline: ['One person,', 'and that is the {em}point.{/em}'],
  name: 'Daniel Laskowski',
  role: 'Chief Executive Officer & Founder',
  body: [
    'ADJL Technologies is run by one person. That is a real constraint and it is worth being straight about it: there is a ceiling on how much work can be in flight at once, and if you need forty engineers on Monday this is the wrong firm.',
    'What you get in exchange is that the person who takes the call is the person who writes the code. Nothing is translated through an account manager, no junior inherits a brief they were not in the room for, and the estimate comes from whoever has to live with it.',
    'The software behind ADJL Capital — the property underwriting engine and the rules-based system for liquid US equities — was built the same way, and it runs on the firm’s own capital. Where a build needs more hands than one, contractors are brought in and told to you by name.',
  ],
  points: [
    'The person who scopes it is the person who builds it',
    'Contractors are disclosed, never presented as staff',
    'Work already running on the firm’s own money',
  ],
};

export const faq = {
  eyebrow: 'Fair Questions',
  headline: ['The things you', 'are actually {em}thinking.{/em}'],
  items: [
    {
      q: 'Why would I hire a one-person firm?',
      a: 'For a narrow, well-scoped build, one experienced person who stays on it start to finish is usually faster than a team that has to be coordinated. For a large programme with many parallel workstreams, it is not — and you should hire an agency. The honest test is whether the work fits in one head; if it does not, we will say so.',
    },
    {
      q: 'Is this just a wrapper around someone else’s model?',
      a: 'The model is one component and usually the least interesting one. The work is in getting your data to a state where a model can act on it, deciding where a human has to stay in the loop, and building the evaluation that tells you whether any of it is working. Swap the model out in a year and that scaffolding is what you keep.',
    },
    {
      q: 'What do you refuse to take on?',
      a: 'Anything where the goal is to replace a person’s judgement in a decision that materially affects someone — hiring, credit, anything medical. Also any project whose success criteria cannot be written down before it starts, because that is not a project, it is a subscription.',
    },
    {
      q: 'Who owns the code when we are done?',
      a: 'You do. The code, the prompts, the evaluation set and the documentation, in your repository, with no licence back to us and no runtime dependency on anything we host. There is no version of this where you have to keep paying to keep using what you paid to have built.',
    },
    {
      q: 'What about our data?',
      a: 'It stays in your environment wherever that is possible, and where it is not, you are told exactly what leaves, where it goes and how long it lives there — before anything is built, not in an appendix afterwards.',
    },
    {
      q: 'How is this related to ADJL Capital?',
      a: 'ADJL Capital is a private investment firm with three partners; ADJL Technologies is its engineering arm and has one. The software the fund runs on was built here, which is why it can be described in detail — it is our own. They are separate companies and nothing on this site is an offer of any security.',
    },
  ],
};

export const cta = {
  eyebrow: 'Start Here',
  headline: ['Tell us what', 'is {em}slow.{/em}'],
  body: 'The most useful first message is not a brief. It is one paragraph about the step in your business that costs the most and moves the slowest — and, if you know it, why the obvious fix has not worked.',
  button: { label: 'Email the founder', href: `mailto:${CONTACT}` },
  email: CONTACT,
  copy: 'Copy address',
  copied: 'Copied',
  note: 'Daniel reads and answers these himself, usually within a day or two. There is no sequence, no drip, and nothing sold to anyone.',
};

export const footer = {
  blurb:
    'ADJL Technologies is the AI consulting and engineering practice behind ADJL Capital’s software. Built and run by Daniel Laskowski.',
  groups: [
    {
      name: 'Work',
      links: [
        { label: 'Real Estate Intelligence', href: '/work/real-estate-intelligence/' },
        { label: 'Trading Infrastructure', href: '/work/trading-infrastructure/' },
        { label: 'AI Implementation', href: '/work/ai-implementation/' },
      ],
    },
    {
      name: 'Firm',
      links: [
        { label: 'Approach', href: '/approach/' },
        { label: 'All work', href: '/work/' },
        { label: 'Contact', href: '/#contact' },
      ],
    },
    {
      name: 'Legal',
      links: [
        { label: 'Privacy', href: '/legal/privacy/' },
        { label: 'Terms', href: '/legal/terms/' },
      ],
    },
  ],
  legal:
    'ADJL Technologies. Nothing on this site is an offer to sell or a solicitation of any security, and nothing here is investment advice. Descriptions of internal systems are general by design and omit parameters and thresholds.',
};
