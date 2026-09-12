/**
 * ADJL Technology — /work/ — the index over the three case pages.
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
    body: "The useful first message is a paragraph on what currently happens, who does it, and what it costs when it goes wrong. Daniel reads and answers these himself. The first reply comes from him, not from a form.",
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
      "All of them {em}in production.{/em}"
    ],
    body: "Work here means a system built to run in production rather than a document about one — code with an owner, a data path, and someone whose job it is when it breaks. Two of the three practices below began as internal problems at ADJL Capital, and they run on the firm’s own capital. The third exists because of one question worth answering inside a business that already works: where does AI actually pay, and where is it decoration. Each is described below by its mechanism, step by step.",
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
      sub: "Built in-house, because the off-the-shelf underwriters model someone else’s assumptions.",
      body: "Paste a listing URL and the scanner assembles the inputs an analyst would otherwise gather by hand: live market data, {k}rent history{/k} and {k}public records{/k} going back years, then taxes, insurance, hazard exposure and financing, all of it modeled instead of assumed. It was built for ADJL Capital, and it underwrites against the firm’s own capital. A narrower test than a long client list, and a more honest one. Where the records won’t support a match, it says so. It doesn’t guess. Anything it couldn’t verify comes back labeled unaudited, never averaged into the total.",
      points: [
        "Live market data, rent history and public records pulled per address",
        "Taxes, insurance, hazard and financing modeled, not assumed",
        "Every assumption visible and editable, so you can check the output instead of trusting it"
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
      body: "The work is plumbing. We normalize and timestamp {k}market data{/k} feeds. We build execution and {k}order routing{/k} paths that fail in a way you can see. We measure the network and latency work instead of asserting it. Backtests run the production code path instead of a parallel copy of it. A rules-based system is only worth having if it behaves the same on Tuesday as it did on Monday. Most of the effort goes there, not into the strategy. We won’t quote a latency figure before your network is measured. That number belongs to your racks and your venue, not to a brochure.",
      points: [
        "Market data capture, normalization and replay",
        "Execution and order pipelines that surface failures instead of swallowing them",
        "Backtests that run the production code path, so test and trade can’t diverge in the code itself"
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
      body: "The first job is finding the step that actually costs you something. We time and cost the process as it runs today, then pick the point where a person is doing expensive repetitive judgment work, and build for that. What we build ships into the working business. It’s connected to real data, owned by a named person inside the company, and measured against what the process cost before.",
      points: [
        "We time and cost the current process before anyone proposes a model",
        "Built and shipped into the running business, not piloted beside it",
        "Handed to an internal owner who can read and change the code"
      ],
      linkLabel: "Read the practice",
      href: "/work/ai-implementation/"
    }
  ],
  meta: {
    title: "AI, Real Estate & Trading Systems — ADJL Technology",
    description: "Three practices: real estate underwriting, trading infrastructure, and AI implementation. Each one described by its mechanism, step by step.",
    ogTitle: "Work — ADJL Technology",
    ogDescription: "Three practices, each described by mechanism: the property underwriting scanner, trading infrastructure, and AI implementation inside businesses that already run."
  }
};

export const meta = content.meta;
