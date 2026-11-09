/**
 * ADJL Technology: /work/trading-infrastructure/, programming and network work for trading firms.
 *
 * One rule is carried from ADJL Capital and still binds here: describe what
 * a system is FOR and how it BEHAVES, never how to rebuild it. No
 * thresholds, no parameter values, no live positions, and in the research
 * section no tickers, returns or counts.
 *
 * Same conventions as src/content.ts: headlines are arrays of lines,
 * {em}…{/em} marks one emphasized phrase per headline, and {k}…{/k} marks a
 * technical term in body copy. Edit words here, never in a renderer.
 */

import type { CaseContent } from './sections/case';

export const content: CaseContent = {
  build: {
    eyebrow: "Ingestion, Execution & Backtesting",
    headline: [
      "From the feed",
      "to the {em}fill.{/em}"
    ],
    intro: "This is the shape of the work, in the order it’s usually done. Not every firm needs all five. Sometimes only one piece needs work.",
    steps: [
      {
        num: "01",
        tag: "ingest",
        title: "Market data in, normalized once",
        body: "Feeds arrive in whatever shape the venue or the vendor chose. They get {k}normalized{/k} into one internal representation, timestamped at capture, not at parse, and recorded so the same bytes can be replayed later. Everything downstream reads that one representation, which means a fix to a feed handler is a fix everywhere instead of in three places you have to remember."
      },
      {
        num: "02",
        tag: "rules",
        title: "The rules set, written down as code",
        body: "A discretionary rules set gets read back to you as a list of conditions and actions, in plain language, until you agree the list is the thing you actually do. Then it becomes code, with the ambiguities resolved on paper instead of at three in the afternoon. What a trader says the rule is and what the rule turns out to be are two different things. That gap is the part worth spending time on."
      },
      {
        num: "03",
        tag: "execution",
        title: "Orders out, on a path you can name",
        body: "Order construction, {k}risk checks{/k} before the wire, {k}order routing{/k}, and the state machine that keeps the system’s idea of a position and the venue’s idea of it in agreement. Every hop is timestamped. When something is slow, you get an answer instead of a theory. Reconciliation runs whether or not anyone is watching it."
      },
      {
        num: "04",
        tag: "backtest",
        title: "One code path, two clocks",
        body: "The backtester feeds recorded data into the same strategy and execution code that runs live. Only two things change. One is where the clock comes from, and the other is where fills come from. That removes the usual source of a whole class of bug. With no second implementation, there’s nothing for the backtest to diverge from. It’s slower to build and less pleasant to experiment in, and worth it."
      },
      {
        num: "05",
        tag: "monitoring",
        title: "Alerting on the conditions that precede a P&L surprise",
        body: "Gaps in sequence numbers, a feed going stale, an order that never got an ack, position drift against the broker, a process that stopped and told nobody. Each condition raises an alert with enough context to act on, and it goes to a person, not to a dashboard nobody has open. A system nobody watches fails silently. Silent failure gets expensive long before it’s visible."
      }
    ]
  },
  detail: {
    eyebrow: "Latency & Backtest Design",
    headline: [
      "Three choices",
      "and what each {em}costs.{/em}"
    ],
    cards: [
      {
        title: "Latency work starts with measurement",
        body: "Before anything is made faster, the path is instrumented end to end: capture, decode, decision, encode, wire. The bottleneck is often somewhere nobody instrumented. A lock, a log line, a collection pause, a switch hop taken twice. Measure before you buy hardware. The work follows what the timestamps show, and it stops when the remaining cost is the distance itself."
      },
      {
        title: "The backtest shares the live path on purpose",
        body: "A firm running one or two strategies gains more from certainty than from throughput, so that’s what this design buys. Research code has to be production code, so fewer ideas get tested in a given week. What you buy is the absence of a second implementation. The backtest and the live system have nowhere to drift apart, because there’s only one of them. A shop testing twenty ideas a week should probably choose the other way. Just know that when the two versions do disagree, the disagreement gets found late."
      },
      {
        /* Drawn hatched: the one card on the page about what's deliberately
           not shown. */
        title: "What doesn’t get written down",
        body: "We describe what a system is for and how it behaves, never how to rebuild it. No thresholds, no parameter values, no live positions. Not on this site, and not in a conversation before there’s a contract. That restraint is carried over from ADJL Capital, where the property scanner and the rules-based equities work run on the firm’s own capital. It points the same way for client work. Your rules set doesn’t get written up anywhere, for any audience. This is deliberate, and it’s why this page argues from method instead of from names.",
        hatch: "Withheld from this page"
      }
    ]
  },
  hero: {
    eyebrow: "Market Data & Execution Systems",
    headline: [
      "Code that behaves the same",
      "on Tuesday as it did",
      "on {em}Monday.{/em}"
    ],
    body: "Programming and network work for trading firms: {k}market data{/k} coming in, orders going out, and the {k}monitoring{/k} that tells you when either one has stopped. It’s unglamorous work. It’s also where the expensive failures start. A correct signal and a late one produce the same result, and only one of them shows up in the research.",
    secondary: {
      label: "Talk to Daniel",
      href: "#contact"
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
    title: "Trading Infrastructure and Market Data | ADJL Technology",
    description: "Market data, execution and latency work, backtests on the live code path, and a daily research pipeline built on point-in-time index membership.",
    ogTitle: "Code that behaves the same on Tuesday as it did on Monday.",
    ogDescription: "Programming and network work for trading firms: market data coming in, orders going out, and the monitoring that tells you when either one has stopped. It’s unglamorous work."
  },
  problem: {
    eyebrow: "Where Trading Systems Fail",
    headline: [
      "A rule in someone’s head",
      "isn’t a {em}rule.{/em}"
    ],
    body: "The signal is defensible and the feed handler drops a message once a week without mentioning it. The rules are clear in conversation and applied three different ways by three different people. The backtest is written in one language and the live system in another, so the two agree right up until the day they don’t. None of that arrives labeled as a bad idea. It arrives as slippage nobody can account for, and a review meeting where the explanation is a shrug.",
    points: [
      "A backtest written separately from the live system, so nobody can say whether a discrepancy is a bug or a market.",
      "Market data normalized one way in research and another way in production. You find out during a fast tape.",
      "Rules that live in a head and a spreadsheet, applied one way in a quiet market and another way in a loud one.",
      "Failures found by reading the P&L at the end of the day instead of from an alert during it."
    ]
  },
  extras: {
    afterBuild: [
      {
        /* The Two Clocks leader diagram: one path, the clock source swapped. */
        id: "clocks",
        eyebrow: "Two clocks, one path",
        headline: [
          "Replay and live",
          "run {em}the same code.{/em}"
        ],
        body: [
          "A backtest replays recorded data in bursts. Live trading reads a steady stream. Both feed the same path from normalization to orders, so a fix in one is a fix in the other."
        ],
        instrument: "leaders-clocks"
      },
      {
        /* Then the point-in-time diagram, with its "Survivors only" toggle. */
        id: "research",
        eyebrow: "Research pipeline",
        headline: [
          "Point-in-time data,",
          "so the past {em}stays honest.{/em}"
        ],
        body: [
          "A backtest that only knows today’s index members has already dropped every company that fell out of the index. Its results look better than anything you could have traded. The research pipeline avoids that. It records who was in the index on each date, keeps the companies that left, and runs every trading day."
        ],
        items: [
          {
            title: "Daily jobs",
            body: "Quotes, fundamentals and options chains are fetched every trading day, and coverage is checked before anything downstream reads them."
          },
          {
            title: "Point-in-time membership",
            body: "Index membership is frozen by date, delisted and removed companies included, so a test on any past day sees that day’s universe."
          },
          {
            title: "An evening brief",
            body: "A plain-text summary assembled after the close from that day’s data."
          },
          {
            title: "An options model checked against real quotes",
            body: "The pricing model is validated against real option-chain quotes, not only against itself."
          }
        ],
        instrument: "leaders-pit"
      }
    ]
  },
  foot: {
    builtUnder: [
      { label: "Websites, apps and backends", href: "/services/software/" }
    ],
    next: { label: "How an AI rollout runs", href: "/work/ai-implementation/" }
  }
};

export const meta = content.meta;
