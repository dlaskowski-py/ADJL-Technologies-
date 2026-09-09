/**
 * Backdrop film lifecycle.
 *
 * Each .backdrop starts as a poster image and nothing else — no <video> in
 * the DOM, so no network cost at all. The source is attached when the
 * section comes within about a viewport, and playback pauses whenever it
 * leaves, so at most a couple of clips are decoding at any moment however
 * long the page gets.
 *
 * Markup contract:
 *   <div class="backdrop" data-video="lumen" [data-webm="true"]>
 *     <img class="bd-poster" src="/media/lumen.jpg" alt="">
 *   </div>
 */

import { allowVideo, whileVisible } from './prefs';
import { HAS_WEBM, HAS_WEBM_2K, SIZES, type Variant } from '../media-manifest';

/**
 * Which rendition a given backdrop actually needs.
 *
 * Measured against THE ELEMENT, not the viewport, and that distinction is
 * most of the page weight. The films appear two ways: full-bleed behind a
 * hero, where the box really is the whole window, and inside framed plates
 * on the work cards, which are about 660 CSS px wide. Sizing everything to
 * the viewport hands those plates the 2560 file to display at a quarter of
 * its width — on the home page alone that is five clips at the top rung
 * when only one of them is anywhere near full size.
 *
 * It is not a width threshold either. The manifest carries every rendition's
 * real dimensions, so this asks what the box needs to COVER and takes the
 * smallest file that does not have to be enlarged to do it. Height matters
 * as much as width: these films are 2.33:1 and a hero is nearer 1.6:1, so
 * `object-fit: cover` fills the height and crops the width, which means the
 * row count decides whether a clip looks sharp.
 *
 * Decided ONCE per element, at attach time. Re-picking on resize would
 * restart the clip mid-scroll, which is a worse experience than a slightly
 * wrong rendition.
 */
const DPR = Math.min(window.devicePixelRatio || 1, 2);

function metered(): boolean {
  const conn = (navigator as unknown as { connection?: { saveData?: boolean; effectiveType?: string } })
    .connection;
  if (conn?.saveData) return true;
  return !!conn?.effectiveType && /(^|-)(2g|slow-2g)$/.test(conn.effectiveType);
}
const METERED = metered();

/**
 * Smallest rendition that needs no meaningful enlargement, else the largest
 * available. On a metered connection the top rung is skipped outright — a
 * slightly soft backdrop is a far better trade than a 3 MB download on a
 * connection that is telling you it cannot afford one.
 */
function pickVariant(name: string, host: HTMLElement): Variant {
  const sizes = SIZES[name] ?? {};
  const ladder: Variant[] = METERED ? ['sm'] : ['sm', '@2k'];
  const available = ladder.filter((v) => sizes[v]);
  if (!available.length) return 'sm';

  const r = host.getBoundingClientRect();
  // A box with no layout yet (display:none ancestor) falls back to the
  // viewport rather than to zero, which would always pick the smallest file.
  const needW = (r.width || window.innerWidth) * DPR;
  const needH = (r.height || window.innerHeight) * DPR;
  const coverScale = (size: [number, number] | undefined) =>
    size ? Math.max(needW / size[0], needH / size[1]) : Infinity;

  return (
    available.find((v) => coverScale(sizes[v]) <= 1.05) ?? available[available.length - 1]
  );
}

/** Variant to filename suffix. 'sm' is the unsuffixed file. */
const suffixOf = (v: Variant): string => (v === 'sm' ? '' : v);

/**
 * Which codec this engine decodes in HARDWARE.
 *
 * Apple has never shipped a VP9 hardware decoder, but Safari still answers
 * "probably" to canPlayType for VP9 and will happily decode it in software.
 * Ordering the sources VP9-first because VP9 files are smaller therefore
 * hands every iPhone a software decode — a warm phone to save 200 kB.
 * Chromium and Firefox hardware-decode both, so they keep the smaller file.
 * canPlayType cannot express that difference, so it is decided here.
 */
const PREFERS_H264 =
  /AppleWebKit/.test(navigator.userAgent) && !/Chrome|Chromium|Edg|OPR/.test(navigator.userAgent);

/** How long a clip may sit at readyState 0 before it counts as stuck. */
const STALL_MS = 6000;

function source(name: string, kind: 'webm' | 'mp4', variant: string): HTMLSourceElement {
  const s = document.createElement('source');
  s.type = kind === 'webm' ? 'video/webm' : 'video/mp4';
  s.src = `/media/${name}${variant}.${kind}`;
  return s;
}

function attach(host: HTMLElement, forceMp4 = false): HTMLVideoElement | null {
  const name = host.dataset.video;
  if (!name) return null;

  const v = document.createElement('video');
  v.muted = true;
  v.loop = true;
  v.playsInline = true;
  v.preload = 'auto';
  /* iOS honours the ATTRIBUTES, not only the properties, when deciding
     whether a clip may start without a tap. Setting both is not belt and
     braces; the property alone does not autoplay on iOS. */
  v.setAttribute('muted', '');
  v.setAttribute('playsinline', '');
  v.setAttribute('aria-hidden', 'true');
  v.setAttribute('tabindex', '-1');
  v.setAttribute('disablepictureinpicture', '');

  const variant = pickVariant(name, host);
  const suffix = suffixOf(variant);
  // The VP9 sets are per-size and deliberately not identical — see the
  // manifest header.
  const hasWebm = variant === 'sm' ? HAS_WEBM.has(name) : HAS_WEBM_2K.has(name);

  const wantsWebm = !forceMp4 && !PREFERS_H264 && hasWebm;
  if (wantsWebm) v.append(source(name, 'webm', suffix));
  v.append(source(name, 'mp4', suffix));

  v.addEventListener(
    'playing',
    () => {
      host.classList.add('is-playing');
    },
    { once: true },
  );

  host.append(v);

  /* If the chosen codec never reaches readyState 1, fall back to the H.264
     once. A silent poster is a legitimate end state — better a still than a
     spinner — but it should not be the end state merely because a VP9 file
     failed to decode on an engine that claimed it could. */
  if (wantsWebm) {
    window.setTimeout(() => {
      if (v.readyState === 0 && v.isConnected) {
        v.remove();
        host.classList.remove('is-playing');
        const fallback = attach(host, true);
        fallback?.play().catch(() => {});
      }
    }, STALL_MS);
  }

  return v;
}

export function initVideo(): void {
  const hosts = Array.from(document.querySelectorAll<HTMLElement>('.backdrop[data-video]'));
  if (!hosts.length || !allowVideo) return;

  for (const host of hosts) {
    let video: HTMLVideoElement | null = null;

    whileVisible(
      host,
      () => {
        if (!video) video = attach(host);
        // A rejected play() is normal — an autoplay policy, a tab that was
        // never interacted with. The poster stays and nothing is broken.
        video?.play().catch(() => {});
      },
      () => {
        video?.pause();
      },
      '300px',
    );
  }
}
