/**
 * Machine view, the part that isn't CSS: the drawer.
 *
 * A right-hand <aside data-drawer aria-label="Machine readout"> measuring
 * this page with the same function the build and Machine View use
 * (lib/measure.ts): totals, the h1–h3 outline and the JSON-LD entities,
 * plus "Copy as JSON". It reads the document as it arrived (pristine.ts),
 * which is what a crawler is handed: not a headline mid-decode, not a
 * caption a script rewrote. Its labels come from a <template> the status
 * bar ships (sections/instruments/views.ts), so this chunk carries no copy.
 *
 * It's a complementary landmark, not a dialog: nothing is trapped, the
 * page behind it stays usable, and it collapses to its header with one
 * button. Open by default where there's room for it beside the page.
 */
import { measureHtml, type Measure } from '../../lib/measure';
import { pristine } from '../../pristine';
import { fmtInt, ldList, outlineHtml, pathOf, shortId } from '../../sections/instruments/machine-kit';

const root = document.documentElement;
let drawer: HTMLElement | null = null;
let readout: Measure | null = null;

const WIDE = '(min-width: 1280px)';

function setOpen(open: boolean): void {
  if (!drawer) return;
  root.dataset.drawer = open ? 'open' : 'closed';
  const b = drawer.querySelector<HTMLButtonElement>('[data-drawer-toggle]');
  if (b) {
    b.setAttribute('aria-expanded', String(open));
    b.textContent = (open ? b.dataset.hide : b.dataset.show) ?? '';
  }
}

function build(): HTMLElement | null {
  const tpl = document.querySelector<HTMLTemplateElement>('template[data-drawer-tpl]');
  const el = tpl?.content.firstElementChild?.cloneNode(true) as HTMLElement | undefined;
  if (!el) return null;

  const m = measureHtml(pristine || document.documentElement.outerHTML, location.origin);
  readout = m;
  const put = (k: string, html: string) => {
    const t = el.querySelector<HTMLElement>(`[data-d="${k}"]`);
    if (t) t.innerHTML = html;
  };
  const txt = (k: string, s: string) => {
    const t = el.querySelector<HTMLElement>(`[data-d="${k}"]`);
    if (t) t.textContent = s;
  };
  txt('req', `${pathOf(m.canonical || location.pathname)} · ${m.title}`);
  txt('headings', fmtInt(m.headings.length));
  txt('links', `${fmtInt(m.links.internal)} · ${fmtInt(m.links.targets)}`);
  txt('words', fmtInt(m.words));
  txt('entities', fmtInt(m.ld.nodes.length));
  put('outline', outlineHtml(m.headings));
  put('ld', ldList(m.ld, '', location.origin));

  /* Outline entries jump to their section. */
  el.querySelectorAll<HTMLElement>('[data-outline] li').forEach((li) => {
    const id = li.querySelector('[data-id]')?.textContent?.slice(1);
    const t = li.querySelector(':scope > [data-t]');
    if (!id || !t) return;
    const a = document.createElement('a');
    a.href = `#${id}`;
    a.textContent = t.textContent;
    t.replaceWith(a);
  });

  el.querySelector('[data-drawer-toggle]')?.addEventListener('click', () => setOpen(root.dataset.drawer !== 'open'));

  const copyBtn = el.querySelector<HTMLButtonElement>('[data-copy-json]');
  const done = el.querySelector<HTMLElement>('[data-copied]');
  copyBtn?.addEventListener('click', async () => {
    if (!readout) return;
    const r = readout;
    const json = JSON.stringify(
      {
        url: location.href,
        title: r.title,
        description: r.description,
        canonical: r.canonical,
        robots: r.robots || null,
        lang: r.lang,
        h1: r.h1,
        outline: r.headings.filter((h) => h.level <= 3).map((h) => ({ level: h.level, text: h.text, id: h.id })),
        words: r.words,
        links: r.links,
        jsonLd: r.ld.nodes.map((n) => ({ id: shortId(n.id), types: n.types, name: n.name || undefined, onThisPage: n.local })),
        references: r.ld.edges.map((e) => ({ from: shortId(e.from), prop: e.prop, to: shortId(e.to) })),
      },
      null,
      2,
    );
    try {
      await navigator.clipboard.writeText(json);
      if (done) {
        done.textContent = copyBtn.dataset.done ?? '';
        window.setTimeout(() => (done.textContent = ''), 1800);
      }
    } catch {
      /* Clipboard refused (permissions, an insecure origin). The readout
         is still on screen; nothing to pretend about. */
    }
  });
  return el;
}

export default {
  enter(): void {
    if (!drawer) drawer = build();
    if (!drawer) return;
    document.body.append(drawer);
    setOpen(window.matchMedia(WIDE).matches);
  },
  leave(): void {
    drawer?.remove();
    delete root.dataset.drawer;
  },
};
