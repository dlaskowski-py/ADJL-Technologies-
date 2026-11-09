/**
 * [data-headers]: the live curl -I panel.
 *
 * The panel ships with the policy as configured (BUILD). This sends one
 * HEAD request for this page, with the cache bypassed and no cookies, and
 * prints what the server actually answered: `HTTP {status}` and every
 * header the browser lets a script read (all of them, on the same origin),
 * with the security headers highlighted and the policy one directive per
 * line. A security header the server didn't send keeps its configured
 * value, marked: a local preview server doesn't send Netlify's headers, and
 * the panel says so instead of pretending.
 */
import { flipChip } from './telemetry';

const SECURITY = ['content-security-policy', 'x-frame-options', 'referrer-policy', 'permissions-policy', 'x-content-type-options'];

const span = (attrs: Record<string, string>, ...kids: (Node | string)[]) => {
  const s = document.createElement('span');
  for (const [k, v] of Object.entries(attrs)) s.setAttribute(k, v);
  s.append(...kids);
  return s;
};

/** One header as `name: value`, the policy split one directive per line. */
function line(name: string, value: string): HTMLElement {
  const sec = SECURITY.includes(name);
  const el = span({ 'data-h': name, ...(sec ? { 'data-sec': '' } : {}) }, span({ 'data-hn': '' }, `${name}:`));
  if (name === 'content-security-policy') {
    const dirs = value.split(';').map((d) => d.trim()).filter(Boolean);
    dirs.forEach((d, i) => {
      const [n, ...rest] = d.split(/\s+/);
      el.append('\n  ', span({ 'data-dir': '' }, n));
      if (rest.length) el.append(' ', span({ 'data-val': '' }, rest.join(' ')));
      if (i < dirs.length - 1) el.append(';');
    });
  } else el.append(` ${value}`);
  return el;
}

export async function initHeaders(): Promise<void> {
  const panel = document.querySelector<HTMLElement>('[data-headers]');
  if (!panel) return;
  let copy: { missing: string };
  try {
    copy = JSON.parse(panel.dataset.copy ?? '');
  } catch {
    return;
  }
  const url = panel.querySelector('[data-url]');
  if (url) url.textContent = location.href.split('#')[0];

  let res: Response;
  try {
    res = await fetch(location.pathname, { method: 'HEAD', cache: 'no-store', credentials: 'omit' });
  } catch {
    return;
  }

  const status = panel.querySelector<HTMLElement>('[data-k="status"]');
  if (status) {
    status.textContent = `${res.status}${res.statusText ? ` ${res.statusText}` : ''}`;
    status.removeAttribute('title');
    status.dataset.live = '';
  }

  /* What the server sent, in the order the browser lists it (sorted). */
  const out = panel.querySelector<HTMLElement>('[data-headers-live]');
  const build = panel.querySelector<HTMLElement>('[data-headers-build]');
  if (!out || !build) return;
  const got = new Map<string, string>();
  res.headers.forEach((v, k) => got.set(k.toLowerCase(), v));

  const frag = document.createDocumentFragment();
  for (const [k, v] of got) frag.append('\n', line(k, v));

  /* Security headers the server didn't send: their configured line, kept
     and marked, in the order the configuration gives them. */
  const missing = Array.from(build.querySelectorAll<HTMLElement>('[data-h][data-sec]')).filter((el) => !got.has(el.dataset.h!));
  for (const el of missing) {
    const kept = el.cloneNode(true) as HTMLElement;
    kept.dataset.missing = '';
    frag.append('\n', kept, '\n  ', span({ 'data-note': '' }, `▲ ${copy.missing}`));
  }
  build.hidden = true;
  out.replaceChildren(frag);

  /* The annotations: a directive the live policy doesn't carry is marked. */
  const live = (got.get('content-security-policy') ?? '')
    .split(';')
    .map((d) => d.trim().split(/\s+/)[0])
    .filter(Boolean);
  panel.querySelectorAll<HTMLElement>('.headers-row[data-dir]').forEach((row) => {
    if (!live.includes(row.dataset.dir!)) {
      row.dataset.missing = '';
      row.title = copy.missing;
    }
  });

  panel.dataset.state = 'live';
  flipChip(panel.querySelector('.panel-head > .prov'));
}
