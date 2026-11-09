/**
 * Telemetry: this page, measured in the visitor's own browser.
 *
 * Markup contract: [data-telemetry] on a container, holding any number of
 * [data-metric="<key>"] elements. Each metric element's text is replaced
 * with a live reading as soon as the browser reports one, and it gets
 * data-rating="good|ok|poor" where a published threshold exists.
 *
 * Every number here is read from the Performance APIs at the moment the
 * visitor is looking at it. None of it is a figure we typed, which is the
 * only way a performance number can appear on this site at all: anything
 * typed would be a claim, and the claims guard forbids those. A browser
 * that doesn't expose a metric (Safari has no LCP or INP entries) leaves
 * the prerendered placeholder in place and says so, instead of guessing.
 *
 * Keys:
 *   ttfb  fcp  lcp  cls  inp   Core Web Vitals and their neighbours
 *   bytes                      bytes transferred for this page so far
 *   requests                   resources fetched, including the document
 *   thirdparty                 requests to any origin that isn't this one
 *   cookies                    cookies set on this origin
 *   dom                        elements in the document
 *   js                         bytes of JavaScript transferred
 */

type Rating = 'good' | 'ok' | 'poor';

/** web.dev thresholds: good below the first, poor above the second. */
const LIMITS: Record<string, [number, number]> = {
  ttfb: [800, 1800],
  fcp: [1800, 3000],
  lcp: [2500, 4000],
  cls: [0.1, 0.25],
  inp: [200, 500],
};

const ms = (v: number) => (v < 1000 ? `${Math.round(v)} ms` : `${(v / 1000).toFixed(2)} s`);
const kb = (v: number) => (v < 1024 * 1024 ? `${(v / 1024).toFixed(1)} kB` : `${(v / 1048576).toFixed(2)} MB`);

const FORMAT: Record<string, (v: number) => string> = {
  ttfb: ms,
  fcp: ms,
  lcp: ms,
  inp: ms,
  cls: (v) => v.toFixed(3),
  bytes: kb,
  js: kb,
  requests: (v) => String(v),
  thirdparty: (v) => String(v),
  cookies: (v) => String(v),
  dom: (v) => v.toLocaleString('en-US'),
};

const listeners: ((key: string, value: number) => void)[] = [];
const latest = new Map<string, number>();

function emit(key: string, value: number): void {
  latest.set(key, value);
  for (const fn of listeners) fn(key, value);
}

/** Subscribe to readings — other modules (the instrument gauges) can draw
 *  from the same measurements instead of observing the browser twice. */
export function onMetric(fn: (key: string, value: number) => void): void {
  listeners.push(fn);
  latest.forEach((v, k) => fn(k, v));
}

export function rate(key: string, value: number): Rating | null {
  const lim = LIMITS[key];
  if (!lim) return null;
  return value <= lim[0] ? 'good' : value <= lim[1] ? 'ok' : 'poor';
}

function observe(type: string, cb: (entries: PerformanceEntry[]) => void, extra: object = {}): void {
  try {
    const po = new PerformanceObserver((list) => cb(list.getEntries()));
    po.observe({ type, buffered: true, ...extra } as PerformanceObserverInit);
  } catch {
    /* Unsupported entry type in this browser. The placeholder stays. */
  }
}

let started = false;

function start(): void {
  if (started) return;
  started = true;

  const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  if (nav) emit('ttfb', Math.max(0, nav.responseStart - nav.startTime));

  observe('paint', (es) => {
    for (const e of es) if (e.name === 'first-contentful-paint') emit('fcp', e.startTime);
  });

  observe('largest-contentful-paint', (es) => {
    const last = es[es.length - 1];
    if (last) emit('lcp', last.startTime);
  });

  /* CLS as the browser defines it since 2021: the largest session window of
     shifts no more than 1s apart and no longer than 5s, ignoring shifts
     that follow user input. */
  let cls = 0;
  let win = 0;
  let winStart = 0;
  let winLast = 0;
  emit('cls', 0);
  observe('layout-shift', (es) => {
    for (const e of es as (PerformanceEntry & { value: number; hadRecentInput: boolean })[]) {
      if (e.hadRecentInput) continue;
      if (win && e.startTime - winLast < 1000 && e.startTime - winStart < 5000) {
        win += e.value;
      } else {
        win = e.value;
        winStart = e.startTime;
      }
      winLast = e.startTime;
      if (win > cls) {
        cls = win;
        emit('cls', cls);
      }
    }
  });

  /* INP, approximated the way the web-vitals library does for a single
     page: the worst interaction duration seen so far. It reads "—" until
     the visitor actually interacts, which is the honest answer. */
  let worst = 0;
  observe(
    'event',
    (es) => {
      for (const e of es as (PerformanceEntry & { interactionId?: number })[]) {
        if (!e.interactionId) continue;
        if (e.duration > worst) {
          worst = e.duration;
          emit('inp', worst);
        }
      }
    },
    { durationThreshold: 16 },
  );

  const resources = () => {
    const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    const res = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    let bytes = navEntry?.transferSize || navEntry?.encodedBodySize || 0;
    let js = 0;
    let third = 0;
    for (const r of res) {
      /* transferSize is 0 for a cache hit; encodedBodySize is what the file
         weighs regardless. Report weight, so a repeat visit doesn't claim
         the page is free. */
      const size = r.transferSize || r.encodedBodySize || 0;
      bytes += size;
      if (r.initiatorType === 'script' || /\.m?js(\?|$)/.test(r.name)) js += size;
      try {
        if (new URL(r.name).origin !== location.origin) third++;
      } catch {
        /* data: or blob: — same document, not a third party. */
      }
    }
    emit('bytes', bytes);
    emit('js', js);
    emit('requests', res.length + 1);
    emit('thirdparty', third);
    emit('dom', document.getElementsByTagName('*').length);
    emit('cookies', document.cookie ? document.cookie.split(';').filter(Boolean).length : 0);
  };

  resources();
  observe('resource', () => resources());
  window.addEventListener('load', () => window.setTimeout(resources, 0), { once: true });
}

export function initTelemetry(): void {
  const boxes = Array.from(document.querySelectorAll<HTMLElement>('[data-telemetry]'));
  if (!boxes.length) return;

  const slots = new Map<string, HTMLElement[]>();
  for (const box of boxes) {
    box.querySelectorAll<HTMLElement>('[data-metric]').forEach((el) => {
      const k = el.dataset.metric!;
      if (!slots.has(k)) slots.set(k, []);
      slots.get(k)!.push(el);
    });
    box.classList.add('is-live');
  }

  onMetric((key, value) => {
    const els = slots.get(key);
    if (!els) return;
    const text = (FORMAT[key] ?? String)(value);
    const r = rate(key, value);
    for (const el of els) {
      el.textContent = text;
      if (r) el.dataset.rating = r;
    }
  });

  start();
}
