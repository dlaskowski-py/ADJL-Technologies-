/**
 * ADJL Technology — /approach/ — principles, engagement shapes, and who owns what.
 *
 * The five principles are positions, not platitudes. Each one is something a competitor could genuinely disagree with. The ownership section is deliberately plain. You own the code and the data, and saying so clearly is itself the differentiator.
 *
 * Same conventions as src/content.ts: headlines are arrays of lines,
 * {em}…{/em} marks one emphasised phrase per headline, and {k}…{/k} marks a
 * technical term in body copy. Edit words here, never in a renderer.
 */

import type { ApproachContent } from './sections/approach';

export const content: ApproachContent = {
  cta: {
    eyebrow: "Contact",
    headline: [
      "Send the problem",
      "before the {em}proposal.{/em}"
    ],
    body: "A useful first message describes the process you want changed, who touches it, and what happens today when it goes wrong. If it is not a fit — wrong scale, wrong timing, or better solved with ordinary software and no model at all — you will be told that in the reply rather than after an invoice.",
    button: {
      label: "Email Daniel",
      href: "mailto:daniel@adjlcapital.com"
    },
    email: "daniel@adjlcapital.com"
  },
  engage: {
    eyebrow: "Engagements",
    headline: [
      "Three shapes of work,",
      "each with a {em}defined end.{/em}"
    ],
    intro: "Which one applies depends on how well defined the problem already is. An assessment is the usual entry point. It’s also a legitimate place to stop.",
    items: [
      {
        tag: "Assessment",
        title: "Where AI pays",
        body: "A short, bounded engagement that goes through a business the way an underwriter goes through a file: what runs today, what it costs in hours, where the data lives, and who is allowed to touch it. It ends with a ranked list of candidates. Each one carries a build estimate and an honest note on what would make it fail. Some of those notes say don’t build this. That’s a legitimate result. It’s also why the exercise comes before the build.",
        points: [
          "Walkthroughs at the desk with the people who do the work day to day",
          "A map of where the data sits, what state it’s in, and what access it would need",
          "Candidates ranked by hours returned against difficulty to build",
          "A written argument against each candidate, including the ones recommended"
        ],
        best: "Best when you suspect AI helps somewhere and can’t yet say where."
      },
      {
        tag: "Build",
        title: "Built, and put into production",
        body: "A defined system scoped, written and deployed into your environment. The kinds of thing this covers: {k}document extraction{/k}, an internal tool, a data pipeline, a scoring or underwriting model, operational plumbing behind a desk. Scope is fixed in writing before anything is built, and changes are quoted. Open-ended builds are how a consulting engagement quietly becomes permanent staff. Handover includes the code, the {k}evaluation set{/k} and the runbook for what to do when it breaks.",
        points: [
          "Fixed scope, written down before the first line is committed",
          "Deployed into your infrastructure and your accounts. Nothing is hosted here",
          "Tests and an evaluation set covering the failure modes found in scoping, so drift gets measured and surfaces instead of going quiet",
          "A runbook, a handover session, and code your own engineers can read"
        ],
        best: "Best when the problem is already defined and the answer is software."
      },
      {
        tag: "Standing arrangement",
        title: "Kept running, and extended",
        body: "A continuing arrangement for a system built here once it’s in production: monitoring, vendor migrations, {k}latency work{/k}, and extensions as the business moves. Models get deprecated and repriced. Data sources change shape without warning. A system left alone for a year has drifted without telling anyone. The commitment here is to a response time, not to seats. Only a few of these run at once, which is what keeps that response time a real number. When your own team is ready to hold the system, the arrangement should end instead of renew.",
        points: [
          "Monitoring and periodic re-runs against the original evaluation set",
          "Migration work when a vendor deprecates, reprices, or changes behavior",
          "New modules on the existing system get quoted and scoped like a build. They don’t get absorbed into the retainer",
          "A stated intention to hand over to your team and stop"
        ],
        best: "Best when something built here has become load-bearing."
      }
    ]
  },
  hero: {
    eyebrow: "Approach",
    headline: [
      "How the work runs,",
      "and where it {em}stops.{/em}"
    ],
    body: "ADJL Technology is Daniel Laskowski and a small senior development team. We take engagements deliberately, not continuously, so the team on yours isn’t also carrying four others. That shape buys you one thing. The person who scopes the work is in the room for the whole of it. There’s no handover between the sale and the build, because the people who write the code were there when it was scoped. Nothing has to survive one.",
    back: {
      label: "Home",
      href: "/"
    }
  },
  meta: {
    title: "How We Build AI Systems — ADJL Technology",
    description: "How ADJL Technology works: the operating principles, the shapes an engagement takes, and who owns the code and the data at the end. Stated plainly.",
    ogTitle: "Approach — ADJL Technology",
    ogDescription: "Five operating positions, three shapes of engagement, and a plain answer on ownership. The client owns the code, the data and the right to leave."
  },
  ownership: {
    eyebrow: "Ownership",
    headline: [
      "You own the code,",
      "the data, and the {em}right to leave.{/em}"
    ],
    body: "Everything built for a client belongs to that client: source, prompts, {k}evaluation sets{/k}, fine-tuned weights, infrastructure definitions, documentation. It’s delivered into repositories you control and it runs on your accounts under your keys. There’s no hosted layer here you have to keep paying to keep the thing alive. Your data is used to build your system and nothing else. It isn’t retained here, it isn’t reused for anyone else, and it never goes into a shared model. If you decide next quarter to hand the whole thing to another firm, everything they need is already in your hands.",
    points: [
      "Source, prompts, evaluation sets and infrastructure code assigned to you in full",
      "Your data stays in your accounts. It isn’t retained here and it’s never reused for another client",
      "No proprietary runtime, no license to renew, no dependency that ends the system if the relationship ends",
      "The one carve-out, stated plainly: any generic tooling not written for your project stays with ADJL. You get it under a perpetual license you never have to renew"
    ]
  },
  principles: {
    eyebrow: "Operating principles",
    headline: [
      "Five positions we",
      "actually {em}build to.{/em}"
    ],
    intro: "None of these are values. Each one is a position you could disagree with, and each one shows up in the code, not just in a conversation.",
    items: [
      {
        num: "01",
        title: "AI goes where the work already is",
        body: "A business that already works is full of processes that already work. A model that sits inside one of them can pay for itself without anything else changing. So the first build is narrow: one {k}intake step{/k}, one document pile, one report someone assembles by hand every Monday. Nothing looks impressive in month one. That’s the price of it. Rebuilding the surrounding system is a separate decision, and it gets made separately, on its own evidence."
      },
      {
        num: "02",
        title: "The model is the small part",
        body: "Most of an AI project is plumbing: reaching the data, cleaning what comes back, deciding what a correct answer looks like, and building the {k}evaluation set{/k} that tells you when the thing has quietly gotten worse. The model itself is often a few lines and a choice between three vendors, and that choice is reversible. A firm that spends its pitch on model selection is describing the cheapest part of the job. A demo gets judged on one good answer. A system gets judged on the hundredth."
      },
      {
        num: "03",
        title: "If it can’t be checked, it doesn’t ship",
        body: "Every output should be traceable back to what produced it: the record, the row, the page of the filing, the version of the prompt. That rules out a whole class of work that shows beautifully and can’t be defended in a meeting. It also slows the first build, because citation and logging get written at the same time as the feature. A system that can’t be audited gets switched off the first time it’s wrong in public. It will eventually be wrong in public."
      },
      {
        num: "04",
        title: "Deterministic first, model second",
        body: "If a rule can be written down, it should be written down. Code that behaves the same on Tuesday as it did on Monday is cheaper to run and easier to argue with. A language model earns its place where the input is genuinely unstructured or the judgment is genuinely fuzzy, and nowhere else. The cost is that some systems come back less exciting than the version a client imagined, with a {k}deterministic core{/k} doing most of the work."
      },
      {
        num: "05",
        title: "The deliverable is running software",
        body: "No engagement here ends in a slide deck and a recommendation. Work ends with something in your environment that runs, with the {k}deployment path{/k} and the known failure modes written down beside it. Scope is the limit on that. A question like which of nine departments should go first is a real question, and it gets answered inside a build. If a strategy document is what you need, a strategy firm will do it better."
      }
    ]
  }
};

export const meta = content.meta;
