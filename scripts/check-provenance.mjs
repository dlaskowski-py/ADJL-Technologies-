/**
 * Every figure says where it came from.
 *
 * The engine this firm built for ADJL Capital has one rule: every number
 * names its source, and anything unaudited says so. This guard holds the
 * website to the same rule. Each instrument on the site (the hero graph,
 * Machine View, Ask, the pipeline, the replay, the diagrams, the telemetry
 * readouts, the headers panel) carries a provenance chip saying which of
 * four things it is:
 *
 *   live          measured in your browser, now
 *   build         measured from this page's HTML when the site was built
 *   recorded      a replay of a real run
 *   illustration  drawn to explain, not a measurement
 *
 * and the chip is the claim. So:
 *
 *   - every instrument root contains a `.prov[data-prov]` chip
 *   - every chip uses one of the four values, and has its definition in a
 *     title attribute and data-chrome (it's a label, not prose)
 *   - NO chip is prerendered as live. Live is a measurement in the visitor's
 *     browser, so it can only be set by JavaScript after the measuring
 *     module has actually produced its value. A page that ships "● Live" in
 *     its HTML is claiming a measurement nobody made.
 *   - every `.hatch` (the one pattern that means "deliberately not shown")
 *     contains a `.hatch-label` saying so, so a withheld value can't look
 *     like a missing one.
 *
 * It reads the pages through the site's tokenizer, so "contains" means the
 * real subtree, nested elements included.
 */
import { readFileSync } from 'node:fs';
import { PAGES } from './pages.mjs';
import { walk, classes } from './lib-text.mjs';
import { pass } from './lib/report.mjs';

const INSTRUMENTS = [
  'data-lattice', 'data-machine', 'data-ask', 'data-pipeline',
  'data-replay', 'data-leaders', 'data-telemetry', 'data-headers',
];
const VALUES = new Set(['live', 'build', 'recorded', 'illustration']);

let bad = 0;
const fail = (msg) => {
  console.error(`check-provenance: ${msg}`);
  bad++;
};

const totals = { instruments: 0, chips: 0, hatches: 0 };
const seen = { build: 0, recorded: 0, illustration: 0 };

for (const page of PAGES) {
  const html = readFileSync(page.out, 'utf8');
  /* Open instruments and hatches, each counting what it contains. */
  const open = [];

  walk(html, {
    open(el) {
      const cls = classes(el);
      const isProv = cls.includes('prov');
      const hasProv = 'data-prov' in el.attrs;

      for (const a of INSTRUMENTS) {
        if (a in el.attrs) {
          open.push({ el, kind: 'instrument', attr: a, found: 0 });
          totals.instruments++;
        }
      }
      if (cls.includes('hatch')) {
        open.push({ el, kind: 'hatch', found: 0 });
        totals.hatches++;
      }

      if (isProv || hasProv) {
        const where = `${page.route} <${el.name} class="${el.attrs.class ?? ''}" data-prov="${el.attrs['data-prov'] ?? ''}">`;
        if (isProv && !hasProv) fail(`${where} is a .prov chip with no data-prov`);
        if (hasProv && !isProv) fail(`${where} has data-prov but isn't a .prov chip`);
        const v = (el.attrs['data-prov'] ?? '').trim();
        if (hasProv) {
          if (!VALUES.has(v)) fail(`${where} uses "${v}". Allowed: ${[...VALUES].join(', ')}`);
          else if (v === 'live') {
            fail(`${where} ships prerendered as LIVE. Live is set by JavaScript after a real measurement; prerender build, recorded or illustration.`);
          } else seen[v]++;
        }
        if (isProv && hasProv) {
          totals.chips++;
          if (!(el.attrs.title ?? '').trim()) fail(`${where} has no title. The chip's definition is its title.`);
          if (!('data-chrome' in el.attrs)) fail(`${where} isn't data-chrome. A chip is a label, not prose.`);
          for (const o of open) if (o.kind === 'instrument') o.found++;
        }
      }
      if (cls.includes('hatch-label')) for (const o of open) if (o.kind === 'hatch') o.found++;
    },
    close(el) {
      for (let i = open.length - 1; i >= 0; i--) {
        if (open[i].el !== el) continue;
        const o = open[i];
        open.splice(i, 1);
        const id = el.attrs.id ? `#${el.attrs.id}` : el.attrs.class ? `.${classes(el).join('.')}` : '';
        if (o.kind === 'instrument' && !o.found) {
          fail(`${page.route} <${el.name}${id} ${o.attr}> has no provenance chip (.prov[data-prov]) inside it`);
        }
        if (o.kind === 'hatch' && !o.found) {
          fail(`${page.route} <${el.name}${id}> is hatched with no .hatch-label. Hatching means "deliberately not shown"; say so.`);
        }
      }
    },
  });
}

if (bad) {
  console.error(`\ncheck-provenance: ${bad} problem(s)`);
  process.exit(1);
}
pass(
  'check-provenance',
  `${totals.instruments} instruments, each labeled (${totals.chips} chips: ${seen.build} build, ${seen.recorded} recorded, ${seen.illustration} illustration, none prerendered live), ${totals.hatches} hatched areas labeled`,
);
