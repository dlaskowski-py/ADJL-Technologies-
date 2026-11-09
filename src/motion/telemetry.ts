/**
 * Telemetry: this page, measured in the visitor's own browser.
 *
 * Markup contract: [data-telemetry] on the status bar (every page) and on
 * the large panels. Every [data-metric="<key>"] on the page is a slot (the
 * Machine View's People reader has some too). BUILD slots (html, css, js)
 * were filled by scripts/stamp-sizes.mjs and are left alone; 3rd-party has
 * a BUILD value that a live reading replaces; the rest prerender as
 * "needs JS" and get a reading as soon as the browser reports one.
 *
 * Every number here is read from the Performance APIs at the moment the
 * visitor is looking at it. None of it is a figure we typed, which is the
 * only way a performance number can appear on this site at all. A browser
 * that doesn't expose a metric gets "n/r" and says why: we won't guess.
 *
 * Rules (spec §3.4):
 *   - updates are throttled to one write per 500 ms, and values never
 *     count up: a slot shows a reading or it doesn't
 *   - ratings use web.dev's thresholds and always carry the word
 *   - a slot's provenance flips to Live when its first reading lands
 *   - every tier, because it's measurement, not motion; no live region
 *
 * Copy comes from the markup (data-copy, written from src/content.ts at
 * build), so this module, which is in every page's first load, carries no
 * copy of its own.
 */
import { onMotionChange, tier as initialTier } from './prefs';

type Rating = 'good' | 'ok' | 'poor';
type Copy = {
  needs: string;
  needsTitle: string;
  nr: string;
  nrTitle: string;
  cached: string;
  rate: Record<Rating, string>;
  live: string;
  liveDef: string;
  none: string;
  noneTitle: string;
};

/** web.dev thresholds: good at or below the first, poor above the second. */
const LIMITS: Record<string, [number, number]> = {
  ttfb: [800, 1800],
  lcp: [2500, 4000],
  cls: [0.1, 0.25],
  inp: [200, 500],
};

const ms = (v: number) => (v < 1000 ? `${Math.round(v)} ms` : `${(v / 1000).toFixed(2)} s`);
const kb = (v: number) => (v < 1024 * 1024 ? `${(v / 1024).toFixed(1)} kB` : `${(v / 1048576).toFixed(2)} MB`);
const int = (v: number) => Math.round(v).toLocaleString('en-US');

const FORMAT: Record<string, (v: number) => string> = {
  ttfb: ms,
  lcp: ms,
  inp: ms,
  cls: (v) => v.toFixed(3),
  transfer: kb,
  requests: int,
  thirdparty: int,
  cookies: int,
  dom: int,
};

/** A reading, or a reason there isn't one. */
export type Reading = { value: number } | { text: 'nr' | 'none' | 'cached' | string };

const listeners: ((key: string, r: Reading) => void)[] = [];
const latest = new Map<string, Reading>();

function emit(key: string, r: Reading): void {
  latest.set(key, r);
  for (const fn of listeners) fn(key, r);
}

/** Subscribe to readings, past and future. Machine View's People reader
 *  draws from these instead of observing the browser a second time. */
export function onMetric(fn: (key: string, r: Reading) => void): void {
  listeners.push(fn);
  latest.forEach((r, k) => fn(k, r));
}

export function rate(key: string, value: number): Rating | null {
  const lim = LIMITS[key];
  if (!lim) return null;
  return value <= lim[0] ? 'good' : value <= lim[1] ? 'ok' : 'poor';
}

const supported = (type: string): boolean =>
  typeof PerformanceObserver !== 'undefined' &&
  (PerformanceObserver.supportedEntryTypes ?? []).includes(type);

function observe(type: string, cb: (entries: PerformanceEntry[]) => void, extra: object = {}): boolean {
  if (!supported(type)) return false;
  try {
    new PerformanceObserver((list) => cb(list.getEntries())).observe({
      type,
      buffered: true,
      ...extra,
    } as PerformanceObserverInit);
    return true;
  } catch {
    return false;
  }
}

let started = false;

function start(): void {
  if (started) return;
  started = true;

  const nav = performance.getEntriesByType?.('navigation')[0] as PerformanceNavigationTiming | undefined;
  if (nav) {
    const act = (nav as PerformanceNavigationTiming & { activationStart?: number }).activationStart ?? 0;
    emit('ttfb', { value: Math.max(0, nav.responseStart - Math.max(act, nav.startTime)) });
  } else emit('ttfb', { text: 'nr' });

  if (
    !observe('largest-contentful-paint', (es) => {
      const last = es[es.length - 1];
      if (last) emit('lcp', { value: last.startTime });
    })
  )
    emit('lcp', { text: 'nr' });

  /* CLS as browsers define it since 2021: the largest session window of
     shifts no more than 1 s apart and no longer than 5 s, ignoring shifts
     right after input. */
  let cls = 0;
  let win = 0;
  let winStart = 0;
  let winLast = 0;
  const hasCls = observe('layout-shift', (es) => {
    for (const e of es as (PerformanceEntry & { value: number; hadRecentInput: boolean })[]) {
      if (e.hadRecentInput) continue;
      if (win && e.startTime - winLast < 1000 && e.startTime - winStart < 5000) win += e.value;
      else {
        win = e.value;
        winStart = e.startTime;
      }
      winLast = e.startTime;
      if (win > cls) {
        cls = win;
        emit('cls', { value: cls });
      }
    }
  });
  emit('cls', hasCls ? { value: cls } : { text: 'nr' });

  /* The slowest input: the longest event duration per interaction. Labeled
     "slowest input", not INP: INP is a percentile over a whole visit, and
     this is the worst one so far, which is the honest thing to show. */
  const byInteraction = new Map<number, number>();
  let worst = 0;
  const hasInp = observe(
    'event',
    (es) => {
      for (const e of es as (PerformanceEntry & { interactionId?: number })[]) {
        if (!e.interactionId) continue;
        const d = Math.max(byInteraction.get(e.interactionId) ?? 0, e.duration);
        byInteraction.set(e.interactionId, d);
        if (d > worst) {
          worst = d;
          emit('inp', { value: worst });
        }
      }
    },
    { durationThreshold: 40 },
  );
  emit('inp', hasInp ? { text: 'none' } : { text: 'nr' });

  const resources = () => {
    const res = (performance.getEntriesByType?.('resource') ?? []) as PerformanceResourceTiming[];
    const navE = performance.getEntriesByType?.('navigation')[0] as PerformanceNavigationTiming | undefined;
    let sent = navE?.transferSize ?? 0;
    let decoded = navE?.decodedBodySize ?? 0;
    let third = 0;
    for (const r of res) {
      sent += r.transferSize || 0;
      decoded += r.decodedBodySize || 0;
      try {
        if (new URL(r.name).origin !== location.origin) third++;
      } catch {
        /* data: or blob: is this document, not a third party. */
      }
    }
    /* transferSize is 0 for a cache hit (and for a cross-origin resource
       that withholds timing, which this site has none of). Nothing went
       over the network, so say "cached" instead of claiming 0 kB. */
    emit('transfer', sent === 0 && decoded > 0 ? { text: 'cached' } : navE || res.length ? { value: sent } : { text: 'nr' });
    emit('requests', { value: res.length + (navE ? 1 : 0) });
    emit('thirdparty', { value: third });
    emit('dom', { value: document.getElementsByTagName('*').length });
    emit('cookies', { value: document.cookie ? document.cookie.split(';').filter((c) => c.trim()).length : 0 });
  };
  resources();
  observe('resource', resources);
  if (document.readyState !== 'complete') window.addEventListener('load', () => window.setTimeout(resources, 0), { once: true });

  emit('tier', { text: initialTier });
  onMotionChange((t) => emit('tier', { text: t }));
}

/* ── Writing slots ─────────────────────────────────────────────────── */

let copy: Copy | null = null;

function readCopy(): Copy | null {
  if (copy) return copy;
  const el = document.querySelector<HTMLElement>('[data-telemetry] [data-copy]');
  try {
    copy = el ? (JSON.parse(el.dataset.copy!) as Copy) : null;
  } catch {
    copy = null;
  }
  return copy;
}

/** Write one reading into one slot. Returns nothing; never throws.
 *  The slot says what it holds in data attributes (telemetry.css styles
 *  them): data-reading="live" once the browser has reported, data-state
 *  "nr" / "none" / "cached" for a reading that isn't a number, and
 *  data-rating with the word beside the value. */
export function paint(el: HTMLElement, key: string, r: Reading): void {
  const c = readCopy();
  if (!c) return;
  const d = el.dataset;
  delete d.state;
  delete d.rating;
  delete d.reading;
  el.title = c.liveDef;
  if ('value' in r) {
    const text = (FORMAT[key] ?? String)(r.value);
    const rt = rate(key, r.value);
    if (rt) {
      d.rating = rt;
      const w = document.createElement('span');
      w.dataset.rw = rt;
      w.textContent = c.rate[rt];
      el.replaceChildren(text + ' ', w);
    } else el.textContent = text;
    d.reading = 'live';
    return;
  }
  const t = r.text;
  if (t === 'nr' || t === 'none') {
    el.textContent = t === 'nr' ? c.nr : c.none;
    el.title = t === 'nr' ? c.nrTitle : c.noneTitle;
    d.state = t;
    return;
  }
  el.textContent = t === 'cached' ? c.cached : t;
  d.reading = 'live';
  if (t === 'cached') d.state = t;
}

/** Flip a prerendered chip to Live (text, glyph and definition). */
export function flipChip(chip: Element | null): void {
  const c = readCopy();
  if (!chip || !c || chip.getAttribute('data-prov') === 'live') return;
  chip.setAttribute('data-prov', 'live');
  chip.setAttribute('title', c.liveDef);
  const i = chip.querySelector('i');
  if (i) i.textContent = '●';
  chip.lastChild!.textContent = ` ${c.live}`;
}

export function initTelemetry(): void {
  if (!document.querySelector('[data-telemetry]')) return;
  if (!readCopy()) return;

  /* Slots are looked up once; the page doesn't grow new ones. BUILD-only
     sizes are skipped: nothing in a browser can re-measure them. */
  const slots = new Map<string, HTMLElement[]>();
  document.querySelectorAll<HTMLElement>('[data-metric]').forEach((el) => {
    const k = el.dataset.metric!;
    if (k === 'html' || k === 'css' || k === 'js') return;
    if (!slots.has(k)) slots.set(k, []);
    slots.get(k)!.push(el);
  });

  /* Throttle: collect readings, write at most every 500 ms. */
  const pending = new Map<string, Reading>();
  let timer = 0;
  let last = 0;
  const flush = () => {
    timer = 0;
    last = performance.now();
    pending.forEach((r, k) => {
      for (const el of slots.get(k) ?? []) {
        paint(el, k, r);
        /* A tile's own chip: in the panel, each metric carries one. */
        const tile = el.closest('.tm-tile');
        if (tile && el.dataset.reading === 'live') {
          const holder = tile.querySelector<HTMLElement>('[data-tchip]');
          if (holder && !holder.firstElementChild) {
            const src = el.closest('[data-telemetry]')?.querySelector('.panel-head .prov');
            if (src) holder.append(src.cloneNode(true));
          }
          flipChip(holder?.firstElementChild ?? null);
        }
      }
    });
    pending.clear();
    /* A readout's own chip goes Live once it holds a live reading. Sizes
       keep their ◆ Build marks (and, in the panel, their own chips). */
    document.querySelectorAll('[data-telemetry]').forEach((box) => {
      if (!box.querySelector('[data-metric][data-reading="live"]')) return;
      flipChip(box.querySelector('.panel-head > .prov') ?? box.querySelector('.status-readouts + .prov'));
    });
  };
  onMetric((key, r) => {
    if (!slots.has(key)) return;
    pending.set(key, r);
    if (timer) return;
    const wait = Math.max(0, 500 - (performance.now() - last));
    timer = window.setTimeout(flush, last ? wait : 0);
  });

  start();
}
