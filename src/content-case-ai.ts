/**
 * ADJL Technology — /work/ai-implementation/ — the consulting-and-build practice.
 *
 * The rule this page has to hold is scope: describe the workflow being changed and the mechanism that changes it, never a client, an outcome, or a figure that has not happened.
 *
 * Same conventions as src/content.ts: headlines are arrays of lines,
 * {em}…{/em} marks one emphasised phrase per headline, and {k}…{/k} marks a
 * technical term in body copy. Edit words here, never in a renderer.
 */

import type { CaseContent } from './sections/case';

export const content: CaseContent = {
  meta: {
    title: "AI Implementation Consulting — ADJL Technology",
    description: "AI implementation for businesses that already run: retrieval over your documents, extraction from unstructured records, classification and routing.",
    ogTitle: "AI Implementation — ADJL Technology",
    ogDescription: "Find the steps where a person is reading, sorting and routing. Build the narrow thing that does one of them. Put a human where being wrong is expensive, instrument it, hand it over running."
  },
  hero: {
    eyebrow: "AI Implementation Consulting",
    headline: [
      "We start at the workflow,",
      "not the {em}model.{/em}"
    ],
    body: "This is the AI implementation practice: folding AI into a business that already works, starting at the workflow instead of the model. The revenue exists. The process exists. Somewhere inside it, competent people spend their best hours reading documents and moving them along. We find those steps. Then we build the narrow thing that does one of them and put it into production with a way to tell whether it’s helping.",
    back: {
      label: "All work",
      href: "/work/"
    },
    specs: [
      {
        label: "Inputs",
        value: "One workflow, the records it runs on, and access to the people who do it today"
      },
      {
        label: "Runs on",
        value: "Your data, in your environment — your cloud or your own machines"
      },
      {
        label: "Output",
        value: "A running system, plus the code, the prompts and the evaluation set"
      },
      {
        label: "Engagement",
        value: "Direct with Daniel Laskowski, who scopes the work, and the senior developers who build it"
      }
    ]
  },
  problem: {
    eyebrow: "Why AI Pilots Never Ship",
    headline: [
      "The pilot worked.",
      "Nothing {em}shipped.{/em}"
    ],
    body: "In a business that already runs, there’s no shortage of places AI could go. What’s short is places where the change is worth the disruption. The usual sequence runs backwards. A tool gets chosen, a pilot gets run, and then someone goes looking for a workflow that fits it. What survives is a demo. It’s impressive in a meeting and unowned by Monday. The real cost sits in plain sight, in the hours a capable person spends reading a long document to pull a few fields out of it.",
    points: [
      "A pilot that worked in the demo and was never wired into the system that holds the data.",
      "Staff quietly redoing the same extraction by hand. The tool is right often enough to use and wrong often enough not to trust.",
      "Nobody can say whether the thing is working, because nothing was measured before it was installed.",
      "A process that exists only in one person’s head, which makes it impossible to automate and risky to leave alone."
    ]
  },
  build: {
    eyebrow: "How An AI Rollout Runs",
    headline: [
      "One step, built narrow,",
      "handed over {em}running.{/em}"
    ],
    intro: "Every stage below exists to keep the build small enough to finish and specific enough to check.",
    steps: [
      {
        num: "01",
        tag: "trace",
        title: "Follow the work as it actually happens",
        body: "We walk one workflow end to end, in the order it really runs instead of the order the org chart implies. Who touches the file, what they open, what they retype, where it sits waiting. The output is a map of steps with a cost written against each one. That cost is time spent, plus what it costs when the step is done wrong."
      },
      {
        num: "02",
        tag: "shortlist",
        title: "Find the reading, sorting and routing",
        body: "The candidates tend to be the same shape. A person is reading, extracting, classifying, routing or summarizing. We rank them by how repetitive the step is and how tolerant it is of an error. High volume and cheap to correct goes first. Rare and expensive to get wrong stays with a person, who gets better tooling instead."
      },
      {
        num: "03",
        tag: "build",
        title: "Build the narrow thing",
        body: "One step, one system, one output you can measure. That usually means {k}retrieval{/k} over company documents with citations back to the source, extraction from {k}unstructured records{/k} into fields, classification and routing into the queues you already use, or drafting that stops at a review gate. It runs against your data inside your environment, and it’s code you can read."
      },
      {
        num: "04",
        tag: "gate",
        title: "Put the person where being wrong is expensive",
        body: "Where an error is costly, the system’s job changes. It prepares the decision instead of making it. The draft arrives with its sources attached. The extraction arrives with the field and the page it came from, and the reviewer approves or corrects in a single action. We capture those corrections. A correction is the cheapest label anyone will ever hand you."
      },
      {
        num: "05",
        tag: "instrument",
        title: "Instrument it, then hand it over running",
        body: "Every run is logged with its inputs, its output and what the reviewer did to it. That produces an {k}evaluation set{/k} built from real traffic instead of invented examples. It also tells you whether the thing is still right this month, which is the only question that keeps mattering. Handover is the running system, the code, the prompts and the evaluation set, with an owner named on your side before we finish."
      }
    ]
  },
  detail: {
    eyebrow: "Evaluation, Retrieval & Build vs Buy",
    headline: [
      "Three choices made",
      "before {em}anything is built.{/em}"
    ],
    cards: [
      {
        title: "The evaluation set comes first",
        body: "Before anything is built we assemble real cases with the right answer written down beside them, produced by the person who currently does the work. It’s slow. It’s also the easiest part to want to skip. Without it, \"it seems better\" is the only verdict available, and that verdict is worthless three months later when the model underneath has changed. The set outlasts the build. It’s how you check the system after handover."
      },
      {
        title: "Retrieval before training",
        body: "The default is grounded {k}retrieval{/k} against your own documents, with citations. We don’t start by training a model on your data. Training is expensive to repeat and hard to correct one fact at a time, and it hides where an answer came from. With retrieval, a wrong answer traces back to a wrong document. That’s a file someone can correct without retraining anything. We move off that default when the same task runs thousands of times a week and the definition of a right answer has stopped changing."
      },
      {
        title: "Buy it where buying works",
        body: "Not everything should be built, and saying so early is part of the job. Where a product already does the step properly, we configure it and move on. The case for building shows up when the workflow carries assumptions specific to you: your definitions, your exceptions, your record formats. A tool that doesn’t model those quietly imports someone else’s. A purchase is faster and someone else maintains it. Build when those assumptions are the reason the step is hard in the first place."
      }
    ]
  },
  cta: {
    eyebrow: "Contact",
    headline: [
      "Name the step",
      "that’s {em}eating hours.{/em}"
    ],
    body: "That step is enough to start with. No plan required, no budget line. The first conversation is with Daniel Laskowski, who scopes the work and stays on it. The team builds it, and the person you brief doesn’t change. Send the workflow and what it costs you now.",
    button: {
      label: "Start a conversation",
      href: "mailto:daniel@adjlcapital.com"
    },
    email: "daniel@adjlcapital.com"
  }
};

export const meta = content.meta;
