/**
 * ADJL Technology: /work/agentic-research/, how we research the stock
 * market with AI agents, with a person deciding at every gate, and the
 * rules-based programs that follow the chosen results on paper.
 *
 * Every statement here was checked against the research's own code and
 * specs, and the wording follows what the founder approved. What this page
 * must not carry, and why:
 *
 *   - A number of any kind. No result, return, win rate or drop, no
 *     comparison with an index, no count (of strategies, ideas, tests,
 *     trades, seeds or stocks), no dollar amount, no date the paper record
 *     starts, no window length and no clock time. A method page that
 *     quotes one result invites the reader to judge the method by it.
 *   - A strategy's name or code name, a ticker, a position, a setting or a
 *     threshold, a cost rate, or the names of the tools, vendors and
 *     published sources the work draws on.
 *   - Any hint that the strategies were invented here. They're published
 *     strategies, rebuilt rule by rule and tested; the indicator on Loep
 *     began as an existing script that the research replicated, tested and
 *     revised. Never "invented", "original", "proprietary" or "built from
 *     scratch", and never "proven", "validated" or "beats the market".
 *   - "Trade", "execute", "live" or "real money" for the paper programs.
 *     They're automated and rules-based, AI agents built them, no model
 *     runs in them, and no order reaches a broker.
 *   - That AI picks strategies or decides anything. The owner sets each
 *     question, approves the plan and chooses what's adopted.
 *   - That paper results appear on Loep (they don't), or who reads them.
 *
 * And three scopes the fact check drew: the gated steps are how a study
 * runs NOW, not how every past study ran; point-in-time membership is in
 * the later studies; trading costs are charged by the strategy tests and
 * the paper records.
 *
 * Same conventions as src/content.ts: headlines are arrays of lines,
 * {em}…{/em} marks one emphasized phrase per headline, and {k}…{/k} marks a
 * technical term in body copy. Edit words here, never in a renderer.
 */

import type { SectionPage } from './content-types';

export const content: SectionPage = {
  meta: {
    title: 'Agentic Research with a Person at Every Gate | ADJL Technology',
    description:
      'How we research the stock market with AI agents. A person approves each plan, guards work against hindsight, and rules-based programs follow results on paper.',
    ogTitle: 'Research with AI agents. A person decides.',
    ogDescription:
      'We research the stock market with AI agents. The agents write the code, run the studies and check each other’s work.',
  },
  hero: {
    eyebrow: 'Case study · Agentic research',
    headline: ['Research with AI agents.', '{em}A person decides.{/em}'],
    lead: 'We research the stock market with AI agents. The agents write the code, run the studies and check each other’s work. A person sets each question, approves each plan and decides what goes forward. This page shows the method and leaves out every result.',
    secondary: { label: 'Talk to Daniel', href: '#contact' },
    specs: [
      { label: 'AI agents', value: 'Write the code, run the studies, review the work' },
      { label: 'A person', value: 'Sets the question, approves the plan, decides' },
      { label: 'On paper', value: 'Rules-based programs, after every close' },
      { label: 'Shown here', value: 'The method only. No results or settings' },
    ],
  },
  sections: [
    {
      id: 'loop',
      eyebrow: 'The loop',
      headline: ['From a question', 'to a {em}written verdict.{/em}'],
      body: [
        'Studies now follow one written workflow with gates in it. AI agents do the work between the gates. The research’s owner approves each gate before the next step starts, and only he can shorten the workflow.',
      ],
      items: [
        {
          title: 'The question',
          body: 'The owner says what he wants to know. An agent asks him focused questions, one at a time, sets out the options and writes a design spec with his decisions in it. Nothing moves until he approves it.',
        },
        {
          title: 'A test-first plan',
          body: 'Agents design the structure, then write a plan that names the exact files and the tests to write first. The owner approves the plan before any code is written.',
        },
        {
          title: 'Built against known answers',
          body: 'By default, a fresh agent builds each task against tests on {k}synthetic prices{/k}, where the right answer is known in advance. A reviewer agent checks each task. A published strategy is rebuilt rule by rule, and each rule cites its source.',
        },
        {
          title: 'Run behind guards',
          body: 'Then the study runs behind guards meant to stop us fooling ourselves. They’re listed further down this page.',
        },
        {
          title: 'An independent review',
          body: 'A reviewer agent checks the whole change, first against the spec and then for quality. The owner reads the findings and chooses which ones to act on.',
        },
        {
          title: 'The verdict, written down',
          body: 'The result goes into a findings log, failures included. A near miss isn’t adopted after the fact.',
        },
        {
          title: 'The owner chooses',
          body: 'From the tested results, the owner chooses what goes onto paper and which changes are adopted. The agents recommend. He decides.',
        },
        {
          /* The last two stages share an item: eight make even rows. */
          title: 'On paper, then Loep',
          body: 'After every close, a scheduled job checks its code against the research, rebuilds the paper accounts and works out the orders for the next open. The results are emailed. A result that holds up can also reach Loep as an indicator. So far, one has.',
        },
      ],
    },
    {
      id: 'who',
      eyebrow: 'Who decides',
      headline: ['Who does what', 'at {em}every gate.{/em}'],
      body: [
        'No AI model picks a strategy, and none runs in the paper programs. The agents write, test and check. The owner chooses at every gate.',
      ],
      table: {
        head: ['Step', 'AI agents', 'The owner'],
        /* Short cells, and short row heads (they don't wrap): on a phone
           the table has three narrow columns. */
        rows: [
          ['Question', 'Ask focused questions and write the spec', 'Approves the spec'],
          ['Plan', 'Write a test-first plan', 'Approves it before any code'],
          ['Review', 'Check the whole change', 'Picks the findings to act on'],
          ['Choosing', 'Recommend from the tested results', 'Decides what goes forward'],
          ['Each close', 'Built the programs. No model runs in them', 'Can hold the day’s run'],
        ],
      },
    },
    {
      id: 'guards',
      eyebrow: 'Guards',
      headline: ['Guards against', '{em}fooling ourselves.{/em}'],
      body: [
        'A backtest can flatter an idea in quiet ways. A company that later failed drops out of the data, or a setting gets picked with the answer in view. Each guard below closes one of those gaps.',
      ],
      list: [
        'The later studies use the index as it stood on each day, companies that later left it included. A stock can be bought only on days it was really a member.',
        'The {k}survivorship bias{/k} was measured, not assumed, by testing companies that were delisted, failures among them.',
        'Prices include dividends and are adjusted for splits, so a split never looks like a crash.',
        'An idea is measured against a {k}blind control{/k} on the same days. The control keeps the same exits and holding rules and enters without the signal.',
        'Settings are tuned on earlier years only. Each test year runs on settings chosen from the years before it.',
        'A proposed change is written into the spec before the run, so the test can’t be shaped to fit the answer.',
        'A result has to hold in both halves of the history and for every random seed.',
        'Strategy tests and paper records charge realistic trading costs.',
        'A look-ahead test cuts the price history off at a given day. Nothing decided before that day may change.',
        'Most ideas fail, and the findings log says so.',
      ],
      instrument: 'leaders-pit',
      links: [{ label: 'Research that can’t fool itself, a field note', href: '/notes/research-that-cannot-fool-itself/' }],
    },
    {
      id: 'paper',
      eyebrow: 'On paper',
      headline: ['Followed on paper', '{em}after every close.{/em}'],
      body: [
        'The owner chooses which results go onto paper. From then on, automated, rules-based programs follow them after every market close. AI agents built and reviewed these programs, and no AI model runs in them.',
        'They follow the strategies our research judged most promising. Those are published strategies the agents rebuilt and tested, with corrected versions beside the originals where the published code didn’t do what it said. It’s research, not advice.',
      ],
      items: [
        {
          title: 'Checked before it publishes',
          body: 'The programs run the research’s own code. Where a program uses its own version of a strategy, each run first checks that version against the research. A run also refuses to publish when too little of the market has that day’s prices.',
        },
        {
          title: 'Rebuilt from the start',
          body: 'The paper accounts are rebuilt from their start at every close, and a check reports where the record changed since the last run. The part from before the accounts existed is a replay, worked out after the strategies were chosen.',
        },
        {
          title: 'Orders, never sent',
          body: 'After each close the job works out the orders for the next open. Nothing goes to a broker. The orders are published for a person to read, and the results are emailed.',
        },
        {
          title: 'A person can stop it',
          body: 'The owner can hold any day’s run, and its email with it. He has done so.',
        },
      ],
    },
    {
      id: 'loep',
      eyebrow: 'Into Loep',
      headline: ['Where Loep', '{em}comes in.{/em}'],
      body: [
        'Loep is a research tool we built for people who aren’t professionals. The indicator Loep offers today is a system our research replicated, tested and revised, working with AI agents. The ones still in testing go through the same process.',
        'Nothing carries research into Loep automatically. The indicator’s sheet writes out its method and its weaknesses, and its settings stay out. The paper records don’t appear on Loep.',
      ],
      links: [{ label: 'How Loep works', href: '/work/loep/' }],
    },
    {
      id: 'omitted',
      eyebrow: 'Not shown',
      headline: ['What this page', '{em}leaves out.{/em}'],
      body: [
        'This page describes how the research works, not what it found. A single quoted result would be judged without its method, so none appears here. These stay private.',
      ],
      list: [
        'Every result and figure, and any comparison with the market.',
        'The names of strategies and stocks, and every setting and threshold.',
        'What the paper accounts hold, and when their record starts.',
        'The tools, vendors and published sources the work draws on.',
      ],
      hatch: 'Withheld from this page',
    },
  ],
  foot: {
    builtUnder: [{ label: 'AI Engineering', href: '/services/ai-engineering/' }],
    next: { label: 'Loep', href: '/work/loep/' },
  },
};

export const meta = content.meta;
