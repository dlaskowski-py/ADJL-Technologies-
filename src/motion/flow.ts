/**
 * The flow diagram — the signature animation on this site.
 *
 * A serpentine path with a node at each stage. As the section scrolls
 * through the viewport, a copper trace draws itself along the path, a packet
 * of light rides the drawn end, each node lights as the packet reaches it,
 * and the matching prose stage takes an active state.
 *
 * THE SVG ITSELF IS PRERENDERED MARKUP, not built here. That is deliberate:
 * the diagram is content — it is the clearest statement on the page of what
 * the firm actually does — so it has to survive with JavaScript switched off
 * and be readable to a screen reader. This module only animates what is
 * already on the page, and every one of its effects is additive.
 *
 * Markup contract, emitted by the section renderers:
 *
 *   <div class="flow" data-flow>
 *     <svg …><path class="flow-live" …/> <g class="flow-node" …>…</g>…</svg>
 *     <ol class="flow-steps"><li class="flow-step">…</li>…</ol>
 *   </div>
 */

import { tier } from './prefs';

/** How much of the section's scroll is spent driving the trace. The last
 *  fifth is left idle so the diagram is complete and readable for a beat
 *  before it scrolls away, rather than finishing on the last pixel. */
const DRIVE = 0.8;

function activate(root: HTMLElement, reached: number): void {
  root.querySelectorAll<HTMLElement>('.flow-node').forEach((n, i) => {
    n.classList.toggle('is-lit', i <= reached);
  });
  root.querySelectorAll<HTMLElement>('.flow-step').forEach((s, i) => {
    s.classList.toggle('is-lit', i <= reached);
    s.classList.toggle('is-current', i === reached);
  });
}

function setupOne(root: HTMLElement): void {
  const live = root.querySelector<SVGPathElement>('.flow-live');
  const packet = root.querySelector<SVGCircleElement>('.flow-packet');
  const nodes = Array.from(root.querySelectorAll<HTMLElement>('.flow-node'));
  if (!live || !nodes.length) return;

  const len = live.getTotalLength();
  live.style.strokeDasharray = `${len}`;
  live.style.strokeDashoffset = `${len}`;

  /* Where along the path each node sits, as a fraction. Measured off the
     real geometry rather than assumed to be evenly spaced: the serpentine
     has longer curves at the turns, so "node 3 of 5" is not 60% of the
     length, and lighting nodes on an even split visibly desynchronises the
     packet from the dots it is supposed to be arriving at. */
  const stops = nodes.map((n) => {
    const at = Number(n.dataset.at ?? '0');
    return Math.min(1, Math.max(0, at));
  });

  let queued = false;
  let last = -1;

  const frame = () => {
    queued = false;
    const rect = root.getBoundingClientRect();
    const vh = window.innerHeight;

    /* Progress is measured against the element crossing the viewport rather
       than against the page, so the diagram behaves the same whether it sits
       on a short page or a long one. */
    const span = rect.height + vh * 0.7;
    const raw = (vh * 0.85 - rect.top) / span;
    const p = Math.min(1, Math.max(0, raw / DRIVE));

    live.style.strokeDashoffset = `${len * (1 - p)}`;

    if (packet) {
      const pt = live.getPointAtLength(len * p);
      packet.setAttribute('cx', pt.x.toFixed(1));
      packet.setAttribute('cy', pt.y.toFixed(1));
      packet.style.opacity = p > 0.004 && p < 0.999 ? '1' : '0';
    }

    let reached = -1;
    for (let i = 0; i < stops.length; i++) if (p >= stops[i] - 0.002) reached = i;
    if (reached !== last) {
      last = reached;
      activate(root, reached);
    }
  };

  const onScroll = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(frame);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  frame();
}

export function initFlow(): void {
  const roots = Array.from(document.querySelectorAll<HTMLElement>('[data-flow]'));
  if (!roots.length) return;

  /* Reduced motion gets the finished diagram, not a blank one. The trace is
     drawn, every node is lit, and the packet — which is the only part that
     exists purely to move — is dropped. */
  if (tier === 'reduced') {
    for (const root of roots) {
      const live = root.querySelector<SVGPathElement>('.flow-live');
      if (live) live.style.strokeDashoffset = '0';
      root.querySelector<SVGCircleElement>('.flow-packet')?.remove();
      activate(root, root.querySelectorAll('.flow-node').length - 1);
    }
    return;
  }

  roots.forEach(setupOne);
}
