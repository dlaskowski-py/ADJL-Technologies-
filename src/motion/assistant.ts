/**
 * [data-assistant]: the scoping assistant and the intake form on /start/.
 *
 * Two roots, both prerendered and complete without this module:
 *
 *   [data-assistant="chat"]  The panel arrives at rest, its composer
 *       disabled. This asks GET /api/assistant whether it's switched on
 *       and sets data-state on [data-asst]: loading → on, off (no key yet)
 *       or unreachable. CSS shows the matching status line. Loading and
 *       on share one size, so turning on moves nothing. Off and
 *       unreachable fold the section down to one line that points to the
 *       form, but only while the part that folds is still below the
 *       screen (see setState()), so nothing a visitor can see moves. When
 *       it's on, a visitor's message goes to POST /api/assistant and the
 *       reply streams back as NDJSON (the wire format is documented in
 *       netlify/functions/assistant.mjs): text, the pages it cites, which
 *       model answered, how it ended. The conversation lives in this
 *       tab's memory only. "Draft my brief" asks for a brief and puts it
 *       in the form. Nothing here ever sends the form: the visitor does.
 *
 *   [data-assistant="form"]  The Netlify form. It posts to /start/sent/
 *       with no script. With one: ?topic= preselects the topic, fields are
 *       checked with messages tied to each field (aria-invalid,
 *       aria-describedby, focus to the first problem), and the form is
 *       sent with fetch, URL-encoded to "/", and confirmed in place.
 *
 * Everything built here is styled by attributes under [data-assistant]
 * (src/styles/pages/start.css), never by classes. Every string comes from
 * the JSON block the renderer writes next to the panel; the model's words
 * and the visitor's are written with textContent, never as HTML. The chat
 * log is role="log" (polite) and aria-busy while a reply streams, so a
 * screen reader hears each reply once, whole. The typing dots stop under
 * reduced motion and Pause.
 *
 * OWNER: WS-A. Contract: [data-assistant].
 */
import type { AssistantCopy } from '../sections/start';
import { SITE_PAGES } from '../site-pages';

type Msg = { role: 'user' | 'assistant'; text: string };
type Brief = {
  want: string;
  audience: string;
  must_haves: string[];
  timeline: string | null;
  budget: string | null;
  open_questions: string[];
  topic: string;
};
type Wire =
  | { t: 'model'; model: string }
  | { t: 'text'; v: string }
  | { t: 'cite'; route: string; title: string }
  | { t: 'fallback'; from: string | null; to: string | null }
  | { t: 'done'; stop: string; model: string; left: number }
  | { t: 'refusal' }
  | { t: 'error'; code: string };

const API = '/api/assistant';
/** How much of each reply goes back to the function with the next turn.
 *  Replies aim for about 120 words; one cut off at max_tokens can run to
 *  thousands of characters, and the function shortens anything past this
 *  too (LIMITS.replyChars). What's shown on screen stays whole. */
const KEEP = 2000;
const LABEL: Record<string, string> = Object.fromEntries(SITE_PAGES.map((p) => [p.route, p.label]));
const sub = (t: string, v: Record<string, string | number>) => t.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ''));
const still = () => document.documentElement.dataset.motion === 'reduced';

function el<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string> = {}, text?: string) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (text !== undefined) e.textContent = text;
  return e;
}

/* ── The form ─────────────────────────────────────────────────────── */

type FormApi = { fill(b: Brief): void };

function wireForm(root: HTMLElement, copy: AssistantCopy): FormApi | null {
  const form = root.querySelector<HTMLFormElement>('form[data-form]');
  if (!form) return null;
  const c = copy.form;
  const q = <T extends HTMLElement>(s: string) => form.querySelector<T>(s)!;
  const name = q<HTMLInputElement>('[name="name"]');
  const email = q<HTMLInputElement>('[name="email"]');
  const topic = q<HTMLSelectElement>('[name="topic"]');
  const message = q<HTMLTextAreaElement>('[name="message"]');
  const source = q<HTMLInputElement>('[data-source]');
  const submit = q<HTMLButtonElement>('[data-submit]');
  const alert = q<HTMLElement>('[data-alert]');
  const hint = form.querySelector<HTMLElement>('#f-message-hint');
  const hintText = hint?.textContent ?? '';
  if (!name || !email || !topic || !message || !submit) return null;

  /* The script validates, with words tied to each field. */
  form.noValidate = true;

  /* ?topic=audit, or the topic's own name. */
  const want = new URLSearchParams(location.search).get('topic')?.trim().toLowerCase();
  if (want) {
    const t = copy.topics.find((x) => x.slug === want || x.label.toLowerCase() === want);
    if (t) topic.value = t.label;
  }

  const checks: [HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, () => string][] = [
    [name, () => (name.value.trim() ? '' : c.errors.name)],
    [
      email,
      () => {
        const v = email.value.trim();
        if (!v) return c.errors.emailMissing;
        return email.validity.typeMismatch || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? c.errors.emailInvalid : '';
      },
    ],
    [topic, () => (topic.value ? '' : c.errors.topic)],
    [message, () => (message.value.trim() ? '' : c.errors.message)],
  ];
  const show = (f: HTMLElement, msg: string) => {
    const err = form.querySelector<HTMLElement>(`#${f.id}-err`);
    if (err) err.textContent = msg;
    if (msg) f.setAttribute('aria-invalid', 'true');
    else f.removeAttribute('aria-invalid');
  };
  /* Once a field has been flagged, it re-checks as it's corrected. */
  for (const [f, check] of checks) {
    const again = () => {
      if (f.getAttribute('aria-invalid') === 'true') show(f, check());
    };
    f.addEventListener('input', again);
    f.addEventListener('change', again);
  }

  let sending = false;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (sending) return;
    let first: HTMLElement | null = null;
    for (const [f, check] of checks) {
      const msg = check();
      show(f, msg);
      if (msg && !first) first = f;
    }
    if (first) {
      first.focus();
      return;
    }

    sending = true;
    alert.textContent = '';
    const label = submit.querySelector('span');
    const idle = label?.textContent ?? '';
    if (label) label.textContent = c.sending;
    submit.setAttribute('aria-disabled', 'true');

    const body = new URLSearchParams();
    new FormData(form).forEach((v, k) => {
      if (typeof v === 'string') body.append(k, v);
    });
    /* Netlify adds this hidden field to the deployed HTML; say it anyway. */
    body.set('form-name', form.getAttribute('name') ?? 'start');

    const ctl = new AbortController();
    const timer = window.setTimeout(() => ctl.abort(), 20_000);
    let ok = false;
    try {
      const res = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
        signal: ctl.signal,
      });
      ok = res.ok;
    } catch {
      ok = false;
    }
    window.clearTimeout(timer);
    sending = false;
    submit.removeAttribute('aria-disabled');
    if (label) label.textContent = idle;

    if (!ok) {
      alert.textContent = c.failed;
      return;
    }
    /* Confirm in place. The panel keeps its height, so nothing below moves. */
    const panel = form.parentElement!;
    panel.style.minHeight = `${panel.offsetHeight}px`;
    const done = el('div', { 'data-done': '', tabindex: '-1', role: 'status' });
    done.append(el('p', { 'data-done-title': '' }, c.sentTitle), el('p', {}, c.sentBody));
    form.hidden = true;
    panel.append(done);
    done.focus();
  });

  return {
    fill(b) {
      const lines = [`${copy.brief.want}: ${b.want}`];
      if (b.audience) lines.push(`${copy.brief.audience}: ${b.audience}`);
      if (b.must_haves.length) lines.push(`${copy.brief.must}:\n${b.must_haves.map((m) => `- ${m}`).join('\n')}`);
      if (b.timeline) lines.push(`${copy.brief.timeline}: ${b.timeline}`);
      if (b.budget) lines.push(`${copy.brief.budget}: ${b.budget}`);
      if (b.open_questions.length) lines.push(`${copy.brief.open}:\n${b.open_questions.map((m) => `- ${m}`).join('\n')}`);
      const brief = lines.join('\n\n');
      /* Anything the visitor already wrote stays, under the draft. */
      const prev = message.value.trim();
      const drafted = message.dataset.drafted;
      message.value = prev && prev !== drafted ? `${brief}\n\n${prev}` : brief;
      message.dataset.drafted = brief;
      if (copy.topics.some((t) => t.label === b.topic)) topic.value = b.topic;
      source.value = 'assistant';
      for (const f of [topic, message]) show(f, '');
      if (hint) hint.textContent = c.drafted || hintText;

      /* The panel, not the section: on a phone the section opens with its
         heading and a screen of copy, and the draft would be out of sight. */
      (root.querySelector<HTMLElement>('[data-intake]') ?? root).scrollIntoView({
        behavior: still() ? 'auto' : 'smooth',
        block: 'start',
      });
      message.focus({ preventScroll: true });
      message.setSelectionRange(0, 0);
      message.scrollTop = 0;
    },
  };
}

/* ── The chat ─────────────────────────────────────────────────────── */

function wireChat(root: HTMLElement, copy: AssistantCopy, form: FormApi | null): void {
  const panel = root.querySelector<HTMLElement>('[data-asst]');
  if (!panel) return;
  const $ = <T extends HTMLElement>(s: string) => root.querySelector<T>(s);
  const log = $<HTMLElement>('[data-log]');
  const input = $<HTMLTextAreaElement>('[data-q]');
  const count = $<HTMLElement>('[data-count]');
  const send = $<HTMLButtonElement>('[data-send]');
  const draftBtn = $<HTMLButtonElement>('[data-draft]');
  const note = $<HTMLElement>('[data-note]');
  const left = $<HTMLElement>('[data-left]');
  const sources = $<HTMLElement>('[data-sources]');
  const none = $<HTMLElement>('[data-none]');
  const starters = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-starter]'));
  if (!log || !input || !count || !send || !draftBtn || !note || !left || !sources) return;
  const ui = copy.ui;

  const history: Msg[] = [];
  const cited = new Set<string>();
  let turns = 8;
  let max = 1500;
  /** The model the function names in its status: anything else that
   *  answers is a backup, and the reply says so. */
  let primary = '';
  let busy = false;
  let state = '';

  const controls = [input, send, draftBtn, ...starters];
  /** Off or unreachable, the section folds to its heading and one line
   *  pointing to the form (src/styles/pages/start.css, keyed on the
   *  section's data-asst-state). Everything from the intro paragraph down
   *  moves when it folds, so it folds only while that part is still below
   *  the screen. That's where it sits for a visitor who arrives at the
   *  top. Anyone already looking at the section, or scrolled past it to
   *  the form (say on /start/?topic=audit#form), keeps the full section
   *  with its status line, the way it was, and nothing they can see moves.
   *  Folding under them would count as layout shift, even with a scroll to
   *  make up for it, and under reduced motion that scroll can't be
   *  measured right, since every change there is a 0.01ms transition. */
  const shut = (s: string) => s === 'off' || s === 'unreachable';
  const folds = root.querySelector<HTMLElement>('.start-body, .asst-grid');
  const unseen = () => !!folds && folds.getBoundingClientRect().top >= window.innerHeight;
  const setState = (s: string) => {
    if (!shut(s) || unseen()) root.dataset.asstState = s;
    state = s;
    panel.dataset.state = s;
    const on = s === 'on';
    for (const c of controls) c.disabled = !on && !(s === 'ended' && c === draftBtn);
  };
  const say = (t: string) => (note.textContent = t);
  const used = () => history.filter((m) => m.role === 'user').length;
  const meter = () => {
    const n = Math.max(0, turns - used());
    left.textContent = n === 1 ? ui.leftOne : sub(ui.left, { n });
  };
  const counter = () => {
    count.textContent = sub(ui.count, { n: input.value.length.toLocaleString('en-US'), max: max.toLocaleString('en-US') });
  };
  const pinned = () => log.scrollHeight - log.scrollTop - log.clientHeight < 48;
  const toEnd = () => (log.scrollTop = log.scrollHeight);

  /** One message in the log. Words go in with textContent, never HTML. */
  const bubble = (role: 'user' | 'assistant' | 'intro', text = '') => {
    const m = el('div', { 'data-msg': role });
    m.append(el('p', { 'data-who': '' }, role === 'user' ? ui.you : ui.them));
    const body = el('div', { 'data-body': '' });
    m.append(body);
    log.append(m);
    paint(body, text);
    toEnd();
    return { m, body };
  };
  const paint = (body: HTMLElement, text: string) => {
    const paras = text
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean);
    body.replaceChildren(...paras.map((p) => el('p', {}, p)));
  };
  const typing = (body: HTMLElement) => {
    const t = el('p', { 'data-typing': '' });
    t.append(el('span', {}, ui.writing), el('i', { 'aria-hidden': 'true' }), el('i', { 'aria-hidden': 'true' }), el('i', { 'aria-hidden': 'true' }));
    body.replaceChildren(t);
  };
  const addSource = (route: string, title: string) => {
    if (cited.has(route)) return;
    cited.add(route);
    const li = el('li');
    const a = el('a', { href: route }, LABEL[route] ?? title);
    li.append(a, el('span', { 'data-route': '' }, route));
    sources.append(li);
    if (none) none.hidden = true;
  };
  const modelName = (id: string) => copy.models[id] ?? id;

  /* Is it switched on? */
  setState('loading');
  void fetch(API, { cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : null))
    .then((s: { enabled?: boolean; model?: string; turns?: number; chars?: number } | null) => {
      if (!s || typeof s !== 'object') return setState('unreachable');
      if (!s.enabled) return setState('off');
      primary = s.model ?? '';
      if (Number.isInteger(s.turns) && s.turns! > 0) turns = s.turns!;
      if (Number.isInteger(s.chars) && s.chars! > 0) max = s.chars!;
      input.maxLength = max;
      setState('on');
      bubble('intro', ui.greeting);
      meter();
      counter();
    })
    .catch(() => setState('unreachable'));

  input.addEventListener('input', counter);
  /* Enter sends and Shift+Enter starts a new line, with a keyboard. On a
     touch screen, Enter is the only way to a new line, and Send is right
     there, so Enter is left alone. */
  const touch = matchMedia('(pointer: coarse)');
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && !touch.matches) {
      e.preventDefault();
      void ask();
    }
  });
  send.addEventListener('click', () => void ask());
  for (const b of starters) {
    b.addEventListener('click', () => {
      input.value = b.textContent ?? '';
      void ask();
    });
  }
  draftBtn.addEventListener('click', () => void draft());

  /** Undo a turn that didn't get a reply: the words go back in the box. */
  const unwind = (u: HTMLElement, a: HTMLElement | null, text: string, msg: string) => {
    history.pop();
    u.remove();
    a?.remove();
    input.value = text;
    counter();
    meter();
    say(msg);
  };

  const ask = async (): Promise<void> => {
    const text = input.value.trim();
    if (!text || busy || state !== 'on') return;
    if (text.length > max) return void say(copy.errors.too_long);
    busy = true;
    say('');
    panel.dataset.started = '';
    history.push({ role: 'user', text });
    const u = bubble('user', text).m;
    input.value = '';
    counter();
    meter();
    const { m: a, body } = bubble('assistant');
    typing(body);
    log.setAttribute('aria-busy', 'true');
    send.disabled = true;

    let reply = '';
    let stop = '';
    let failed = '';
    let model = '';
    let backup = '';
    const pages: { route: string; title: string }[] = [];
    let frame = 0;
    const repaint = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const stick = pinned();
        paint(body, reply);
        if (stick) toEnd();
      });
    };

    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'chat', messages: history }),
      });
      const type = res.headers.get('content-type') ?? '';
      if (!res.ok || !type.includes('ndjson') || !res.body) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        failed = j?.error ?? 'unreachable';
      } else {
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let buf = '';
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          let nl: number;
          while ((nl = buf.indexOf('\n')) >= 0) {
            const raw = buf.slice(0, nl);
            buf = buf.slice(nl + 1);
            let ev: Wire;
            try {
              ev = JSON.parse(raw) as Wire;
            } catch {
              continue;
            }
            if (ev.t === 'text') {
              reply += ev.v;
              repaint();
            } else if (ev.t === 'cite') pages.push({ route: ev.route, title: ev.title });
            else if (ev.t === 'model') model = ev.model;
            else if (ev.t === 'fallback') backup = ev.to ?? '';
            else if (ev.t === 'done') {
              stop = ev.stop;
              model = ev.model || model;
              if (Number.isInteger(ev.left)) turns = used() + ev.left;
            } else if (ev.t === 'refusal') failed = 'refusal';
            else if (ev.t === 'error') failed = ev.code || 'generic';
          }
        }
        if (!stop && !failed) failed = 'generic';
      }
    } catch {
      failed = 'unreachable';
    }
    cancelAnimationFrame(frame);
    frame = 0;
    busy = false;
    log.removeAttribute('aria-busy');

    if (failed || !reply.trim()) {
      const code = failed || 'generic';
      unwind(u, a, text, copy.errors[code] ?? copy.errors.generic);
      if (code === 'turn_limit') setState('ended');
      else if (code === 'disabled') setState('off');
      else setState('on');
      return;
    }

    paint(body, reply);
    history.push({ role: 'assistant', text: reply.trim().slice(0, KEEP) });
    if (pages.length) {
      const from = el('p', { 'data-from': '' }, `${ui.from} `);
      pages.forEach((p, i) => {
        if (i) from.append(', ');
        from.append(el('a', { href: p.route }, LABEL[p.route] ?? p.title));
        addSource(p.route, p.title);
      });
      a.append(from);
    }
    /* Out of words (max_tokens) or out of time: what arrived stays, marked. */
    if (stop === 'max_tokens' || stop === 'timeout') a.append(el('p', { 'data-flag': '' }, ui.cut));
    if (backup || (model && primary && model !== primary)) {
      a.append(el('p', { 'data-flag': '' }, sub(ui.backup, { model: modelName(backup || model) })));
    }
    toEnd();
    meter();
    if (used() >= turns) {
      setState('ended');
      say(ui.ended);
    } else {
      setState('on');
      input.focus({ preventScroll: true });
    }
  };

  const draft = async (): Promise<void> => {
    if (busy) return;
    if (!history.some((m) => m.role === 'assistant')) return void say(ui.first);
    busy = true;
    draftBtn.setAttribute('aria-disabled', 'true');
    send.disabled = true;
    say(ui.drafting);
    let brief: Brief | null = null;
    let code = 'draft';
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'draft', messages: history }),
      });
      const j = (await res.json().catch(() => null)) as { ok?: boolean; brief?: Brief; error?: string } | null;
      if (res.ok && j?.ok && j.brief) brief = j.brief;
      else code = j?.error ?? 'unreachable';
    } catch {
      code = 'unreachable';
    }
    busy = false;
    draftBtn.removeAttribute('aria-disabled');
    if (state === 'on') send.disabled = false;
    if (!brief || !form) return void say(copy.errors[code] ?? copy.errors.draft);
    say(ui.drafted);
    form.fill(brief);
  };
}

export function initAssistant(): void {
  let copy: AssistantCopy;
  try {
    copy = JSON.parse(document.querySelector('[data-assistant-copy]')?.textContent ?? '') as AssistantCopy;
  } catch {
    return;
  }
  const formRoot = document.querySelector<HTMLElement>('[data-assistant="form"]');
  const chatRoot = document.querySelector<HTMLElement>('[data-assistant="chat"]');
  const form = formRoot ? wireForm(formRoot, copy) : null;
  if (chatRoot) wireChat(chatRoot, copy, form);
}
