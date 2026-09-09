/**
 * The flow diagram.
 *
 * Emitted as real SVG at build time rather than assembled by JavaScript,
 * because this diagram is CONTENT — it is the clearest statement on the site
 * of what the firm actually does. It has to survive with scripting off, be
 * readable to a screen reader, and appear in the prerendered HTML a crawler
 * sees. src/motion/flow.ts only animates what is already here.
 *
 * The geometry is a serpentine: five nodes on two rows, joined by four
 * symmetric cubic curves. Because every segment is the same shape, each node
 * sits at an exact quarter of the path length, which is what `data-at`
 * carries — flow.ts uses it to light a node at the moment the packet
 * actually arrives, rather than on an even split that would visibly
 * desynchronise from the curve.
 *
 * On a phone the SVG is hidden entirely and the same stages render as a
 * vertical list with a progress rail. A serpentine 1200 units wide either
 * scales to illegibility or scrolls sideways, and neither is worth it.
 */

import { esc, eyebrow, headline, rich } from './html';

export type Stage = { num: string; tag: string; title: string; body: string };

const NODE_X = [90, 345, 600, 855, 1110];
const NODE_Y = [78, 162, 78, 162, 78];

const PATH_D = [
  `M ${NODE_X[0]} ${NODE_Y[0]}`,
  `C 217 78, 217 162, ${NODE_X[1]} ${NODE_Y[1]}`,
  `C 472 162, 472 78, ${NODE_X[2]} ${NODE_Y[2]}`,
  `C 727 78, 727 162, ${NODE_X[3]} ${NODE_Y[3]}`,
  `C 982 162, 982 78, ${NODE_X[4]} ${NODE_Y[4]}`,
].join(' ');

function nodes(stages: Stage[]): string {
  return stages
    .map((s, i) => {
      const x = NODE_X[i];
      const y = NODE_Y[i];
      // Label above the top row, below the bottom row, so it never collides
      // with the curve arriving at the node.
      const up = y < 120;
      const ly = up ? y - 30 : y + 44;
      return `<g class="flow-node" data-at="${(i / (stages.length - 1)).toFixed(4)}">
        <circle class="flow-halo" cx="${x}" cy="${y}" r="22" />
        <circle class="flow-dot" cx="${x}" cy="${y}" r="9" />
        <text class="flow-tag" x="${x}" y="${ly}" text-anchor="middle">${esc(s.tag)}</text>
        <text class="flow-idx" x="${x}" y="${up ? y - 48 : y + 62}" text-anchor="middle">${esc(s.num)}</text>
      </g>`;
    })
    .join('');
}

export function renderFlowDiagram(stages: Stage[], title: string): string {
  return `<div class="flow" data-flow>
    <svg class="flow-svg" viewBox="0 0 1200 240" role="img" aria-label="${esc(title)}" focusable="false">
      <defs>
        <linearGradient id="flow-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#d9542a" />
          <stop offset="52%" stop-color="#0fa3a3" />
          <stop offset="100%" stop-color="#6c4bf5" />
        </linearGradient>
      </defs>
      <path class="flow-track" d="${PATH_D}" />
      <path class="flow-live" d="${PATH_D}" />
      ${nodes(stages)}
      <circle class="flow-packet" r="6" cx="${NODE_X[0]}" cy="${NODE_Y[0]}" />
    </svg>

    <ol class="flow-steps" role="list">
      ${stages
        .map(
          (s) => `<li class="flow-step">
        <span class="flow-step-rail" aria-hidden="true"></span>
        <span class="flow-step-num label">${esc(s.num)}</span>
        <h3 class="flow-step-title">${esc(s.title)}</h3>
        <p class="flow-step-body">${rich(s.body)}</p>
      </li>`,
        )
        .join('')}
    </ol>
  </div>`;
}

/** The whole home-page section around the diagram. */
export function renderFlowSection(f: {
  eyebrow: string;
  headline: string[];
  intro: string;
  stages: Stage[];
  foot: string;
}): string {
  return `<section class="flowsec sec-line sec-tint" id="process">
    <div class="wrap">
      ${eyebrow(f.eyebrow)}
      ${headline(f.headline)}
      <p class="lede" data-reveal style="--i:1">${rich(f.intro)}</p>
    </div>
    <div class="wrap flow-wrap">
      ${renderFlowDiagram(f.stages, f.headline.join(' ').replace(/\{\/?em\}/g, ''))}
      <p class="flow-foot" data-reveal>${rich(f.foot)}</p>
    </div>
  </section>`;
}
