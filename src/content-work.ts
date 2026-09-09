/**
 * ADJL Technologies — /work/ — the index over the three case pages.
 *
 * Drafted against the house voice brief, then audited on two axes — fabricated claims, and hype or voice drift — and revised against both.
 *
 * Same conventions as src/content.ts: headlines are arrays of lines,
 * {em}…{/em} marks one emphasised phrase per headline, and {k}…{/k} marks a
 * technical term in body copy. Edit words here, never in a renderer.
 */

import type { WorkHubContent } from './sections/workhub';

export const content: WorkHubContent = {
  cta: {
    eyebrow: "Contact",
    headline: [
      "Describe the {em}system,{/em}",
      "not the ambition."
    ],
    body: "The useful first message is a paragraph on what currently happens, who does it, and what it costs when it goes wrong. Daniel reads and answers these himself. If it is not work for this firm, you will be told so in the first reply rather than in the third meeting.",
    button: {
      label: "Start with the problem",
      href: "mailto:daniel@adjlcapital.com"
    },
    email: "daniel@adjlcapital.com"
  },
  hero: {
    eyebrow: "Work",
    headline: [
      "Three practices.",
      "And what each does {em}badly.{/em}"
    ],
    body: "Work here means a system built to run in production rather than a document about one — code with an owner, a data path, and a failure mode. Two of the three practices below began as internal problems at ADJL Capital, and they run on the firm's own capital. The third exists because of one question worth answering inside a business that already works: where does AI actually pay, and where is it decoration. Each is described below by its mechanism, step by step, and by the conditions where it is the wrong answer.",
    back: {
      label: "Home",
      href: "/"
    }
  },
  items: [
    {
      num: "01",
      kicker: "Property",
      title: [
        "Real estate",
        "{em}underwriting.{/em}"
      ],
      sub: "Built in-house, because the off-the-shelf underwriters model someone else's assumptions.",
      body: "Paste a listing URL and the scanner assembles the inputs an analyst would otherwise gather by hand: live market data, {k}rent history{/k} and {k}public records{/k} going back years, then taxes, insurance, hazard exposure and financing modelled rather than assumed. It was built for ADJL Capital and it underwrites against the firm's own capital, which is a narrower test than a long client list and a more honest one. Its confidence varies by property type, and it says which type it thinks it is looking at rather than returning one number for everything.",
      points: [
        "Live market data, rent history and public records pulled per address",
        "Taxes, insurance, hazard and financing modelled rather than assumed",
        "Every assumption visible and editable, so the output can be checked instead of trusted"
      ],
      linkLabel: "Read how it underwrites",
      href: "/work/real-estate-intelligence/"
    },
    {
      num: "02",
      kicker: "Markets",
      title: [
        "Trading infrastructure",
        "that {em}holds.{/em}"
      ],
      sub: "Data in, orders out, and everything that can go wrong between them.",
      body: "The work is plumbing: {k}market data{/k} feeds normalised and timestamped, execution and {k}order routing{/k} paths that fail in a way you can see, network and latency work that is measured rather than asserted, backtests that run the production code path instead of a parallel copy of it. A rules-based system is only worth having if it behaves the same on Tuesday as it did on Monday, and most of the effort goes there rather than into the strategy. No latency figure is quoted before your network is measured — that number belongs to your racks and your venue, not to a brochure.",
      points: [
        "Market data capture, normalisation and replay",
        "Execution and order pipelines that surface failures instead of swallowing them",
        "Backtests that run the production code path, so test and trade cannot diverge in the code itself"
      ],
      linkLabel: "Read how the plumbing works",
      href: "/work/trading-infrastructure/"
    },
    {
      num: "03",
      kicker: "Operating businesses",
      title: [
        "AI where it",
        "actually {em}pays.{/em}"
      ],
      sub: "Folding AI into a business that already runs, without breaking the part that runs.",
      body: "The first job is subtraction. A lot of what gets scoped as an AI project turns out to be a query, a form, or a process that needs an afternoon of someone's attention — and saying so early is cheaper than building it. What survives gets built and shipped into the working business: connected to real data, owned by a named person inside the company, and measured against what the process cost before. Sometimes the finding is that the current process is fine and a model adds risk without adding margin; that finding gets delivered as soon as it is reached rather than held until the scope is used up, and it ends the work.",
      points: [
        "The current process is timed and costed before any model is proposed",
        "Built and shipped into the running business, not piloted beside it",
        "Handed to an internal owner who can read and change the code"
      ],
      linkLabel: "Read what gets cut first",
      href: "/work/ai-implementation/"
    }
  ],
  meta: {
    title: "Work — ADJL Technologies",
    description: "Three practices: real estate underwriting, trading infrastructure, and AI implementation. Each one described by its mechanism, and by what it does badly.",
    ogTitle: "Work — ADJL Technologies",
    ogDescription: "Three practices, each described by mechanism: the property underwriting scanner, trading infrastructure, and AI implementation inside businesses that already run."
  },
  refuse: {
    eyebrow: "What this firm refuses",
    headline: [
      "The list of work",
      "this firm {em}turns down.{/em}"
    ],
    body: "A firm this small has to be exact about what it will not take, because the wrong engagement consumes the capacity for the right one. Publishing the list is cheaper than both sides discovering it in month three.",
    items: [
      "Strategy decks. There is no assessment, roadmap or maturity model for sale here — if an engagement cannot end with something running inside your business, it is not work this firm takes.",
      "AI where a query would do. When the honest answer is a SQL statement, a spreadsheet rule or a rewritten process, that is the answer you get, including when a model is what the budget was written for.",
      "Bodies by the month. There is no seat to fill and no retainer that bills for being available; work is scoped to a system with a defined edge, and when the system runs, the engagement stops.",
      "Systems nobody will own. If no one inside your company will have their name on the code after handover, the work is declined — an unowned system stops being maintained, and shortly after that it stops being true."
    ]
  }
};

export const meta = content.meta;
