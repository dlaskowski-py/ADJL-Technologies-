/**
 * The point field behind the whole page.
 *
 * A slow-drifting lattice of points; the ones near the pointer lean toward
 * it and take on a spectrum colour, and near neighbours link with hairlines.
 * It is the quietest thing on the site and it is doing real work: on a white
 * page, an empty margin is genuinely empty, and this gives the whitespace a
 * texture that responds to the reader.
 *
 * Capital's version of this file draws bone-grey points on black. Inverting
 * it is not a matter of swapping two colours — on white, an ink-coloured
 * point at the same alpha reads as dirt, so the resting state here is much
 * fainter and the link lines are thinner. The colour arrives only under the
 * cursor, which is what makes it feel like a response rather than a texture.
 */

import { allowCanvas, whileVisible } from './prefs';

type Pt = { x: number; y: number; ox: number; oy: number; ph: number };

const LINK_DIST = 116;
const CURSOR_RADIUS = 200;

/** Copper, teal, violet — the same three the eyebrow rule uses. */
const SPECTRUM: [number, number, number][] = [
  [217, 84, 42],
  [15, 163, 163],
  [108, 75, 245],
];

export function initField(): void {
  if (!allowCanvas) return;

  const canvas = document.getElementById('field') as HTMLCanvasElement | null;
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  let pts: Pt[] = [];
  let w = 0;
  let h = 0;
  let raf = 0;
  let running = false;

  const pointer = { x: -9999, y: -9999, active: false };

  function build(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas!.width = Math.floor(w * dpr);
    canvas!.height = Math.floor(h * dpr);
    canvas!.style.width = `${w}px`;
    canvas!.style.height = `${h}px`;
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

    /* Density scales with area and is CAPPED, because the link pass is
       O(n²) — an ultrawide monitor without this cap does about four times
       the work of a laptop for a texture nobody is looking at. */
    const target = Math.min(130, Math.round((w * h) / 16000));
    const cols = Math.ceil(Math.sqrt(target * (w / h)));
    const rows = Math.ceil(target / cols);
    const gx = w / cols;
    const gy = h / rows;

    pts = [];
    for (let r = 0; r <= rows; r++) {
      for (let c = 0; c <= cols; c++) {
        // Jittered off the grid, or it reads as graph paper rather than a field.
        const x = c * gx + (Math.random() - 0.5) * gx * 0.72;
        const y = r * gy + (Math.random() - 0.5) * gy * 0.72;
        pts.push({ x, y, ox: x, oy: y, ph: Math.random() * Math.PI * 2 });
      }
    }
  }

  /** Which spectrum colour a point takes, fixed by position so a point does
   *  not change hue as the cursor sweeps past it. */
  function hueOf(p: Pt): [number, number, number] {
    return SPECTRUM[Math.abs(Math.round(p.ox / 137 + p.oy / 211)) % SPECTRUM.length];
  }

  function draw(t: number): void {
    raf = requestAnimationFrame(draw);
    ctx!.clearRect(0, 0, w, h);

    const time = t * 0.00015;

    for (const p of pts) {
      p.x = p.ox + Math.cos(time + p.ph) * 10;
      p.y = p.oy + Math.sin(time * 0.86 + p.ph) * 10;

      if (pointer.active) {
        const dx = pointer.x - p.x;
        const dy = pointer.y - p.y;
        const d = Math.hypot(dx, dy);
        if (d < CURSOR_RADIUS && d > 0.001) {
          const pull = (1 - d / CURSOR_RADIUS) * 15;
          p.x += (dx / d) * pull;
          p.y += (dy / d) * pull;
        }
      }
    }

    // Hairlines between near neighbours. The cheap axis rejections before
    // the hypot matter: this is the hot loop.
    ctx!.lineWidth = 1;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      for (let j = i + 1; j < pts.length; j++) {
        const b = pts[j];
        const dx = a.x - b.x;
        if (dx > LINK_DIST || dx < -LINK_DIST) continue;
        const dy = a.y - b.y;
        if (dy > LINK_DIST || dy < -LINK_DIST) continue;
        const d = Math.hypot(dx, dy);
        if (d > LINK_DIST) continue;
        ctx!.strokeStyle = `rgba(14,17,23,${(1 - d / LINK_DIST) * 0.05})`;
        ctx!.beginPath();
        ctx!.moveTo(a.x, a.y);
        ctx!.lineTo(b.x, b.y);
        ctx!.stroke();
      }
    }

    for (const p of pts) {
      let alpha = 0.12;
      let col = '14,17,23';
      if (pointer.active) {
        const d = Math.hypot(pointer.x - p.x, pointer.y - p.y);
        if (d < CURSOR_RADIUS) {
          const k = 1 - d / CURSOR_RADIUS;
          alpha = 0.12 + k * 0.62;
          col = hueOf(p).join(',');
        }
      }
      ctx!.fillStyle = `rgba(${col},${alpha})`;
      ctx!.beginPath();
      ctx!.arc(p.x, p.y, 1.3, 0, Math.PI * 2);
      ctx!.fill();
    }
  }

  const start = () => {
    if (running) return;
    running = true;
    raf = requestAnimationFrame(draw);
  };
  const stop = () => {
    running = false;
    cancelAnimationFrame(raf);
  };

  window.addEventListener(
    'pointermove',
    (e) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;
    },
    { passive: true },
  );
  window.addEventListener('pointerleave', () => {
    pointer.active = false;
  });

  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(build, 180);
  });

  build();
  // The canvas is position:fixed, so it is always "in view" — this exists to
  // stop it in a hidden tab, which is the case that actually costs battery.
  whileVisible(canvas, start, stop);
}
