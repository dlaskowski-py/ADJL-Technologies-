/**
 * The scanner on /scan/: a visitor names a page, /api/scan fetches it, and
 * this draws what a crawler or an AI answer engine is handed.
 *
 * Markup contract: [data-scan]. boot.ts loads this module with lazyOn()
 * when that markup nears the viewport. The page carries:
 *
 *   form[data-scan="form"]       the address field, the steps list
 *                                ([data-scan-steps], hidden until a scan
 *                                starts), the error box ([data-scan-error],
 *                                role=alert) and a polite status line
 *                                ([data-scan-status], role=status)
 *   [data-scan="report"]         the report: a recorded scan of this site
 *                                until the visitor runs one
 *   [data-scan="example-note"]   the sentence above it saying so, hidden
 *                                once a live scan replaces the example
 *   script[data-scan-copy]       every word this module says, as JSON, so
 *                                no copy ships in this chunk
 *
 * One scan: POST {url} with Accept: application/x-ndjson. The function
 * answers one JSON object per line: {"type":"step"} as each step starts and
 * ends (each one ticks its row in the list), then {"type":"result"} or
 * {"type":"error"}. The report is drawn by sections/scan-kit.ts, the same
 * function the build used for the example, so the two look the same. The
 * scanned page's own text is escaped there; nothing from it is trusted.
 *
 * Keyboard and screen readers: it's a real form (Enter scans). While a
 * scan runs the button says so and the status line is announced. When the
 * report arrives, the summary is announced and focus moves to the report's
 * head, from where its "Start here" links lead to each finding. Errors are
 * announced by the alert box, and an address the scanner refused marks the
 * field invalid and points it at the reason.
 *
 * DOM this module changes is styled by attribute selectors under
 * [data-scan] (src/styles/pages/scan.css), never by new classes.
 */
import { fmtMs, renderReport, type Level, type ScanCopy, type ScanResult } from '../sections/scan-kit';
import { tier } from './prefs';

type Step = 'fetch' | 'parse' | 'robots' | 'files';
type StepState = 'wait' | 'run' | 'done' | 'failed' | 'skip';

type Copy = {
  form: {
    button: string;
    busy: string;
    stepState: Record<StepState, string>;
    status: { start: string; done: string; clear: string; failed: string };
    liveChip: string;
    liveTitle: string;
  };
  report: ScanCopy;
  errors: Record<string, { title: string; body: string }>;
};

type Line =
  | { type: 'step'; step: Step; state: 'start' | 'done'; ms?: number }
  | { type: 'result'; result: ScanResult }
  | { type: 'error'; error: string; vars?: Record<string, string | number> };

/** Errors that are about the address itself: the field is marked invalid. */
const ABOUT_INPUT = new Set(['empty', 'bad_url', 'scheme', 'credentials', 'port', 'private_name', 'blocked', 'not_found']);

/** The browser gives up a little after the function's own 8 s budget. */
const CLIENT_MS = 20_000;

/** Fill {name} slots for text that goes in through textContent. */
const fillText = (s: string, vars: Record<string, string | number> = {}): string =>
  s.replace(/\{(\w+)\}/g, (m, k: string) => {
    const v = vars[k];
    return v === undefined ? m : typeof v === 'number' ? v.toLocaleString('en-US') : v;
  });

/** For markup we build: the same escape scan-kit uses. */
const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** The host part of what was typed, for "Scanning example.com." */
function hostOf(raw: string): string {
  try {
    return new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`).hostname;
  } catch {
    return raw.slice(0, 80);
  }
}

export function initScan(): void {
  const form = document.querySelector<HTMLFormElement>('form[data-scan="form"]');
  const out = document.querySelector<HTMLElement>('[data-scan="report"]');
  const data = document.querySelector<HTMLScriptElement>('script[data-scan-copy]');
  if (!form || !out || !data || form.dataset.ready) return;

  let copy: Copy;
  try {
    copy = JSON.parse(data.textContent ?? '') as Copy;
  } catch {
    return;
  }
  const input = form.querySelector<HTMLInputElement>('[data-scan-url]');
  const go = form.querySelector<HTMLButtonElement>('[data-scan-go]');
  const steps = form.querySelector<HTMLOListElement>('[data-scan-steps]');
  const errBox = form.querySelector<HTMLElement>('[data-scan-error]');
  const status = form.querySelector<HTMLElement>('[data-scan-status]');
  if (!input || !go || !steps || !errBox || !status) return;
  form.dataset.ready = 'true';

  const describedBy = input.getAttribute('aria-describedby') ?? '';
  errBox.id ||= 'scan-error';

  /* /scan/?url=example.com fills the field (it never starts a scan). */
  const asked = new URLSearchParams(location.search).get('url');
  if (asked && !input.value) input.value = asked.slice(0, 2048);

  let busy = false;

  const say = (text: string) => {
    /* Cleared first, so the same sentence twice is still announced. */
    status.textContent = '';
    requestAnimationFrame(() => {
      status.textContent = text;
    });
  };

  const setStep = (step: Step, state: StepState, ms?: number) => {
    const li = steps.querySelector<HTMLElement>(`[data-step="${step}"]`);
    if (!li) return;
    li.dataset.state = state;
    const t = li.querySelector<HTMLElement>('[data-part="t"]');
    if (t) t.textContent = state === 'done' && typeof ms === 'number' ? fmtMs(ms) : copy.form.stepState[state];
  };

  const resetSteps = () => {
    for (const li of steps.querySelectorAll<HTMLElement>('[data-step]')) setStep(li.dataset.step as Step, 'wait');
  };

  const clearError = () => {
    errBox.hidden = true;
    errBox.textContent = '';
    input.removeAttribute('aria-invalid');
    input.setAttribute('aria-describedby', describedBy);
  };

  const showError = (code: string, vars: Record<string, string | number> = {}) => {
    const e = copy.errors[code] ?? copy.errors.failed;
    errBox.innerHTML = `<p data-part="etitle">${esc(fillText(e.title, vars))}</p><p>${esc(fillText(e.body, vars))}</p>`;
    errBox.hidden = false;
    if (ABOUT_INPUT.has(code)) {
      input.setAttribute('aria-invalid', 'true');
      input.setAttribute('aria-describedby', `${errBox.id} ${describedBy}`.trim());
    }
    /* Whatever was running stopped there, and what hadn't started won't.
       If nothing started at all, the list has nothing to say. */
    const all = [...steps.querySelectorAll<HTMLElement>('[data-step]')];
    if (all.every((li) => li.dataset.state === 'wait')) steps.hidden = true;
    for (const li of all) {
      if (li.dataset.state === 'run') setStep(li.dataset.step as Step, 'failed');
      else if (li.dataset.state === 'wait') setStep(li.dataset.step as Step, 'skip');
    }
    /* The reason sits under the steps, often below the fold: bring it into
       view (no further than needed, after the steps have settled above it).
       Focus stays on the button; role=alert reads the reason out. */
    errBox.scrollIntoView({ block: 'nearest', behavior: tier === 'reduced' ? 'auto' : 'smooth' });
  };

  const setBusy = (on: boolean) => {
    busy = on;
    form.setAttribute('aria-busy', String(on));
    go.textContent = on ? copy.form.busy : copy.form.button;
    if (on) go.setAttribute('aria-disabled', 'true');
    else go.removeAttribute('aria-disabled');
  };

  const draw = (r: ScanResult) => {
    const chip = `<span class="prov" data-prov="live" data-chrome title="${esc(copy.form.liveTitle)}"><i aria-hidden="true">●</i> ${esc(
      copy.form.liveChip,
    )}</span>`;
    out.innerHTML = renderReport(r, copy.report, chip);
    out.removeAttribute('data-example');
    out.dataset.fresh = 'true';
    /* "Until you scan a page, it shows a scan of this site…" is no longer
       true of the report under it. */
    document.querySelector<HTMLElement>('[data-scan="example-note"]')?.setAttribute('hidden', '');

    const count = (l: Level) => r.findings.filter((f) => f.level === l).length;
    const first = r.findings.find((f) => f.level !== 'ok');
    const firstTitle = first ? fillText(copy.report.findings[first.id]?.title ?? '', first.vars) : '';
    say(
      first
        ? fillText(copy.form.status.done, { fix: count('fix'), improve: count('improve'), first: firstTitle })
        : copy.form.status.clear,
    );

    const head = out.querySelector<HTMLElement>('[data-part="head"]');
    if (head) {
      head.focus({ preventScroll: true });
      head.scrollIntoView({ behavior: tier === 'reduced' ? 'auto' : 'smooth', block: 'start' });
    }
  };

  async function run(): Promise<void> {
    const raw = input!.value.trim();
    clearError();
    if (!raw) {
      /* An empty field has nothing to do with the last scan's steps. */
      resetSteps();
      showError('empty');
      input!.focus();
      return;
    }
    setBusy(true);
    resetSteps();
    steps!.hidden = false;
    say(fillText(copy.form.status.start, { host: hostOf(raw) }));

    const ctl = new AbortController();
    const timer = window.setTimeout(() => ctl.abort(), CLIENT_MS);
    let settled = false;
    const handle = (text: string) => {
      if (!text.trim() || settled) return;
      let line: Line;
      try {
        line = JSON.parse(text) as Line;
      } catch {
        return;
      }
      if (line.type === 'step') setStep(line.step, line.state === 'start' ? 'run' : 'done', line.ms);
      else if (line.type === 'result') {
        settled = true;
        draw(line.result);
      } else if (line.type === 'error') {
        settled = true;
        showError(line.error, line.vars);
        say(copy.form.status.failed);
      }
    };

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/x-ndjson' },
        body: JSON.stringify({ url: raw }),
        credentials: 'omit',
        cache: 'no-store',
        signal: ctl.signal,
      });
      const type = res.headers.get('content-type') ?? '';
      if (!res.ok || !/ndjson/i.test(type) || !res.body) {
        /* Refused before it started: the function's own JSON, or a 429
           from Netlify's rate limiter, which isn't ours to parse. */
        let code = res.status === 429 ? 'rate_limited' : 'failed';
        let vars: Record<string, string | number> = {};
        if (/json/i.test(type)) {
          try {
            const j = (await res.json()) as { error?: string; vars?: Record<string, string | number> };
            if (j.error) code = j.error;
            vars = j.vars ?? {};
          } catch {
            /* keep the status's code */
          }
        }
        settled = true;
        showError(code, vars);
        say(copy.form.status.failed);
        return;
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = '';
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let i;
        while ((i = buf.indexOf('\n')) >= 0) {
          handle(buf.slice(0, i));
          buf = buf.slice(i + 1);
        }
      }
      handle(buf + dec.decode());
      if (!settled) {
        settled = true;
        showError('failed');
        say(copy.form.status.failed);
      }
    } catch (e) {
      if (!settled) {
        settled = true;
        /* Past CLIENT_MS the function has blown its own 8 s budget: that's
           on us, not the site, so it isn't the site-was-slow message. */
        showError((e as Error)?.name === 'AbortError' ? 'failed' : 'network');
        say(copy.form.status.failed);
      }
    } finally {
      window.clearTimeout(timer);
      setBusy(false);
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!busy) void run();
  });
  input.addEventListener('input', () => {
    if (input.hasAttribute('aria-invalid')) clearError();
  });
}
