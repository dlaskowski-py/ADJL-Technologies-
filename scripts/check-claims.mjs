/**
 * The anti-fabrication and anti-hype guard.
 *
 * ADJL Technology is new and small. It has no published clients, no metrics,
 * no awards and no headcount to quote, and a site that implies otherwise gets
 * found out in the first conversation. The copy was written to that rule and
 * audited against it; this is what keeps it true through every future edit,
 * including the well-meaning one that adds "trusted by leading firms" to a
 * hero because the page felt thin.
 *
 * Two classes of check:
 *
 *   BANNED PHRASES: consulting-site filler, and the specific constructions
 *   that smuggle in a claim ("trusted by", "years of experience").
 *
 *   NUMERIC CLAIMS: a percentage or a multiplier next to a performance
 *   verb, and a count of clients, projects or systems. There are no measured
 *   results to report, so any sentence of the form "40% faster" is by
 *   definition invented. Counts get the same treatment spelled out, because
 *   "five systems in production" makes the same claim as "5 systems" and the
 *   first version of the numeric rule let it straight through.
 *
 * WHAT IT READS: everything, the exclusion set notwithstanding. check-voice
 * drops instrument chrome because a readout isn't a sentence; a readout can
 * still be a claim. So this reads every text node, spoken attributes
 * (aria-label, alt, title), meta descriptions, and the string values of every
 * application/json and application/ld+json script: a demo that types "8.4%
 * yield" into a console is making that claim even though the words live in
 * a <script>, and structured data is the version of the copy that search
 * engines and answer engines quote.
 *
 * And it reads the machine surfaces the build writes for those engines:
 * llms.txt, llms-full.txt, every markdown twin, the search index and the
 * source sheets. They're generated from the pages, so they should be clean
 * when the pages are. Checking them anyway is what catches a generator that
 * picked up something the pages never showed.
 *
 * If a phrase here is ever legitimately needed, because the thing became
 * true, the fix is to delete the line and say so in the commit, not to work
 * around the check.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { PAGES } from './pages.mjs';
import { readableText, jsonStrings } from './lib-text.mjs';
import { pass } from './lib/report.mjs';

const BANNED = [
  'cutting-edge', 'cutting edge', 'best-in-class', 'best in class', 'world-class',
  'game-changing', 'game changing', 'next-generation', 'state-of-the-art',
  'revolutioniz', 'revolutionis', 'revolutionary', 'turnkey', 'synergy', 'paradigm',
  'supercharge', 'unlock the power', 'take it to the next level',
  'trusted by', 'clients trust', 'our clients say', 'testimonial',
  'years of experience', 'decades of experience', 'award-winning',
  'industry-leading', 'industry leading', 'we are passionate',
  'in today’s fast-paced', "in today's fast-paced", 'seamlessly integrate',
  'one-stop', 'end-to-end solution', 'solutions provider',
  /* The rebuild's thesis is that the site never says "future": it shows the
     habits instead. And "AI-powered" describes nothing a buyer can check. */
  'the future of', 'ai-powered', 'ai powered',
];

/** A number attached to a performance claim, or a count of things sold. */
const NUMERIC = [
  /\b\d+(\.\d+)?\s*%\s*(faster|cheaper|more|less|better|improvement|increase|reduction|accura)/i,
  /\b\d+(\.\d+)?x\s+(faster|cheaper|better|more|improvement)/i,
  /\b(saved|saves|reduced|cut)\s+(over\s+)?\d+/i,
  /\b\d{2,}\+?\s+(clients|customers|companies|firms|projects|engagements)\b/i,
  /\b(two|three|four|five|six|seven|eight|nine|ten|\d+)\s+(clients|customers|companies|firms|projects|engagements|systems|products|builds)\b/i,
];

/** The privacy page states there is no analytics or tracking on this site.
 *  If one is ever added, that page has to change first. */
const TRACKERS = [
  'googletagmanager', 'google-analytics', 'gtag(', 'analytics.js',
  'hotjar', 'segment.com', 'mixpanel', 'fbq(', 'clarity.ms', 'plausible.io',
];

let bad = 0;
let scanned = 0;

/** Report every banned phrase and numeric claim in one piece of text. */
function scan(where, text) {
  scanned++;
  const hay = text.toLowerCase();
  for (const phrase of BANNED) {
    const at = hay.indexOf(phrase.toLowerCase());
    if (at >= 0) {
      const around = text.slice(Math.max(0, at - 40), at + phrase.length + 40).replace(/\s+/g, ' ');
      console.error(`check-claims: ${where} contains banned phrase "${phrase}" (…${around}…)`);
      bad++;
    }
  }
  for (const re of NUMERIC) {
    const m = re.exec(text);
    if (m) {
      console.error(`check-claims: ${where} makes a numeric claim: "${m[0].trim()}"`);
      bad++;
    }
  }
}

/* ── Pages ─────────────────────────────────────────────────────────── */
for (const page of PAGES) {
  const html = readFileSync(page.out, 'utf8');
  /* Compare on text, not markup, so a class name can't trip a phrase. */
  scan(page.route, readableText(html));
  for (const t of TRACKERS) {
    if (html.includes(t)) {
      console.error(
        `check-claims: ${page.route} loads "${t}", but /legal/privacy/ says this site has no analytics. Change the policy first.`,
      );
      bad++;
    }
  }
}
if (existsSync('dist/404.html')) scan('/404.html', readableText(readFileSync('dist/404.html', 'utf8')));

/* ── Machine surfaces (when this build wrote them) ─────────────────── */
function files(dir, test, out = []) {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) files(p, test, out);
    else if (test(p)) out.push(p);
  }
  return out;
}

const surfaces = [
  ...['dist/llms.txt', 'dist/llms-full.txt'].filter((f) => existsSync(f)),
  ...files('dist', (p) => p.endsWith('index.md')),
];
for (const f of surfaces) scan(f.replace(/^dist/, ''), readFileSync(f, 'utf8'));

const jsonSurfaces = [
  ...(existsSync('dist/search-index.json') ? ['dist/search-index.json'] : []),
  ...files('dist/source', (p) => p.endsWith('.json')),
];
for (const f of jsonSurfaces) {
  const raw = readFileSync(f, 'utf8');
  let text;
  try {
    text = jsonStrings(JSON.parse(raw)).join(' \n ');
  } catch {
    console.error(`check-claims: ${f} isn't valid JSON`);
    bad++;
    text = raw;
  }
  scan(f.replace(/^dist/, ''), text);
}

if (bad) process.exit(1);
pass(
  'check-claims',
  `${PAGES.length} pages and ${surfaces.length + jsonSurfaces.length} machine-readable files, no fabricated claims, no counts, no hype, no trackers`,
);
