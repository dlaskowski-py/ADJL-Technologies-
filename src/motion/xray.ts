/**
 * X-ray: what a crawler or an AI answer engine reads from THIS page.
 *
 * Markup contract: [data-xray] on a container holding:
 *   [data-xray-tab="<key>"]    buttons (role="tab"), one per view
 *   [data-xray-out]            the panel the active view is written into
 *
 * Views:
 *   head       <title>, meta description, canonical, og:image, robots
 *   outline    the heading outline, h1 to h3, read from the live DOM
 *   schema     the page's JSON-LD, pretty-printed and highlighted
 *   llms       /llms.txt, fetched from this origin
 *
 * Nothing in here is an illustration. Every line is read from the document
 * the visitor is looking at, at the moment they open the view, which is the
 * point: the search section of the site argues that machine-readable
 * structure is a craft, and this shows the visitor the structure instead of
 * asking them to believe it exists.
 *
 * DOM is built with textContent throughout. The JSON-LD and llms.txt are
 * our own files, but writing them through innerHTML would make this the one
 * place on the site where a stray '<' in a description became markup.
 */

type View = 'head' | 'outline' | 'schema' | 'llms';

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  cls?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}

function row(k: string, v: string): HTMLElement {
  const r = el('div', 'xr-row');
  r.append(el('span', 'xr-k', k), el('span', 'xr-v', v || '—'));
  return r;
}

function headView(): HTMLElement {
  const meta = (sel: string, attr = 'content') =>
    document.querySelector(sel)?.getAttribute(attr)?.trim() ?? '';
  const box = el('div', 'xr-list');
  const title = document.title;
  const desc = meta('meta[name="description"]');
  box.append(
    row('title', `${title}  (${title.length} chars)`),
    row('description', `${desc}  (${desc.length} chars)`),
    row('canonical', meta('link[rel="canonical"]', 'href')),
    row('og:image', meta('meta[property="og:image"]')),
    row('robots', meta('meta[name="robots"]') || 'index, follow (default)'),
    row('lang', document.documentElement.lang),
  );
  return box;
}

function outlineView(): HTMLElement {
  const box = el('ol', 'xr-outline');
  const main = document.querySelector('main') ?? document.body;
  main.querySelectorAll('h1, h2, h3').forEach((h) => {
    if (h.closest('[data-xray]')) return;
    const level = Number(h.tagName[1]);
    const li = el('li', `xr-h xr-h${level}`);
    li.append(
      el('span', 'xr-tag', h.tagName.toLowerCase()),
      el('span', 'xr-v', (h.textContent ?? '').replace(/\s+/g, ' ').trim()),
    );
    box.append(li);
  });
  return box;
}

/** Tokenize pretty-printed JSON into spans. Strings that end with a colon
 *  are keys. Everything else falls through as punctuation or whitespace. */
function highlightJson(json: string): HTMLElement {
  const pre = el('pre', 'xr-code');
  const re = /("(?:[^"\\]|\\.)*")(\s*:)?|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|(true|false|null)|([{}[\],])/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(json))) {
    if (m.index > last) pre.append(document.createTextNode(json.slice(last, m.index)));
    if (m[1]) {
      pre.append(el('span', m[2] ? 'xj-key' : 'xj-str', m[1]));
      if (m[2]) pre.append(document.createTextNode(m[2]));
    } else if (m[3]) pre.append(el('span', 'xj-num', m[3]));
    else if (m[4]) pre.append(el('span', 'xj-num', m[4]));
    else pre.append(el('span', 'xj-pun', m[5]));
    last = re.lastIndex;
  }
  if (last < json.length) pre.append(document.createTextNode(json.slice(last)));
  return pre;
}

function schemaView(): HTMLElement {
  const blocks = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
  if (!blocks.length) return el('p', 'xr-note', 'No structured data on this page.');
  const parsed = blocks.map((b) => {
    try {
      return JSON.parse(b.textContent ?? '');
    } catch {
      return { error: 'unparseable JSON-LD block' };
    }
  });
  const data = parsed.length === 1 ? parsed[0] : parsed;
  const graph: { '@type'?: string | string[] }[] = data?.['@graph'] ?? [];
  const types = graph.flatMap((n) => (Array.isArray(n['@type']) ? n['@type'] : [n['@type'] ?? '?']));
  const wrap = el('div', 'xr-schema');
  if (types.length) wrap.append(el('p', 'xr-note', `@graph: ${types.join(' · ')}`));
  wrap.append(highlightJson(JSON.stringify(data, null, 2)));
  return wrap;
}

let llmsCache: string | null = null;

async function llmsView(): Promise<HTMLElement> {
  if (llmsCache === null) {
    try {
      const r = await fetch('/llms.txt', { headers: { accept: 'text/plain' } });
      llmsCache = r.ok ? await r.text() : `/llms.txt answered ${r.status}`;
    } catch {
      llmsCache = '/llms.txt could not be fetched (are you offline?)';
    }
  }
  const pre = el('pre', 'xr-code', llmsCache);
  return pre;
}

export function initXray(): void {
  document.querySelectorAll<HTMLElement>('[data-xray]').forEach((root) => {
    const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-xray-tab]'));
    const out = root.querySelector<HTMLElement>('[data-xray-out]');
    if (!tabs.length || !out) return;

    let token = 0;
    const show = async (key: View) => {
      const mine = ++token;
      tabs.forEach((t) => {
        const on = t.dataset.xrayTab === key;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
      });
      const view =
        key === 'head'
          ? headView()
          : key === 'outline'
            ? outlineView()
            : key === 'schema'
              ? schemaView()
              : await llmsView();
      if (mine !== token) return; // a later click won the race
      out.replaceChildren(view);
      out.setAttribute('aria-labelledby', tabs.find((t) => t.dataset.xrayTab === key)?.id ?? '');
      root.classList.add('is-live');
    };

    tabs.forEach((t, i) => {
      t.addEventListener('click', () => void show(t.dataset.xrayTab as View));
      /* Arrow keys move between tabs, per the ARIA tabs pattern. */
      t.addEventListener('keydown', (e) => {
        const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        const next = tabs[(i + d + tabs.length) % tabs.length];
        next.focus();
        void show(next.dataset.xrayTab as View);
      });
    });

    void show((tabs[0].dataset.xrayTab as View) ?? 'head');
  });
}
