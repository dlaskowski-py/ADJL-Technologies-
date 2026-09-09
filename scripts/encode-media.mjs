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
 * TWO SIZES, which is a change from the first version of this file.
 *
 * The original renders were 1470x630 and shipped as a single rendition,
 * because every tier above native would have been an upscale wearing a
 * bigger filename. The masters are now run through Seedance's upscaler to
 * 2560 wide, so there is real detail to serve and the ladder is back:
 *
 *   sm    1280   phones, and the framed plates, which are never more than
 *                about 660 CSS px wide — 1280 covers those at 2x DPR
 *   @2k   2560   the full-bleed heroes on a desktop or retina display
 *
 * There is deliberately no 4K tier. Going higher means asking the upscaler
 * for a 2.6x linear enlargement of a 0.93MP source, which invents detail
 * rather than recovering it, and then shipping two to three times the bytes
 * of it — for film that sits under a 93-98% opaque paper veil in the heroes
 * and inside small framed plates everywhere else. 2560 is the widest any
 * viewport actually asks these clips to cover.
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

/* The 1280 rung is served to phones and to the framed plates, where the
   film is small and close to the reader, so it gets the better quality. The
   2560 rung only ever plays full-bleed under a 93-98% opaque paper veil,
   where two more points of CRF are invisible and worth about a third of the
   file. */
const CRF = { '': { h264: 26, vp9: 34 }, '@2k': { h264: 29, vp9: 37 } };
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
  // `min(w,iw)` never enlarges: a master smaller than a rung simply produces
  // that rung at its own size rather than a blurry upscale.
  for (const [suffix, width] of [['', 1280], ['@2k', 2560]]) {
    const scale = `scale='min(${width},iw)':-2`;
    const q = CRF[suffix];
    run([
      '-i', pp, '-vf', scale,
      '-c:v', 'libx264', '-crf', String(q.h264), '-preset', 'slow',
      '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-movflags', '+faststart',
      '-an', join(OUT, `${name}${suffix}.mp4`),
    ]);
    run([
      '-i', pp, '-vf', scale,
      '-c:v', 'libvpx-vp9', '-crf', String(q.vp9), '-b:v', '0',
      '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2',
      '-an', join(OUT, `${name}${suffix}.webm`),
    ]);
  }

  run([
    '-ss', (seconds(pp) * POSTER_AT).toFixed(2), '-i', pp,
    '-frames:v', '1', '-q:v', '4', join(OUT, `${name}.jpg`),
  ]);

  const d = dims(join(OUT, `${name}@2k.mp4`));
  console.log(
    `${d ? `${String(d[0]).padStart(4)}x${d[1]}` : '?'}  ` +
      `sm ${mb(join(OUT, `${name}.mp4`)).toFixed(2)}/${mb(join(OUT, `${name}.webm`)).toFixed(2)}MB  ` +
      `2k ${mb(join(OUT, `${name}@2k.mp4`)).toFixed(2)}/${mb(join(OUT, `${name}@2k.webm`)).toFixed(2)}MB  ` +
      `poster ${mb(join(OUT, `${name}.jpg`)).toFixed(2)}MB`,
  );
}

/* ── Manifest ───────────────────────────────────────────────────────
   Written from the files that are actually on disk, so the markup can never
   drift from the media directory. VP9 is kept only where it beat the H.264,
   so the two sets are deliberately not the same. */

const names = [
  ...new Set(
    readdirSync(OUT)
      .filter((f) => f.endsWith('.mp4'))
      .map((f) => f.replace(/(@2k)?\.mp4$/, '')),
  ),
].sort();

const SIZES = {};
const webm = [];
const webm2k = [];
for (const n of names) {
  const entry = {};
  for (const [key, suffix] of [['sm', ''], ['@2k', '@2k']]) {
    const d = dims(join(OUT, `${n}${suffix}.mp4`));
    if (d) entry[key] = d;
  }
  SIZES[n] = entry;

  // Keep a VP9 only where it actually came out smaller than its H.264. A
  // bigger "more efficient" file served to Chrome is a pure loss, and VP9
  // loses on some of this footage.
  for (const [suffix, list] of [['', webm], ['@2k', webm2k]]) {
    const w = join(OUT, `${n}${suffix}.webm`);
    if (existsSync(w) && mb(w) < mb(join(OUT, `${n}${suffix}.mp4`))) list.push(n);
  }
}

writeFileSync(
  'src/media-manifest.ts',
  `/** Generated by scripts/encode-media.mjs — do not edit by hand.
 *
 *  SIZES carries every rendition's REAL pixel dimensions, so the player picks
 *  one by comparing them against the viewport rather than guessing from a
 *  width threshold. A new rendition is picked up automatically.
 *
 *  HAS_WEBM / HAS_WEBM_2K list the clips whose VP9 came out SMALLER than the
 *  H.264 at that size. The two sets are deliberately not the same: VP9 loses
 *  on some of this footage, and a larger "more efficient" file served to
 *  Chrome is a pure loss. */
export type Variant = 'sm' | '@2k';

export const SIZES: Record<string, Partial<Record<Variant, [number, number]>>> =
${JSON.stringify(SIZES, null, 2)};

export const HAS_WEBM = new Set<string>(${JSON.stringify(webm)});
export const HAS_WEBM_2K = new Set<string>(${JSON.stringify(webm2k)});

/** Every clip the build knows about. scripts/check-media.mjs asserts that
 *  every name used in the markup appears here and on disk. */
export const CLIPS = ${JSON.stringify(names)} as const;
`,
);

console.log(
  `\nmanifest: ${names.length} clips, VP9 kept for ${webm.length} at 1280 and ${webm2k.length} at 2560`,
);
