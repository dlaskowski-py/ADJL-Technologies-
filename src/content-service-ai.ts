/**
 * ADJL Technology: /services/ai-engineering/, the AI engineering practice.
 *
 * The page argues from mechanism. It describes how an agent, a retrieval
 * system or an extraction pipeline is built and checked, then shows one
 * running: Ask This Site with its controls exposed, and a replay of the
 * underwriting engine with every value withheld. No outcome, accuracy
 * figure or client is quoted, because none of that has been measured in
 * public.
 *
 * Same conventions as src/content.ts: headlines are arrays of lines,
 * {em}…{/em} marks one emphasized phrase per headline, and {k}…{/k} marks a
 * technical term in body copy. Edit words here, never in a renderer.
 */

import type { SectionPage } from './content-types';

export const content: SectionPage = {
  meta: {
    title: 'AI Agent and RAG Development | ADJL Technology',
    description:
      'AI agents, retrieval with citations, document extraction and workflow automation, built with an evaluation set and a review gate where errors cost money.',
    ogTitle: 'AI agents and automation that show their work.',
    ogDescription:
      'We build AI systems that do one job inside a business that already runs. Agents that call your tools.',
  },
  hero: {
    eyebrow: 'AI Engineering',
    headline: ['AI agents and automation', 'that {em}show their work.{/em}'],
    lead: 'We build AI systems that do one job inside a business that already runs. Agents that call your tools. {k}Retrieval{/k} that cites its sources. Extraction from records nobody structured, and drafting that stops at a review gate. Each one ships with an {k}evaluation set{/k}, so you can tell whether it’s still right next month.',
    primary: { label: 'Watch a run stop', href: '#replay' },
    secondary: { label: 'Talk to Daniel', href: '#contact' },
    specs: [
      { label: 'Inputs', value: 'Your documents, records and tools' },
      { label: 'Builds', value: 'Agents, retrieval, extraction, routing, drafting' },
      { label: 'Measures', value: 'An evaluation set of real cases, plus a trace of every run' },
      { label: 'Hands over', value: 'Code, prompts, evals and docs, in your repository' },
    ],
  },
  sections: [
    {
      id: 'covers',
      eyebrow: 'What it covers',
      headline: ['Narrow systems,', 'measured {em}from day one.{/em}'],
      items: [
        {
          title: 'Agents that call tools',
          body: 'An agent is a loop. It plans, calls a tool, reads the result and decides what’s next. We give it narrow tools, a budget and a log of every call. It stops and asks when the evidence runs out.',
        },
        {
          title: 'Retrieval with citations',
          body: 'Answers come from your own documents, and every answer links to the passage it came from. A wrong answer traces back to a wrong document, which someone can fix without retraining anything.',
        },
        {
          title: 'Extraction',
          body: 'Fields pulled out of invoices, contracts, filings and emails nobody structured. Each field is checked against a {k}schema{/k}. Anything missing goes to a person instead of getting filled in with a guess.',
        },
        {
          title: 'Routing and drafting',
          body: 'Classify what came in, send it to the right queue and draft the reply. Drafts wait for a person wherever a wrong one would cost real money.',
        },
        {
          title: 'Evaluation',
          body: 'Before launch, a set of real cases with known right answers. After launch, the same set runs on every change. You find out a model update made things worse before your customers do.',
        },
        {
          title: 'Handover',
          body: 'The code, the prompts, the evaluation set and a {k}runbook{/k} go into your {k}repository{/k}. Swap the model out in a year and the scaffolding is what you keep.',
        },
      ],
    },
    {
      /* The full Ask variant: the confidence floor and the Break the input
         chip groups (src/content.ts ask.groups). */
      id: 'ask',
      eyebrow: 'Try to break it',
      headline: ['Retrieval you can', '{em}argue with.{/em}'],
      body: [
        'The same retrieval pattern as the home page, with the controls exposed. Move the {k}confidence floor{/k} and watch the gate change its mind. Then try a question this site can’t answer.',
      ],
      instrument: 'ask-full',
    },
    {
      id: 'replay',
      eyebrow: 'A system we run',
      headline: ['A pipeline that stops', 'and {em}asks a person.{/em}'],
      body: [
        'This is the underwriting engine we run for ADJL Capital, replayed stage by stage. A model writes the narrative at the end and nothing else. It’s handed figures that are already computed, and its prose is never parsed back into a number. Pick a bad input and watch where the run stops.',
      ],
      instrument: 'replay-compact',
    },
    {
      id: 'gates',
      eyebrow: 'Review gates',
      headline: ['Where a person', '{em}stays in the loop.{/em}'],
      body: [
        'We put a {k}review gate{/k} wherever a wrong answer costs real money. We keep them few, because a person who approves everything soon stops reading. Choosing where they go is part of the scope we write.',
      ],
    },
    {
      id: 'proof',
      eyebrow: 'Proof',
      headline: ['Where this', '{em}already runs.{/em}'],
      body: [
        'The patterns on this page run in systems we operate. Each page below shows one of them stage by stage.',
      ],
      links: [
        { label: 'How an AI rollout runs', href: '/work/ai-implementation/' },
        { label: 'A model that writes prose, never figures', href: '/work/real-estate-intelligence/' },
        {
          label: 'An options model checked against real quotes',
          href: '/work/trading-infrastructure/#research',
        },
      ],
    },
  ],
  faq: {
    eyebrow: 'Fair questions',
    headline: ['Questions about', '{em}AI builds.{/em}'],
    items: [
      {
        q: 'Which models do you use?',
        a: 'Whichever fits the job and your data rules. We work with Claude, OpenAI models and open-weight models run locally. The evaluation set makes the choice, and it lets you switch later without guessing.',
      },
      {
        q: 'Can it run without sending our data to a model provider?',
        a: 'Often, yes. Retrieval and extraction can run on a local open-weight model inside your environment. Where a hosted model is the better tool, you’re told what leaves, where it goes and how long it’s kept, before anything is built.',
      },
      {
        q: 'How do you know it works?',
        a: 'An evaluation set of real cases, written before the build and scored on every change. Plus a trace of every run, so a bad answer can be followed back to the step that produced it.',
      },
    ],
  },
};

export const meta = content.meta;
export const faq = content.faq;
