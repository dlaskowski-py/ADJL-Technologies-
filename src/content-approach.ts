/**
 * ADJL Technology — /approach/ — principles, engagement shapes, and who owns what.
 *
 * The five principles are positions rather than platitudes — each is something a competitor could genuinely disagree with. The ownership section is deliberately plain: you own the code and the data, and saying so clearly is itself the differentiator.
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
    intro: "Which one applies depends on how well defined the problem already is. An assessment is the usual entry point, and it is a legitimate place to stop.",
    items: [
      {
        tag: "Assessment",
        title: "Where AI pays",
        body: "A short, bounded engagement that goes through a business the way an underwriter goes through a file: what runs today, what it costs in hours, where the data lives, and who is allowed to touch it. It ends with a ranked list of candidates, each carrying a build estimate and an honest note on what would make it fail. Some of those notes say do not build this. That is a legitimate result of the exercise, and it is the reason the exercise comes before the build.",
        points: [
          "Walkthroughs at the desk with the people who do the work day to day",
          "A map of where the data sits, what state it is in, and what access it would need",
          "Candidates ranked by hours returned against difficulty to build",
          "A written argument against each candidate, including the ones recommended"
        ],
        best: "Best when you suspect AI helps somewhere and cannot yet say where."
      },
      {
        tag: "Build",
        title: "Built, and put into production",
        body: "A defined system scoped, written and deployed into your environment. The kinds of thing this covers: {k}document extraction{/k}, an internal tool, a data pipeline, a scoring or underwriting model, operational plumbing behind a desk. Scope is fixed in writing before anything is built and changes are quoted, because open-ended builds are how a consulting engagement quietly becomes permanent staff. Handover includes the code, the {k}evaluation set{/k} and the runbook for what to do when it breaks.",
        points: [
          "Fixed scope, written down before the first line is committed",
          "Deployed into your infrastructure and your accounts, not hosted here",
          "Tests and an evaluation set covering the failure modes identified in scoping, so that measured drift surfaces instead of going quiet",
          "A runbook, a handover session, and code your own engineers can read"
        ],
        best: "Best when the problem is already defined and the answer is software."
      },
      {
        tag: "Standing arrangement",
        title: "Kept running, and extended",
        body: "A continuing arrangement for a system built here once it is in production: monitoring, vendor migrations, {k}latency work{/k}, and extensions as the business moves. Models get deprecated and repriced, data sources change shape without warning, and a system left alone for a year has drifted without telling anyone. This is a commitment to response time rather than to seats, and only a few of these run at once so that the response time stays a real number. When your own team is ready to hold the system, the arrangement should end rather than renew.",
        points: [
          "Monitoring and periodic re-runs against the original evaluation set",
          "Migration work when a vendor deprecates, reprices, or changes behavior",
          "New modules on the existing system, quoted and scoped like a build, not absorbed into the retainer",
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
    body: "ADJL Technology is Daniel Laskowski and a small senior development team. Engagements are taken deliberately rather than continuously, so timing alone can be a reason one does not go ahead — and you will be told that rather than queued. What the shape buys is that the person who scopes the work is in the room for the whole of it. There is no handover between the sale and the build: the people who write the code were in the room when it was scoped, so nothing has to survive one.",
    back: {
      label: "Home",
      href: "/"
    }
  },
  meta: {
    title: "Approach — ADJL Technology",
    description: "How ADJL Technology works: what it takes on, what it turns down, and who owns the code and the data at the end. Stated plainly, with the limits included.",
    ogTitle: "Approach — ADJL Technology",
    ogDescription: "Five operating positions, three shapes of engagement, and a plain answer on ownership: the client owns the code, the data and the right to leave."
  },
  ownership: {
    eyebrow: "Ownership",
    headline: [
      "You own the code,",
      "the data, and the {em}right to leave.{/em}"
    ],
    body: "Everything built for a client belongs to that client: source, prompts, {k}evaluation sets{/k}, fine-tuned weights, infrastructure definitions, documentation. It is delivered into repositories you control and it runs on your accounts under your keys, so there is no hosted layer here you have to keep paying to keep the thing alive. Your data is used to build your system and nothing else — not retained here, not reused for anyone else, not fed into a shared model. If you decide next quarter to hand the whole thing to another firm, everything they need is already in your hands.",
    points: [
      "Source, prompts, evaluation sets and infrastructure code assigned to you in full",
      "Your data stays in your accounts, is not retained here, and is never reused for another client",
      "No proprietary runtime, no license to renew, no dependency that ends the system if the relationship ends",
      "The one carve-out, stated plainly: any generic tooling not written for your project stays with ADJL, and you get it under a perpetual license you never have to renew"
    ]
  },
  principles: {
    eyebrow: "Operating principles",
    headline: [
      "Five positions, and",
      "what each one {em}closes off.{/em}"
    ],
    intro: "None of these are values. Each one closes off something another firm would happily sell you, and the cost is written next to the position.",
    items: [
      {
        num: "01",
        title: "AI goes where the work already is",
        body: "A business that already works is full of processes that already work, and a model that sits inside one of them can pay for itself without anything else changing. So the first build is narrow: one {k}intake step{/k}, one document pile, one report someone assembles by hand every Monday. Nothing looks impressive in month one, and that is the price of it. Rebuilding the surrounding system is a separate decision and it gets made separately, on its own evidence."
      },
      {
        num: "02",
        title: "The model is the small part",
        body: "Most of an AI project is plumbing: reaching the data, cleaning what comes back, deciding what a correct answer looks like, and building the {k}evaluation set{/k} that tells you when the thing has quietly gotten worse. The model itself is often a few lines and a choice between three vendors, and that choice is reversible. A firm that spends its pitch on model selection is describing the cheapest part of the job. That is the difference between a demo and a system: a demo is judged on one good answer, a system on the hundredth."
      },
      {
        num: "03",
        title: "If it cannot be checked, it does not ship",
        body: "Every output should be traceable back to what produced it — the record, the row, the page of the filing, the version of the prompt. This rules out a whole class of work that shows beautifully and cannot be defended in a meeting. It also slows the first build, because citation and logging get written at the same time as the feature. A system that cannot be audited gets switched off the first time it is wrong in public, and it will eventually be wrong in public."
      },
      {
        num: "04",
        title: "Deterministic first, model second",
        body: "If a rule can be written down, it should be written down — code that behaves the same on Tuesday as it did on Monday is cheaper to run and easier to argue with. A language model earns its place where the input is genuinely unstructured or the judgment is genuinely fuzzy, and nowhere else. The cost is that some systems come back less exciting than the version a client imagined, with a {k}deterministic core{/k} doing most of the work."
      },
      {
        num: "05",
        title: "The deliverable is running software",
        body: "No engagement here ends in a slide deck and a recommendation. Work ends with something in your environment that runs, with the {k}deployment path{/k} and the known failure modes written down beside it. The limit of that is scope: a question like which of nine departments should go first is a real question, and it gets answered inside a build. If a strategy document is what you need, a strategy firm will do it better."
      }
    ]
  }
};

export const meta = content.meta;
