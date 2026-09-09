# ADJL Technology

The site for ADJL Technology — the AI consulting and applied engineering
practice that builds ADJL Capital's software. Static build, deploys to Netlify.

It is a sibling of [ADJL Capital's site](https://adjlcapital.com), and reuses
its brand kit: Manrope, the copper signal, and the three-bar mark. The obvious
difference is the ground. Capital is black; this is porcelain, and the single
copper signal has grown into a three-colour spectrum — copper, teal, violet —
that the data and AI work is drawn in.

## Changing the words

**All copy lives in `src/content*.ts`.** Edit a sentence there and it changes on
the site; you do not need to touch markup, styling or animation code. If you
find yourself editing a sentence inside a section renderer, the renderer is
wrong.

| File | Page |
|---|---|
| `src/content.ts` | Home, plus the nav, footer and contact address |
| `src/content-work.ts` | `/work/` |
| `src/content-case-real-estate.ts` | `/work/real-estate-intelligence/` |
| `src/content-case-trading.ts` | `/work/trading-infrastructure/` |
| `src/content-case-ai.ts` | `/work/ai-implementation/` |
| `src/content-approach.ts` | `/approach/` |
| `src/content-legal.ts` | `/legal/privacy/` and `/legal/terms/` |

Three conventions in those files:

- Headlines are **arrays**. Each entry renders as its own line.
- `{em}word{/em}` sets that phrase in copper. **One per headline**, on the word
  that carries the meaning.
- `{k}word{/k}` marks a technical term in **body copy only**, never a headline.

## Running it

```bash
npm install
npm run dev       # dev server with live reload
npm run build     # production build into dist/, and every guard below
npm run preview   # serve the production build on :4173
npm run verify    # drive a real browser over it (needs preview running)
```

`verify` and the media pipeline need two tools deliberately kept **out** of
`devDependencies` — they are local chores, and keeping them out spares every
Netlify build a large install and a binary download:

```bash
npm i --no-save playwright-core ffmpeg-static
```

## The guards

`npm run build` **fails** rather than shipping a regression. Each of these
exists because of a specific way a site like this goes wrong:

| Guard | What it prevents |
|---|---|
| `check-css` | A class in the markup with no rule (silently unstyled), or a rule matching nothing (dead CSS) |
| `check-links` | A link to a page that was not built, a fragment that does not exist on the target page, or a built page nothing links to |
| `check-claims` | Fabricated claims and hype — see below |
| `check-contact` | The contact address missing, unlinked, or half-migrated |
| `check-media` | A film named in markup with no file on disk, or a film shipped that nothing uses |
| `check-motion` | A motion module whose markup contract appears on no page — dead JavaScript, the same argument `check-css` makes about dead rules |
| `check-markers` | An authoring marker (`{em}`, `{k}`) reaching production as literal text, because a renderer reached for `esc()` instead of `rich()` |

`check-claims` is the one to understand before editing copy. ADJL Technology
is new and small: there are no clients to name, no metrics to quote, no
headcount, no awards. The guard fails the build on consulting-site
filler, on the constructions that smuggle in a claim (`trusted by`,
`years of experience`), and on any number attached to a performance verb —
because if the site says "40% faster", that figure was invented.

It also fails if an analytics or tag script appears while `/legal/privacy/`
still says the site has none. **Change the policy first.**

Two more guards need a browser, so they are **not** in `npm run build` — run
them against `npm run preview`:

```bash
npm run preview &      # then, in another shell:
npm run verify         # overflow, reveals, console errors, film, the diagram
npm run check:contrast # every text element, measured
```

`npm run check:contrast` is the one to run after touching a colour. It
measures what a reader actually sees rather than what the stylesheet asked
for: it composites `opacity` into the foreground, and for text sitting over
film it blanks every glyph on the page, screenshots the region behind the
words across five frames of the loop, and takes a near-extreme percentile of
the real pixels. Colours picked by eye on a light ground fail this
constantly — that is the point of it.

`npm run verify` drives a real browser and checks the things only a browser
can: horizontal overflow at 390px, elements left unrevealed after a full
scroll, console errors, that each film's `currentTime` actually **advances**
(present is not the same as playing — Capital once shipped a hero that played
correctly and measured zero movement), and that the flow diagram's trace
responds to scroll.

## Media

Six films in `public/media/`, generated with Seedance 2.5 and processed by
`scripts/encode-media.mjs`:

| Clip | Where |
|---|---|
| `lumen` | Home hero — glass prisms and caustics |
| `survey` | Real estate intelligence |
| `latency` | Trading infrastructure |
| `mesh` | AI implementation |
| `weave` | `/approach/` hero |
| `bloom` | Closing CTA, `/work/` hero |

Each 4-second render is **ping-ponged** — concatenated with its own reverse —
into an 8-second loop that is seamless by construction, because the last frame
*is* the first. They ship as H.264 and VP9 with a poster, one size at native
1470×630; `encode-media.mjs` explains why there is no resolution ladder.

To regenerate: `node scripts/encode-media.mjs name=url [name=url ...]`. It
rewrites `src/media-manifest.ts` from the files on disk, so the markup can
never drift from the media directory.

## How the motion works

Eleven modules in `src/motion/`, all gated by one capability tier resolved
once in `prefs.ts`:

| Tier | When | What runs |
|---|---|---|
| `full` | desktop, fine pointer | everything, including the point-field canvas, tilt and spotlight |
| `lite` | touch, low memory, data saver | film, reveals, the flow diagram — no canvas, no pointer effects |
| `reduced` | `prefers-reduced-motion` | no film, no canvas; the flow diagram renders complete and every reveal is visible immediately |

`prefs.ts` also exports `whileVisible()`, and everything continuous goes
through it — canvas, marquees, film. Nine animations left running at once,
including the six below the fold, is a warm laptop and a flat phone.

The flow diagram is **prerendered SVG**, not built by JavaScript: it is the
clearest statement on the site of what the firm does, so it has to survive with
scripting off and be readable to a screen reader. `motion/flow.ts` only
animates what is already on the page.

## Deploying

Netlify builds from this repo with no extra configuration.
[`netlify.toml`](netlify.toml) sets the build command, publish directory, Node
version, cache headers, and a Content-Security-Policy that is genuinely strict
— no inline script, no third-party origin, `form-action 'none'` — because the
site is static and has nothing that needs the exceptions.

The build also prerenders every page to static HTML, so crawlers and visitors
without JavaScript get the full content, and the browser gets real content on
first paint instead of an empty shell.
