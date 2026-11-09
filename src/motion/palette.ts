/**
 * ⌘K: the command palette.
 *
 * Markup contract: [data-palette] on the nav's "Jump to ⌘K" button. The
 * dialog itself is built here on first use, because nobody who never
 * presses ⌘K should download or parse it; the nav and footer stay the real,
 * crawlable way around the site.
 *
 * A native <dialog> opened with showModal(), so focus is trapped and Esc
 * closes it and returns focus to whatever opened it. The input is a
 * combobox driving a listbox through aria-activedescendant. Matching is a
 * subsequence match ("tsit" finds "This Site"), scored so word starts and
 * runs of consecutive letters rank first. No single-key shortcuts (WCAG
 * 2.1.4): only ⌘K / Ctrl K, which boot.ts registers.
 *
 * JS-built DOM is styled by attribute selectors under [data-palette-dialog]
 * so check-css never sees a class it can't find in the HTML.
 */

import { palette as P } from '../content-palette';
import { CONTACT } from '../content';
import { SITE_PAGES } from '../site-pages';
import { isPaused, setPaused } from './prefs';

type Cmd = { id: string; group: string; label: string; hint?: string; run: () => void | Promise<void> };

let dialog: HTMLDialogElement | null = null;
let input: HTMLInputElement;
let list: HTMLUListElement;
let out: HTMLPreElement;
let live: HTMLParagraphElement;
let all: Cmd[] = [];
let shown: Cmd[] = [];
let active = 0;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string> = {}, text?: string) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  if (text !== undefined) n.textContent = text;
  return n;
}

/** Subsequence score: -1 when the query isn't a subsequence of the label. */
function score(q: string, label: string): number {
  if (!q) return 0;
  const s = label.toLowerCase();
  let si = 0;
  let total = 0;
  let run = 0;
  for (const ch of q) {
    const at = s.indexOf(ch, si);
    if (at < 0) return -1;
    run = at === si ? run + 1 : 0;
    const wordStart = at === 0 || /[\s/.\-&]/.test(s[at - 1]);
    total += 1 + run * 2 + (wordStart ? 3 : 0) - Math.min(at - si, 4) * 0.25;
    si = at + 1;
  }
  return total;
}

function setView(v: 'render' | 'source' | 'machine'): void {
  /* Drive the real radios so views.ts stays the single owner of the view
     state, and the status bar shows what changed. */
  const radio = document.querySelector<HTMLInputElement>(`[data-views="status"] input[value="${v}"]`);
  if (radio) {
    radio.checked = true;
    radio.dispatchEvent(new Event('change', { bubbles: true }));
  } else {
    document.documentElement.dataset.view = v;
  }
}

async function curl(): Promise<void> {
  out.hidden = false;
  out.textContent = `$ curl -I ${location.origin}${location.pathname}\n…`;
  try {
    const r = await fetch(location.pathname, { method: 'HEAD', cache: 'no-store', credentials: 'omit' });
    const lines = [`$ curl -I ${location.origin}${location.pathname}`, `HTTP ${r.status} ${r.statusText}`.trim()];
    const KEY = ['content-security-policy', 'x-frame-options', 'referrer-policy', 'permissions-policy', 'x-content-type-options'];
    r.headers.forEach((v, k) => {
      if (k === 'content-security-policy') {
        lines.push(`${k}:`);
        v.split(';').forEach((d) => d.trim() && lines.push(`    ${d.trim()};`));
      } else lines.push(`${k}: ${v}`);
    });
    for (const k of KEY) if (!r.headers.has(k)) lines.push(`${k}: (${P.commands.curlMissing})`);
    lines.push('', P.commands.curlNote);
    out.textContent = lines.join('\n');
  } catch {
    out.textContent = P.commands.curlFail;
  }
}

function commands(): Cmd[] {
  const cmds: Cmd[] = [];
  for (const p of SITE_PAGES) {
    cmds.push({
      id: `page${p.route}`,
      group: P.groups.pages,
      label: p.label,
      hint: p.route,
      run: () => {
        location.href = p.route;
      },
    });
  }
  document.querySelectorAll<HTMLElement>('main section[id]').forEach((sec) => {
    const h = sec.querySelector('h2');
    const text = h?.getAttribute('aria-label') ?? h?.textContent?.replace(/\s+/g, ' ').trim();
    if (!text) return;
    cmds.push({
      id: `sec#${sec.id}`,
      group: P.groups.sections,
      label: text,
      hint: `#${sec.id}`,
      run: () => {
        close();
        sec.scrollIntoView({ behavior: document.documentElement.dataset.motion === 'reduced' ? 'auto' : 'smooth' });
        history.replaceState(null, '', `#${sec.id}`);
      },
    });
  });
  (['render', 'source', 'machine'] as const).forEach((v) =>
    cmds.push({
      id: `view:${v}`,
      group: P.groups.views,
      label: P.views[v],
      run: () => {
        close();
        setView(v);
      },
    }),
  );
  cmds.push(
    {
      id: 'measure',
      group: P.groups.commands,
      label: P.commands.measure,
      run: () => {
        close();
        const m = document.getElementById('machine') ?? document.querySelector('[data-machine]');
        if (m) m.scrollIntoView({ behavior: 'smooth' });
        else setView('machine');
      },
    },
    {
      id: 'llms',
      group: P.groups.commands,
      label: P.commands.llms,
      hint: '/llms.txt',
      run: () => {
        location.href = '/llms.txt';
      },
    },
    {
      id: 'copy',
      group: P.groups.commands,
      label: P.commands.copy,
      hint: CONTACT,
      run: async () => {
        try {
          await navigator.clipboard.writeText(CONTACT);
          live.textContent = P.commands.copied;
        } catch {
          /* Clipboard refused: the address is in the hint, readable. */
        }
      },
    },
    {
      id: 'pause',
      group: P.groups.commands,
      label: isPaused() ? P.commands.resume : P.commands.pause,
      run: () => {
        setPaused(!isPaused());
        close();
      },
    },
    { id: 'curl', group: P.groups.commands, label: P.commands.curl, run: curl },
  );
  return cmds;
}

function render(): void {
  const q = input.value.trim().toLowerCase();
  const scored = all
    .map((c, i) => ({ c, s: Math.max(score(q, c.label), c.hint ? score(q, c.hint) - 1 : -1), i }))
    .filter((x) => x.s >= 0);
  if (q) scored.sort((a, b) => b.s - a.s || a.i - b.i);
  shown = scored.map((x) => x.c);
  active = Math.min(active, Math.max(0, shown.length - 1));

  list.replaceChildren();
  let lastGroup = '';
  shown.forEach((c, i) => {
    if (!q && c.group !== lastGroup) {
      list.append(el('li', { role: 'presentation', 'data-p-group': '' }, c.group));
      lastGroup = c.group;
    }
    const li = el('li', {
      role: 'option',
      id: `pal-o-${i}`,
      'aria-selected': String(i === active),
      'data-p-option': '',
    });
    li.append(el('span', { 'data-p-label': '' }, c.label));
    if (c.hint) li.append(el('span', { 'data-p-hint': '' }, c.hint));
    li.addEventListener('pointerenter', () => {
      active = i;
      sync();
    });
    li.addEventListener('click', () => void run(i));
    list.append(li);
  });
  if (!shown.length) list.append(el('li', { role: 'presentation', 'data-p-empty': '' }, P.empty));
  live.textContent = shown.length === 1 ? P.count.one : P.count.many.replace('{n}', String(shown.length));
  sync();
}

function sync(): void {
  list.querySelectorAll<HTMLElement>('[role="option"]').forEach((o, i) => {
    o.setAttribute('aria-selected', String(i === active));
  });
  if (shown.length) {
    input.setAttribute('aria-activedescendant', `pal-o-${active}`);
    document.getElementById(`pal-o-${active}`)?.scrollIntoView({ block: 'nearest' });
  } else input.removeAttribute('aria-activedescendant');
}

async function run(i: number): Promise<void> {
  const c = shown[i];
  if (c) await c.run();
}

function close(): void {
  dialog?.close();
}

function build(): void {
  dialog = el('dialog', { 'data-palette-dialog': '', 'aria-label': P.label }) as HTMLDialogElement;
  const head = el('div', { 'data-p-head': '' });
  const id = 'pal-input';
  const lab = el('label', { for: id, 'data-p-label-k': '' }, P.label);
  input = el('input', {
    id,
    type: 'text',
    role: 'combobox',
    'aria-expanded': 'true',
    'aria-controls': 'pal-list',
    'aria-autocomplete': 'list',
    autocomplete: 'off',
    spellcheck: 'false',
    placeholder: P.placeholder,
  }) as HTMLInputElement;
  const x = el('button', { type: 'button', 'data-p-close': '', 'aria-label': P.close }, 'esc');
  head.append(lab, input, x);
  list = el('ul', { id: 'pal-list', role: 'listbox', 'aria-label': P.label }) as HTMLUListElement;
  out = el('pre', { 'data-p-out': '', 'aria-live': 'polite' }) as HTMLPreElement;
  out.hidden = true;
  live = el('p', { 'data-p-live': '', 'aria-live': 'polite' }) as HTMLParagraphElement;
  const foot = el('p', { 'data-p-foot': '', 'aria-hidden': 'true' }, P.hint);
  dialog.append(head, list, out, foot, live);
  document.body.append(dialog);

  input.addEventListener('input', () => {
    active = 0;
    out.hidden = true;
    render();
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!shown.length) return;
      active = (active + (e.key === 'ArrowDown' ? 1 : -1) + shown.length) % shown.length;
      sync();
    } else if (e.key === 'Home' && e.ctrlKey) {
      active = 0;
      sync();
    } else if (e.key === 'End' && e.ctrlKey) {
      active = Math.max(0, shown.length - 1);
      sync();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      void run(active);
    }
  });
  x.addEventListener('click', close);
  /* A click on the backdrop (the dialog element itself, outside its box)
     closes it, as a modal should. */
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) close();
  });
}

export function initPalette(): void {
  if (!dialog) build();
  if (dialog!.open) return;
  all = commands();
  input.value = '';
  active = 0;
  out.hidden = true;
  render();
  dialog!.showModal();
  input.focus();
}
