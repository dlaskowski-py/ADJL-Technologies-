/**
 * [data-replay]: Run Replay with "Break the input".
 *
 * The panel arrives prerendered in its finished state (the clean run,
 * complete), and the trace arrives as JSON. This module only moves a
 * position through it:
 *
 *   pos      steps completed, 0…end. `end` is 14 for a run that goes
 *            through, or the step a broken input stops at.
 *   input    the radiogroup's choice. It decides each span's end state.
 *   picked   the span the inspector shows (its own radiogroup).
 *
 * Tiers: full plays once (≤6 s) the first time the panel is in view, and
 * replays a branch when the input changes. Lite never plays on its own:
 * Play and Step do, and a new input shows its outcome at once. Reduced
 * shows the complete trace and switches branches instantly.
 *
 * One polite live region per panel, and it announces outcomes only: the
 * input's sentence, once, when a run the visitor started reaches its end.
 */
import { onMotionChange, tier } from './prefs';
import { drawLeader } from './leaders';

/** [id, name, depth, kind, note, fields, extra] */
type SpanT = [string, string, number, string, string, [string, string][] | 0, string | 0];
type Input = { id: string; stop?: string; st?: string; flag?: string; field?: string; src?: string };
type Data = {
  spans: SpanT[];
  inputs: Input[];
  states: Record<string, string>;
  sources: Record<string, string>;
  i: Record<string, string>;
  c: Record<string, string>;
};

const GLYPH: Record<string, string> = { done: '✓', gate: '◆', stop: '✕', held: '▲', flag: '▲', skip: '–', idle: '○', run: '▸' };
const MASK = '••••';

export function initReplay(): void {
  document.querySelectorAll<HTMLElement>('[data-replay]').forEach(wire);
}

function wire(root: HTMLElement): void {
  let D: Data;
  try {
    D = JSON.parse(root.querySelector('[data-replay-data]')?.textContent ?? '');
  } catch {
    return;
  }
  const S = D.spans;
  const $ = <T extends Element = HTMLElement>(s: string) => root.querySelector<T>(s);
  const rows = Array.from(root.querySelectorAll<HTMLElement>('.rp-row'));
  const bars = S.map((_, i) => root.querySelectorAll(`[data-bar="${i}"]`));
  const range = $<HTMLInputElement>('.rp-range')!;
  const out = $('.rp-out')!;
  const live = $('[data-rp-live]')!;
  const play = $<HTMLButtonElement>('[data-rp="play"]')!;
  const I = (k: string) => $(`[data-rp-i="${k}"]`);
  const fieldsEl = I('fields')!;
  const srcsEl = I('srcs');
  const svg = I('leads') as SVGSVGElement | null;
  if (!range || !fieldsEl) return;

  /* Step of each span: the root 0, top-level stages 1…14, the fetches
     their parent's. */
  const step: number[] = [];
  const parent: number[] = [];
  let total = 0;
  let top = 0;
  S.forEach((s, i) => {
    step[i] = s[2] === 0 ? 0 : s[2] === 1 ? ++total : total;
    if (s[2] < 2) top = i;
    parent[i] = s[2] === 2 ? top : i;
  });
  const at = (id?: string) => S.findIndex((s) => s[0] === id);
  /* Every field of the run, with the span that produces it. */
  const all: [string, string, number][] = S.flatMap((s, i) => (s[5] || []).map((f) => [f[0], f[1], i] as [string, string, number]));

  let input = D.inputs[0];
  let pos = total;
  let playing = false;
  let timer = 0;
  let picked = 0;
  let touched = false;
  let speak = false;
  let states: string[] = [];

  const end = () => (input.stop ? step[at(input.stop)] : total);
  const glyph = (st: string, i: number) => (st === 'held' && S[i][3] === 'p' ? '◆' : GLYPH[st]);

  /** Each span's state at the end of this input's run. */
  const finals = () => {
    const f: string[] = S.map((s) => (s[3] === 'p' ? 'gate' : 'done'));
    if (input.stop) {
      const j = at(input.stop);
      S.forEach((_, i) => step[i] > step[j] && (f[i] = 'skip'));
      f[j] = f[parent[j]] = f[0] = input.st!;
    }
    if (input.flag) f[at(input.flag)] = 'flag';
    return f;
  };

  const icon = (g: string) => {
    const i = document.createElement('i');
    i.setAttribute('aria-hidden', 'true');
    i.textContent = g;
    return i;
  };

  function render(): void {
    const fin = finals();
    const e = end();
    states = S.map((_, i) => {
      if (i === 0) return pos === 0 ? (playing ? 'run' : 'idle') : pos >= e ? fin[0] : 'run';
      if (step[i] <= pos) return fin[i];
      if (pos >= e) return 'skip';
      return playing && step[i] === pos + 1 ? 'run' : 'idle';
    });
    rows.forEach((r, i) => {
      const st = states[i];
      bars[i].forEach((b) => b.setAttribute('data-s', st));
      if (r.dataset.s === st) return;
      r.dataset.s = st;
      r.querySelector('.rp-g')!.textContent = glyph(st, i);
      r.querySelector('.rp-sw')!.textContent = D.states[st];
    });
    root.querySelector<SVGElement>('.rp-runfill')?.style.setProperty('--p', String(pos / total));
    $('.rp-head')?.style.setProperty('--at', String(pos));
    range.max = String(e);
    range.value = String(pos);
    range.style.setProperty('--v', String(e ? pos / e : 0));
    const name = S[step.indexOf(pos)]?.[1] ?? '';
    range.setAttribute(
      'aria-valuetext',
      (pos ? D.c.at.replace('{n}', String(pos)).replace('{name}', name) : D.c.start).replace('{total}', String(total)),
    );
    const read = $('.rp-read');
    if (read) read.textContent = `${pos} / ${total}`;
    play.querySelector('i')!.textContent = playing ? '❚❚' : '▶';
    play.querySelector('span')!.textContent = playing ? D.c.pause : D.c.play;
    play.setAttribute('aria-pressed', String(playing));
    out.dataset.rpOut = pos >= e ? input.id : '';
    const wait = out.querySelector('[data-rp-wait]');
    if (wait) {
      wait.firstElementChild!.textContent = GLYPH[pos || playing ? 'run' : 'idle'];
      wait.lastElementChild!.textContent = D.states[pos || playing ? 'run' : 'idle'];
    }
    inspect(false);
  }

  /** The value a field shows, from the state of the span that makes it. */
  const value = (owner: number): [string, string] => {
    const st = states[owner];
    if (st === 'done' || st === 'gate' || st === 'flag') return ['mask', MASK];
    if (st === 'held' && S[owner][2] === 2) return ['blank', D.i.blank];
    return [st, D.states[st]];
  };

  let shown = -1;
  let shownInput = '';
  function inspect(fresh: boolean): void {
    const s = S[picked];
    const st = states[picked];
    I('stage')!.textContent =
      picked === 0 ? D.i.whole : D.i.stage.replace('{n}', String(step[picked])).replace('{total}', String(total));
    I('name')!.textContent = s[1];
    I('note')!.textContent = s[4];
    const se = I('state')!;
    se.dataset.s = st;
    se.replaceChildren(icon(glyph(st, picked)), ` ${D.states[st]}`);

    const list = picked === 0 ? all : (s[5] || []).map((f) => [f[0], f[1], picked] as [string, string, number]);
    const src = (f: [string, string, number]) =>
      input.flag && f[2] === at(input.flag) && f[0] === input.field ? input.src! : f[1];
    I('box')!.hidden = !list.length;
    const extra = I('extra')!;
    extra.hidden = !!list.length;
    extra.textContent = s[6] === 'derived' ? D.i.derived : D.i.none;

    /* Rebuild only when the span or the input changed; otherwise the rows
       and their leaders stay, and only their values move. */
    const rebuild = fresh || shown !== picked || shownInput !== input.id;
    shown = picked;
    shownInput = input.id;
    if (rebuild) {
      fieldsEl.replaceChildren(
        ...list.map((f) => {
          const li = document.createElement('li');
          li.setAttribute('data-f', '');
          const l = document.createElement('span');
          l.setAttribute('data-fl', '');
          l.textContent = f[0];
          const v = document.createElement('span');
          v.setAttribute('data-fv', '');
          if (src(f) !== f[1]) li.setAttribute('data-flag', '');
          li.append(l, v, badge(src(f)));
          return li;
        }),
      );
      if (srcsEl) {
        /* In the order of the fields that use them, so leaders cross as
           little as they can. */
        const mean = (k: string) => {
          const r = list.flatMap((f, j) => (src(f) === k ? [j] : []));
          return r.length ? r.reduce((a, b) => a + b, 0) / r.length : -1;
        };
        const used = Object.keys(D.sources)
          .filter((k) => mean(k) >= 0)
          .sort((a, b) => mean(a) - mean(b));
        srcsEl.replaceChildren(
          ...used.map((k) => {
            const li = document.createElement('li');
            li.setAttribute('data-src', k);
            li.append(badge(k));
            return li;
          }),
        );
      }
    }
    Array.from(fieldsEl.children).forEach((li, j) => {
      const [v, text] = value(list[j][2]);
      (li as HTMLElement).dataset.v = v;
      li.children[1].textContent = text;
    });
    if (rebuild) requestAnimationFrame(() => leads(true));
    else syncLeads();
  }

  const badge = (k: string) => {
    const b = document.createElement('span');
    b.setAttribute('data-fs', k);
    if (k === 'unaudited') b.append(icon('▲'), ' ');
    b.append(D.sources[k]);
    return b;
  };

  /** Leader lines from each field to its source, in the full variant and
   *  only where the inspector is wide enough to have a source column. */
  function leads(draw: boolean): void {
    if (!svg || !srcsEl) return;
    svg.replaceChildren();
    if (!srcsEl.getClientRects().length || srcsEl.offsetParent === null) return;
    const items = Array.from(fieldsEl.children) as HTMLElement[];
    const pairs = items.map((li) => [li.children[1], srcsEl.querySelector(`[data-src="${li.children[2].getAttribute('data-fs')}"] > *`)] as const);
    for (const [from, to] of pairs) if (to) drawLeader(from, to, svg);
    if (!draw) svg.setAttribute('data-still', '');
    else svg.removeAttribute('data-still');
    syncLeads();
  }
  function syncLeads(): void {
    if (!svg) return;
    const items = Array.from(fieldsEl.children) as HTMLElement[];
    const paths = svg.querySelectorAll('[data-leader]');
    const dots = svg.querySelectorAll('[data-leader-dot]');
    /* A new path starts undrawn and draws once its field resolves. */
    requestAnimationFrame(() =>
      items.forEach((li, j) => {
        paths[j]?.setAttribute('data-v', li.dataset.v ?? '');
        dots[j]?.setAttribute('data-v', li.dataset.v ?? '');
        paths[j]?.setAttribute('data-src', li.children[2].getAttribute('data-fs') ?? '');
      }),
    );
  }

  /* ── Playback ─────────────────────────────────────────────────────── */

  const say = () => {
    if (!speak) return;
    speak = false;
    const text = out.querySelector(`[data-out="${input.id}"] span`)?.textContent ?? '';
    live.textContent = '';
    requestAnimationFrame(() => (live.textContent = text));
  };
  const halt = () => {
    playing = false;
    clearTimeout(timer);
  };
  const tick = (dt: number) => {
    pos = Math.min(end(), pos + 1);
    if (pos >= end()) {
      halt();
      render();
      say();
    } else {
      render();
      timer = window.setTimeout(() => tick(dt), dt);
    }
  };
  const start = (dt = 400) => {
    halt();
    if (tier === 'reduced') {
      pos = end();
      render();
      say();
      return;
    }
    if (pos >= end()) pos = 0;
    playing = true;
    render();
    timer = window.setTimeout(() => tick(dt), dt);
  };

  root.querySelector('.rp-ctl')?.addEventListener('click', (ev) => {
    const b = (ev.target as Element).closest<HTMLElement>('[data-rp]');
    if (!b) return;
    touched = true;
    speak = true;
    const k = b.dataset.rp;
    if (k === 'play') {
      if (playing) {
        halt();
        speak = false;
        render();
      } else start();
    } else if (k === 'step') {
      halt();
      pos = pos >= end() ? 0 : pos + 1;
      render();
      if (pos >= end()) say();
    } else {
      pos = 0;
      if (tier === 'reduced') {
        halt();
        render();
      } else start();
    }
  });

  range.addEventListener('input', () => {
    touched = true;
    halt();
    pos = Number(range.value);
    speak = true;
    render();
    if (pos >= end()) say();
    else speak = false;
  });

  root.addEventListener('change', (ev) => {
    const t = ev.target as HTMLInputElement;
    if (t.type !== 'radio') return;
    if (t.classList.contains('rp-pick')) {
      picked = Number(t.value);
      inspect(true);
      return;
    }
    const next = D.inputs.find((x) => x.id === t.value);
    if (!next) return;
    touched = true;
    speak = true;
    input = next;
    halt();
    if (tier === 'full') {
      pos = 0;
      start(250);
    } else {
      pos = end();
      render();
      say();
    }
  });

  onMotionChange((t) => {
    if (t !== 'reduced') return;
    halt();
    pos = end();
    render();
  });

  let raf = 0;
  new ResizeObserver(() => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => leads(false));
  }).observe(I('box')!);

  /* Full: start from the top, and play once when the trace is in view. */
  if (tier !== 'reduced') pos = 0;
  render();
  if (tier === 'full') {
    const io = new IntersectionObserver(
      (es) => {
        if (!es.some((e) => e.isIntersecting)) return;
        io.disconnect();
        if (!touched && tier === 'full') start();
      },
      { threshold: 0.35 },
    );
    io.observe($('.rp-main')!);
  }
}
