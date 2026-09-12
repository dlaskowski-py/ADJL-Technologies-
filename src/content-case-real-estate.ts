/**
 * ADJL Technology — /work/real-estate-intelligence/ — the property underwriting scanner.
 *
 * The system described here is real: it was built for ADJL Capital and runs on the firm’s own capital before anyone else’s. Nothing here may claim a client, an outcome or a performance figure that has not happened.
 *
 * Same conventions as src/content.ts: headlines are arrays of lines,
 * {em}…{/em} marks one emphasised phrase per headline, and {k}…{/k} marks a
 * technical term in body copy. Edit words here, never in a renderer.
 */

import type { CaseContent } from './sections/case';

export const content: CaseContent = {
  build: {
    eyebrow: "How it works",
    headline: [
      "Five stages between a URL",
      "and a {em}decision.{/em}"
    ],
    intro: "Each stage takes a defined input and does one job. Then it hands the next stage something a person could check line by line.",
    steps: [
      {
        num: "01",
        tag: "resolve",
        title: "Resolve the address",
        body: "The listing URL is scraped for the address. Then the address is matched against {k}parcel records{/k} to resolve it to a specific parcel. Where the records won’t support a match, the system says so instead of guessing. Listing text is treated as a claim, not a fact. Square footage, bed and bath counts and lot size are checked against the county’s own record of the parcel. Where the two disagree, both are kept."
      },
      {
        num: "02",
        tag: "market",
        title: "Pull the live market",
        body: "Current asking rents, closed comparables and {k}vacancy{/k} are pulled for the submarket the parcel actually sits in, not the city it shares a name with. Comparables are filtered on unit type, size band and distance before anything is averaged. The spread is carried forward alongside the midpoint, because a midpoint with no dispersion attached hides how little the comparables agree."
      },
      {
        num: "03",
        tag: "records",
        title: "Read years of public record",
        body: "The system reads back through the parcel’s history: prior sales, assessed values, {k}permit filings{/k}, and the local assessor’s own reassessment behavior. Records that far back are what expose an assessor who reassesses aggressively on transfer, and one who doesn’t. A parcel assessed at a fraction of its market value for a decade carries that gap into the buyer’s first tax bill. The history is where the size of the gap becomes visible."
      },
      {
        num: "04",
        tag: "model",
        title: "Model the carry",
        body: "Property tax is modeled forward including {k}reassessment on sale{/k}. That’s where most spreadsheets go wrong. Insurance is priced against the hazard exposure of the specific parcel, not the state average. Operating costs, capital reserves and financing terms go in as explicit assumptions. Each one is visible and each one is editable."
      },
      {
        num: "05",
        tag: "output",
        title: "Return a sourced file",
        body: "The output has the sections an underwriting file normally has: rent roll, {k}operating statement{/k}, tax and insurance build-up, debt service and the yield that falls out of them. Each figure carries the source it came from. Anything the system couldn’t verify gets labeled unaudited instead of rounded into the total. The whole file is the deliverable. It comes back in a form you can edit and re-run against your own assumptions."
      }
    ]
  },
  cta: {
    eyebrow: "Contact",
    headline: [
      "Send a listing",
      "and a set of {em}assumptions.{/em}"
    ],
    body: "If you underwrite property, run this against a deal you already know the answer to. Nothing else tells you as much. Send the URL and the assumptions you’d normally apply. Then compare the output against the file you built by hand.",
    button: {
      label: "Email Daniel",
      href: "mailto:daniel@adjlcapital.com"
    },
    email: "daniel@adjlcapital.com"
  },
  detail: {
    eyebrow: "Detail",
    headline: [
      "Three decisions",
      "behind the {em}output file.{/em}"
    ],
    cards: [
      {
        title: "Tax is modeled, not copied",
        body: "Most underwriting carries the seller’s current property tax line forward into the buyer’s first year. In a reassessment-on-sale jurisdiction, that one copied cell can misprice the deal outright. The system models the assessment the sale itself triggers. It uses the county’s own rules and its record of what it’s done to comparable parcels after transfer. Where the local behavior is inconsistent, it returns a range instead of pretending to a single figure."
      },
      {
        title: "Every number carries its source",
        body: "A figure with no provenance can’t be argued with, only believed. Each line in the output points back to where it came from: a county record, a live listing, a closed comparable, or an assumption you supplied. Anything derived from thin or stale data is labeled unaudited. It stays labeled all the way to the summary."
      },
      {
        title: "Built for ADJL Capital first",
        body: "This wasn’t built as a product and then sold as one. It was built for ADJL Capital, to do the underwriting that would otherwise be done a field at a time. It has been run on the firm’s own capital before anyone else’s. Development runs against live listings and live county records instead of synthetic test data, because the edge cases only live there. Off-the-shelf underwriting tools model the way their authors model. A tool that doesn’t match how you underwrite quietly imports someone else’s assumptions."
      }
    ]
  },
  hero: {
    eyebrow: "Property underwriting scanner",
    headline: [
      "Paste a listing.",
      "Get the {em}underwriting.{/em}"
    ],
    body: "A property underwriting scanner that takes a listing URL and returns a structured underwriting file: rent roll, operating statement, tax and insurance build-up, debt service and the resulting yield. It resolves the address to a parcel, pulls live market data, reads years of public record, and models the tax, insurance, hazard, operating cost and financing that decide whether the deal works. Every figure carries its source: a county record, a live listing, a comparable, or an assumption you supplied. Anything it couldn’t verify is labeled unaudited instead of averaged into the total.",
    back: {
      label: "All work",
      href: "/work/"
    },
    specs: [
      {
        label: "Input",
        value: "One listing URL"
      },
      {
        label: "Reads",
        value: "Live market data, county records, parcel history"
      },
      {
        label: "Models",
        value: "Tax on reassessment, insurance, hazard, operating cost, financing"
      },
      {
        label: "Output",
        value: "A sourced underwriting file, unaudited figures marked"
      }
    ]
  },
  meta: {
    title: "Real Estate Underwriting Software — ADJL Technology",
    description: "A property underwriting scanner. Paste a listing URL and it resolves the parcel, pulls live market data, reads public records and models the full carry.",
    ogTitle: "Property underwriting scanner — ADJL Technology",
    ogDescription: "Paste a listing URL. The scanner resolves the parcel, pulls live rents and comparables, reads years of public record, and models tax, insurance, hazard and financing into a sourced underwriting file."
  },
  problem: {
    eyebrow: "The problem",
    headline: [
      "Underwriting is slow, and",
      "the slowness is {em}the cost.{/em}"
    ],
    body: "Underwriting one property properly is slow manual work: match the address to a parcel, pull the rents and sanity-check them against comparables, read the county records for prior sales and assessment history, model the tax forward through reassessment, price the insurance against actual hazard exposure instead of a rule of thumb. Most of that is retrieval and arithmetic. It’s also expensive in hours, so plenty of deals never get it. They get a screening pass built on the listing’s own numbers and a cap rate someone remembered. That shortcut carries the seller’s tax bill into the buyer’s model. It’s the single most expensive cell in the spreadsheet.",
    points: [
      "A full underwriting is expensive in hours, so it tends to go to deals that are already half-decided. The ones that should have been surfaced don’t get it.",
      "Listing figures get taken at face value: square footage, rent, expenses, and a tax line that’s the current owner’s and not yours.",
      "Public records hold the answer to the tax question. They’re also tedious enough to read that they routinely go unread.",
      "Screening and underwriting use different numbers. The deal that looked good in the screen isn’t the same deal once it’s underwritten."
    ]
  }
};

export const meta = content.meta;
