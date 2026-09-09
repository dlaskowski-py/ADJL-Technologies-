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
import { HAS_WEBM } from '../media-manifest';

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

function source(name: string, kind: 'webm' | 'mp4'): HTMLSourceElement {
  const s = document.createElement('source');
  s.type = kind === 'webm' ? 'video/webm' : 'video/mp4';
  s.src = `/media/${name}.${kind}`;
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

  const wantsWebm = !forceMp4 && !PREFERS_H264 && HAS_WEBM.has(name);
  if (wantsWebm) v.append(source(name, 'webm'));
  v.append(source(name, 'mp4'));

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
