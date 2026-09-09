/**
 * Interaction that is not motion: the nav, the mobile menu, the FAQ.
 *
 * Everything here degrades to working markup. The FAQ is <details>/<summary>,
 * so it opens and closes with no JavaScript at all; this only adds the
 * one-open-at-a-time behaviour and the height transition.
 */

/** Nav: solid once scrolled, plus a read-progress hairline. */
export function initNav(): void {
  const nav = document.querySelector('.nav');
  const bar = document.querySelector<HTMLElement>('.nav-progress i');
  if (!nav) return;

  let queued = false;
  const update = () => {
    queued = false;
    const y = window.scrollY;
    nav.classList.toggle('is-stuck', y > 32);
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
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };

  burger.addEventListener('click', () => {
    setOpen(burger.getAttribute('aria-expanded') !== 'true');
  });

  // Any navigation closes it — including an in-page jump, which does not
  // reload and would otherwise leave the overlay covering the target.
  menu.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('a')) setOpen(false);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      burger.focus();
    }
  });
}

/** One question open at a time. */
export function initFaq(): void {
  const items = Array.from(document.querySelectorAll<HTMLDetailsElement>('.faq-item'));
  if (!items.length) return;

  for (const item of items) {
    item.addEventListener('toggle', () => {
      if (!item.open) return;
      for (const other of items) {
        if (other !== item) other.open = false;
      }
    });
  }
}

/**
 * Copy the contact address to the clipboard.
 *
 * The address stays a real mailto: link and stays visible as text — this is
 * an addition to it, not a replacement for it. A "copy" button that has
 * replaced the address is useless to anyone whose browser refuses clipboard
 * access, and there are more of those than people expect.
 */
export function initCopyMail(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const value = btn.dataset.copy ?? '';
      try {
        await navigator.clipboard.writeText(value);
        btn.classList.add('is-copied');
        window.setTimeout(() => btn.classList.remove('is-copied'), 1800);
      } catch {
        // Clipboard denied. The address is still on the page as text and as
        // a mailto: link, so there is nothing to recover from.
      }
    });
  });
}
