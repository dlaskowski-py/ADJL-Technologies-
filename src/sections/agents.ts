/**
 * /agents/: the front door for AI agents.
 *
 *   #who      who it's for                       (the generic section)
 *   #connect  the endpoint's facts beside three code panes: a client
 *             config block, the Claude Code command and a curl request
 *   #tools    one card per tool, from the same list the MCP endpoint
 *             sends in tools/list (src/content-agents.ts `mcp.tools`)
 *   #rules    read-only with one exception, limits, no tracking
 *   #text     the plain-text routes that need no protocol at all
 *
 * The code panes are real text, not chrome: the markdown twin carries
 * them as fenced code, so an agent reading /agents/index.md gets the
 * address and the config it needs. Only each pane's label strip is
 * data-chrome. The address isn't a link: /mcp answers POST, and a click
 * would only get a 405.
 *
 * Pure string functions, like every renderer: no DOM, no window.
 */

import type { Hero, Meta, Section, Spec } from '../content-types';
import { esc, eyebrow, headline, prose, rail, rich, sectionOpen } from './html';
import { pageHero, renderSection } from './kit';
import { renderNav } from './nav';
import { renderContact, renderFooter } from './bottom';

const FILE = 'content-agents.ts';
const RENDERER = 'sections/agents.ts#renderAgents';

/** One argument of a tool, as the page and tools/list both describe it.
 *  Its type and limits are code, in netlify/functions/mcp.mjs. */
export type ToolParam = { name: string; required: boolean; text: string };

/** One MCP tool. `description` and each param's `text` are what an agent
 *  reads in tools/list, word for word, so they carry no markers. */
export type AgentTool = {
  name: string;
  title: string;
  /** read: changes nothing. send: sends Daniel a message. */
  kind: 'read' | 'send';
  description: string;
  params: ToolParam[];
  /** What comes back, for the page. */
  returns: string;
};

/** Everything the MCP endpoint says. Plain text: no {em} or {k}. */
export type AgentsServer = {
  name: string;
  title: string;
  version: string;
  endpoint: string;
  page: string;
  contact: string;
  topics: string[];
  description: string;
  instructions: string;
  tools: AgentTool[];
  replies: {
    unavailable: string;
    searchHead: string;
    searchNone: string;
    searchClosest: string;
    servicesHead: string;
    workHead: string;
    notFound: string;
    offSite: string;
    sent: string;
    duplicate: string;
    /** This visitor (IP address) has sent its messages for the day. */
    limited: string;
    /** The whole site has taken its messages from agents for the day. */
    full: string;
    /** Sending is switched off (MCP_DAILY_LIMIT=0). */
    paused: string;
    failed: string;
    invalid: Record<
      'args' | 'noArgs' | 'query' | 'limit' | 'path' | 'name' | 'email' | 'messageShort' | 'messageLong' | 'topic',
      string
    >;
  };
};

/** A code pane: a label strip, a sentence saying what it is, the code. */
export type Snippet = { label: string; lang: string; caption: string; code: string };

export type AgentsPage = {
  meta: Meta;
  hero: Hero;
  who: Section;
  connect: {
    id: string;
    eyebrow: string;
    headline: string[];
    body: string[];
    factsLabel: string;
    facts: Spec[];
    snippets: Snippet[];
  };
  tools: {
    id: string;
    eyebrow: string;
    headline: string[];
    body: string[];
    labels: { takes: string; returns: string; none: string; optional: string; read: string; send: string };
  };
  rules: Section;
  text: Section;
};

/** Keep each YYYY-MM-DD protocol version on one line. An MCP version is
 *  the date of its last breaking change, so it's marked up as one; <time>
 *  is phrasing, so the twin and the search index read the text unbroken.
 *  Presentation only: the words are the content module's. */
const nowrapDates = (html: string) =>
  html.replace(/\b\d{4}-\d{2}-\d{2}\b/g, '<time class="ag-date" datetime="$&">$&</time>');

function snippet(s: Snippet): string {
  return `<div class="panel ag-snip">
    <div class="panel-head" data-chrome><span class="panel-title">${esc(s.label)}</span><span class="ag-lang">${esc(s.lang)}</span></div>
    <p class="ag-cap">${rich(s.caption)}</p>
    <pre class="ag-pre" tabindex="0"><code>${esc(s.code)}</code></pre>
  </div>`;
}

function renderConnect(c: AgentsPage['connect'], n: number): string {
  return `${sectionOpen({ id: c.id, src: `${FILE}#content.connect`, renderer: RENDERER, band: n % 2 === 0 })}
    <div class="wrap">
      ${rail(n, c.id)}
      <div class="ag-connect">
        <div class="sec-copy">
          ${eyebrow(c.eyebrow)}
          ${headline(c.headline)}
          ${prose(c.body, 'prose sec-body')}
          <p class="label defs-label" data-reveal>${esc(c.factsLabel)}</p>
          <dl class="defs ag-facts" data-reveal>${c.facts
            .map((d) => `<div class="def"><dt>${rich(d.label)}</dt><dd>${nowrapDates(rich(d.value))}</dd></div>`)
            .join('')}</dl>
        </div>
        <div class="ag-snips" data-reveal>${c.snippets.map(snippet).join('')}</div>
      </div>
    </div>
  </section>`;
}

function toolCard(t: AgentTool, l: AgentsPage['tools']['labels'], i: number): string {
  const args = t.params.length
    ? `<ul class="ag-args">${t.params
        .map(
          (p) =>
            `<li><code class="ag-arg">${esc(p.name)}</code>${p.required ? '' : ` <span class="ag-opt">${esc(l.optional)}</span>`} <span class="ag-argtext">${rich(p.text)}</span></li>`,
        )
        .join('')}</ul>`
    : `<p>${esc(l.none)}</p>`;
  return `<article class="panel ag-tool" id="tool-${esc(t.name.replace(/_/g, '-'))}" data-kind="${t.kind}" data-reveal style="--i:${i}">
      <h3 class="ag-tool-h"><code class="ag-tool-name">${esc(t.name)}</code><span class="ag-tool-title">${esc(t.title)}</span></h3>
      <p class="ag-tag"><span class="ag-glyph" aria-hidden="true">${t.kind === 'send' ? '→' : '◇'}</span>${esc(
        t.kind === 'send' ? l.send : l.read,
      )}</p>
      <p class="ag-desc">${rich(t.description)}</p>
      <dl class="ag-io">
        <div><dt class="label">${esc(l.takes)}</dt><dd>${args}</dd></div>
        <div><dt class="label">${esc(l.returns)}</dt><dd><p>${rich(t.returns)}</p></dd></div>
      </dl>
    </article>`;
}

function renderTools(c: AgentsPage['tools'], list: AgentTool[], n: number): string {
  return `${sectionOpen({ id: c.id, src: `${FILE}#content.tools`, renderer: RENDERER, band: n % 2 === 0 })}
    <div class="wrap">
      ${rail(n, c.id)}
      <div class="sec-copy">
        ${eyebrow(c.eyebrow)}
        ${headline(c.headline)}
        ${prose(c.body, 'prose sec-body')}
      </div>
      <div class="ag-tools">${list.map((t, i) => toolCard(t, c.labels, i)).join('')}</div>
    </div>
  </section>`;
}

export function renderAgents(c: AgentsPage, tools: AgentTool[]): { navHtml: string; pageHtml: string } {
  const section = (s: Section, n: number) =>
    renderSection(s, n, `${FILE}#content.${s.id}`, { band: n % 2 === 0 });
  const parts = [
    pageHero({ route: '/agents/', hero: c.hero, src: `${FILE}#content.hero`, figure: true }),
    section(c.who, 2),
    renderConnect(c.connect, 3),
    renderTools(c.tools, tools, 4),
    section(c.rules, 5),
    section(c.text, 6),
    renderContact(7),
    renderFooter(),
  ];
  return { navHtml: renderNav('/agents/'), pageHtml: parts.join('') };
}
