/**
 * Lattice: the hero's GPU centerpiece.
 *
 * Markup contract: [data-lattice] on an element; this module puts a <canvas>
 * inside it. Optional attributes:
 *   data-lattice-count   node count for the core (default 900)
 *   data-lattice-scroll  "1" to disperse the lattice as the element scrolls
 *                        out of view
 *
 * What it draws: a core of nodes on a jittered sphere, each wired to its
 * nearest neighbours, inside a slow shell of orbiting particles and a fine
 * dust. Edges carry pulses, a bright bead running from one node to the
 * next, so the structure reads as something passing signals and not as a
 * screensaver. The pointer tilts the whole lattice toward itself and lights
 * the nodes under it.
 *
 * It is raw WebGL1, two programs and three draw calls a frame, because the
 * scene is points and lines and a 150 kB library would be paying for a scene
 * graph this never uses. Positions are uploaded once; everything that moves
 * (rotation, breathing, pulses, dispersal, pointer light) is computed in the
 * vertex shader from a handful of uniforms, so a frame costs the CPU almost
 * nothing.
 *
 * Tiers: full runs it. lite and reduced never create a context. The element
 * keeps whatever static treatment the stylesheet gives it, so the hero
 * looks composed on every tier and the canvas is purely additive.
 *
 * It is never the LCP: canvas paints aren't LCP candidates, and the context
 * is created at idle time after first paint, so the headline paints first.
 */

import { allowCanvas, whileVisible } from './prefs';

type RGB = [number, number, number];

const VERT_POINTS = `
attribute vec3 aPos;
attribute vec2 aSeed;     // x: random 0..1, y: kind (0 core, 1 shell, 2 dust)
uniform float uTime;
uniform float uScroll;
uniform vec2 uRot;        // yaw, pitch
uniform vec2 uPointer;    // NDC, or far away when no pointer
uniform float uAspect;
uniform float uDpr;
uniform float uScale;
uniform vec3 uC0;
uniform vec3 uC1;
uniform vec3 uC2;
varying vec3 vColor;
varying float vAlpha;

mat3 rotY(float a){ float c=cos(a), s=sin(a); return mat3(c,0.,-s, 0.,1.,0., s,0.,c); }
mat3 rotX(float a){ float c=cos(a), s=sin(a); return mat3(1.,0.,0., 0.,c,s, 0.,-s,c); }

void main(){
  vec3 p = aPos;
  float kind = aSeed.y;
  float r = aSeed.x;

  // Breathing: each node drifts along its own normal on its own phase.
  float br = sin(uTime * 0.7 + r * 6.2831) * 0.5 + sin(dot(p, vec3(2.1, 1.7, 2.9)) + uTime * 0.4) * 0.5;
  p += normalize(p + 1e-4) * br * (kind < 0.5 ? 0.035 : 0.06);

  // The shell orbits; the dust drifts slower still.
  float spin = kind < 0.5 ? 0.0 : (kind < 1.5 ? uTime * 0.06 : uTime * 0.015);
  p = rotY(spin) * p;

  // Dispersal as the hero scrolls away.
  p *= 1.0 + uScroll * (0.9 + r * 1.4);

  p = rotY(uRot.x + uTime * 0.035) * rotX(uRot.y) * p;

  float z = p.z + 4.2;
  vec2 ndc = vec2(p.x / uAspect, p.y) * (2.6 / z) * uScale;

  // Pointer light: nodes near the cursor brighten and lean away a little.
  vec2 dp = ndc - uPointer;
  float near = exp(-dot(dp * vec2(uAspect, 1.0), dp * vec2(uAspect, 1.0)) * 18.0);
  ndc += normalize(dp + 1e-4) * near * 0.025;

  gl_Position = vec4(ndc, 0.0, 1.0);

  float depth = clamp((5.6 - z) / 2.8, 0.0, 1.0);   // 1 = near
  float base = kind < 0.5 ? 5.5 : (kind < 1.5 ? 3.4 : 2.4);
  float hot = step(0.93, r) * (kind < 0.5 ? 1.0 : 0.0);   // a few brighter hubs
  gl_PointSize = (base + depth * 4.5 + near * 9.0 + hot * 7.0) * uDpr * uScale * (0.7 + r * 0.6);

  // Colour sweeps around the sphere through the spectrum (copper, teal,
  // violet) so every side of it is a different part of the palette; the
  // pointer pushes toward white.
  float ang = atan(aPos.z, aPos.x) / 6.2831 + 0.5;
  float t = fract(ang + aPos.y * 0.18 + (r - 0.5) * 0.12);
  t = t < 0.5 ? t * 2.0 : 2.0 - t * 2.0;
  vec3 c = t < 0.5 ? mix(uC0, uC1, t * 2.0) : mix(uC1, uC2, (t - 0.5) * 2.0);
  vColor = mix(c, vec3(1.0), near * 0.55);

  float a = kind < 0.5 ? 0.95 : (kind < 1.5 ? 0.55 : 0.32);
  vAlpha = (a * (0.3 + depth * 0.7) + hot * 0.5) * (1.0 - uScroll * 0.85) + near * 0.5;
}`;

const FRAG_POINTS = `
precision mediump float;
varying vec3 vColor;
varying float vAlpha;
void main(){
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  // A hard bright centre inside a soft halo: reads as light, not as a dot.
  float halo = smoothstep(0.5, 0.0, d);
  float core = smoothstep(0.16, 0.0, d);
  float a = (halo * halo * 0.55 + core) * vAlpha;
  if (a < 0.01) discard;
  gl_FragColor = vec4(vColor * a, a);
}`;

const VERT_LINES = `
attribute vec3 aPos;
attribute vec2 aEdge;     // x: phase 0..1, y: end (0 or 1)
uniform float uTime;
uniform float uScroll;
uniform vec2 uRot;
uniform vec2 uPointer;
uniform float uAspect;
uniform float uScale;
varying float vT;
varying float vPhase;
varying float vDepth;
varying float vNear;

mat3 rotY(float a){ float c=cos(a), s=sin(a); return mat3(c,0.,-s, 0.,1.,0., s,0.,c); }
mat3 rotX(float a){ float c=cos(a), s=sin(a); return mat3(1.,0.,0., 0.,c,s, 0.,-s,c); }

void main(){
  vec3 p = aPos;
  float r = fract(aEdge.x * 7.31);
  float br = sin(uTime * 0.7 + r * 6.2831) * 0.5 + sin(dot(p, vec3(2.1, 1.7, 2.9)) + uTime * 0.4) * 0.5;
  p += normalize(p + 1e-4) * br * 0.035;
  p *= 1.0 + uScroll * 0.9;
  p = rotY(uRot.x + uTime * 0.035) * rotX(uRot.y) * p;
  float z = p.z + 4.2;
  vec2 ndc = vec2(p.x / uAspect, p.y) * (2.6 / z) * uScale;
  vec2 dp = ndc - uPointer;
  vNear = exp(-dot(dp * vec2(uAspect, 1.0), dp * vec2(uAspect, 1.0)) * 14.0);
  gl_Position = vec4(ndc, 0.0, 1.0);
  vT = aEdge.y;
  vPhase = aEdge.x;
  vDepth = clamp((5.6 - z) / 2.8, 0.0, 1.0);
}`;

const FRAG_LINES = `
precision mediump float;
uniform float uFTime;
uniform float uFScroll;
uniform vec3 uC0;
uniform vec3 uC1;
uniform vec3 uC2;
varying float vT;
varying float vPhase;
varying float vDepth;
varying float vNear;
void main(){
  // A bead travels each edge on its own schedule; most edges are idle at
  // any moment, which is what makes the active ones read as traffic.
  float cycle = fract(uFTime * 0.18 + vPhase);
  float head = cycle * 2.5;                  // the first 40% of the cycle is travel
  float bead = head <= 1.0 ? exp(-pow((vT - head) * 6.0, 2.0)) : 0.0;
  float base = 0.035 + vDepth * 0.07 + vNear * 0.4;
  vec3 c = vPhase < 0.33 ? uC0 : (vPhase < 0.66 ? uC1 : uC2);
  float a = (base + bead * 1.1) * (1.0 - uFScroll);
  gl_FragColor = vec4(mix(c, vec3(1.0), bead * 0.35) * a, a);
}`;

function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
  const s = gl.createShader(type);
  if (!s) return null;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.warn('lattice: shader', gl.getShaderInfoLog(s));
    return null;
  }
  return s;
}

function program(gl: WebGLRenderingContext, vs: string, fs: string): WebGLProgram | null {
  const v = compile(gl, gl.VERTEX_SHADER, vs);
  const f = compile(gl, gl.FRAGMENT_SHADER, fs);
  const p = gl.createProgram();
  if (!v || !f || !p) return null;
  gl.attachShader(p, v);
  gl.attachShader(p, f);
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    console.warn('lattice: link', gl.getProgramInfoLog(p));
    return null;
  }
  return p;
}

/** Deterministic PRNG — the lattice is the same shape on every visit. */
function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function cssColor(name: string, fallback: RGB): RGB {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const m = /^#([0-9a-f]{6})$/i.exec(raw);
  if (!m) return fallback;
  const n = parseInt(m[1], 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function buildScene(count: number) {
  const rand = rng(0xad71);
  const core: number[] = [];
  /* Fibonacci sphere, jittered: even coverage without a visible spiral. */
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const rad = Math.sqrt(1 - y * y);
    const th = golden * i;
    const j = 0.86 + rand() * 0.22;
    core.push(Math.cos(th) * rad * j, y * j, Math.sin(th) * rad * j);
  }

  /* Edges: each node to its 3 nearest. O(n²) once at init: 900 nodes is
     about 0.8M distance checks, a few milliseconds, and it happens at idle. */
  const K = 3;
  const seen = new Set<number>();
  const lines: number[] = [];
  const edgeAttr: number[] = [];
  for (let i = 0; i < count; i++) {
    const best: [number, number][] = [];
    const ax = core[i * 3], ay = core[i * 3 + 1], az = core[i * 3 + 2];
    for (let j = 0; j < count; j++) {
      if (j === i) continue;
      const dx = core[j * 3] - ax, dy = core[j * 3 + 1] - ay, dz = core[j * 3 + 2] - az;
      const d = dx * dx + dy * dy + dz * dz;
      if (best.length < K) {
        best.push([d, j]);
        best.sort((a, b) => a[0] - b[0]);
      } else if (d < best[K - 1][0]) {
        best[K - 1] = [d, j];
        best.sort((a, b) => a[0] - b[0]);
      }
    }
    for (const [, j] of best) {
      const key = i < j ? i * count + j : j * count + i;
      if (seen.has(key)) continue;
      seen.add(key);
      const phase = rand();
      lines.push(ax, ay, az, core[j * 3], core[j * 3 + 1], core[j * 3 + 2]);
      edgeAttr.push(phase, 0, phase, 1);
    }
  }

  const pos: number[] = [...core];
  const seed: number[] = [];
  for (let i = 0; i < count; i++) seed.push(rand(), 0);

  /* Shell: two tilted rings of particles at 1.45–1.7. */
  const shell = Math.round(count * 0.9);
  for (let i = 0; i < shell; i++) {
    const ring = i % 2;
    const a = rand() * Math.PI * 2;
    const rr = 1.45 + rand() * 0.25;
    const tilt = ring ? 0.5 : -0.35;
    const x = Math.cos(a) * rr;
    const z = Math.sin(a) * rr;
    const y = (rand() - 0.5) * 0.08;
    pos.push(x, y * Math.cos(tilt) - z * Math.sin(tilt), y * Math.sin(tilt) + z * Math.cos(tilt));
    seed.push(rand(), 1);
  }

  /* Dust: a sparse volume out to radius 3.2. */
  const dust = Math.round(count * 1.4);
  for (let i = 0; i < dust; i++) {
    const u = rand() * 2 - 1;
    const a = rand() * Math.PI * 2;
    const rr = 1.8 + Math.pow(rand(), 0.6) * 1.4;
    const s = Math.sqrt(1 - u * u);
    pos.push(Math.cos(a) * s * rr, u * rr, Math.sin(a) * s * rr);
    seed.push(rand(), 2);
  }

  return {
    pos: new Float32Array(pos),
    seed: new Float32Array(seed),
    lines: new Float32Array(lines),
    edges: new Float32Array(edgeAttr),
    points: pos.length / 3,
    lineVerts: lines.length / 3,
  };
}

function mount(figure: HTMLElement): void {
  /* Draw inside the fixed-ratio art box, never the figure itself: sizing a
     canvas from a box that grows to fit the canvas is a feedback loop. */
  const host = figure.querySelector<HTMLElement>('.hero-fig-art') ?? figure;
  const canvas = document.createElement('canvas');
  canvas.className = 'lattice-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  const gl = canvas.getContext('webgl', {
    alpha: true,
    antialias: true,
    premultipliedAlpha: true,
    powerPreference: 'low-power',
  });
  if (!gl) return;

  const pp = program(gl, VERT_POINTS, FRAG_POINTS);
  const lp = program(gl, VERT_LINES, FRAG_LINES);
  if (!pp || !lp) return;

  const count = Math.max(200, Math.min(2000, Number(host.dataset.latticeCount) || 900));
  const scene = buildScene(count);

  const buf = (data: Float32Array) => {
    const b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    return b;
  };
  const bPos = buf(scene.pos);
  const bSeed = buf(scene.seed);
  const bLine = buf(scene.lines);
  const bEdge = buf(scene.edges);

  const C0 = cssColor('--signal', [0.85, 0.33, 0.16]);
  const C1 = cssColor('--teal', [0.06, 0.64, 0.64]);
  const C2 = cssColor('--violet', [0.42, 0.29, 0.96]);

  const U = (p: WebGLProgram, names: string[]) =>
    Object.fromEntries(names.map((n) => [n, gl.getUniformLocation(p, n)])) as Record<string, WebGLUniformLocation | null>;
  const up = U(pp, ['uTime', 'uScroll', 'uRot', 'uPointer', 'uAspect', 'uDpr', 'uScale', 'uC0', 'uC1', 'uC2']);
  const ul = U(lp, ['uTime', 'uScroll', 'uFTime', 'uFScroll', 'uRot', 'uPointer', 'uAspect', 'uScale', 'uC0', 'uC1', 'uC2']);
  const aPP = gl.getAttribLocation(pp, 'aPos');
  const aPS = gl.getAttribLocation(pp, 'aSeed');
  const aLP = gl.getAttribLocation(lp, 'aPos');
  const aLE = gl.getAttribLocation(lp, 'aEdge');

  gl.useProgram(pp);
  gl.uniform3fv(up.uC0, C0);
  gl.uniform3fv(up.uC1, C1);
  gl.uniform3fv(up.uC2, C2);
  gl.useProgram(lp);
  gl.uniform3fv(ul.uC0, C0);
  gl.uniform3fv(ul.uC1, C1);
  gl.uniform3fv(ul.uC2, C2);

  gl.disable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  /* Additive: overlapping light adds up, so dense regions glow. */
  gl.blendFunc(gl.ONE, gl.ONE);

  host.appendChild(canvas);
  canvas.style.width = '100%';
  canvas.style.height = '100%';

  let w = 0;
  let h = 0;
  let dpr = 1;
  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = host.getBoundingClientRect();
    w = Math.max(1, r.width);
    h = Math.max(1, r.height);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
  };
  resize();
  new ResizeObserver(resize).observe(host);

  /* Pointer and tilt, eased toward their targets every frame. */
  const ptr = { x: 9, y: 9, tx: 9, ty: 9 };
  const rot = { x: 0, y: 0.18, tx: 0, ty: 0.18 };
  window.addEventListener(
    'pointermove',
    (e) => {
      const r = host.getBoundingClientRect();
      const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
      const ny = -(((e.clientY - r.top) / r.height) * 2 - 1);
      ptr.tx = nx;
      ptr.ty = ny;
      rot.tx = nx * 0.45;
      rot.ty = 0.18 - ny * 0.25;
    },
    { passive: true },
  );
  document.addEventListener('pointerleave', () => {
    ptr.tx = 9;
    ptr.ty = 9;
  });

  const scrolls = host.dataset.latticeScroll === '1';
  let scroll = 0;
  const readScroll = () => {
    if (!scrolls) return;
    const r = host.getBoundingClientRect();
    scroll = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height)));
  };

  let raf = 0;
  let running = false;
  const t0 = performance.now();

  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    const t = (now - t0) / 1000;
    ptr.x += (ptr.tx - ptr.x) * 0.08;
    ptr.y += (ptr.ty - ptr.y) * 0.08;
    rot.x += (rot.tx - rot.x) * 0.04;
    rot.y += (rot.ty - rot.y) * 0.04;
    readScroll();

    const aspect = w / h;
    /* Fit the sphere to the shorter side so a tall phone-shaped box and a
       wide desktop box both frame it. */
    const scale = aspect < 1 ? aspect * 1.05 : 1;

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(lp);
    gl.uniform1f(ul.uTime, t);
    gl.uniform1f(ul.uScroll, scroll);
    gl.uniform1f(ul.uFTime, t);
    gl.uniform1f(ul.uFScroll, scroll);
    gl.uniform2f(ul.uRot, rot.x, rot.y);
    gl.uniform2f(ul.uPointer, ptr.x, ptr.y);
    gl.uniform1f(ul.uAspect, aspect);
    gl.uniform1f(ul.uScale, scale);
    gl.bindBuffer(gl.ARRAY_BUFFER, bLine);
    gl.enableVertexAttribArray(aLP);
    gl.vertexAttribPointer(aLP, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, bEdge);
    gl.enableVertexAttribArray(aLE);
    gl.vertexAttribPointer(aLE, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.LINES, 0, scene.lineVerts);
    gl.disableVertexAttribArray(aLE);

    gl.useProgram(pp);
    gl.uniform1f(up.uTime, t);
    gl.uniform1f(up.uScroll, scroll);
    gl.uniform2f(up.uRot, rot.x, rot.y);
    gl.uniform2f(up.uPointer, ptr.x, ptr.y);
    gl.uniform1f(up.uAspect, aspect);
    gl.uniform1f(up.uDpr, dpr);
    gl.uniform1f(up.uScale, scale);
    gl.bindBuffer(gl.ARRAY_BUFFER, bPos);
    gl.enableVertexAttribArray(aPP);
    gl.vertexAttribPointer(aPP, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, bSeed);
    gl.enableVertexAttribArray(aPS);
    gl.vertexAttribPointer(aPS, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.POINTS, 0, scene.points);
    gl.disableVertexAttribArray(aPS);
  };

  whileVisible(
    host,
    () => {
      if (running) return;
      running = true;
      figure.dataset.running = 'true';
      raf = requestAnimationFrame(frame);
    },
    () => {
      if (!running) return;
      running = false;
      cancelAnimationFrame(raf);
    },
    '0px',
  );

  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    cancelAnimationFrame(raf);
    running = false;
    canvas.remove();
    figure.dataset.running = 'false';
  });
}

export function initLattice(): void {
  if (!allowCanvas) return;
  const hosts = Array.from(document.querySelectorAll<HTMLElement>('[data-lattice]'));
  if (!hosts.length) return;
  const go = () => hosts.forEach(mount);
  /* After first paint and off the critical path: the headline is the LCP
     and it should not wait on a shader compile. */
  const ric = (window as Window & { requestIdleCallback?: (cb: () => void, o?: object) => number })
    .requestIdleCallback;
  if (ric) ric(go, { timeout: 1200 });
  else window.setTimeout(go, 300);
}
