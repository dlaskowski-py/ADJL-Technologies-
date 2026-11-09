/**
 * [data-pipeline]: the build sequence on home #process.
 *
 * Three modes, picked from the tier and the viewport (the CSS picks the
 * same layout at first paint, so choosing one here never moves the page):
 *
 *   sticky  full tier, ≥900×640, subgrid: scroll position through the
 *           6 × 90vh track sets data-stage (0–5) on the root, data-at and
 *           aria-current="step" on the steps, and --plq (0→1) on the
 *           current step, which types its artifact in. The rail fill is
 *           CSS (animation-timeline: view()) where supported; --plp
 *           drives it everywhere else.
 *   cards   lite tier or a narrow screen: each step's artifact types in
 *           once, as its card enters.
 *   static  reduced, or Pause motion: every artifact complete.
 *
 * Step 05's terminal reads /build-report.json and prints this deploy's own
 * guard lines (RECORDED). If the report doesn't load, the prerendered guard
 * names stay, with a line saying so.
 */
import { onMotionChange, tier } from './prefs';

type Mode = 'sticky' | 'cards' | 'static';
type Copy = { rec: string; def: string; stamp: string; failed: string };
type Report = { commit?: string; date?: string; guards?: { name: string; line?: string }[] };

const wideMq = '(min-width: 900px) and (min-height: 640px)';

export function initPipeline(): void {
  const root = document.querySelector<HTMLElement>('[data-pipeline]');
  if (!root) return;
  const steps = Array.from(root.querySelectorAll<HTMLElement>('.pl-step'));
  const stage = root.querySelector<HTMLElement>('.pl-stage');
  const count = root.querySelector('[data-pl-n]');
  const n = steps.length;
  const mq = matchMedia(wideMq);
  const subgrid = CSS.supports('grid-template-rows', 'subgrid');

  let mode: Mode | '' = '';
  let at = -1;
  let queued = false;
  let io: IntersectionObserver | null = null;

  const setStage = (i: number) => {
    if (i === at) return;
    at = i;
    root.dataset.stage = String(i);
    if (count) count.textContent = String(i + 1).padStart(2, '0');
  };

  /* Sticky: read the track once per frame, then write. */
  const frame = () => {
    queued = false;
    const r = root.getBoundingClientRect();
    const top = parseFloat(getComputedStyle(stage!).top) || 0;
    const run = r.height - stage!.offsetHeight;
    const p = run > 0 ? Math.min(1, Math.max(0, (top - r.top) / run)) : 0;
    const i = Math.min(n - 1, Math.floor(p * n));
    const q = Math.min(1, p * n - i);
    root.style.setProperty('--plp', p.toFixed(4));
    if (i !== at) {
      steps.forEach((s, k) => {
        if (k < i) s.dataset.at = 'done';
        else if (k === i) s.dataset.at = 'current';
        else delete s.dataset.at;
        if (k === i) s.setAttribute('aria-current', 'step');
        else s.removeAttribute('aria-current');
        if (k !== i) s.style.removeProperty('--plq');
      });
      setStage(i);
    }
    steps[i].style.setProperty('--plq', q.toFixed(3));
  };
  const onScroll = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(frame);
  };

  const clear = () => {
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
    io?.disconnect();
    io = null;
    root.style.removeProperty('--plp');
    for (const s of steps) {
      delete s.dataset.at;
      s.removeAttribute('aria-current');
      s.style.removeProperty('--plq');
    }
  };

  const pick = (): Mode => (tier === 'reduced' ? 'static' : tier === 'full' && mq.matches && subgrid && stage ? 'sticky' : 'cards');

  const apply = () => {
    const next = pick();
    if (next === mode) return;
    clear();
    mode = next;
    root.dataset.mode = mode;
    at = -1;
    if (mode === 'sticky') {
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll, { passive: true });
      frame();
    } else if (mode === 'cards') {
      /* A card that's already been read stays typed. */
      let best = -1;
      steps.forEach((s, k) => s.hasAttribute('data-in') && (best = k));
      if (best >= 0) setStage(best);
      io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (!e.isIntersecting) continue;
            const s = e.target as HTMLElement;
            s.dataset.in = '';
            io!.unobserve(s);
            setStage(Math.max(at, steps.indexOf(s)));
          }
        },
        { rootMargin: '0px 0px -20% 0px', threshold: 0.15 },
      );
      steps.forEach((s) => !s.hasAttribute('data-in') && io!.observe(s));
    } else {
      steps.forEach((s) => (s.dataset.in = ''));
      setStage(n - 1);
    }
  };

  apply();
  onMotionChange(apply);
  mq.addEventListener('change', apply);

  void loadReport(root);
}

/** Swap step 05's prerendered guard names for this deploy's report. */
async function loadReport(root: HTMLElement): Promise<void> {
  const term = root.querySelector<HTMLElement>('[data-pl-term]');
  const lines = term?.querySelector<HTMLElement>('[data-pl-lines]');
  const stamp = term?.querySelector<HTMLElement>('[data-pl-stamp]');
  if (!term || !lines || !stamp) return;
  let copy: Copy;
  try {
    copy = JSON.parse(term.dataset.plTerm ?? '');
  } catch {
    return;
  }
  let report: Report | null = null;
  try {
    const res = await fetch('/build-report.json', { credentials: 'omit' });
    if (res.ok && /json/.test(res.headers.get('content-type') ?? '')) report = await res.json();
  } catch {
    /* Offline, or a server without the file: the fallback stays. */
  }
  if (!report?.guards?.length) {
    stamp.textContent = copy.failed;
    return;
  }
  const out = report.guards.map((g, j) => {
    const el = document.createElement('span');
    el.setAttribute('data-gl', '');
    el.style.setProperty('--j', String(j));
    const tick = document.createElement('i');
    tick.setAttribute('aria-hidden', 'true');
    tick.textContent = '✓';
    el.append(tick, ` ${g.name}`);
    if (g.line) {
      const d = document.createElement('span');
      d.setAttribute('data-gd', '');
      d.textContent = `  ${g.line}`;
      el.append(d);
    }
    return el;
  });
  lines.replaceChildren(...out);
  stamp.textContent = copy.stamp
    .replace('{commit}', String(report.commit ?? '').slice(0, 7))
    .replace('{date}', String(report.date ?? '').slice(0, 10));
  const chip = term.querySelector<HTMLElement>('.prov');
  if (chip) {
    chip.dataset.prov = 'recorded';
    chip.title = copy.def;
    const i = chip.querySelector('i');
    if (i) i.textContent = '■';
    chip.lastChild!.textContent = ` ${copy.rec}`;
  }
}
