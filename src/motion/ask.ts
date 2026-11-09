/**
 * [data-ask]: Ask This Site, answered in your browser.
 *
 * The panel arrives prerendered and at rest (src/sections/instruments/
 * ask.ts). This module wires it:
 *
 *   - the chips, <a href="#ask-qN"> links to the build's answers, become
 *     buttons that ask their question here instead
 *   - /search-index.json is fetched on the first focus or pointerenter of
 *     the input, a chip or the Ask button, and its postings are built here
 *     by the same src/lib/bm25.ts that answered the chips at build. The
 *     panel head prints how long that took, measured
 *   - a question runs QUERY → RETRIEVE → GATE → ANSWER (or ABSTAIN). On
 *     the full tier the stages light in order over about 600ms; on lite
 *     and reduced the result is simply there
 *   - the floor slider (full variant) re-gates the current question and
 *     re-runs "Break the input" at the new floor, live
 *   - one polite region announces the outcome and nothing else
 *
 * Everything built here is styled by attributes under [data-ask] (see
 * ask.css), never by classes. Every string comes from the JSON block the
 * renderer writes next to the panel, so no copy ships in this file. That
 * copy is ours and written as is; every word from the question or the
 * index is escaped before it's written. The panel's state lives on its
 * root: data-index (idle → loading → ready, or failed, or mismatch),
 * data-stage (0 to 4) and data-outcome. If the index can't be loaded, or
 * was built by different code (its N and avgdl don't match), the panel
 * falls back to the build's answers.
 *
 * OWNER: WS3. Contract: [data-ask="home|full"].
 */
import type { AskCopy } from '../sections/instruments/ask';
import {
  type Answer,
  type Engine,
  type IndexFile,
  type Search,
  createEngine,
  dfOf,
  fmt,
  gate,
  quote,
  search,
} from '../lib/bm25';
import { tier } from './prefs';

type V = Record<string, string | number>;

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
const sub = (t: string, v: V) => t.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ''));
/** A template filled in, its numbers in <b>. */
const bold = (t: string, v: V) => sub(t, v).replace(/\d+(\.\d+)?/g, '<b>$&</b>');
const sp = (k: string, s: string) => `<span data-k="${k}">${s}</span>`;

/* The index: one fetch per page, shared by every panel on it. */
let loading: Promise<{ e: Engine; ms: number } | null> | undefined;
const load = () =>
  (loading ??= fetch('/search-index.json')
    .then((r) => (r.ok ? (r.json() as Promise<IndexFile>) : null))
    .then((f) => {
      if (!f) return null;
      const t0 = performance.now();
      const e = createEngine(f);
      return { e, ms: performance.now() - t0 };
    })
    .catch(() => null));

function wire(root: HTMLElement): void {
  /* The copy block sits right after the panel (renderAsk writes both). */
  let c: AskCopy;
  try {
    c = JSON.parse(root.nextElementSibling!.textContent!);
  } catch {
    return;
  }
  const ui = c.ui;
  const $ = (s: string) => root.querySelector<HTMLElement>(s);
  const input = $('[data-q]') as HTMLInputElement | null;
  const go = $('[data-go]');
  const live = $('[data-live]');
  if (!input || !go || !live) return;
  const range = $('[data-floor]') as HTMLInputElement | null;
  /* QUERY, RETRIEVE, GATE, ANSWER: each pane's readout and body. */
  const all = (s: string) => root.querySelectorAll<HTMLElement>(s);
  const [qr, rr, gr] = all('[data-read]');
  const [qb, , gb, ab] = all('[data-body]');
  const rows = all('[data-hit]');
  const abstain = $('[data-a="abstain"]')!;

  let floor = c.floor;
  let engine: Engine | undefined;
  let pending: [string, HTMLElement?] | undefined;
  let cur: Search | undefined;
  let said = '';
  let timers: number[] = [];
  let quiet = 0;
  let started = false;

  /* Chips: links to the build's answers become buttons that ask here. */
  const links = Array.from(root.querySelectorAll<HTMLElement>('a[data-chip]'));
  const chips = links.map((a) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.chip = a.dataset.chip;
    b.textContent = a.textContent;
    b.onclick = () => ask(b.textContent!, b);
    a.replaceWith(b);
    return b;
  });

  /* The readout's fixed wordings are prerendered and CSS shows the one
     matching data-index. Only "ready" carries numbers. */
  const start = () => {
    if (started) return;
    started = true;
    root.dataset.index = 'loading';
    void load().then((l) => {
      if (!l?.e.ok) {
        /* Back to the build's answers, and the chips back to links to them. */
        chips.forEach((b, i) => b.replaceWith(links[i]));
        return void (root.dataset.index = l ? 'mismatch' : 'failed');
      }
      engine = l.e;
      $('[data-i="ready"]')!.textContent = sub(ui.ready, { n: l.e.N, ms: l.ms.toFixed(1) });
      root.dataset.index = 'ready';
      if (pending) ask(...pending);
    });
  };
  for (const el of [input, go, ...chips]) {
    el.addEventListener('focus', start);
    el.addEventListener('pointerenter', start);
  }

  function ask(q: string, chip?: HTMLElement): void {
    q = q.trim();
    for (const b of chips) b.toggleAttribute('data-on', b === chip);
    if (chip) input!.value = q;
    if (!q) return input!.focus();
    live!.textContent = said = '';
    if (!engine) {
      pending = [q, chip];
      return start();
    }
    pending = undefined;
    const a = paint((cur = search(engine, q)));
    timers.forEach(clearTimeout);
    flip();
    root.dataset.ran = '';
    const full = tier === 'full';
    if (full) {
      /* Hide every pane at once, then light them in order. */
      root.dataset.reset = '';
      root.dataset.stage = '0';
      void root.offsetWidth;
      delete root.dataset.reset;
    }
    timers = [40, 170, 300, 440].map((t, i) =>
      setTimeout(() => {
        root.dataset.stage = String(i + 1);
        if (i === 3) announce(a);
      }, full ? t : 0),
    );
  }

  input.onkeydown = (e) => {
    if (e.key === 'Enter' && !e.isComposing) {
      e.preventDefault();
      ask(input.value);
    }
  };
  go.onclick = () => ask(input.value);

  function announce(a: Answer): void {
    const n = a.cited.length;
    const t = n ? (n > 1 ? sub(c.announce.cited, { n }) : c.announce.one) : c.announce.none;
    if (t !== said) live!.textContent = said = t;
  }

  /* Live, once a question has actually run here. */
  function flip(): void {
    const p = $('.prov');
    if (!p || p.dataset.prov === 'live') return;
    p.dataset.prov = 'live';
    p.title = c.live.def;
    p.innerHTML = `<i aria-hidden="true">●</i> ${c.live.label}`;
  }

  /** All four stages, painted at once (staging only shows them). */
  function paint(s: Search): Answer {
    const e = engine!;
    const a = gate(s, floor);
    const n = a.cited.length;
    const part = (i: number) => (s.parts.length > 1 ? sp('q', sub(ui.part, { n: i + 1 })) : '');
    root.dataset.outcome = n ? 'answer' : 'abstain';

    /* QUERY: every word; stopwords struck, cut suffixes faint, df beside. */
    let words = 0;
    const terms = new Set<string>();
    qb.innerHTML = `<div data-toks>${s.parts
      .map(
        (p, i) =>
          `<div data-part>${part(i)}${p.toks
            .map(({ word, term }) => {
              words++;
              const df = term ? dfOf(e, term) : 0;
              if (term) terms.add(term);
              return `<span data-tok="${!term ? 'stop' : df ? 'term' : 'unseen'}">${sp(
                'w',
                term && word.startsWith(term) ? esc(term) + sp('sfx', esc(word.slice(term.length))) : esc(word),
              )}${sp('df', !term ? ui.stop : df ? sub(ui.df, { n: df }) : ui.unseen)}</span>`;
            })
            .join('')}</div>`,
      )
      .join('')}</div>`;
    qr.textContent = sub(ui.read.query, { w: words, t: terms.size });

    /* RETRIEVE: the top eight, a bar each, the floor drawn across. The
       slots are the prerendered ones, so a bar that's already drawn
       animates to its new length instead of being replaced. */
    rows.forEach((row, i) => {
      const h = s.hits[i];
      const above = !!h && a.above.includes(h);
      const st = h && a.cited.includes(h) ? 'cited' : above ? 'same' : '';
      const [, where, bar, conf] = row.children as unknown as HTMLElement[];
      row.dataset.hit = h ? 'on' : 'empty';
      row.dataset.above = String(above);
      row.dataset.state = st;
      where.innerHTML = h ? sp('path', part(h.part) + esc(`${h.p.route}#${h.p.anchor}`)) + sp('snip', esc(h.p.text)) : '';
      bar.style.cssText = h ? `--c:${Math.min(1, h.conf)};--r:${i}` : '';
      conf.textContent = h ? fmt(h.conf) : '';
    });
    rr.textContent = sub(ui.read.retrieve, { m: s.hits.length, n: e.N });

    /* GATE: one line of arithmetic. An answer quotes one passage per
       section, so passages cited and sections cited are the same count. */
    const why = { best: fmt(a.best), floor: fmt(floor) };
    gb.innerHTML = `<p data-gate>${
      n
        ? `<span>${bold(ui.above, { n: a.above.length })}</span><span>${n > 1 ? bold(ui.sections, { n, s: n }) : ui.sectionsOne}</span>`
        : `${sp('held', ui.none)}<span>${bold(ui.abstainWhy, why)}</span>`
    }</p>`;
    gr.textContent = sub(ui.floorAt, { v: fmt(floor) });

    /* ANSWER: the same markup as the build's answers. ABSTAIN is
       prerendered; it only needs showing, and its reason filling in. */
    abstain.hidden = !!n;
    abstain.lastElementChild!.textContent = sub(ui.abstainWhy, why);
    ab.innerHTML = n
      ? `<ol data-a="quotes">${a.cited
          .map((h, i) => {
            const q = quote(h.p.text, h.matched, e.stop);
            const href = esc(`${h.p.route}#${h.p.anchor}`);
            return `<li data-a="quote" style="--i:${i}"><blockquote data-a="text" data-cut="${+q.before}${+q.after}"><p>${esc(
              q.text,
            )}</p></blockquote><p data-a="cite">${part(h.part)}<a href="${href}"><span data-a="where">${href}</span><span data-a="head">${esc(
              h.p.heading,
            )}</span></a><span data-a="conf">${fmt(h.conf)}</span></p></li>`;
          })
          .join('')}</ol>`
      : '';
    return a;
  }

  /* Break the input: each case's verdict at the current floor. The build
     ran every case at every floor the slider can reach, and wrote the
     floors where it does what it promises on its answer (data-met). The
     words for each verdict are prerendered; CSS shows the one that
     matches. */
  function verdicts(pct: number): void {
    const f = String(pct);
    for (const b of chips) {
      const m = document.getElementById(`ask-q${b.dataset.chip}`)?.dataset.met;
      const v = b.parentElement!.querySelector('[data-verdict]');
      if (v && m !== undefined) v.setAttribute('data-verdict', m.split(' ').includes(f) ? 'met' : 'missed');
    }
  }

  /* The floor. */
  range?.addEventListener('input', () => {
    floor = Number(range.value);
    const v = fmt(floor);
    $('[data-floor-out]')!.textContent = v;
    $('[data-gate-tag]')!.textContent = sub(ui.floorAt, { v });
    const pct = Math.round(floor * 100);
    range.setAttribute('aria-valuetext', sub(c.valuetext, { v, pct }));
    $('[data-run]')!.style.setProperty('--floor', String(floor));
    verdicts(pct);
    if (!cur) return;
    timers.forEach(clearTimeout);
    root.dataset.stage = '4';
    const a = paint(cur);
    /* The outcome once the slider settles, and only if it changed. */
    clearTimeout(quiet);
    quiet = setTimeout(() => announce(a), 700);
  });
}

export function initAsk(): void {
  document.querySelectorAll<HTMLElement>('[data-ask]').forEach(wire);
}
