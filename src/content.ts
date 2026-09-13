/**
 * ADJL Technology — home page and site-wide copy.
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
 *   names, no testimonials, no performance figures, no counts of anything —
 *   including headcount. The firm is new; a site that pretends otherwise gets
 *   found out in the first conversation, and the restraint is a better pitch
 *   than the invention would have been. scripts/check-claims.mjs fails the
 *   build over the specific words that tend to smuggle a claim in.
 */

export const meta = {
  title: 'AI Consulting & Software Engineering — ADJL Technology',
  description:
    'AI consulting and software engineering: real estate underwriting automation, trading infrastructure, and AI built into the workflow you already run.',
  ogTitle: 'ADJL Technology — We build the system, not the slide deck',
  ogDescription:
    'AI consulting and applied engineering from the team behind ADJL Capital’s underwriting software. Real estate intelligence, trading infrastructure, and AI built into the workflow you already run.',
};

/** The address on every page. One string, one place to change it. */
export const CONTACT = 'daniel@adjlcapital.com';

export const nav = {
  wordmark: { lead: 'ADJL', tail: 'Technology' },
  links: [
    { label: 'Work', href: '/work/' },
    { label: 'Approach', href: '/approach/' },
  ],
  cta: { label: 'Start a conversation', href: '/#contact' },
};

export const hero = {
  eyebrow: 'AI Consulting · Applied Engineering',
  headline: ['We build the system.', 'Not the {em}slide deck.{/em}'],
  body: 'ADJL Technology works out where AI actually belongs inside a business that already runs. Then we build that thing, put it into production, and hand it over with the code. The first client was our own firm. The underwriting engine behind ADJL Capital’s property deals is ours, and it ran on our own capital before it ran on anyone else’s.',
  primary: { label: 'See the work', href: '/work/' },
  secondary: { label: 'How we work', href: '/approach/' },
  scrollHint: 'Scroll',
};

/** Four capability facts. Not metrics — there are no metrics to report yet,
 *  and inventing four would be the fastest way to lose the reader who checks. */
export const strip = {
  line: 'Three practices. One team. Software that’s already running on the firm’s own money.',
  chips: [
    { k: 'Real estate', v: 'A listing URL in, a full underwriting out' },
    { k: 'Trading firms', v: 'Market data, execution and network work' },
    { k: 'AI implementation', v: 'Built into the workflow you already run' },
    { k: 'Ownership', v: 'You keep the code, the data and the models' },
  ],
};

export const practices = {
  eyebrow: 'AI Consulting & Engineering',
  headline: ['Three practices,', 'one {em}discipline.{/em}'],
  intro:
    'The three look unrelated until you notice they’re the same job. Somebody is making a decision slowly, by hand, out of incomplete information. We build the thing that makes it faster, repeatable and checkable. The domain changes. The work doesn’t.',
  items: [
    {
      num: '01',
      title: 'AI Implementation',
      sub: 'For businesses that already work',
      body: 'We start at your workflow, before we go anywhere near a model. Somewhere in a business that already runs, capable people are spending their best hours reading, sorting, extracting and routing. That work is expensive because it’s repetitive and still needs judgment. We build the narrow thing that does one of those steps, put a human where being wrong is costly, and instrument it so you can tell whether it’s helping.',
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
      body: 'Paste a listing URL. The system resolves the address, pulls live rents and comparables, reads years of public records, and models tax including the reassessment that lands on sale. What comes back is the underwriting an analyst would have spent a day on. Every figure carries its source, and anything unaudited says so on its face.',
      points: [
        'Live {k}market data{/k} and comparables, not a national average',
        '{k}Public records{/k} read directly, going back years',
        'Every number carries {k}provenance{/k} or it doesn’t ship',
      ],
      link: { label: 'How the scanner works', href: '/work/real-estate-intelligence/' },
    },
    {
      num: '03',
      title: 'Trading Infrastructure',
      sub: 'Programming and network solutions',
      body: 'The plumbing a trading firm runs on: market data ingestion and normalization, order and execution pipelines, network and latency work, and backtesting harnesses that run the same code path as production, so a backtest can’t quietly diverge from the thing it’s supposed to predict. We describe what a system is for and how it behaves, and never how to rebuild it.',
      points: [
        '{k}Market data{/k} ingestion, normalization and storage',
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
  eyebrow: 'How An AI Build Runs',
  headline: ['How a problem becomes', 'something that {em}runs.{/em}'],
  intro:
    'Most AI projects die between the demo and the Tuesday after it. This is the sequence that avoids that. It works because nothing gets built until the thing it’s replacing has been watched in the wild.',
  stages: [
    {
      num: '01',
      tag: 'watch',
      title: 'Sit with the work',
      body: 'We watch the actual process, with the people who actually do it, before we propose anything. Almost every workflow has a step nobody documented, because it lives in one person’s head.',
    },
    {
      num: '02',
      tag: 'map',
      title: 'Find the one step',
      body: 'We pick one step. It has to be expensive, repetitive, and survivable if it’s occasionally wrong. Choosing the step is most of the job, and choosing a glamorous one is how these projects fail.',
    },
    {
      num: '03',
      tag: 'build',
      title: 'Build the narrow thing',
      body: 'A system that does that one step and nothing else. Narrow is what makes it possible to say whether it works. A narrow thing that ships beats a broad one that’s still in review.',
    },
    {
      num: '04',
      tag: 'measure',
      title: 'Instrument it',
      body: 'Before it goes live it gets an evaluation set and a way to see what it did and why. A system nobody measures is a system nobody can defend when it gets questioned.',
    },
    {
      num: '05',
      tag: 'handover',
      title: 'Hand it over running',
      body: 'You get the code, the prompts, the evaluation set and the documentation. The engagement ends with your team able to change the thing without calling us.',
    },
  ],
  foot: 'This sequence is slower to start than buying a tool. That’s the trade. The first two stages produce no software at all, and skipping them is how you end up with the demo that nobody owns.',
};

export const work = {
  eyebrow: 'Selected Work',
  headline: ['Systems that are', 'actually {em}running.{/em}'],
  intro:
    'Three builds, described by mechanism instead of outcome. Each page walks the system stage by stage: what goes in, what each stage does with it, and the decisions inside it a buyer would otherwise have to ask about.',
  items: [
    {
      num: '01',
      kicker: 'Real Estate',
      title: ['A listing URL in,', 'an underwriting out'],
      sub: 'Built for ADJL Capital · run on the firm’s own capital',
      body: 'The engine behind ADJL Capital’s property decisions. It resolves an address, pulls live market data, reads public records going back years, and models taxes, insurance, hazard exposure and financing. What it produces is the analysis a person would have produced by hand, with sources attached to every figure.',
      linkLabel: 'Read the build',
      href: '/work/real-estate-intelligence/',
      media: 'survey',
    },
    {
      num: '02',
      kicker: 'Trading Infrastructure',
      title: ['From the feed', 'to the fill'],
      sub: 'Market data, execution, network and backtesting',
      body: 'Programming and network solutions for trading firms: ingesting and normalizing market data, moving orders, keeping latency honest, and building backtest harnesses that can’t silently diverge from production because they run the same code. We describe them by behavior, never by parameter.',
      linkLabel: 'Read the build',
      href: '/work/trading-infrastructure/',
      media: 'latency',
    },
    {
      num: '03',
      kicker: 'AI Implementation',
      title: ['Into the workflow', 'you already run'],
      sub: 'Retrieval, extraction, routing and drafting, with a review gate',
      body: 'The consulting-and-build practice. We find the step in your process where a person is doing expensive, repetitive judgment work, build the narrow system that does it, put a human decision point where the cost of being wrong is high, and instrument the whole thing before it goes live.',
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
  eyebrow: 'Underwriting Automation',
  headline: ['Watch it', 'do the {em}work.{/em}'],
  body: 'A sentence like “it underwrites the property” is easy to disbelieve. This is the same claim with its working shown. You watch the address resolve, the records come back, and the numbers land.',
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
    { kind: 'note', text: '3 figures unaudited and labeled as such', wait: 400 },
  ],
};

export const method = {
  eyebrow: 'Engagement Process',
  headline: ['What it is like', 'to {em}hire us.{/em}'],
  intro:
    'Four steps, and the first one is free. By the end of the second you have a written scope with a price on it. By the end of the fourth your team owns a system that’s running.',
  steps: [
    {
      num: '01',
      when: 'A conversation',
      title: 'You describe the problem',
      body: 'A call with Daniel and whoever will lead the build. No qualifying call before the real call, and no salesperson in the room.',
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
      title: 'A scope, in writing',
      body: 'You get the one step we’d build, what it would cost, what it would take, and what has to be true for it to work. Priced and dated before anyone commits to it.',
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
  eyebrow: 'Languages, Models & Infrastructure',
  label: 'What the work is actually built out of. No preference here is a religion. The constraint picks the tool.',
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
  eyebrow: 'The Team',
  headline: ['You talk to Daniel.', 'A team {em}builds it.{/em}'],
  name: 'Daniel Laskowski',
  role: 'Chief Executive Officer & Founder',
  body: [
    'ADJL Technology is Daniel Laskowski and a team of developers. He takes the first call, writes the scope, and reads every message that arrives at the address on this page. There’s no account manager standing between you and the person accountable for the work.',
    'The team is small and senior on purpose. That’s an engineering decision, not modesty. A brief loses something at every hand it passes through, and a system built by people who were all in the original conversation needs far less documentation to stay understood a year later.',
    'The software behind ADJL Capital was built here: the property underwriting engine and the rules-based system for liquid US equities. It runs on the firm’s own capital before it runs on anyone else’s, and the client work is held to that same standard.',
  ],
  points: [
    'The founder scopes the work and stays on it',
    'A small senior team, not a rotating bench',
    'Work already running on the firm’s own money',
  ],
};

export const faq = {
  eyebrow: 'Fair Questions',
  headline: ['The things you', 'are actually {em}thinking.{/em}'],
  items: [
    {
      q: 'How big is the team, and who actually does the work?',
      a: 'Daniel founded the firm and leads every engagement. He scopes the work and stays on it through delivery. The build is done by a small senior development team, and you meet the people who are on yours. There’s no bench of juniors a brief gets handed down to, and nobody translating between you and the engineers.'
    },
    {
      q: 'Is this just a wrapper around someone else’s model?',
      a: 'The model is one component, and usually the least interesting one. The work is in getting your data to a state where a model can act on it, deciding where a human has to stay in the loop, and building the evaluation that tells you whether any of it works. Swap the model out in a year and that scaffolding is what you keep.',
    },
    {
      q: 'We already have developers. Where do you fit?',
      a: 'Usually alongside them. We’re not there to replace anyone. An in-house team knows the business far better than we will in week one. What they often don’t have is spare capacity, or a reason to have built this particular thing before. We build the piece, work in your repository against your conventions, and hand it to your people to carry. They’re the ones who’ll still be here in a year.'
    },
    {
      q: 'Who owns the code when we’re done?',
      a: 'You do. The code, the prompts, the evaluation set and the documentation, in your repository, with no license back to us and no runtime dependency on anything we host. There’s no version of this where you have to keep paying to keep using what you paid to have built.',
    },
    {
      q: 'What about our data?',
      a: 'It stays in your environment wherever that’s possible. Where it isn’t, you’re told exactly what leaves, where it goes and how long it lives there. You get that before anything is built, not in an appendix afterward.',
    },
    {
      q: 'How is this related to ADJL Capital?',
      a: 'ADJL Capital is a private investment firm with three partners. ADJL Technology is a separate company, founded and led by Daniel Laskowski with its own development team. The software the fund runs on was built here, which is why we can describe it in this much detail. It’s our own. Neither firm owns the other, and nothing on this site is an offer of any security.',
    },
  ],
};

export const cta = {
  eyebrow: 'Start Here',
  headline: ['Tell us what', 'is {em}slow.{/em}'],
  body: 'The most useful first message isn’t a brief. It’s one paragraph about the step in your business that costs the most and moves the slowest. If you know why the obvious fix hasn’t worked, say that too.',
  button: { label: 'Email the founder', href: `mailto:${CONTACT}` },
  email: CONTACT,
  copy: 'Copy address',
  copied: 'Copied',
  note: 'Daniel reads and answers these himself, usually within a day or two. There’s no sequence, no drip, and nothing sold to anyone.',
};

export const footer = {
  blurb:
    'ADJL Technology is the AI consulting and engineering practice behind ADJL Capital’s software. Founded and led by Daniel Laskowski.',
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
    'ADJL Technology. Nothing on this site is an offer to sell or a solicitation of any security, and nothing here is investment advice. Descriptions of internal systems are general by design and omit parameters and thresholds.',
};
