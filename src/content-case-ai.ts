/**
 * ADJL Technologies — /work/ai-implementation/ — the consulting-and-build practice.
 *
 * The limits section is the most valuable part of this page and is not decoration: models are confidently wrong, evaluation is harder than the build, and some problems are a spreadsheet and a clear owner rather than a model.
 *
 * Same conventions as src/content.ts: headlines are arrays of lines,
 * {em}…{/em} marks one emphasised phrase per headline, and {k}…{/k} marks a
 * technical term in body copy. Edit words here, never in a renderer.
 */

import type { CaseContent } from './sections/case';

export const content: CaseContent = {
  meta: {
    title: "AI Implementation — ADJL Technologies",
    description: "The consulting and build practice for businesses that already work. We start at the workflow, build the narrow thing that does one step, and instrument it.",
    ogTitle: "AI Implementation — ADJL Technologies",
    ogDescription: "Find the steps where a person is reading, sorting and routing. Build the narrow thing that does one of them. Put a human where being wrong is expensive, instrument it, hand it over running."
  },
  hero: {
    eyebrow: "AI Implementation",
    headline: [
      "We start at the workflow,",
      "not the {em}model.{/em}"
    ],
    body: "This is the practice for a business that already works. The revenue exists, the process exists, and somewhere inside it competent people are spending their best hours reading documents and moving them along. We find those steps, build the narrow thing that does one of them, and put it into production with a way to tell whether it is helping.",
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
        value: "Direct with Daniel Laskowski, with specialist help sourced if a build needs it"
      }
    ]
  },
  problem: {
    eyebrow: "The problem",
    headline: [
      "The pilot worked.",
      "Nothing {em}shipped.{/em}"
    ],
    body: "A business that already runs has no shortage of places AI could go — it has a shortage of places where the change is worth the disruption. The usual sequence runs backwards: a tool is chosen, a pilot is run, and then someone goes looking for a workflow that fits it. What survives is a demo, impressive in a meeting and unowned by Monday. The real cost sits in plain sight, in the hours a capable person spends reading a long document to pull a few fields out of it.",
    points: [
      "A pilot that worked in the demo and was never wired into the system that holds the data.",
      "Staff quietly redoing the same extraction by hand, because the tool is right often enough to use and wrong often enough not to trust.",
      "Nobody can say whether the thing is working, because nothing was measured before it was installed.",
      "A process that exists only in one person's head, which makes it impossible to automate and risky to leave alone."
    ]
  },
  build: {
    eyebrow: "The mechanism",
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
        body: "We walk one workflow end to end, in the order it really runs rather than the order the org chart implies. Who touches the file, what they open, what they retype, where it sits waiting. The output is a map of steps with a cost written against each one — time spent, and what it costs when that step is done wrong."
      },
      {
        num: "02",
        tag: "shortlist",
        title: "Find the reading, sorting and routing",
        body: "The candidates tend to be the same shape: a person is reading, extracting, classifying, routing or summarising. We rank them by how repetitive the step is and how tolerant it is of an error. High volume and cheap to correct goes first; rare and expensive to get wrong stays with a person and gets better tooling instead."
      },
      {
        num: "03",
        tag: "build",
        title: "Build the narrow thing",
        body: "One step, one system, one output you can measure. That usually means {k}retrieval{/k} over company documents with citations back to the source, extraction from {k}unstructured records{/k} into fields, classification and routing into the queues you already use, or drafting that stops at a review gate. It runs against your data inside your environment, and it is code you can read."
      },
      {
        num: "04",
        tag: "gate",
        title: "Put the person where being wrong is expensive",
        body: "Where an error is costly, the system's job changes: it prepares the decision instead of making it. The draft arrives with its sources attached, the extraction arrives with the field and the page it came from, and the reviewer approves or corrects in a single action. Those corrections are captured, because a correction is the cheapest label anyone will ever hand you."
      },
      {
        num: "05",
        tag: "instrument",
        title: "Instrument it, then hand it over running",
        body: "Every run is logged with its inputs, its output and what the reviewer did to it. That produces an {k}evaluation set{/k} built from real traffic rather than invented examples, and an answer to the only question that keeps mattering — is this still right this month. Handover is the running system, the code, the prompts and the evaluation set, with an owner named on your side before we finish."
      }
    ]
  },
  detail: {
    eyebrow: "Decisions",
    headline: [
      "Three choices made",
      "before {em}anything is built.{/em}"
    ],
    cards: [
      {
        title: "The evaluation set comes first",
        body: "Before anything is built we assemble real cases with the right answer written down beside them, produced by the person who currently does the work. It is slow, and it is the easiest part to want to skip. Without it, \"it seems better\" is the only verdict available, and that verdict is worthless three months later when the model underneath has changed. The set outlasts the build — it is how you check the system after handover."
      },
      {
        title: "Retrieval before training",
        body: "The default is grounded {k}retrieval{/k} against your own documents with citations, not a model trained on your data. Training is expensive to repeat, hard to correct one fact at a time, and it hides where an answer came from. With retrieval, a wrong answer traces back to a wrong document, which is a file someone can correct without retraining anything. We move off that default when the same task runs thousands of times a week and the definition of a right answer has stopped changing."
      },
      {
        title: "Buy it where buying works",
        body: "Not everything should be built, and saying so early is part of the job. Where a product already does the step properly, we configure it and move on. The case for building appears when the workflow carries assumptions specific to you — your definitions, your exceptions, your record formats — because a tool that does not model those quietly imports someone else's. A purchase is faster and someone else maintains it. Build when those assumptions are the reason the step is hard in the first place."
      }
    ]
  },
  limits: {
    eyebrow: "Limits",
    headline: [
      "What this practice",
      "does {em}badly.{/em}"
    ],
    body: "These are the failure modes of this kind of work, stated plainly. They decide whether a project is worth starting at all, so they are here rather than in a footnote.",
    items: [
      "Models are confidently wrong. A bad answer arrives in the same tone as a good one, which is why anything expensive to get wrong keeps a review gate, and why the checking gets built before the feature.",
      "A process nobody can describe cannot be automated. If three people do the same job three ways and none of them can say why, the first stretch of work is writing the rules down, and that document may be worth more than anything built on top of it.",
      "Evaluation is harder than the build. A first version that works is the easy part; knowing whether it is right often enough to trust takes labelled cases, an argument about what \"right\" means, and a willingness to be told the answer is no.",
      "Some problems are a spreadsheet and a clear owner. A great deal of what looks like an AI problem is a missing field, an unenforced deadline, or nobody responsible for the queue. We will say so, and that is a short invoice."
    ]
  },
  cta: {
    eyebrow: "Contact",
    headline: [
      "Name the step",
      "that is {em}eating hours.{/em}"
    ],
    body: "That step is enough to start with — no plan required, no budget line. The first conversation is with Daniel Laskowski, who writes the code. Contractors come in on the build; the person you brief does not change. Send the workflow and what it costs you now.",
    button: {
      label: "Start a conversation",
      href: "mailto:daniel@adjlcapital.com"
    },
    email: "daniel@adjlcapital.com"
  }
};

export const meta = content.meta;
