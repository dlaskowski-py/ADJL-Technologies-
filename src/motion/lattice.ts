/**
 * Lattice: the hero figure, live. "Parse."
 *
 * Markup contract: [data-lattice] on the hero <figure>, holding the poster
 * (svg.pg, drawn at build by lib/poster.ts), the Pause button and the
 * figcaption. Full tier only: boot.ts loads this after `load`, at idle, so
 * the h1 has painted and settled as the LCP before a shader compiles.
 *
 * What it does:
 *   1. Parses the page exactly as the browser received it (src/pristine.ts)
 *      with the same pageGraph() the build used, and times that parse.
 *   2. Lays it out (lib/layout.ts) and draws it with WebGL1: the exploded
 *      layout B first, on a frame identical to the poster, so the canvas
 *      cross-fades in invisibly. Then it assembles into layout A over 1.4s.
 *   3. Scrolling explodes it again: uExplode = scrollY / (0.6 × hero height).
 *      The poster's own plane callouts stay on top of the canvas, follow
 *      their planes and fade in above 0.6.
 *   4. It drifts ±6° over 40s and tilts ±8° toward the pointer. Up to 24
 *      teal beads travel the link edges toward the routes they target:
 *      that's crawl.
 *   5. Hover names the nearest node (a screen-space grid, built in the
 *      frame, so pointermove never reads the DOM). Click scrolls to it.
 *   6. On first draw the caption turns LIVE, with the real parse time.
 *
 * Lifecycle: whileVisible() runs the loop only while the figure is near the
 * viewport, the tab is visible and motion isn't paused. Pause stops the
 * drift and the beads; hover and scroll still draw single frames, because
 * the visitor is driving them. A median frame time over 22ms halves the
 * word particles, then stops drift and beads. A lost context removes the
 * canvas and the poster is simply there again.
 */
import { pristine } from '../pristine';
import { isPaused, whileVisible } from './prefs';
import { E, GRAPH_SELECTOR, K, P, pageGraph, type Graph } from '../lib/pagegraph';
import { isExcluded } from '../lib/exclude';
import {
  edgeVis,
  FLAT,
  hash,
  KU,
  KV,
  LABEL,
  layout,
  leader,
  LOOK,
  mulberry32,
  PLANE_Y,
  RIM,
  VIEW,
  words,
  type Layout,
} from '../lib/layout';

/* Palette slots, read from the tokens at init. */
const PAL = ['--signal', '--data-dim', '--model', '--fg-3', '--model-dim', '--signal-hi', '--data', '--ground'];
/* Line alphas: the twins of lattice.css (.pg-pl, .pg-e0…, .pg-ax, .pg-pin). */
const A_PLANE = 0.55;
const A_FILL = 0.045;
const A_EDGE = [0.5, 0.3, 0.5, 0.32];
const A_AXIS = 0.7;
const A_PIN = 0.8;
const BEADS = 24;
const DEG = Math.PI / 180;

const VS_PROJ = `
uniform float uE,uYaw,uPitch;uniform vec4 uFit;
vec4 proj(vec3 a,vec3 b){vec3 p=mix(a,b,uE);float c=cos(uYaw),s=sin(uYaw);
vec2 q=vec2(p.x*c-p.z*s,p.x*s+p.z*c);float cp=cos(uPitch),sp=sin(uPitch);
float v=q.y*cp-p.y*sp,y=q.y*sp+p.y*cp;
vec2 o=vec2(${VIEW.cx.toFixed(1)}+${(VIEW.s * KU).toFixed(4)}*q.x,${VIEW.cy.toFixed(1)}+${VIEW.s.toFixed(1)}*(${KV.toFixed(6)}*v-y));
return vec4(o.x*uFit.x+uFit.y,o.y*uFit.z+uFit.w,0.,1.);}`;

/* Points. aM: x palette slot, y shape (0 dot, 1 ring, 2 diamond, 3 word,
   4 glow), z order (0..1), w size in CSS px (negative: only in layout B). */
const VS_PTS = `attribute vec3 aA,aB;attribute vec4 aM;uniform float uDpr,uM,uGrow;uniform vec3 uC[8];
varying vec3 vC;varying float vA,vS,vZ,vW;${VS_PROJ}
void main(){gl_Position=proj(aA,aB);float s=abs(aM.w),a=1.;
if(aM.w<0.)s*=smoothstep(.15,.85,uE);
if(aM.y>1.5&&aM.y<2.5)s*=uM;
if(aM.y>2.5&&aM.y<3.5)a=smoothstep(aM.z,aM.z+.06,uGrow*1.07)*.55;
vS=aM.y;vZ=s*uDpr;vW=(s>7.?1.5:1.25)*uDpr;gl_PointSize=vZ+1.;vA=a;
int i=int(aM.x+.5);vC=uC[0];for(int k=1;k<8;k++)if(k==i)vC=uC[k];}`;
const FS_PTS = `precision mediump float;varying vec3 vC;varying float vA,vS,vZ,vW;uniform vec3 uG;
void main(){vec2 q=(gl_PointCoord-.5)*(vZ+1.);float r=vZ*.5,d=length(q),a;vec3 c=vC;
if(vS<.5)a=1.-smoothstep(r-.5,r+.5,d);
else if(vS<1.5){a=1.-smoothstep(r-.5,r+.5,d);c=mix(uG,vC,smoothstep(r-vW-.5,r-vW+.5,d));}
else if(vS<2.5){float m=(abs(q.x)+abs(q.y))*.7071;r*=.7071;a=1.-smoothstep(r,r+1.,m);c=mix(uG,vC,smoothstep(r-1.,r,m));}
else if(vS<4.5)a=exp(-d*d/(r*r+.01)*2.2);
else a=(1.-smoothstep(r-.5,r+.5,d))*smoothstep(r-1.6,r-.6,d);
a*=vA;if(a<.004)discard;gl_FragColor=vec4(c*a,a);}`;

/* Lines and plate fills. aL: x palette slot, y alpha, z visible in A (1),
   B (2) or both (3), w distance along a dashed run in viewBox units (-1 solid). */
const VS_LN = `attribute vec3 aA,aB;attribute vec4 aL;uniform float uGain;uniform vec3 uC[8];
varying vec3 vC;varying float vA,vD;${VS_PROJ}
void main(){gl_Position=proj(aA,aB);float v=aL.z<1.5?1.-uE:aL.z<2.5?uE:1.;
vA=aL.y*v*uGain;vD=aL.w;int i=int(aL.x+.5);vC=uC[0];for(int k=1;k<8;k++)if(k==i)vC=uC[k];}`;
const FS_LN = `precision mediump float;varying vec3 vC;varying float vA,vD;uniform float uM;
void main(){if(vD>=0.&&fract(vD*uM/5.)>.4)discard;gl_FragColor=vec4(vC*vA,vA);}`;

type Prog = { p: WebGLProgram; u: Record<string, WebGLUniformLocation | null>; a: Record<string, number> };

export function initLattice(): void {
  const fig = document.querySelector<HTMLElement>('[data-lattice]');
  const art = fig?.querySelector<HTMLElement>('.hero-fig-art');
  /* The poster is injected at prerender; the dev shell has none, and the
     live drawing simply runs without its callouts there. */
  const svg = art?.querySelector<SVGSVGElement>('svg.pg');
  if (!fig || !art || fig.dataset.running) return;
  /* While the opening sequence covers the page (html[data-intro="play"],
     home only), start at its hand-off: the graph assembles where the
     visitor can see it, and no shader compiles under the sequence.
     motion/intro.ts dispatches the event. */
  if (document.documentElement.dataset.intro === 'play') {
    window.addEventListener('adjl:intro-done', initLattice, { once: true });
    return;
  }

  /* 1. Parse the page as it arrived, and time it. */
  const t0 = performance.now();
  const g = pageGraph(pristine || document.documentElement.outerHTML, location.pathname);
  const ms = performance.now() - t0;
  const L = layout(g);
  const W = words(g, L);

  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  const gl = canvas.getContext('webgl', { antialias: true, alpha: true, premultipliedAlpha: true });
  if (!gl) return;

  const css = getComputedStyle(document.documentElement);
  const pal = new Float32Array(24);
  PAL.forEach((v, i) => pal.set(rgb(css.getPropertyValue(v)), i * 3));

  const pts = program(gl, VS_PTS, FS_PTS, ['aA', 'aB', 'aM']);
  const lns = program(gl, VS_LN, FS_LN, ['aA', 'aB', 'aL']);
  if (!pts || !lns) return;

  /* ── Geometry ─────────────────────────────────────────────────────── */
  const nodeBuf = buffer(gl, nodeData(g, L));
  const wordBuf = buffer(gl, wordData(W, g.route));
  const nWords = W.o.length;
  const lines = lineData(g, L);
  const lineBuf = buffer(gl, lines.data);
  const bead = new Float32Array((BEADS + 1) * 3);
  const beadBuf = gl.createBuffer();
  const links = g.edges.filter((e) => e.t === E.target);
  const rnd = mulberry32(hash(g.route));
  const beads = Array.from({ length: Math.min(BEADS, links.length) }, () => ({
    k: (rnd() * links.length) | 0,
    t: -rnd() * 2,
    v: 0.25 + rnd() * 0.25,
  }));

  /* ── State ────────────────────────────────────────────────────────── */
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  let w = 0;
  let h = 0;
  let m = 1;
  let fit = [1, 0, 1, 0];
  let heroH = 600;
  let e = 1; // explode, as drawn
  let grow = 0;
  let yaw = 0;
  let pitch = 0;
  let tilt = [0, 0];
  let ptr: [number, number] | null = null;
  let rect: DOMRect | null = null;
  let hover = -1;
  let introAt = -1;
  let driftT = 0;
  let last = 0;
  let raf = 0;
  let looping = false;
  let first = true;
  let low = 0; // governor: 1 half particles, 2 no drift or beads
  let shown = -1; // callout opacity last written
  const frames: number[] = [];
  const screen = new Float32Array(g.nodes.length * 2);
  const labels = Array.from(svg?.querySelectorAll<SVGGElement>('.pg-frame [data-plane]') ?? []);
  const restD = labels.map((lb) => Array.from(lb.children, (c) => c.getAttribute('d')));
  const tip = document.createElement('div');
  tip.setAttribute('data-tip', '');
  tip.setAttribute('aria-hidden', 'true');
  tip.hidden = true;
  const tipTag = tip.appendChild(document.createElement('b'));
  const tipText = tip.appendChild(document.createElement('span'));
  const tipRef = tip.appendChild(document.createElement('i'));

  /* Scroll target, read without forcing layout. */
  const target = () => Math.min(1, Math.max(0, window.scrollY / (0.6 * heroH)));

  const size = () => {
    const r = art.getBoundingClientRect();
    w = r.width;
    h = r.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    m = Math.min(w, h) / VIEW.size;
    const ox = (w - VIEW.size * m) / 2;
    const oy = (h - VIEW.size * m) / 2;
    fit = [(2 * m) / w, (2 * ox) / w - 1, (-2 * m) / h, 1 - (2 * oy) / h];
    heroH = (fig.closest('section') as HTMLElement | null)?.offsetHeight || heroH;
    rect = null;
    need();
  };

  /* ── Projection on the CPU: the shader's twin ─────────────────────── */
  const proj = (u: number, y: number, v: number, out: Float32Array | number[], o: number) => {
    const c = Math.cos(yaw);
    const s = Math.sin(yaw);
    const qu = u * c - v * s;
    const qv = u * s + v * c;
    const cp = Math.cos(pitch);
    const sp = Math.sin(pitch);
    const vv = qv * cp - y * sp;
    const yy = qv * sp + y * cp;
    out[o] = VIEW.cx + VIEW.s * KU * qu;
    out[o + 1] = VIEW.cy + VIEW.s * (KV * vv - yy);
  };
  const at = (i: number, ab: Float32Array, j: number) => ab[i * 3 + j];
  const mixed = (i: number, j: number) => at(i, L.a, j) + (at(i, L.b, j) - at(i, L.a, j)) * e;

  /* ── Draw ─────────────────────────────────────────────────────────── */
  const uniforms = (pr: Prog) => {
    gl.useProgram(pr.p);
    gl.uniform1f(pr.u.uE, e);
    gl.uniform1f(pr.u.uYaw, yaw);
    gl.uniform1f(pr.u.uPitch, pitch);
    gl.uniform4f(pr.u.uFit, fit[0], fit[1], fit[2], fit[3]);
    gl.uniform3fv(pr.u['uC[0]'], pal);
    gl.uniform1f(pr.u.uM, m);
  };
  const bind = (pr: Prog, buf: WebGLBuffer | null, stride: number, third: string) => {
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    const f = 4;
    gl.vertexAttribPointer(pr.a.aA, 3, gl.FLOAT, false, stride * f, 0);
    gl.vertexAttribPointer(pr.a.aB, 3, gl.FLOAT, false, stride * f, (stride === 3 ? 0 : 3) * f);
    if (stride === 3) {
      gl.disableVertexAttribArray(pr.a[third]);
    } else {
      gl.enableVertexAttribArray(pr.a[third]);
      gl.vertexAttribPointer(pr.a[third], 4, gl.FLOAT, false, stride * f, 6 * f);
    }
  };

  const draw = () => {
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);

    /* Plates and edges. */
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    uniforms(lns);
    gl.uniform1f(lns.u.uGain, Math.min(dpr, 1.5));
    bind(lns, lineBuf, 10, 'aL');
    gl.drawArrays(gl.TRIANGLES, 0, lines.fills);
    gl.drawArrays(gl.LINES, lines.fills, lines.count - lines.fills);

    uniforms(pts);
    gl.uniform1f(pts.u.uDpr, dpr);
    gl.uniform3fv(pts.u.uG, pal.subarray(21, 24));
    gl.uniform1f(pts.u.uGrow, grow);
    /* Words: additive, so dense sections glow. */
    gl.blendFunc(gl.ONE, gl.ONE);
    bind(pts, wordBuf, 10, 'aM');
    if (grow > 0) gl.drawArrays(gl.POINTS, 0, low ? nWords >> 1 : nWords);
    /* Structure: ordinary alpha. */
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    bind(pts, nodeBuf, 10, 'aM');
    gl.drawArrays(gl.POINTS, 0, g.nodes.length);

    /* Beads and the hover ring: positions computed here, on the CPU. */
    let nb = 0;
    if (low < 2 && grow > 0) {
      for (const b of beads) {
        if (b.t <= 0 || b.t >= 1) continue;
        const ln = links[b.k];
        const p = g.nodes[ln.a].p;
        for (let j = 0; j < 3; j++) {
          const s = at(p, L.a, j) + (at(ln.a, L.b, j) - at(p, L.a, j)) * e;
          const t = at(ln.a, L.a, j) + (at(ln.b, L.b, j) - at(ln.a, L.a, j)) * e;
          bead[nb * 3 + j] = s + (t - s) * b.t;
        }
        nb++;
      }
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, beadBuf);
    gl.bufferData(gl.ARRAY_BUFFER, bead, gl.DYNAMIC_DRAW);
    bind(pts, beadBuf, 3, 'aM');
    if (nb) {
      gl.blendFunc(gl.ONE, gl.ONE);
      gl.vertexAttrib4f(pts.a.aM, 6, 4, 0, 7);
      gl.drawArrays(gl.POINTS, 0, nb);
    }
    if (hover >= 0) {
      for (let j = 0; j < 3; j++) bead[j] = mixed(hover, j);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, bead.subarray(0, 3));
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.vertexAttrib4f(pts.a.aM, 5, 5, 0, 15);
      gl.drawArrays(gl.POINTS, 0, 1);
    }

    /* The callouts ride with their planes and show above 0.6; each leader
       still lands on its plate's rim as the plates turn. */
    const op = smooth(0.6, 0.85, e);
    if (op || shown) {
      shown = op;
      const c = [0, 0];
      const d = [0, 0];
      const cu = Math.cos(LABEL.phi);
      const sv = Math.sin(LABEL.phi);
      labels.forEach((lb, k) => {
        const y = PLANE_Y[k] * e;
        const rest = leader(k);
        proj(0, y, 0, c, 0);
        const tx = c[0] - VIEW.cx;
        const ty = c[1] - (VIEW.cy - VIEW.s * PLANE_Y[k]);
        const r = 1.04 + (RIM - 1.04) * e;
        proj(r * cu, y, (1.04 + (FLAT * RIM - 1.04) * e) * sv, d, 0);
        const dot = `${(d[0] - tx).toFixed(1)} ${(d[1] - ty).toFixed(1)}`;
        lb.setAttribute('transform', `translate(${tx.toFixed(1)} ${ty.toFixed(1)})`);
        lb.style.opacity = op.toFixed(3);
        lb.firstElementChild?.setAttribute('d', `M${LABEL.x} ${rest.y.toFixed(1)}H${rest.elbow[0].toFixed(1)}L${dot}`);
        lb.children[1]?.setAttribute('d', `M${dot}h0`);
      });
    }
  };

  /* The nearest structure node to the pointer: project, bucket, look up. */
  const pick = () => {
    if (!ptr) return -1;
    if (!rect) rect = canvas.getBoundingClientRect();
    const px = (ptr[0] - rect.left - (w - VIEW.size * m) / 2) / m;
    const py = (ptr[1] - rect.top - (h - VIEW.size * m) / 2) / m;
    const cell = 16 / m;
    const grid = new Map<number, number[]>();
    const key = (x: number, y: number) => Math.floor(x / cell) * 4096 + Math.floor(y / cell);
    for (const nd of g.nodes) {
      if (nd.k === K.route && e < 0.5) continue;
      proj(mixed(nd.i, 0), mixed(nd.i, 1), mixed(nd.i, 2), screen, nd.i * 2);
      const k = key(screen[nd.i * 2], screen[nd.i * 2 + 1]);
      const list = grid.get(k);
      if (list) list.push(nd.i);
      else grid.set(k, [nd.i]);
    }
    let best = -1;
    let bd = cell * cell;
    const cx = Math.floor(px / cell);
    const cy = Math.floor(py / cell);
    for (let i = -1; i <= 1; i++)
      for (let j = -1; j <= 1; j++)
        for (const n of grid.get((cx + i) * 4096 + cy + j) ?? []) {
          const d = (screen[n * 2] - px) ** 2 + (screen[n * 2 + 1] - py) ** 2;
          if (d < bd) {
            bd = d;
            best = n;
          }
        }
    return best;
  };

  const showTip = () => {
    if (hover < 0) {
      tip.hidden = true;
      canvas.style.cursor = '';
      return;
    }
    const nd = g.nodes[hover];
    tipTag.textContent = nd.tag;
    tipText.textContent = nd.text;
    tipRef.textContent = nd.k === K.section ? `${nd.words} words` : nd.k === K.link || nd.k === K.ld ? nd.ref : '';
    tip.hidden = false;
    const x = (w - VIEW.size * m) / 2 + screen[hover * 2] * m;
    const y = (h - VIEW.size * m) / 2 + screen[hover * 2 + 1] * m;
    const ty = y + 74 > h ? y - 70 : y + 14;
    tip.style.transform = `translate(${Math.round(Math.max(8, Math.min(x + 14, w - 248)))}px,${Math.round(ty)}px)`;
    canvas.style.cursor = target_of(nd) ? 'pointer' : '';
  };

  /* ── The loop ─────────────────────────────────────────────────────── */
  const frame = (now: number) => {
    raf = 0;
    const dt = last ? Math.min(64, now - last) : 16;
    last = now;
    const goal = target();
    if (ptr && !rect) rect = canvas.getBoundingClientRect();

    if (first) {
      /* The poster's own frame: exploded, square-on, no words yet. */
      first = false;
      e = 1;
      grow = 0;
      draw();
      goLive();
      introAt = now;
      raf = requestAnimationFrame(frame);
      return;
    }
    const hold = introAt >= 0 && now - introAt < 400;
    if (introAt >= 0) {
      /* Hold the poster frame while the cross-fade runs, then assemble. */
      const q = easeIO(Math.min(1, Math.max(0, (now - introAt - 400) / 1400)));
      e = 1 + (goal - 1) * q;
      grow = q;
      if (q >= 1) introAt = -1;
    } else {
      e += (goal - e) * Math.min(1, dt / 90);
      if (Math.abs(goal - e) < 1e-4) e = goal;
    }
    if (looping && low < 2 && !hold) {
      driftT += dt;
      for (const b of beads) {
        b.t += (dt / 1000) * b.v;
        if (b.t > 1) {
          b.t = 0;
          b.k = (rnd() * links.length) | 0;
        }
      }
    }
    /* Tilt toward the pointer, only while motion runs. */
    const want = ptr && looping && rect && !hold ? [clamp1(((ptr[0] - rect.left) / w - 0.5) * 2), clamp1(((ptr[1] - rect.top) / h - 0.5) * 2)] : [0, 0];
    tilt = [tilt[0] + (want[0] - tilt[0]) * 0.06, tilt[1] + (want[1] - tilt[1]) * 0.06];
    yaw = 6 * DEG * Math.sin((driftT / 40000) * Math.PI * 2) + 8 * DEG * tilt[0];
    pitch = 4 * DEG * tilt[1];
    hover = pick();
    draw();
    showTip();

    if (looping) {
      governor(dt);
      raf = requestAnimationFrame(frame);
    } else {
      /* Paused or offscreen: settle what the visitor moved, then stop. */
      if (introAt >= 0) skipIntro();
      if (Math.abs(goal - e) > 1e-4 || Math.abs(want[0] - tilt[0]) + Math.abs(want[1] - tilt[1]) > 1e-3) {
        raf = requestAnimationFrame(frame);
      }
    }
  };

  /* No assembling where nobody's watching it, or with motion paused. */
  const skipIntro = () => {
    introAt = -1;
    e = target();
    grow = 1;
    need();
  };

  /* One frame on demand (scroll, hover, resize), once the canvas is up.
     The first frame waits for the loop: it only starts where it's seen. */
  const need = () => {
    if (!raf && !first) raf = requestAnimationFrame(frame);
  };

  const governor = (dt: number) => {
    if (low >= 2 || introAt >= 0) return;
    frames.push(dt);
    if (frames.length < 60) return;
    const med = frames.sort((x, y) => x - y)[30];
    frames.length = 0;
    if (med > 22) low++;
  };

  const cap = fig.querySelector('[data-graph-caption]');
  const counts = fig.querySelector('[data-graph-counts]');
  const chip = fig.querySelector('.prov');
  const built = [cap, counts, chip].map((el) => el?.cloneNode(true));
  const goLive = () => {
    fig.setAttribute('data-live', '');
    const d = fig.dataset;
    if (cap && d.liveCaption) cap.textContent = d.liveCaption.replace('{ms}', `${ms < 10 ? ms.toFixed(1) : Math.round(ms)} ms`);
    if (counts && d.liveCounts) {
      counts.textContent = d.liveCounts
        .replace('{h}', String(g.counts.headings))
        .replace('{l}', String(g.counts.links))
        .replace('{e}', String(g.counts.entities));
    }
    if (chip && d.liveChip) {
      chip.setAttribute('data-prov', 'live');
      chip.setAttribute('title', d.liveTitle ?? '');
      const i = chip.querySelector('i');
      if (i) i.textContent = '●';
      if (chip.lastChild) chip.lastChild.textContent = ` ${d.liveChip}`;
    }
  };

  const start = () => {
    if (looping) return;
    looping = true;
    last = 0;
    fig.dataset.running = 'true';
    if (!raf) raf = requestAnimationFrame(frame);
  };
  const stop = () => {
    looping = false;
    fig.dataset.running = 'false';
  };

  /* ── Wiring ───────────────────────────────────────────────────────── */
  art.prepend(canvas);
  art.append(tip);
  const ro = new ResizeObserver(size);
  ro.observe(art);
  size();
  fig.dataset.running = 'false';
  whileVisible(fig, start, stop);

  /* Scrolling only costs a frame while it changes the drawing: past 0.6
     of the hero the graph is fully exploded, and far below it nothing is
     drawn at all. */
  const onScroll = () => {
    rect = null;
    if (target() !== e) need();
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  canvas.addEventListener('pointermove', (ev) => {
    ptr = [ev.clientX, ev.clientY];
    need();
  });
  canvas.addEventListener('pointerleave', () => {
    ptr = null;
    need();
  });
  canvas.addEventListener('click', () => {
    if (hover < 0) return;
    const el = target_of(g.nodes[hover]);
    if (!el) return;
    el.scrollIntoView({ behavior: isPaused() ? 'auto' : 'smooth', block: g.nodes[hover].k === K.section ? 'start' : 'center' });
    el.setAttribute('data-graph-hit', '');
    window.setTimeout(() => el.removeAttribute('data-graph-hit'), 1600);
  });

  canvas.addEventListener('webglcontextlost', (ev) => {
    ev.preventDefault();
    stop();
    if (raf) cancelAnimationFrame(raf);
    raf = 1; // never schedule again
    ro.disconnect();
    window.removeEventListener('scroll', onScroll);
    canvas.remove();
    tip.remove();
    fig.removeAttribute('data-live');
    fig.removeAttribute('data-running');
    labels.forEach((lb, k) => {
      lb.removeAttribute('transform');
      lb.style.opacity = '';
      restD[k].forEach((d, j) => d && lb.children[j].setAttribute('d', d));
    });
    /* The poster is a build-time drawing again, so the caption says so. */
    [cap, counts, chip].forEach((el, i) => el && built[i] && el.replaceWith(built[i]!));
  });

  /** The element a node stands for: its ordinal in the same list pageGraph
   *  counted, filtered by the same exclusion predicate. */
  function target_of(nd: Graph['nodes'][number]): Element | null {
    if (nd.ord < 0) return null;
    if (nd.k === K.section) return document.getElementById(nd.ref);
    const els = Array.from(document.querySelectorAll(GRAPH_SELECTOR)).filter((el) => {
      for (let p: Element | null = el; p; p = p.parentElement) if (isExcluded(p.tagName, p)) return false;
      return true;
    });
    const tag = nd.tag.slice(1).split(/[>\s]/)[0];
    const is = (el?: Element) => !!el && el.tagName.toLowerCase() === tag;
    if (is(els[nd.ord])) return els[nd.ord];
    const want = nd.text.replace(/…$/, '');
    return els.find((el) => is(el) && (el.textContent ?? '').replace(/\s+/g, ' ').trim().startsWith(want)) ?? null;
  }
}

/* ── Buffers ──────────────────────────────────────────────────────────── */

function nodeData(g: Graph, L: Layout): Float32Array {
  const d = new Float32Array(g.nodes.length * 10);
  g.nodes.forEach((nd, i) => {
    const [size, shape] = LOOK[nd.k];
    const slot = nd.k === K.landmark || nd.k === K.root ? 3 : [5, 6, 2][nd.plane];
    d.set(L.a.subarray(i * 3, i * 3 + 3), i * 10);
    d.set(L.b.subarray(i * 3, i * 3 + 3), i * 10 + 3);
    d.set([slot, shape, 0, nd.k === K.route ? -size : size], i * 10 + 6);
  });
  return d;
}

function wordData(W: { a: Float32Array; b: Float32Array; o: Float32Array }, route: string): Float32Array {
  const n = W.o.length;
  /* Shuffled, so the governor's "first half" is an even sample. */
  const idx = Array.from({ length: n }, (_, i) => i);
  const r = mulberry32(hash(route + ':w'));
  for (let i = n - 1; i > 0; i--) {
    const j = (r() * (i + 1)) | 0;
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  const d = new Float32Array(n * 10);
  idx.forEach((s, i) => {
    d.set(W.a.subarray(s * 3, s * 3 + 3), i * 10);
    d.set(W.b.subarray(s * 3, s * 3 + 3), i * 10 + 3);
    d.set([5, 3, Math.min(W.o[s], 0.94), 1.7], i * 10 + 6);
  });
  return d;
}

function lineData(g: Graph, L: Layout): { data: Float32Array; count: number; fills: number } {
  const v: number[] = [];
  const put = (a: ArrayLike<number>, b: ArrayLike<number>, slot: number, alpha: number, vis: number, dash = -1) =>
    v.push(a[0], a[1], a[2], b[0], b[1], b[2], slot, alpha, vis, dash);
  const A = (i: number) => L.a.subarray(i * 3, i * 3 + 3);
  const B = (i: number) => L.b.subarray(i * 3, i * 3 + 3);
  const SEG = 96;
  /* Each plate in A is the one floor disc; in B its own plane. */
  const rim = (k: number, t: number, inB: boolean): number[] => {
    const c = Math.cos(t);
    const s = Math.sin(t);
    return inB ? [RIM * c, PLANE_Y[k], FLAT * RIM * s] : [1.04 * c, 0, 1.04 * s];
  };
  const tone = [0, 1, 4];
  /* Fills first: triangles, B only. */
  for (const k of [P.machine, P.link, P.read]) {
    for (let i = 0; i < SEG; i++) {
      const t0 = (i / SEG) * Math.PI * 2;
      const t1 = ((i + 1) / SEG) * Math.PI * 2;
      put(rim(k, 0, false).map(() => 0), [0, PLANE_Y[k], 0], tone[k], A_FILL, 2);
      put(rim(k, t0, false), rim(k, t0, true), tone[k], A_FILL, 2);
      put(rim(k, t1, false), rim(k, t1, true), tone[k], A_FILL, 2);
    }
  }
  const fills = v.length / 10;
  for (const k of [P.machine, P.link, P.read]) {
    for (let i = 0; i < SEG; i++) {
      const t0 = (i / SEG) * Math.PI * 2;
      const t1 = ((i + 1) / SEG) * Math.PI * 2;
      put(rim(k, t0, false), rim(k, t0, true), tone[k], A_PLANE, 3);
      put(rim(k, t1, false), rim(k, t1, true), tone[k], A_PLANE, 3);
    }
  }
  g.edges.forEach((ed, idx) => {
    const vis = edgeVis(g, ed.t, ed.a, ed.b);
    if (ed.t === E.pin) {
      /* Down to the machine plane, then along it: dashed, as in the poster. */
      const foot = L.feet.get(idx)!;
      const len = (p: ArrayLike<number>, q: ArrayLike<number>) =>
        Math.hypot(VIEW.s * KU * (p[0] - q[0]), VIEW.s * (KV * (p[2] - q[2]) - (p[1] - q[1])));
      const l1 = len(B(ed.a), foot);
      put(A(ed.a), B(ed.a), 2, A_PIN, 2, 0);
      put(A(ed.b), foot, 2, A_PIN, 2, l1);
      put(A(ed.b), foot, 2, A_PIN, 2, l1);
      put(A(ed.b), B(ed.b), 2, A_PIN, 2, l1 + len(foot, B(ed.b)));
      return;
    }
    let slot: number;
    let alpha: number;
    if (ed.t === E.tree && ed.a === 0) {
      slot = 3;
      alpha = A_AXIS;
    } else if (ed.t === E.target) {
      slot = 1;
      alpha = A_EDGE[1];
    } else if (ed.t === E.ref) {
      slot = 2;
      alpha = A_EDGE[3];
    } else {
      const pl = g.nodes[ed.a].plane;
      slot = [0, 1, 2][pl];
      alpha = A_EDGE[pl];
      /* A tree edge that crosses planes (heading → link) exists only in A. */
    }
    put(A(ed.a), B(ed.a), slot, alpha, vis);
    put(A(ed.b), B(ed.b), slot, alpha, vis);
  });
  return { data: new Float32Array(v), count: v.length / 10, fills };
}

/* ── GL plumbing ──────────────────────────────────────────────────────── */

function program(gl: WebGLRenderingContext, vs: string, fs: string, attrs: string[]): Prog | null {
  const p = gl.createProgram();
  if (!p) return null;
  for (const [type, src] of [
    [gl.VERTEX_SHADER, vs],
    [gl.FRAGMENT_SHADER, fs],
  ] as const) {
    const s = gl.createShader(type);
    if (!s) return null;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    gl.attachShader(p, s);
  }
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) return null;
  const u: Prog['u'] = {};
  for (const n of ['uE', 'uYaw', 'uPitch', 'uFit', 'uC[0]', 'uM', 'uDpr', 'uGrow', 'uGain', 'uG']) u[n] = gl.getUniformLocation(p, n);
  const a: Prog['a'] = {};
  for (const n of attrs) {
    a[n] = gl.getAttribLocation(p, n);
    gl.enableVertexAttribArray(a[n]);
  }
  return { p, u, a };
}

function buffer(gl: WebGLRenderingContext, data: Float32Array): WebGLBuffer | null {
  const b = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, b);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  return b;
}

/** '#d9542a' or 'rgb(…)' → linear-ish 0..1 floats (sRGB, as CSS draws it). */
function rgb(s: string): [number, number, number] {
  const t = s.trim();
  if (t[0] === '#') {
    const n = parseInt(t.length === 4 ? t.replace(/(\w)/g, '$1$1').slice(1) : t.slice(1, 7), 16);
    return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }
  const m = t.match(/[\d.]+/g) ?? ['0', '0', '0'];
  return [+m[0] / 255, +m[1] / 255, +m[2] / 255];
}

const clamp1 = (x: number) => Math.max(-1, Math.min(1, x));
const smooth = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
/** --ease-io, cubic-bezier(.65,0,.35,1), close enough for a scrub. */
const easeIO = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
