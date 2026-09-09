/**
 * The console demo — a scripted terminal that types a request and streams a
 * reply back, once, when it scrolls into view.
 *
 * This exists because "paste a listing URL and it underwrites the property"
 * is a sentence, and a sentence is easy to disbelieve. Watching the address
 * resolve, the records come back and the numbers land is the same claim with
 * its working shown.
 *
 * IT IS A RECORDING, NOT A LIVE PRODUCT, and the markup says so in a caption
 * that is not part of the animation — the whole site is built on not
 * overstating what exists, and an animated fake presented as a live tool
 * would undo that on the one section most likely to be believed.
 *
 * Markup contract: [data-console] wrapping .con-out, with the script carried
 * in a <script type="application/json" class="con-script"> so the lines live
 * in the content module with the rest of the copy.
 *
 * The replay control exists because the demo runs once, and the one time it
 * runs is while the reader is still arriving at the section — look away for
 * four seconds and there is otherwise no way back to it.
 */

import { tier } from './prefs';

type Line = {
  /** 'in' types character by character; 'out' and 'note' appear whole. */
  kind: 'in' | 'out' | 'note' | 'kv';
  text?: string;
  k?: string;
  v?: string;
  /** Milliseconds to wait before this line starts. */
  wait?: number;
};

const CHAR_MS = 26;
const LINE_GAP = 320;

const sleep = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

function render(line: Line): HTMLElement {
  const el = document.createElement('div');
  /* 'out' would render as .con-out, which is ALSO the class on the scrolling
     container this line is appended into — so the container's padding and
     max-height would apply to a single line of text. Mapped to a distinct
     class rather than fixed with specificity, because the collision is a
     naming bug and hiding it would leave the next kind to trip over it. */
  const cls = line.kind === 'out' ? 'con-result' : `con-${line.kind}`;
  el.className = `con-line ${cls}`;

  if (line.kind === 'kv') {
    el.innerHTML =
      `<span class="con-k">${line.k ?? ''}</span><span class="con-dots"></span>` +
      `<span class="con-v num">${line.v ?? ''}</span>`;
    return el;
  }

  if (line.kind === 'in') {
    el.innerHTML = `<span class="con-prompt" aria-hidden="true">&rsaquo;</span><span class="con-text"></span>`;
    return el;
  }

  el.textContent = line.text ?? '';
  return el;
}

async function play(root: HTMLElement, lines: Line[]): Promise<void> {
  const out = root.querySelector<HTMLElement>('.con-out');
  if (!out) return;
  out.textContent = '';

  for (const line of lines) {
    if (line.wait) await sleep(line.wait);

    const el = render(line);
    out.append(el);

    if (line.kind === 'in') {
      const target = el.querySelector<HTMLElement>('.con-text');
      const text = line.text ?? '';
      root.classList.add('is-typing');
      for (let i = 1; i <= text.length; i++) {
        if (target) target.textContent = text.slice(0, i);
        await sleep(CHAR_MS);
      }
      root.classList.remove('is-typing');
    }

    requestAnimationFrame(() => {
      out.scrollTop = out.scrollHeight;
    });
    await sleep(LINE_GAP);
  }

  root.classList.add('is-done');
}

/** Show the whole transcript at once, with no typing. */
function showAll(root: HTMLElement, lines: Line[]): void {
  const out = root.querySelector<HTMLElement>('.con-out');
  if (!out) return;
  out.textContent = '';
  for (const line of lines) {
    const el = render(line);
    if (line.kind === 'in') {
      const t = el.querySelector<HTMLElement>('.con-text');
      if (t) t.textContent = line.text ?? '';
    }
    out.append(el);
  }
  root.classList.add('is-done');
}

export function initConsole(): void {
  const roots = Array.from(document.querySelectorAll<HTMLElement>('[data-console]'));
  if (!roots.length) return;

  for (const root of roots) {
    const raw = root.querySelector('.con-script')?.textContent;
    if (!raw) continue;

    let lines: Line[];
    try {
      lines = JSON.parse(raw) as Line[];
    } catch {
      continue;
    }

    /* Registered BEFORE the tier branch. It used to sit after it, so in the
       reduced tier the button was rendered, made visible by .is-done, and
       wired to nothing — a control that looks live and does nothing when
       pressed is worse than one that is not there. In this tier it re-lays
       the finished transcript, which is the honest equivalent of a replay. */
    root.querySelector('[data-console-replay]')?.addEventListener('click', () => {
      if (tier === 'reduced') {
        showAll(root, lines);
        return;
      }
      root.classList.remove('is-done');
      void play(root, lines);
    });

    if (tier === 'reduced') {
      showAll(root, lines);
      continue;
    }

    let played = false;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting || played) continue;
          played = true;
          io.disconnect();
          void play(root, lines);
        }
      },
      { threshold: 0.4 },
    );
    io.observe(root);
  }
}
