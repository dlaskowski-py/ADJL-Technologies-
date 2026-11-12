/**
 * /start/: the scoping assistant and the intake form.
 *
 * Two sections between the hero and the contact block:
 *
 *   #assistant  [data-assistant="chat"]  the scoping assistant. Prerendered
 *               at rest: the panel, its status wordings (CSS shows the one
 *               matching data-state), the composer (data-js-only) and the
 *               "How it works" panel, whose list of cited pages is
 *               data-js-only too: with no script it could never fill. src/motion/assistant.ts asks
 *               /api/assistant whether it's switched on and builds the
 *               conversation inside [data-log].
 *   #form       [data-assistant="form"]  the intake form. Netlify Forms,
 *               a plain POST to /start/sent/ that works with no script at
 *               all. With one, the same module validates it, sends it with
 *               fetch and confirms in place.
 *
 * The form's contract is shared with the MCP endpoint (netlify/functions/
 * mcp.mjs submits it server-side with source=agent): name="start", the
 * fields name, email, topic, message and source, and the honeypot
 * company-website. Topic values are the labels themselves. The hidden
 * form-name is what Netlify adds to the deployed HTML anyway; written here
 * too, so the page's own fetch and a plain post carry it either way. Field
 * order matters to Netlify's submission list, which titles each entry with
 * the first visible text input: the name, so the honeypot comes last.
 *
 * Pure string functions, like every renderer: no DOM, no window.
 */

import type { Hero, Link, Meta } from '../content-types';
import { esc, eyebrow, headline, prose, rail, rich, sectionOpen } from './html';
import { pageHero } from './kit';
import { renderNav } from './nav';
import { renderContact, renderFooter } from './bottom';

/** One topic in the form's select. `slug` is what ?topic= accepts. */
export type Topic = { label: string; slug: string };

/** Everything the browser module needs and the markup doesn't carry. It's
 *  written into the page as a JSON block next to the panel, so no copy
 *  ships inside src/motion/assistant.ts. */
export type AssistantCopy = {
  ui: {
    you: string;
    them: string;
    greeting: string;
    writing: string;
    left: string;
    leftOne: string;
    count: string;
    cut: string;
    from: string;
    drafting: string;
    drafted: string;
    ended: string;
    first: string;
    backup: string;
  };
  /** Keyed by the error codes /api/assistant returns. */
  errors: Record<string, string>;
  /** The labels of the brief the assistant drafts into the form. */
  brief: { want: string; audience: string; must: string; timeline: string; budget: string; open: string };
  /** Model ids to the names people know them by. */
  models: Record<string, string>;
  form: {
    errors: { name: string; emailMissing: string; emailInvalid: string; topic: string; message: string };
    sending: string;
    sentTitle: string;
    sentBody: string;
    failed: string;
    drafted: string;
  };
  topics: Topic[];
};

export type StartPage = {
  meta: Meta;
  hero: Hero;
  assistant: {
    eyebrow: string;
    headline: string[];
    body: string[];
    panel: {
      title: string;
      status: { nojs: string; loading: string; off: string; unreachable: string };
      /** Shown with every status but "loading": the way on when the
       *  assistant can't help. */
      toForm: Link;
      startersLabel: string;
      starters: string[];
      label: string;
      placeholder: string;
      send: string;
      draft: string;
    };
    side: {
      title: string;
      facts: { label: string; value: string }[];
      sources: string;
      none: string;
      privacy: Link;
    };
  };
  form: {
    eyebrow: string;
    headline: string[];
    body: string[];
    list: string[];
    fields: {
      name: string;
      email: string;
      emailHint: string;
      topic: string;
      topicPlaceholder: string;
      message: string;
      messageHint: string;
      honeypot: string;
    };
    submit: string;
    note: string;
    privacy: Link;
  };
  copy: AssistantCopy;
};

const FILE = 'content-start.ts';
/** Characters per visitor message; /api/assistant enforces the same. */
export const ASSISTANT_MAX_CHARS = 1500;
/** The form's message field. Netlify takes more; a brief needs less. */
const MESSAGE_MAX = 5000;

/** JSON inside <script> only needs "</" escaped. */
const json = (v: unknown) => JSON.stringify(v).replace(/<\//g, '<\\/');

function renderAssistant(c: StartPage['assistant'], copy: AssistantCopy, n: number): string {
  const p = c.panel;
  const s = c.side;
  const max = ASSISTANT_MAX_CHARS.toLocaleString('en-US');
  return `${sectionOpen({
    id: 'assistant',
    src: `${FILE}#content.assistant`,
    renderer: 'sections/start.ts#renderAssistant',
    band: true,
    extra: 'data-assistant="chat"',
  })}
    <div class="wrap">
      ${rail(n, 'assistant')}
      <div class="start-head">
        ${eyebrow(c.eyebrow)}
        ${headline(c.headline)}
        ${prose(c.body, 'prose start-body')}
      </div>
      <div class="asst-grid">
        <div class="asst panel" data-asst>
          <div class="panel-head" data-chrome>
            <span class="panel-title">${esc(p.title)}</span>
            <span class="asst-left" data-left></span>
          </div>
          <div class="asst-stage">
            <div class="asst-status" data-chrome>
              <p data-s="nojs">${rich(p.status.nojs)}</p>
              <p data-s="loading">${rich(p.status.loading)}</p>
              <p data-s="off">${rich(p.status.off)}</p>
              <p data-s="unreachable">${rich(p.status.unreachable)}</p>
              <a class="alink asst-to-form" href="${esc(p.toForm.href)}"><span>${esc(p.toForm.label)}</span><span class="arw" aria-hidden="true">↓</span></a>
            </div>
            <div class="asst-log" data-log role="log" aria-live="polite" aria-label="${esc(p.title)}" tabindex="0"></div>
            <div class="asst-ideas" data-js-only data-chrome>
              <p class="label" id="asst-try">${esc(p.startersLabel)}</p>
              <ul class="asst-starters" aria-labelledby="asst-try">${p.starters
                .map((t) => `<li><button class="asst-starter" type="button" data-starter disabled>${esc(t)}</button></li>`)
                .join('')}</ul>
            </div>
          </div>
          <div class="asst-compose" data-js-only data-chrome>
            <label class="label" for="asst-q">${esc(p.label)}</label>
            <textarea class="asst-input" id="asst-q" rows="3" maxlength="${ASSISTANT_MAX_CHARS}" placeholder="${esc(
              p.placeholder,
            )}" aria-describedby="asst-count" data-q disabled></textarea>
            <div class="asst-row">
              <p class="asst-count" id="asst-count" data-count>0 / ${max}</p>
              <div class="asst-btns">
                <button class="btn btn--ghost" type="button" data-draft disabled>${esc(p.draft)}</button>
                <button class="btn btn--primary" type="button" data-send disabled><span>${esc(p.send)}</span><span class="arw" aria-hidden="true">→</span></button>
              </div>
            </div>
            <p class="asst-note" data-note aria-live="polite"></p>
          </div>
        </div>
        <aside class="asst-side panel" aria-labelledby="asst-side-title">
          <div class="panel-head" data-chrome><span class="panel-title" id="asst-side-title">${esc(s.title)}</span></div>
          <dl class="asst-facts">${s.facts
            .map((f) => `<div class="asst-fact"><dt>${esc(f.label)}</dt><dd>${rich(f.value)}</dd></div>`)
            .join('')}</dl>
          <div class="asst-srcs" data-chrome data-js-only>
            <p class="label">${esc(s.sources)}</p>
            <ul class="asst-src-list" data-sources></ul>
            <p class="asst-src-none" data-none>${esc(s.none)}</p>
          </div>
          <a class="alink asst-privacy" href="${esc(s.privacy.href)}"><span>${esc(s.privacy.label)}</span><span class="arw" aria-hidden="true">→</span></a>
        </aside>
      </div>
      <script type="application/json" data-assistant-copy>${json(copy)}</script>
    </div>
  </section>`;
}

/** One labeled field: the label, an optional hint, the control, and an
 *  error line the browser module fills (empty, and so silent, until then).
 *  A hint goes above the control, where it's read before typing, unless
 *  `below`: side by side, a hint above one input and not the other would
 *  set the two inputs at different heights. */
function field(o: { id: string; label: string; hint?: string; below?: boolean; control: string; wide?: boolean }): string {
  const hint = o.hint ? `<p class="field-hint" id="${o.id}-hint">${rich(o.hint)}</p>` : '';
  return `<div class="field${o.wide ? ' field--wide' : ''}">
    <label class="field-label" for="${o.id}">${esc(o.label)}</label>
    ${o.below ? '' : hint}
    ${o.control}
    ${o.below ? hint : ''}
    <p class="field-err" id="${o.id}-err" data-err></p>
  </div>`;
}

function renderForm(c: StartPage['form'], topics: Topic[], n: number): string {
  const f = c.fields;
  const describe = (id: string, hint = false) => `aria-describedby="${hint ? `${id}-hint ` : ''}${id}-err"`;
  return `${sectionOpen({
    id: 'form',
    src: `${FILE}#content.form`,
    renderer: 'sections/start.ts#renderForm',
    extra: 'data-assistant="form"',
  })}
    <div class="wrap">
      ${rail(n, 'form')}
      <div class="split">
        <div class="sec-copy">
          ${eyebrow(c.eyebrow)}
          ${headline(c.headline)}
          ${prose(c.body, 'prose sec-body')}
          <ul class="bullets start-list" data-reveal>${c.list.map((l) => `<li>${rich(l)}</li>`).join('')}</ul>
        </div>
        <div class="intake panel" data-intake data-chrome>
          <form class="intake-form" name="start" method="POST" action="/start/sent/" data-netlify="true" netlify-honeypot="company-website" data-form>
            <input type="hidden" name="form-name" value="start" />
            <input type="hidden" name="source" value="form" data-source />
            <div class="intake-grid">
              ${field({
                id: 'f-name',
                label: f.name,
                control: `<input class="field-input" id="f-name" name="name" type="text" autocomplete="name" required maxlength="120" ${describe('f-name')} />`,
              })}
              ${field({
                id: 'f-email',
                label: f.email,
                hint: f.emailHint,
                below: true,
                control: `<input class="field-input" id="f-email" name="email" type="email" autocomplete="email" spellcheck="false" required maxlength="200" ${describe('f-email', true)} />`,
              })}
              ${field({
                id: 'f-topic',
                label: f.topic,
                wide: true,
                control: `<select class="field-input field-select" id="f-topic" name="topic" required ${describe('f-topic')}>
                  <option value="">${esc(f.topicPlaceholder)}</option>
                  ${topics.map((t) => `<option value="${esc(t.label)}">${esc(t.label)}</option>`).join('')}
                </select>`,
              })}
              ${field({
                id: 'f-message',
                label: f.message,
                hint: f.messageHint,
                wide: true,
                control: `<textarea class="field-input field-area" id="f-message" name="message" rows="8" required maxlength="${MESSAGE_MAX}" ${describe('f-message', true)}></textarea>`,
              })}
            </div>
            <p class="intake-hp" aria-hidden="true"><label>${esc(f.honeypot)} <input name="company-website" tabindex="-1" autocomplete="off" /></label></p>
            <div class="intake-foot">
              <button class="btn btn--primary" type="submit" data-submit><span>${esc(c.submit)}</span><span class="arw" aria-hidden="true">→</span></button>
              <p class="intake-note">${rich(c.note)} <a class="tlink" href="${esc(c.privacy.href)}">${esc(c.privacy.label)}</a></p>
            </div>
            <p class="intake-alert" role="alert" data-alert></p>
          </form>
        </div>
      </div>
    </div>
  </section>`;
}

export function renderStart(c: StartPage): { navHtml: string; pageHtml: string } {
  const parts = [
    pageHero({
      route: '/start/',
      hero: c.hero,
      src: `${FILE}#content.hero`,
      renderer: 'sections/kit.ts#pageHero',
      figure: true,
    }),
    renderAssistant(c.assistant, c.copy, 2),
    renderForm(c.form, c.copy.topics, 3),
    /* This page IS the way in, so the shared block drops its "Start a
       project" button, which would only link back here. */
    renderContact(4, undefined, { start: false }),
    renderFooter(),
  ];
  return { navHtml: renderNav('/start/'), pageHtml: parts.join('') };
}
