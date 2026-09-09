/**
 * The anti-fabrication and anti-hype guard.
 *
 * ADJL Technologies is new and one person runs it. It has no published
 * clients, no metrics, no awards and no headcount, and a site that implies
 * otherwise gets found out in the first conversation. The copy was written
 * to that rule and audited against it; this is what keeps it true through
 * every future edit, including the well-meaning one that adds "trusted by
 * leading firms" to a hero because the page felt thin.
 *
 * Two classes of check:
 *
 *   BANNED PHRASES — consulting-site filler, and the specific constructions
 *   that smuggle in a claim ("trusted by", "years of experience").
 *
 *   NUMERIC CLAIMS — a percentage or a multiplier next to a performance
 *   verb. There are no measured results to report, so any sentence of the
 *   form "40% faster" is by definition invented.
 *
 * If a phrase here is ever legitimately needed — because the thing became
 * true — the fix is to delete the line and say so in the commit, not to
 * work around the check.
 */
import { readFileSync } from 'node:fs';
import { PAGES } from './pages.mjs';

const BANNED = [
  'cutting-edge', 'cutting edge', 'best-in-class', 'best in class', 'world-class',
  'game-changing', 'game changing', 'next-generation', 'state-of-the-art',
  'revolutioniz', 'revolutionis', 'turnkey', 'synergy', 'paradigm',
  'supercharge', 'unlock the power', 'take it to the next level',
  'trusted by', 'clients trust', 'our clients say', 'testimonial',
  'years of experience', 'decades of experience', 'award-winning',
  'industry-leading', 'industry leading', 'we are passionate',
  'in today’s fast-paced', "in today's fast-paced", 'seamlessly integrate',
  'one-stop', 'end-to-end solution', 'solutions provider',
];

/** A number attached to a performance claim. */
const NUMERIC = [
  /\b\d+(\.\d+)?\s*%\s*(faster|cheaper|more|less|better|improvement|increase|reduction|accura)/i,
  /\b\d+(\.\d+)?x\s+(faster|cheaper|better|more|improvement)/i,
  /\b(saved|saves|reduced|cut)\s+(over\s+)?\d+/i,
  /\b\d{2,}\+?\s+(clients|customers|companies|firms|projects|engagements)\b/i,
];

/** The privacy page states there is no analytics or tracking on this site.
 *  If one is ever added, that page has to change first. */
const TRACKERS = [
  'googletagmanager', 'google-analytics', 'gtag(', 'analytics.js',
  'hotjar', 'segment.com', 'mixpanel', 'fbq(', 'clarity.ms', 'plausible.io',
];

let bad = 0;

for (const page of PAGES) {
  const html = readFileSync(page.out, 'utf8');
  // Compare on text, not markup — otherwise a class name can trip a phrase.
  const text = html.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<[^>]+>/g, ' ');
  const hay = text.toLowerCase();

  for (const phrase of BANNED) {
    if (hay.includes(phrase.toLowerCase())) {
      console.error(`check-claims: ${page.route} contains banned phrase "${phrase}"`);
      bad++;
    }
  }
  for (const re of NUMERIC) {
    const m = re.exec(text);
    if (m) {
      console.error(`check-claims: ${page.route} makes a numeric performance claim: "${m[0].trim()}"`);
      bad++;
    }
  }
  for (const t of TRACKERS) {
    if (html.includes(t)) {
      console.error(
        `check-claims: ${page.route} loads "${t}", but /legal/privacy/ says this site has no analytics. Change the policy first.`,
      );
      bad++;
    }
  }
}

if (bad) process.exit(1);
console.log(`check-claims: ${PAGES.length} pages, no fabricated claims, no hype, no trackers`);
