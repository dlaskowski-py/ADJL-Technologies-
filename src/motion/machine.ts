/**
 * [data-machine]: Machine View, measured again in your browser.
 *
 * The panel ships with a BUILD readout (sections/instruments/machine.ts,
 * from the page's own HTML at build). When it comes within 400 px of the
 * viewport (boot.ts lazy-loads this module then), it:
 *
 *   1. fetches this page once, the way a crawler would: no script run, no
 *      cache, no cookies: fetch(location.pathname, {cache: 'no-store',
 *      credentials: 'omit'})
 *   2. measures the response with the same function the build used
 *      (lib/measure.ts), plus what only a live fetch knows: status, time to
 *      first byte and bytes (raw, and gzip via CompressionStream)
 *   3. counts the words your browser rendered in <main> with the same
 *      exclusion set, for "words readable without JavaScript: N of M"
 *   4. HEAD-checks the machine-readable files and reads the markdown twin
 *      and this page's llms.txt line
 *   5. writes every value into its slot by key, marks anything that differs
 *      from BUILD with ▲ "Changed since build", flips the chip to Live and
 *      says so once in the panel's polite region
 *
 * Values are written in place (no re-render), so the readers radiogroup
 * keeps its state and nothing moves: every slot has a fixed width.
 *
 * Copy comes from the panel's data-copy attribute (written from
 * src/content.ts at build). This chunk imports no copy.
 */
import { domWords, measureHtml, type Measure } from '../lib/measure';
import { fmtInt, fmtKB, ldList, ldSig, ldSvg, outlineHtml, outlineSig } from '../sections/instruments/machine-kit';
import { flipChip } from './telemetry';

type Copy = {
  say: string;
  changed: string;
  live: string;
  liveDef: string;
  nr: string;
  nrTitle: string;
  budget: string;
  lines: string;
  links: string;
  missing: string;
};

const TWIN_LINES = 40;

const copyOf = (p: HTMLElement): Copy | null => {
  try {
    return JSON.parse(p.dataset.copy ?? '') as Copy;
  } catch {
    return null;
  }
};

const ms = (v: number) => (v < 1000 ? `${Math.round(v)} ms` : `${(v / 1000).toFixed(2)} s`);

async function gzipped(buf: ArrayBuffer): Promise<number | null> {
  if (typeof CompressionStream === 'undefined') return null;
  try {
    const s = new Blob([buf]).stream().pipeThrough(new CompressionStream('gzip'));
    return (await new Response(s).arrayBuffer()).byteLength;
  } catch {
    return null;
  }
}

type Live = {
  status: number;
  ttfb: number | null;
  raw: number;
  gz: number | null;
  m: Measure;
  dom: number;
};

async function fetchPage(): Promise<Live | null> {
  const url = new URL(location.pathname, location.href).href;
  const t0 = performance.now();
  let res: Response;
  try {
    res = await fetch(location.pathname, { cache: 'no-store', credentials: 'omit' });
  } catch {
    return null;
  }
  const head = performance.now() - t0;
  const buf = await res.arrayBuffer();
  const html = new TextDecoder().decode(buf);
  /* Time to first byte of THIS fetch, from Resource Timing when the
     browser exposes it, else from when the response headers arrived. */
  const entry = (performance.getEntriesByName(url) as PerformanceResourceTiming[]).filter((e) => e.startTime >= t0 - 1).pop();
  const ttfb = entry && entry.responseStart > 0 ? entry.responseStart - entry.startTime : head;
  const main = document.querySelector('main');
  return {
    status: res.status,
    ttfb,
    raw: buf.byteLength,
    gz: await gzipped(buf),
    m: measureHtml(html, location.origin),
    dom: main ? domWords(main) : 0,
  };
}

/** One file's status and size, by HEAD. An HTML answer for a file that
 *  isn't HTML is a fallback page, not the file: reported as missing. */
async function head(path: string): Promise<{ status: number; bytes: number | null; enc: string; html: boolean } | null> {
  try {
    const r = await fetch(path, { method: 'HEAD', cache: 'no-store', credentials: 'omit' });
    const len = r.headers.get('content-length');
    const type = r.headers.get('content-type') ?? '';
    return {
      status: r.status,
      bytes: len !== null && len !== '' ? Number(len) : null,
      enc: r.headers.get('content-encoding') ?? '',
      html: /text\/html/i.test(type) && !/\.html?$|\/$/.test(path),
    };
  } catch {
    return null;
  }
}

async function text(path: string): Promise<string | null> {
  try {
    const r = await fetch(path, { cache: 'no-store', credentials: 'omit' });
    if (!r.ok || /text\/html/i.test(r.headers.get('content-type') ?? '')) return null;
    return await r.text();
  } catch {
    return null;
  }
}

/* ── Writing into the panel ────────────────────────────────────────── */

function marker(slot: Element, c: Copy): void {
  if (slot.querySelector('[data-delta]')) return;
  const d = document.createElement('span');
  d.dataset.delta = '';
  d.title = c.changed;
  d.textContent = '▲';
  slot.append(' ', d);
}

/** Fill a live-only slot ("needs JS" until now). */
function fill(p: HTMLElement, k: string, value: string, c: Copy, title = c.liveDef): void {
  p.querySelectorAll<HTMLElement>(`[data-k="${CSS.escape(k)}"]`).forEach((el) => {
    el.textContent = value;
    el.title = title;
    delete el.dataset.nojs;
    el.dataset.live = '';
  });
}

/** Compare a BUILD slot with its live value; on a difference, write the
 *  live one (via `write`) and mark it. */
function check(p: HTMLElement, k: string, live: string, c: Copy, write?: (el: HTMLElement) => void): void {
  p.querySelectorAll<HTMLElement>(`[data-k="${CSS.escape(k)}"]`).forEach((el) => {
    el.dataset.live = '';
    if (el.dataset.v === undefined || el.dataset.v === live) return;
    el.dataset.v = live;
    write?.(el);
    marker(el, c);
  });
}

function budget(el: HTMLElement, value: string, max: number, c: Copy): void {
  const n = [...value].length;
  const q = el.querySelector('[data-text]');
  if (q) q.textContent = value;
  const bar = el.querySelector<HTMLElement>('[data-meter] i');
  bar?.style.setProperty('--f', Math.min(1, n / max).toFixed(3));
  const num = el.querySelector('[data-n]');
  if (num) num.textContent = `${n} ${c.budget.replace('{n}', String(max))}`;
}

function paint(p: HTMLElement, L: Live, c: Copy): void {
  const m = L.m;
  fill(p, 'status', String(L.status), c);
  fill(p, 'ttfb', L.ttfb === null ? c.nr : ms(L.ttfb), c, L.ttfb === null ? c.nrTitle : c.liveDef);
  fill(p, 'bytes', `${fmtKB(L.raw)} raw · ${L.gz === null ? c.nr : `${fmtKB(L.gz)} gz`}`, c);

  check(p, 'title', m.title, c, (el) => budget(el, m.title, 60, c));
  check(p, 'description', m.description, c, (el) => budget(el, m.description, 160, c));
  check(p, 'canonical', m.canonical, c, (el) => (el.querySelector('code')!.textContent = m.canonical));
  check(p, 'robots', m.robots, c, (el) => (el.querySelector('code')!.textContent = m.robots || el.textContent!));
  check(p, 'h1', String(m.h1), c, (el) => (el.firstChild!.textContent = String(m.h1)));
  check(p, 'hcount', String(m.headings.length), c, (el) => (el.firstChild!.textContent = fmtInt(m.headings.length)));
  check(p, 'links', `${m.links.internal}/${m.links.targets}`, c, (el) => {
    el.firstChild!.textContent = `${c.links.replace('{n}', fmtInt(m.links.internal)).replace('{u}', fmtInt(m.links.targets))} `;
  });
  check(p, 'outline', outlineSig(m.headings), c, (el) => {
    el.innerHTML = outlineHtml(m.headings);
  });
  check(p, 'ld', ldSig(m.ld), c, (el) => {
    const svg = el.querySelector('svg');
    let n = 0;
    const label = (svg?.getAttribute('aria-label') ?? '').replace(/\d+/g, () => String(n++ ? m.ld.edges.length : m.ld.nodes.length));
    const box = el.querySelector('[data-svg]');
    if (box) box.innerHTML = ldSvg(m.ld, label, location.origin);
    el.querySelector('[data-ld-list]')?.replaceWith(
      Object.assign(document.createElement('div'), { innerHTML: ldList(m.ld, '', location.origin) }).firstElementChild!,
    );
  });
  check(p, 'says', ldSig(m.ld), c);

  /* The parity meter: N from the fetched HTML, M from the live <main>. */
  check(p, 'words', String(m.words), c, (el) => (el.firstChild!.textContent = fmtInt(m.words)));
  const N = m.words;
  const M = L.dom;
  const top = Math.max(N, M, 1);
  fill(p, 'dom', fmtInt(M), c);
  fill(p, 'dom2', fmtInt(M), c);
  p.querySelectorAll<HTMLElement>('[data-k="pct"]').forEach((el) => {
    el.textContent = M ? `(${Math.round((Math.min(N, M) / M) * 100)}%)` : '';
  });
  p.querySelectorAll<HTMLElement>('[data-k="rawbar"]').forEach((el) => el.style.setProperty('--f', (N / top).toFixed(3)));
  p.querySelectorAll<HTMLElement>('[data-k="dombar"]').forEach((el) => {
    el.style.setProperty('--f', (M / top).toFixed(3));
    delete el.parentElement!.dataset.empty;
  });
  p.querySelectorAll<HTMLElement>('[data-bar="raw"] [data-bn]').forEach((el) => (el.textContent = fmtInt(N)));
}

async function surfaces(panels: HTMLElement[], c: Copy): Promise<void> {
  const paths = new Set<string>();
  panels.forEach((p) => p.querySelectorAll<HTMLElement>('[data-surface]').forEach((li) => paths.add(li.dataset.surface!)));
  await Promise.all(
    [...paths].map(async (path) => {
      const r = await head(path);
      for (const p of panels) {
        if (!r) {
          fill(p, `s:${path}`, c.nr, c, c.nrTitle);
          continue;
        }
        if (r.html || r.status === 404) {
          fill(p, `s:${path}`, `${r.status === 404 ? 404 : r.status} · ${c.missing}`, c);
          p.querySelectorAll(`[data-k="s:${CSS.escape(path)}"]`).forEach((el) => {
            (el as HTMLElement).dataset.bad = '';
            marker(el, c);
          });
          continue;
        }
        fill(p, `s:${path}`, String(r.status), c);
        /* Bytes: what the server says it sent. A compressed answer isn't
           the file's size on disk, so it's labeled with its encoding and
           never compared with BUILD. */
        if (r.bytes === null) continue;
        const shown = `${fmtKB(r.bytes)}${r.enc ? ` ${r.enc}` : ''}`;
        p.querySelectorAll<HTMLElement>(`[data-k="b:${CSS.escape(path)}"]`).forEach((el) => {
          const build = el.dataset.v;
          if (build === undefined) {
            el.textContent = shown;
            el.title = c.liveDef;
            delete el.dataset.nojs;
          } else if (!r.enc && String(r.bytes) !== build) {
            el.textContent = shown;
            marker(el, c);
          }
          el.dataset.live = '';
        });
      }
    }),
  );
}

async function answers(panels: HTMLElement[], m: Measure, c: Copy): Promise<void> {
  const want = panels.filter((p) => p.querySelector('[data-k="twin"], [data-k="llms"]'));
  if (!want.length) return;
  const twinUrl = m.twin || `${location.pathname}index.md`;
  const [twin, llms] = await Promise.all([text(twinUrl), text('/llms.txt')]);
  for (const p of want) {
    if (twin !== null) {
      const head = twin.split('\n').slice(0, TWIN_LINES).join('\n');
      const pre = p.querySelector<HTMLElement>('[data-k="twin"]');
      if (pre?.dataset.nojs !== undefined) {
        pre.textContent = head;
        delete pre.dataset.nojs;
        pre.title = c.liveDef;
        fill(p, 'tokens', `≈ ${fmtInt(twin.length / 4)}`, c);
      } else check(p, 'twin', String(twin.length), c, (el) => (el.textContent = head));
      check(p, 'tokens', String(Math.round(twin.length / 4)), c, (el) => (el.textContent = `≈ ${fmtInt(twin.length / 4)}`));
    }
    if (llms !== null) {
      const canon = m.canonical;
      const line = llms.split('\n').find((l) => (canon && l.includes(`](${canon})`)) || l.includes(`](${location.origin}${location.pathname})`));
      const code = p.querySelector<HTMLElement>('[data-k="llms"]');
      if (line && code?.dataset.nojs !== undefined) fill(p, 'llms', line.trim(), c);
      else if (line) check(p, 'llms', line.trim(), c, (el) => (el.textContent = line.trim()));
    }
  }
}

let started = false;

async function goLive(panels: HTMLElement[]): Promise<void> {
  if (started) return;
  started = true;
  const c = copyOf(panels[0]);
  if (!c) return;
  const live = await fetchPage();
  if (!live) return;
  for (const p of panels) {
    paint(p, live, c);
    flipChip(p.querySelector('.panel-head > .prov'));
    p.dataset.state = 'live';
  }
  await Promise.all([surfaces(panels, c), answers(panels, live.m, c)]);
  /* One sentence, once per page, in the first panel's polite region. */
  const say = panels[0].querySelector<HTMLElement>('[data-machine-say]');
  if (say) say.textContent = c.say;
}

/** The readers radiogroup: CSS switches panes with :has(); this mirrors the
 *  choice into data-on for browsers without it. */
function readers(p: HTMLElement): void {
  const fs = p.querySelector('[data-readers]');
  if (!fs) return;
  const sync = () => {
    const on = fs.querySelector<HTMLInputElement>('input:checked');
    if (on) p.dataset.on = on.value;
  };
  fs.addEventListener('change', sync);
  sync();
}

export async function initMachine(): Promise<void> {
  const panels = Array.from(document.querySelectorAll<HTMLElement>('[data-machine]'));
  if (!panels.length) return;

  /* DEV ONLY: the dev server mounts pages client-side and never runs the
     build's prerender hooks, so the BUILD readout isn't there. Draw it from
     the page as mounted. Dropped from production builds. */
  if (import.meta.env.DEV) {
    const r = await import('../sections/instruments/machine');
    const m = measureHtml(document.documentElement.outerHTML, location.origin);
    for (const p of panels) {
      const body = p.querySelector<HTMLElement>('[data-machine-readout]');
      if (body && !body.firstElementChild) body.innerHTML = r.renderMachineReadout(m, body.dataset.machineReadout as never);
    }
  }

  panels.forEach(readers);
  await goLive(panels);
}
