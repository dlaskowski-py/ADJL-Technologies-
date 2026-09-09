/**
 * Every film named in the markup exists on disk, in both codecs, with a
 * poster — and every film on disk is used by something.
 *
 * A missing .mp4 is a section with an invisible backdrop and no error
 * anywhere: the poster is also missing, so the element is simply empty, and
 * on a white site an empty backdrop looks like a design decision.
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { PAGES } from './pages.mjs';

/* The manifest is TypeScript, and importing it would mean either a build
   step for the checks or a Node flag that has changed twice in two releases.
   It is generated code with a known shape, so it is read as text. */
const manifest = readFileSync('src/media-manifest.ts', 'utf8');
const CLIPS = JSON.parse(/export const CLIPS = (\[[\s\S]*?\]) as const;/.exec(manifest)[1]);
const HAS_WEBM = new Set(
  JSON.parse(/export const HAS_WEBM = new Set<string>\((\[[\s\S]*?\])\);/.exec(manifest)[1]),
);
const HAS_WEBM_2K = new Set(
  JSON.parse(/export const HAS_WEBM_2K = new Set<string>\((\[[\s\S]*?\])\);/.exec(manifest)[1]),
);

const used = new Set();
for (const page of PAGES) {
  const html = readFileSync(page.out, 'utf8');
  for (const m of html.matchAll(/data-video="([^"]+)"/g)) used.add(m[1]);
}

let bad = 0;
let bytes = 0;

for (const name of used) {
  if (!CLIPS.includes(name)) {
    console.error(`check-media: "${name}" is used in markup but is not in the manifest`);
    bad++;
    continue;
  }
  for (const f of [`${name}.mp4`, `${name}@2k.mp4`, `${name}.jpg`]) {
    const p = `dist/media/${f}`;
    if (!existsSync(p)) {
      console.error(`check-media: ${p} is missing`);
      bad++;
    } else {
      bytes += statSync(p).size;
    }
  }
  for (const [set, suffix] of [[HAS_WEBM, ''], [HAS_WEBM_2K, '@2k']]) {
    if (set.has(name) && !existsSync(`dist/media/${name}${suffix}.webm`)) {
      console.error(
        `check-media: manifest says ${name}${suffix} has a VP9, but dist/media/${name}${suffix}.webm is missing`,
      );
      bad++;
    }
  }
}

for (const name of CLIPS) {
  if (!used.has(name)) {
    console.error(`check-media: "${name}" ships ${(statSync(`dist/media/${name}.mp4`).size / 1048576).toFixed(1)} MB and nothing uses it`);
    bad++;
  }
}

// The posters are what a reduced-motion visitor sees instead of the film, so
// a poster that failed to encode is a blank panel for exactly the people who
// asked for less motion.
for (const f of readdirSync('dist/media')) {
  if (statSync(`dist/media/${f}`).size === 0) {
    console.error(`check-media: dist/media/${f} is zero bytes`);
    bad++;
  }
}

if (bad) process.exit(1);
console.log(`check-media: ${used.size} films, all present, ${(bytes / 1048576).toFixed(1)} MB shipped`);
