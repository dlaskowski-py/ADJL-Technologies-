/**
 * Turns the raw Seedance renders into the renditions the site ships.
 *
 * Three things happen to every clip, and each is load-bearing:
 *
 *   1. PING-PONG. The generator returns a four-second clip whose last frame
 *      has nothing to do with its first, so looping it jumps every four
 *      seconds — the one artefact that reads instantly as "stock loop".
 *      Concatenating the clip with its own reverse gives an eight-second
 *      loop that is seamless by construction: the last frame IS the first.
 *      The reversed half drops its own first frame, or the turnaround frame
 *      is held for two frames and stutters at exactly the moment the loop
 *      is trying to hide.
 *
 *   2. RE-ENCODE, at web bitrate. The renders arrive at roughly 8 Mbps for
 *      four seconds. These are backdrops under a paper veil; that bitrate
 *      buys nothing anyone can see and costs seconds on a phone.
 *
 *   3. A POSTER, lifted from 40% into the clip rather than from frame zero
 *      — on a render that fades in, frame zero is a blank screen, and the
 *      poster is exactly what a reduced-motion visitor sees instead of the
 *      film.
 *
 * ONE SIZE, deliberately. Capital ships a 1280/2560/3840 ladder because its
 * masters are 4K. These renders are 1470x630 native, so every tier above
 * native would be an upscale wearing a bigger filename, and the tier below
 * would save about a fifth of the pixels for a second file to keep in step.
 * The film is used two ways here — behind a 95%-opaque paper veil in the
 * hero, and inside framed plates about 1100px wide — and native is
 * comfortably sharp for both. If the masters are ever re-rendered larger,
 * this is the place a ladder goes back in.
 *
 * ffmpeg comes from `npm i --no-save ffmpeg-static`, deliberately not a
 * dependency: Netlify installs devDependencies, and the build has no use
 * for a 77 MB binary.
 *
 * Usage:  node scripts/encode-media.mjs name=url [name=url ...]
 */

import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, statSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const FFMPEG = (await import('ffmpeg-static')).default;
const OUT = 'public/media';
const TMP = '/tmp/adjl-tech-encode';

const H264_CRF = 26;
const VP9_CRF = 34;
/** Where the poster frame is lifted from, as a fraction of the loop. */
const POSTER_AT = 0.22;

const pairs = process.argv.slice(2).map((a) => {
  const at = a.indexOf('=');
  if (at < 0) {
    console.error(`encode-media: "${a}" is not name=url`);
    process.exit(2);
  }
  return { name: a.slice(0, at), url: a.slice(at + 1) };
});

if (!pairs.length) {
  console.error('Usage: node scripts/encode-media.mjs name=url [name=url ...]');
  process.exit(2);
}

mkdirSync(TMP, { recursive: true });
mkdirSync(OUT, { recursive: true });

const mb = (p) => statSync(p).size / 1048576;
const run = (args) => execFileSync(FFMPEG, ['-y', '-hide_banner', '-loglevel', 'error', ...args]);

/**
 * `ffmpeg -i file` with no output prints the stream table and then exits 1,
 * because "at least one output file must be specified" — that non-zero exit
 * is the documented behaviour, not a failure, so it has to be caught rather
 * than allowed to throw. (This is what ffprobe is for; ffmpeg-static does
 * not ship one, and pulling a second 77 MB binary to read two integers is
 * not worth it.)
 */
function probe(file) {
  try {
    return execFileSync(FFMPEG, ['-hide_banner', '-i', file], {
      stdio: ['ignore', 'pipe', 'pipe'],
      encoding: 'utf8',
    });
  } catch (err) {
    return String(err.stderr ?? '');
  }
}

function dims(file) {
  const m = /Video:.*?,\s(\d{2,5})x(\d{2,5})[\s,]/.exec(probe(file));
  return m ? [Number(m[1]), Number(m[2])] : null;
}

function seconds(file) {
  const m = /Duration:\s*(\d+):(\d+):([\d.]+)/.exec(probe(file));
  return m ? +m[1] * 3600 + +m[2] * 60 + +m[3] : 8;
}

for (const { name, url } of pairs) {
  const src = join(TMP, `${name}.src.mp4`);
  const pp = join(TMP, `${name}.pingpong.mp4`);
  process.stdout.write(`  ${name.padEnd(10)} `);

  const res = await fetch(url);
  if (!res.ok) {
    console.log(`FAILED download (${res.status})`);
    continue;
  }
  writeFileSync(src, Buffer.from(await res.arrayBuffer()));
  process.stdout.write(`${mb(src).toFixed(1)}MB in  `);

  run([
    '-i', src,
    '-filter_complex',
    "[0:v]split[a][b];[b]reverse,select='gt(n,0)'[r];[a][r]concat=n=2:v=1[out]",
    '-map', '[out]',
    '-c:v', 'libx264', '-crf', '16', '-preset', 'veryfast', '-pix_fmt', 'yuv420p',
    '-an', pp,
  ]);

  // -an everywhere: these are silent backdrops. An empty audio track is bytes,
  // plus a reason for some browsers to demand a user gesture before playing.
  run([
    '-i', pp,
    '-c:v', 'libx264', '-crf', String(H264_CRF), '-preset', 'slow',
    '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-movflags', '+faststart',
    '-an', join(OUT, `${name}.mp4`),
  ]);
  run([
    '-i', pp,
    '-c:v', 'libvpx-vp9', '-crf', String(VP9_CRF), '-b:v', '0',
    '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2',
    '-an', join(OUT, `${name}.webm`),
  ]);

  run([
    '-ss', (seconds(pp) * POSTER_AT).toFixed(2), '-i', pp,
    '-frames:v', '1', '-q:v', '4', join(OUT, `${name}.jpg`),
  ]);

  const d = dims(join(OUT, `${name}.mp4`));
  console.log(
    `${d ? `${d[0]}x${d[1]}` : '?'}  mp4 ${mb(join(OUT, `${name}.mp4`)).toFixed(2)}MB  ` +
      `webm ${mb(join(OUT, `${name}.webm`)).toFixed(2)}MB  ` +
      `poster ${mb(join(OUT, `${name}.jpg`)).toFixed(2)}MB`,
  );
}

/* ── Manifest ───────────────────────────────────────────────────────
   Written from the files that are actually on disk, so the markup can never
   drift from the media directory. VP9 is kept only where it beat the H.264,
   so the two sets are deliberately not the same. */

const names = [
  ...new Set(readdirSync(OUT).filter((f) => f.endsWith('.mp4')).map((f) => f.replace(/\.mp4$/, ''))),
].sort();

const SIZES = {};
const webm = [];
for (const n of names) {
  const d = dims(join(OUT, `${n}.mp4`));
  if (d) SIZES[n] = d;
  const w = join(OUT, `${n}.webm`);
  // Keep the VP9 only where it is actually smaller — a bigger "efficient"
  // file served to Chrome is a pure loss.
  if (existsSync(w) && mb(w) < mb(join(OUT, `${n}.mp4`))) webm.push(n);
}

writeFileSync(
  'src/media-manifest.ts',
  `/** Generated by scripts/encode-media.mjs — do not edit by hand.
 *
 *  SIZES carries each clip's real pixel dimensions so the player can decide
 *  whether a film is worth loading at all on a given viewport, rather than
 *  guessing from a width threshold.
 *
 *  HAS_WEBM lists the clips whose VP9 came out SMALLER than their H.264.
 *  It is not every clip: VP9 loses on some of this footage, and shipping a
 *  larger "more efficient" file to Chrome is a pure loss. */
export const SIZES: Record<string, [number, number]> = ${JSON.stringify(SIZES, null, 2)};

export const HAS_WEBM = new Set<string>(${JSON.stringify(webm)});

/** Every clip the build knows about. scripts/check-media.mjs asserts that
 *  every name used in the markup appears here and on disk. */
export const CLIPS = ${JSON.stringify(names)} as const;
`,
);

console.log(`\nmanifest: ${names.length} clips, ${webm.length} with a smaller VP9`);
