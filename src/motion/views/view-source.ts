/**
 * Source view: every section shows the code that produced it.
 *
 * Fetches /source/<slug>.json once (written by scripts/gen-machine.mjs:
 * `{sections: [{id, src, renderer, contracts, bytes: {raw, gz}, content}]}`)
 * and inserts an <aside data-source-sheet aria-label="Source: hero"> into
 * every [data-src] section: the content export, the renderer, the motion
 * contracts present, the section's bytes and its content object as
 * highlighted JSON, {em} markers and all.
 *
 * If the map isn't there (a dev server, or a build that hasn't written it
 * yet), each sheet still shows what the page itself says, read from the
 * section's own data-src and data-renderer, and the bytes of the section
 * as it arrived (measured here, from the pristine HTML), and says plainly
 * that the map isn't built. Nothing is invented to fill the gap.
 *
 * Sheets sit over the right 40% of their section on a desktop and inline
 * under the section head below 1024px (views.css). Labels come from a
 * <template> the status bar ships, so this chunk carries no copy.
 */
import { pristine } from '../../pristine';

type Entry = {
  id: string;
  src?: string;
  renderer?: string;
  contracts?: string[];
  bytes?: { raw: number; gz: number };
  content?: unknown;
};

/** Attribute contracts a motion module looks for (scripts/check-motion). */
const CONTRACTS = [
  'data-reveal', 'data-scrub', 'data-flow', 'data-lattice', 'data-compile', 'data-decode', 'data-telemetry',
  'data-machine', 'data-ask', 'data-pipeline', 'data-replay', 'data-leaders', 'data-headers',
];

const slug = (route: string) => (route === '/' ? 'home' : route.replace(/^\/|\/$/g, '').replace(/\//g, '-'));

let map: Promise<Entry[] | null> | null = null;
let sheets: HTMLElement[] = [];

function load(): Promise<Entry[] | null> {
  map ??= fetch(`/source/${slug(location.pathname)}.json`, { credentials: 'omit' })
    .then((r) => (r.ok && /json/.test(r.headers.get('content-type') ?? 'json') ? r.json() : null))
    .then((d: { sections?: Entry[] } | null) => (Array.isArray(d?.sections) ? d!.sections : null))
    .catch(() => null);
  return map;
}

const kb = (n: number) => (n < 1024 ? `${n} B` : `${(n / 1024).toFixed(1)} kB`);

/** "content.ts#hero" → "content.ts → hero". */
const arrow = (s: string) => s.replace('#', ' → ');

/** The section as it arrived, gzipped here, for when the map is missing. */
async function measured(id: string): Promise<{ raw: number; gz: number | null } | null> {
  try {
    const doc = new DOMParser().parseFromString(pristine || document.documentElement.outerHTML, 'text/html');
    const el = doc.getElementById(id);
    if (!el) return null;
    const bytes = new TextEncoder().encode(el.outerHTML);
    let gz: number | null = null;
    if (typeof CompressionStream !== 'undefined') {
      const s = new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip'));
      gz = (await new Response(s).arrayBuffer()).byteLength;
    }
    return { raw: bytes.length, gz };
  } catch {
    return null;
  }
}

/** JSON → spans: keys violet, strings, numbers and literals teal, and the
 *  authoring markers ({em}, {/em}, {k}, {/k}) in copper. Built with text
 *  nodes, never innerHTML. */
function highlight(pre: HTMLElement, value: unknown): void {
  const text = JSON.stringify(value, null, 2) ?? '';
  const re = /("(?:\\.|[^"\\])*")(\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g;
  const frag = document.createDocumentFragment();
  const span = (kind: string, s: string) => {
    const e = document.createElement('span');
    e.dataset.j = kind;
    e.textContent = s;
    return e;
  };
  let last = 0;
  for (let m: RegExpExecArray | null; (m = re.exec(text)); ) {
    if (m.index > last) frag.append(text.slice(last, m.index));
    if (m[1] && m[2]) {
      frag.append(span('k', m[1]), m[2]);
    } else if (m[1]) {
      const s = span('s', '');
      for (const part of m[1].split(/(\{\/?(?:em|k)\})/)) {
        if (!part) continue;
        s.append(/^\{\/?(em|k)\}$/.test(part) ? span('m', part) : part);
      }
      frag.append(s);
    } else frag.append(span('n', m[0]));
    last = re.lastIndex;
  }
  frag.append(text.slice(last));
  pre.replaceChildren(frag);
}

async function sheetFor(section: HTMLElement, tpl: HTMLTemplateElement, entry: Entry | undefined, none: string): Promise<HTMLElement> {
  const el = tpl.content.firstElementChild!.cloneNode(true) as HTMLElement;
  const id = section.id;
  el.setAttribute('aria-label', (el.getAttribute('aria-label') ?? '').replace('{id}', id));
  const set = (k: string, s: string) => {
    const t = el.querySelector<HTMLElement>(`[data-s="${k}"]`);
    if (t) t.textContent = s;
  };
  set('id', `#${id}`);
  set('src', arrow(entry?.src ?? section.dataset.src ?? ''));
  set('renderer', arrow(entry?.renderer ?? section.dataset.renderer ?? ''));
  const found = entry?.contracts ?? CONTRACTS.filter((a) => section.hasAttribute(a) || section.querySelector(`[${a}]`)).map((a) => `[${a}]`);
  set('contracts', found.length ? found.join(' ') : none);
  const pre = el.querySelector<HTMLElement>('[data-s="content"]')!;
  if (entry) {
    if (entry.bytes) set('bytes', `${kb(entry.bytes.raw)} raw · ${kb(entry.bytes.gz)} gz`);
    /* null: the map names the export but couldn't resolve it. */
    if (entry.content != null) highlight(pre, entry.content);
    else pre.remove();
  } else {
    pre.remove();
    el.querySelector<HTMLElement>('[data-s="missing"]')?.removeAttribute('hidden');
    const b = await measured(id);
    set('bytes', b ? `${kb(b.raw)} raw${b.gz !== null ? ` · ${kb(b.gz)} gz` : ''}` : none);
  }
  return el;
}

let entered = 0;

export default {
  async enter(): Promise<void> {
    const ticket = ++entered;
    const tpl = document.querySelector<HTMLTemplateElement>('template[data-source-tpl]');
    if (!tpl) return;
    const none = document.querySelector<HTMLElement>('[data-views="status"]')?.dataset.none ?? '';
    const entries = await load();
    if (ticket !== entered || document.documentElement.dataset.view !== 'source') return;
    const vh = window.innerHeight || 1;
    const sections = Array.from(document.querySelectorAll<HTMLElement>('main section[data-src][id]'));
    const made = await Promise.all(
      sections.map((s) => sheetFor(s, tpl, entries?.find((e) => e.id === s.id), none)),
    );
    if (ticket !== entered || document.documentElement.dataset.view !== 'source') return;
    sections.forEach((s, i) => {
      const el = made[i];
      /* Appear as the scanline passes this section's top. */
      const t = s.getBoundingClientRect().top / vh;
      el.style.setProperty('--sy', String(Math.min(1, Math.max(0, t)).toFixed(3)));
      const wrap = s.querySelector(':scope > .wrap') ?? s;
      const rail = wrap.querySelector(':scope > .rail');
      if (rail) rail.after(el);
      else wrap.prepend(el);
      sheets.push(el);
    });
  },
  leave(): void {
    entered++;
    for (const s of sheets) s.remove();
    sheets = [];
  },
};
