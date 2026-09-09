/**
 * Reveal-on-enter. One shared IntersectionObserver for the whole page;
 * elements are unobserved once shown, so the observer drains to nothing as
 * you scroll rather than growing with the page.
 *
 * Markup contract: [data-reveal] on the element. Children of a
 * [data-stagger] container get a --i index so CSS can offset each one's
 * transition-delay without the markup having to count.
 */

import { allowReveal } from './prefs';

export function initReveal(): void {
  const targets = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));

  // Assign stagger indices up front so transition-delay resolves on first
  // paint rather than one frame late.
  document.querySelectorAll<HTMLElement>('[data-stagger]').forEach((group) => {
    Array.from(group.children).forEach((child, i) => {
      (child as HTMLElement).style.setProperty('--i', String(i));
    });
  });

  if (!allowReveal) {
    targets.forEach((el) => el.classList.add('is-in'));
    return;
  }

  const pending = new Set(targets);

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-in');
        pending.delete(entry.target as HTMLElement);
        io.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.06 },
  );

  targets.forEach((el) => io.observe(el));

  /* Safety net, and it is not theoretical: a fast scroll — a Home keypress,
     a trackpad fling, an anchor jump — can outrun IntersectionObserver's
     delivery and leave content permanently invisible, which on this site
     means a blank section. After scrolling settles, reveal anything already
     at or above the fold regardless of what the observer thinks. */
  let settle = 0;
  const sweep = () => {
    if (!pending.size) {
      window.removeEventListener('scroll', onScroll);
      return;
    }
    const vh = window.innerHeight;
    for (const el of Array.from(pending)) {
      if (el.getBoundingClientRect().top < vh * 0.94) {
        el.classList.add('is-in');
        pending.delete(el);
        io.unobserve(el);
      }
    }
  };
  const onScroll = () => {
    window.clearTimeout(settle);
    settle = window.setTimeout(sweep, 120);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
}
