# ADJL Technology

The site for ADJL Technology, an AI engineering, technical SEO and software
studio. Static build, deploys to Netlify.

The site is built as a running, instrumented system the visitor can open
("Glass Box"). The hero is the page's own structure, drawn from its HTML. A
status bar shows what the page weighs and how fast it painted, measured on
the visitor's device. One switch shows the page the way a crawler reads it,
or the code that produced it. A console answers questions by retrieving and
citing passages from the site, and refuses when the evidence is thin. Every
figure carries a provenance chip saying whether it's Live, Build, Recorded
or an Illustration.

It's a sibling of [ADJL Capital's site](https://adjlcapital.com) and reuses
its brand kit: Manrope, the copper signal and the three-bar mark.

## Changing the words

**All copy lives in `src/content*.ts`.** Edit a sentence there and it changes
on the site; you don't need to touch markup, styling or animation code. If
you find yourself editing a sentence inside a section renderer, the renderer
is wrong. The shapes every module follows are in `src/content-types.ts`.

| Content module | Route |
|---|---|
| `src/content.ts` | `/` (home), plus the nav, footer, status bar, provenance chips, the shared contact block and the instruments' fixed copy |
| `src/content-services.ts` | `/services/` |
| `src/content-service-ai.ts` | `/services/ai-engineering/` |
| `src/content-service-seo.ts` | `/services/seo/` |
| `src/content-service-software.ts` | `/services/software/` |
| `src/content-audit.ts` | `/services/seo/audit/` |
| `src/content-work.ts` | `/work/` (its cards come from `content.ts` `systems.items`) |
| `src/content-case-real-estate.ts` | `/work/real-estate-intelligence/` |
| `src/content-case-trading.ts` | `/work/trading-infrastructure/` |
| `src/content-case-ai.ts` | `/work/ai-implementation/` |
| `src/content-case-mobile-app.ts` | `/work/mobile-app/` |
| `src/content-case-loep.ts` | `/work/loep/` |
| `src/content-glossary.ts` | every page: the reading switch's plain definition of each `{k}` term, and the switch's own labels |
| `src/content-case-private-site.ts` | `/work/private-site/` |
| `src/content-case-this-site.ts` | `/work/this-site/` |
| `src/content-case-research.ts` | `/work/agentic-research/` |
| `src/content-notes.ts` | `/notes/` and each note under it |
| `src/content-approach.ts` | `/approach/` |
| `src/content-scan.ts` | `/scan/` |
| `src/content-start.ts` | `/start/` and `/start/sent/` (the form's thank-you page, noindex) |
| `src/content-agents.ts` | `/agents/` |
| `src/content-changelog.ts` | `/changelog/` |
| `src/content-legal.ts` | `/legal/privacy/` and `/legal/terms/` |

`scripts/pages.mjs` is the one list of pages. Each entry names its content
modules (their last git commit is the page's `dateModified` and sitemap
`lastmod`), its kind (home, hub, service, case, note, firm, legal) and what
its structured data says about it (FAQ, Service, TechArticle, BlogPosting,
collection, app). A page marked `noindex` (only `/start/sent/`) is
prerendered and checked like any other, carries a robots noindex tag, and is
left out of the sitemap, `llms.txt`, the markdown twins and Ask's index.

Adding a page means an entry there and in `src/site-pages.ts`, a line in
`vite.config.ts` and `src/main.ts`, a shell (`<route>/index.html`), a
prerender entry (`scripts/entry-*.ts`), a page module (`src/pages/*.ts`),
its share-card copy in `scripts/gen-og.mjs` and a trailing-slash redirect in
`netlify.toml`. A page's own stylesheet lives in `src/styles/pages/` and is
linked from its shell.

Conventions in the content files:

- Headlines are **arrays**. Each entry renders as its own line.
- `{em}word{/em}` sets that phrase in copper. **Exactly one per headline**,
  on the word that carries the meaning. `check-markers` checks the content
  exports for this before any renderer runs.
- `{k}word{/k}` marks a technical term in **body copy only**, never a headline, and needs a plain definition in `src/content-glossary.ts` (the reading switch shows it in Plain; check-markers fails the build without one).
- Apostrophes are `’`. Titles use ` | ` as the separator, never a dash.

## Running it

```bash
npm install
npm run dev       # dev server with live reload
npm run build     # production build into dist/, and every guard below
npm run preview   # serve the production build on :4173
npm run verify    # drive a real browser over it (needs preview running)
```

`verify`, `check:contrast` and `og` need Playwright, deliberately kept **out**
of `devDependencies`. They're local chores, and keeping them out spares every
Netlify build a large install and a browser download:

```bash
npm i --no-save playwright-core
```

## The build

```
tsc --noEmit && vite build
node scripts/prerender.mjs      # every page to static HTML: content, head and JSON-LD,
                                # the hero's poster SVG, Machine View's BUILD readout, the stamp
node scripts/gen-machine.mjs    # search index, Ask's precomputed answers and chip evaluation,
                                # /source/*.json, _headers
node scripts/gen-sitemap.mjs    # sitemap.xml, lastmod from git per page
node scripts/gen-404.mjs
node scripts/gen-wellknown.mjs  # robots.txt, .well-known/security.txt
node scripts/gen-llms.mjs       # llms.txt, llms-full.txt, a markdown twin of every page, _headers
node scripts/stamp-sizes.mjs    # the LAST change to any HTML: gzip sizes into the status bar
node scripts/check-*.mjs        # the guards, below
node scripts/gen-report.mjs     # build-report.json from the guards' own output
```

Pages are prerendered by **pure string functions**. Section renderers in
`src/sections/` never touch the DOM, so `prerender.mjs` bundles each page
with esbuild and runs it in Node. Crawlers and no-JS visitors get the whole
page, and the browser gets real content on first paint. In production the
browser bundle only boots motion and interaction; a page's renderer is
imported only by the dev shell, so the copy never ships as JavaScript.

The pure libraries in `src/lib/` run in both places. `scripts/lib/ts.mjs`
loads them into Node scripts (esbuild bundle, imported from a `data:` URL),
and the browser imports them normally:

| Library | What it is |
|---|---|
| `tokenize.ts` | A streaming tag tokenizer with a depth stack, void elements and entity decoding. Every reader of the site's words goes through it. |
| `exclude.ts` | **The** exclusion set: which subtrees aren't prose (`script`, `style`, `svg`, `template`, `noscript`, and anything `aria-hidden="true"`, `data-chrome`, `data-machine`, `data-ask-pre` or `data-source-sheet`). Used by the guards, the markdown twins, Machine View, the hero graph and `verify`, so none of them can disagree about what the page says. |
| `measure.ts` | What a crawler is handed, measured from an HTML string (at build, and live from a re-fetch). |
| `pagegraph.ts`, `layout.ts`, `poster.ts` | The hero figure: the page's own structure as a graph, its two layouts, and the build-time SVG. |
| `bm25.ts` | Ask This Site's tokenizer, stemmer, scoring and confidence gate. |

## The guards

`npm run build` **fails** instead of shipping a regression. Each guard
prints one summary line through `scripts/lib/report.mjs`, and the last step
writes those lines to `/build-report.json`, which the home page's pipeline
and `/work/this-site/` print live. If the page says every check passed, it's
this deploy's own output saying so.

| Guard | What it prevents |
|---|---|
| `check-css` | A class in the markup with no rule (silently unstyled), a rule matching nothing (dead CSS), or a JavaScript-only class nobody sets any more |
| `check-links` | A link to a page that wasn't built, a fragment that doesn't exist on its target, a built page nothing links to, a link to a machine-readable file the build didn't write, or an Ask citation pointing at a missing anchor |
| `check-claims` | Fabricated claims and hype, in the pages, their structured data and JSON, and every machine-readable file. See below |
| `check-contact` | The contact address missing, unlinked, or half-migrated |
| `check-motion` | A motion module whose markup contract appears on no page: dead JavaScript, the same argument `check-css` makes about dead rules. A module whose markup is still being written can sit on its explicit `PENDING` list, which the guard's own summary line names in the build report |
| `check-markers` | An authoring marker (`{em}`, `{k}`) reaching production as literal text, a headline without exactly one `{em}`, or a `{k}` term with no plain definition |
| `check-usage` | A British spelling, the old plural name, or a meta description that's missing, repeated or over 160 characters |
| `check-voice` | The copy drifting back into the AI-essay register. See below |
| `check-seo` | A missing canonical, a second h1, a relative share image, a dash in a title, a missing markdown twin, or structured data that doesn't hold together: a `data-ld` pin or an `@id` reference that resolves to nothing |
| `check-provenance` | An instrument with no provenance chip, a chip prerendered as Live (Live is set only after a real measurement in the browser), or a hatched "not shown" area with no label |
| `check-budget` | A page over its byte budget (HTML 40 kB gz, first-load JS 24 kB, shared CSS 24 kB, page-only CSS 10 kB, each lazy chunk 10 kB, search index 40 kB, everything reachable from home 70 kB), a resource from another origin, anything in `dist/media/`, or a shipped file nothing references |

`check-voice` is the unusual one. Every other guard tests a fact; this one
tests a habit, and it exists because the habit was invisible from the
inside. The first version of this site read, in the client's words, "too
AI-ish". He was right, and counting said exactly why: **53 em-dashes in 8,866
words** (published prose runs about one per thousand), 31 `rather than`,
uncontracted forms outnumbering contractions more than two to one, and only
5% of sentences under eight words. Every sentence was a polished aphorism
carrying a reversal. No single sentence was wrong; the density was.

So it measures density, not vocabulary, and the thresholds sit just above
where the copy lands. If one trips, vary the writing; don't raise the
number. It reads the pages through the shared exclusion set plus code panes,
because a row of readouts isn't a sentence. It prints how many words that
dropped and fails if more than 25% of the site is excluded, so moving copy
into a chrome container can't be a way around it. It also counts the soft
vocabulary of generated marketing copy (seamless, leverage, empower and the
rest) against a budget of 0.3 per thousand words.

`check-claims` is the one to understand before editing copy. ADJL Technology
is new and small: there are no clients to name, no metrics to quote, no
headcount, no awards. The guard fails the build on consulting-site filler,
on the constructions that smuggle in a claim, on any number attached to a
performance verb, and on counts of clients, projects or systems, spelled out
or not. If the site says "40% faster", that figure was invented. It reads
everything, chrome and structured data included, because a readout can be a
claim even when it isn't a sentence. It also fails if an analytics or tag
script appears while `/legal/privacy/` still says the site has none.
**Change the policy first.**

Two more checks need a browser, so they're **not** in `npm run build`. Run
them against `npm run preview`:

```bash
npm run preview &      # then, in another shell:
npm run verify
npm run check:contrast
```

`npm run check:contrast` measures every text element (and every generated
`::before`/`::after` label) as the browser rendered it, opacity composited,
against the background actually behind it. It runs each page in Render
view, Machine view and Source view, and measures Machine view's drawer, the
⌘K dialog and Ask in its answered and abstained states. Run it after
touching a color.

`npm run verify` runs every page at 390px and 1440px: no sideways overflow,
no console errors, the largest contentful paint is the hero's text, CLS under
0.02 across a full scroll, no hero text over the figure, every reveal fired.
Then the instruments: the hero graph runs on the full tier and stops on Pause
and offscreen, no canvas exists under reduced motion or on touch, the
pipeline reaches its last stage, Machine View's live fetch reads 100% parity,
Ask cites for a fair question and abstains for one the site can't answer,
and the view switch changes `html[data-view]`. Finally, with JavaScript off,
every page's text is within 2% of the scripted page's. An instrument that
isn't built yet is reported as skipped, not passed.

## Machine-readable surfaces

Everything here is generated from the built pages on every deploy, so none
of it can describe a site that no longer exists.

| File | Written by | What it is |
|---|---|---|
| `/llms.txt` | `gen-llms.mjs` | A plain-markdown index for answer engines: the firm in two sentences, then every page grouped under Services, Work, Notes, Firm and Legal, then the machine-readable files. `llms.txt` is a proposed convention, not a standard. |
| `/llms-full.txt` | `gen-llms.mjs` | Every page's prose as markdown, in one file |
| `/{route}index.md` | `gen-llms.mjs` | A markdown twin of every page (home is `/index.md`), linked from its page with `<link rel="alternate" type="text/markdown">`. `_headers` serves each as `text/markdown` with a `Link: rel="canonical"` back to the page. |
| `/search-index.json` | `gen-machine.mjs` | Ask This Site's passages, `noindex` |
| `/source/{slug}.json` | `gen-machine.mjs` | Source view's sheets: each section's content object, renderer, contracts and bytes, `noindex` |
| `/build-report.json` | `gen-report.mjs` | `{commit, date, node, guards: [{name, line}]}`, `noindex` |
| `/sitemap.xml` | `gen-sitemap.mjs` | Every page, `lastmod` from the git history of its content modules |
| `/robots.txt` | `gen-wellknown.mjs` | Allow all, a named group for AI crawlers (GPTBot, ClaudeBot, PerplexityBot, Google-Extended; default allow, Daniel confirms before launch), and the sitemap |
| `/.well-known/security.txt` | `gen-wellknown.mjs` | The contact address |
| `dist/_headers` | `scripts/lib/headers.mjs` | Per-file headers on top of `netlify.toml` |

Every page carries one JSON-LD graph with stable `@id`s: the Organization
(`/#organization`), its founder (`/#daniel`), the WebSite (`/#website`), the
page's WebPage (`#webpage`, never replaced: a hub is also a CollectionPage
and an FAQ page also an FAQPage), its BreadcrumbList, and what the page is
about: a Service on each service page, a TechArticle on each case page, an
ItemList on each hub, a SoftwareApplication on the app page. Sections in the
markup point at their entity with `data-ld="#service"` and friends, and
`check-seo` resolves every one.

## The dark kit

One theme, no toggle: a dark graphite ground, blue-shifted so it reads as a
different room from ADJL Capital's neutral black, under a faint drafting
grid. One ground means one set of measured pairs. `@media print` switches to
paper and ink.

| Token | Value | Use |
|---|---|---|
| `--ground` / `--ground-2` | `#0a0c10` / `#0e1015` | Page and alternating band |
| `--panel` / `--panel-2` | `#12151b` / `#1a1e26` | Instrument panels and cards / raised, inputs, dialogs |
| `--fg` / `--fg-2` / `--fg-3` | `#e8ecf2` / `#aab2bf` / `#808999` | Headlines and lead / body / labels and readouts |
| `--fg-faint` | `#6a7282` | Text ≥24px and aria-hidden decoration only |
| `--signal` / `--signal-hi` | `#d9542a` / `#ec6e44` | Copper: display `{em}`, fills, marks / every small copper text, links, focus |
| `--data` | `#3cc8c0` | Teal: data, measurement, crawl paths, LIVE |
| `--model` | `#a08cff` | Violet: models and structured data, BUILD |
| `--ok` / `--warn` / `--fail` | `#4cc38a` / `#e0a53a` / `#f2705e` | States, always with a glyph and a word |

Every ratio is in a comment beside its token in `src/styles/tokens.css`,
measured against all four surfaces. Copper means people and interfaces, teal
means data, violet means models and machine-readable structure, amber means
unverified or waiting on a person. Type is Manrope (preloaded) and JetBrains
Mono (swapped in, metric-matched fallback), both self-hosted. No text ever
sits over a canvas or the hero figure, so the flat contrast measurement
stays valid.

## How the motion works

Every module in `src/motion/` is gated by one capability tier, resolved in
`public/js-on.js` before first paint and set on `<html data-motion>`, so CSS
and every module agree from frame one:

| Tier | When | What runs |
|---|---|---|
| `full` | desktop, fine pointer | everything, including the hero graph's WebGL canvas, pointer effects and the headline decode |
| `lite` | touch, coarse pointer, low memory, data saver | one-shot reveals and short transitions; no continuously running canvas, no pointer effects |
| `reduced` | `prefers-reduced-motion`, or **Pause motion** pressed | nothing moves on its own; every page is complete and static (posters exploded, the pipeline stacked, the replay complete) |

**Pause motion** sits in the hero figure, the status bar and the footer
(WCAG 2.2.2). It drops the page to `reduced`, remembers the choice in local
storage so the next page stays still, and pressing it again restores what was
detected. Every module with a loop subscribes through `onMotionChange()` and
renders its static state.

`prefs.ts` also exports `whileVisible()`, and everything continuous goes
through it, so it pauses offscreen and in hidden tabs. Heavy setup (the WebGL
context, the page graph) waits for load and idle, after first paint. The h1
and hero text never animate in; they're the largest contentful paint on
every page.

| Module | Contract | What it does |
|---|---|---|
| `lattice.ts` | `[data-lattice]` | The hero graph: the page's own structure, assembling and coming apart into what people read, what crawlers follow and what machines parse |
| `compile.ts` | `[data-compile]` | The h1's `{em}` markers, drawn once and folded away |
| `decode.ts` | `[data-decode]` | h2 lines resolve on first entry (full tier only) |
| `telemetry.ts` | `[data-telemetry]` | The status bar's live readouts: LCP, CLS, slowest input, transfer |
| `views.ts` | `[data-views]` | Render / Source / Machine views of the page |
| `machine.ts` | `[data-machine]` | Machine View: re-fetches the page and reads it the way a crawler is handed it |
| `ask.ts` | `[data-ask]` | Ask This Site: retrieval with citations, or an honest abstain |
| `pipeline.ts` | `[data-pipeline]` | The scroll-driven "how we build" sequence |
| `replay.ts` | `[data-replay]` | A replay of the underwriting engine's stages, with bad inputs to try |
| `leaders.ts` | `[data-leaders]` | Leader-line diagrams (parity, seal, point-in-time, two clocks) |
| `headers.ts` | `[data-headers]` | This page's real response headers, `curl -I` style |
| `palette.ts` | `[data-palette]` | ⌘K: jump anywhere |
| `scan.ts` | `[data-scan]` | The scanner on `/scan/`: what a crawler or answer engine is handed from a page you name, via `/api/scan` |
| `assistant.ts` | `[data-assistant]` | The scoping assistant on `/start/`, via `/api/assistant`; the form works without it |
| `read.ts` | `[data-read-toggle]` | The Plain / Technical reading switch |
| `reveal.ts`, `scrub.ts`, `wordmark.ts`, `flow.ts` | `[data-reveal]`, `[data-scrub]`, `wm-mark`, `[data-flow]` | One-shot reveals, the shared scroll-progress primitive, the mark's pulse, the case pages' stage traces |

`check-motion` fails the build if a module's contract appears on no page.
Everything a module builds is styled by attribute selectors under its own
root, never by new classes, so `check-css` stays honest.

With JavaScript off, every prerendered word is visible: hiding-before-reveal
styles hang off `html.js`, which `public/js-on.js` sets.

## Deploying

Netlify builds from this repo. [`netlify.toml`](netlify.toml) sets the
build command, publish directory, Node version, cache headers,
trailing-slash redirects for every route, the functions directory, and a
Content-Security-Policy that's genuinely strict: no inline script, no
third-party origin, `media-src 'none'`, `form-action 'self'` (the one form,
the intake form on `/start/`, posts to this origin for Netlify Forms).

Three Netlify Functions live in `netlify/functions/`, each routed by its
own `config.path`: `/api/scan` (the scanner), `/api/assistant` (the scoping
assistant, through the Anthropic SDK) and `/mcp` (the MCP endpoint for AI
agents). The assistant needs `ANTHROPIC_API_KEY` set in the Netlify UI with
the Functions scope; until it is, the assistant says it isn't switched on
and the form still works. No secret is ever in this repository or in the
browser. `dist/_headers` adds the
per-file headers the build knows about (markdown twins, noindex on the
machine files).
