/**
 * Interaction that isn't motion: the nav, the mobile menu, the FAQ, the
 * copy button, Pause motion and the /work/ filter.
 *
 * Everything here degrades to working markup. The FAQ is <details>, the
 * address is a mailto: link, every work card is visible without a filter,
 * and the controls only a script could operate are marked data-js-only and
 * hidden until a script is running.
 */

import { isPaused, setPaused } from './motion/prefs';

/** Nav: solid once scrolled, plus a read-progress hairline. */
export function initNav(): void {
  const nav = document.querySelector('.nav');
  const bar = document.querySelector<HTMLElement>('.nav-progress i');
  if (!nav) return;
  let queued = false;
  const update = () => {
    queued = false;
    const y = window.scrollY;
    nav.classList.toggle('is-stuck', y > 24);
    if (bar) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
    }
  };
  window.addEventListener(
    'scroll',
    () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(update);
    },
    { passive: true },
  );
  update();
}

export function initMenu(): void {
  const burger = document.querySelector<HTMLButtonElement>('.nav-burger');
  const menu = document.getElementById('mobile-menu');
  if (!burger || !menu) return;

  const setOpen = (open: boolean) => {
    burger.setAttribute('aria-expanded', String(open));
    menu.hidden = !open;
    document.body.style.overflow = open ? 'hidden' : '';
    const label = open ? burger.dataset.labelClose : burger.dataset.labelOpen;
    if (label) burger.setAttribute('aria-label', label);
  };

  burger.addEventListener('click', () => setOpen(burger.getAttribute('aria-expanded') !== 'true'));

  /* Any navigation closes it, including an in-page jump, which doesn't
     reload and would otherwise leave the overlay over the target. */
  menu.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('a')) setOpen(false);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      burger.focus();
    }
  });

  /* Widening past the breakpoint removes the burger, and with it the only
     control that could close the menu, while body overflow stays locked.
     Closing on the media query restores everything together. */
  const wide = window.matchMedia('(min-width: 1100px)');
  wide.addEventListener('change', (e) => {
    if (e.matches && burger.getAttribute('aria-expanded') === 'true') setOpen(false);
  });
}

/** One question open at a time. */
export function initFaq(): void {
  const items = Array.from(document.querySelectorAll<HTMLDetailsElement>('.faq-item'));
  for (const item of items) {
    item.addEventListener('toggle', () => {
      if (!item.open) return;
      for (const other of items) if (other !== item) other.open = false;
    });
  }
}

/** Copy the contact address. The address stays a mailto: link and visible
 *  text; this is an addition to it, never a replacement. */
export function initCopyMail(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(btn.dataset.copy ?? '');
        btn.classList.add('is-copied');
        window.setTimeout(() => btn.classList.remove('is-copied'), 1800);
      } catch {
        /* Clipboard refused. The address is still on the page. */
      }
    });
  });
}

/** Pause motion (WCAG 2.2.2): every [data-pause] button toggles it, and
 *  the choice persists across pages until pressed again. */
export function initPause(): void {
  const btns = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-pause]'));
  const paused = isPaused();
  btns.forEach((b) => {
    b.setAttribute('aria-pressed', String(paused));
    b.addEventListener('click', () => setPaused(!isPaused()));
  });
}

/** /work/ filter: radios with data-tags matching. Every card is visible
 *  without a script; with one, the radios narrow the grid. */
export function initFilter(): void {
  const box = document.querySelector<HTMLElement>('[data-filter]');
  if (!box) return;
  const cards = Array.from(document.querySelectorAll<HTMLElement>('[data-tags]'));
  const live = box.querySelector<HTMLElement>('[data-filter-announce]');
  box.addEventListener('change', (e) => {
    const v = (e.target as HTMLInputElement).value;
    let shown = 0;
    for (const c of cards) {
      const on = v === 'all' || (c.dataset.tags ?? '').split(' ').includes(v);
      c.hidden = !on;
      if (on) shown++;
    }
    if (live) live.textContent = `${shown} shown.`;
  });
}
