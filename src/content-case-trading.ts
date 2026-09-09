/**
 * ADJL Technology — /work/trading-infrastructure/ — programming and network work for trading firms.
 *
 * One rule is carried from ADJL Capital and still binds here: describe what a system is FOR and how it BEHAVES, never how to rebuild it. No thresholds, no parameter values, no live positions.
 *
 * Same conventions as src/content.ts: headlines are arrays of lines,
 * {em}…{/em} marks one emphasised phrase per headline, and {k}…{/k} marks a
 * technical term in body copy. Edit words here, never in a renderer.
 */

import type { CaseContent } from './sections/case';

export const content: CaseContent = {
  build: {
    eyebrow: "The work",
    headline: [
      "From the feed",
      "to the {em}fill.{/em}"
    ],
    intro: "This is the shape of the work, in the order it is usually done. Not every firm needs all five, and sometimes only one piece needs work.",
    steps: [
      {
        num: "01",
        tag: "ingest",
        title: "Market data in, normalized once",
        body: "Feeds arrive in whatever shape the venue or the vendor chose. They get {k}normalized{/k} into one internal representation, timestamped at capture rather than at parse, and recorded so the same bytes can be replayed later. Everything downstream reads that one representation, which means a fix to a feed handler is a fix everywhere rather than in three places you have to remember."
      },
      {
        num: "02",
        tag: "rules",
        title: "The rules set, written down as code",
        body: "A discretionary rules set gets read back to you as a list of conditions and actions, in plain language, until you agree the list is the thing you actually do. Then it becomes code, with the ambiguities resolved on paper instead of at three in the afternoon. The gap between what a trader says the rule is and what the rule turns out to be is the part of this step worth spending time on."
      },
      {
        num: "03",
        tag: "execution",
        title: "Orders out, on a path you can name",
        body: "Order construction, {k}risk checks{/k} before the wire, {k}order routing{/k}, and the state machine that keeps the system’s idea of a position and the venue’s idea of it in agreement. Every hop is timestamped, so when something is slow there is an answer rather than a theory. Reconciliation runs whether or not anyone is watching it."
      },
      {
        num: "04",
        tag: "backtest",
        title: "One code path, two clocks",
        body: "The backtester feeds recorded data into the same strategy and execution code that runs live. The only things that change are where the clock comes from and where fills come from, which removes the usual source of a whole class of bug: with no second implementation, there is nothing for the backtest to diverge from. It is slower to build and less pleasant to experiment in, and that is the trade."
      },
      {
        num: "05",
        tag: "monitoring",
        title: "Alerting on the conditions that precede a P&L surprise",
        body: "Gaps in sequence numbers, a feed going stale, an order that never got an ack, position drift against the broker, a process that stopped and told nobody. Each condition raises an alert carrying enough context to act on, routed to a person rather than to a dashboard nobody has open. A system nobody is watching is a system that fails silently, and silent failure is expensive long before it is visible."
      }
    ]
  },
  cta: {
    eyebrow: "Start here",
    headline: [
      "Send the part that",
      "keeps {em}breaking.{/em}"
    ],
    body: "A feed handler that drops messages once a week, a backtest nobody trusts, a rules set that still lives in someone’s head. Describe what it is and what it is supposed to do, and you will get a straight answer about whether this is worth building — including when it is not.",
    button: {
      label: "Email Daniel",
      href: "mailto:daniel@adjlcapital.com"
    },
    email: "daniel@adjlcapital.com"
  },
  detail: {
    eyebrow: "Decisions",
    headline: [
      "Three choices",
      "and what each {em}costs.{/em}"
    ],
    cards: [
      {
        title: "Latency work starts with measurement",
        body: "Before anything is made faster, the path is instrumented end to end: capture, decode, decision, encode, wire. The bottleneck is often somewhere nobody instrumented — a lock, a log line, a collection pause, a switch hop taken twice — which is the argument for measuring before buying hardware. The work follows what the timestamps show, and it stops when the remaining cost is the distance itself."
      },
      {
        title: "The backtest shares the live path on purpose",
        body: "A firm running one or two strategies gains more from certainty than from throughput, and that is the trade this design makes. Research code has to be production code, so fewer ideas get tested in a given week. What is bought with that is the absence of a second implementation: the backtest and the live system have nowhere to drift apart, because there is only one of them. A shop testing twenty ideas a week should probably choose the other way, knowing that when the two versions do disagree, the disagreement is found late."
      },
      {
        title: "What does not get written down",
        body: "We describe what a system is for and how it behaves, never how to rebuild it. No thresholds, no parameter values, no live positions — not on this site and not in a conversation before there is a contract. That restraint is carried over from ADJL Capital, where the property scanner and the rules-based equities work run on the firm’s own capital, and it points the same way for client work: your rules set is not written up anywhere, for any audience. It is deliberate, and it means this page argues from method rather than from names."
      }
    ]
  },
  hero: {
    eyebrow: "Trading infrastructure",
    headline: [
      "Code that behaves the same",
      "on Tuesday as it did",
      "on {em}Monday.{/em}"
    ],
    body: "Programming and network work for trading firms: {k}market data{/k} coming in, orders going out, and the {k}monitoring{/k} that tells you when either one has stopped. It is unglamorous work and it is where the expensive failures start. A correct signal and a late one produce the same result, and only one of them shows up in the research.",
    back: {
      label: "All work",
      href: "/work/"
    },
    specs: [
      {
        label: "Inputs",
        value: "Exchange and vendor feeds, an existing rules set, whatever already runs"
      },
      {
        label: "Scope",
        value: "Ingestion, execution, network, backtesting, monitoring"
      },
      {
        label: "Runs on",
        value: "Your venues, your hardware, your accounts"
      },
      {
        label: "Output",
        value: "Code the firm owns and can read, and the alerting around it"
      }
    ]
  },
  meta: {
    title: "Trading Infrastructure — ADJL Technology",
    description: "Market data, execution pipelines, network and latency work, and backtesting that runs the live code path. Programming for trading firms, by ADJL Technology.",
    ogTitle: "Trading Infrastructure — ADJL Technology",
    ogDescription: "Market data ingestion, order and execution pipelines, latency and network work, backtesting on the live code path, and the monitoring around all of it."
  },
  problem: {
    eyebrow: "The situation",
    headline: [
      "A rule in someone’s head",
      "is not a {em}rule.{/em}"
    ],
    body: "The signal is defensible and the feed handler drops a message once a week without mentioning it. The rules are clear in conversation and applied three different ways by three different people. The backtest is written in one language and the live system in another, so the two agree right up until the day they do not. None of that arrives labeled as a bad idea. It arrives as slippage nobody can account for and a review meeting where the explanation is a shrug.",
    points: [
      "A backtest written separately from the live system, so nobody can say whether a discrepancy is a bug or a market.",
      "Market data normalized one way in research and another way in production, with the difference discovered during a fast tape.",
      "Rules that live in a head and a spreadsheet, applied one way in a quiet market and another way in a loud one.",
      "Failures found by reading the P&L at the end of the day rather than by an alert during it."
    ]
  }
};

export const meta = content.meta;
