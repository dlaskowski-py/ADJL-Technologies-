/**
 * The hero's typed line: what we're "building" right now, cycling through
 * the kinds of things we build. Markup contract: [data-typer], whose value
 * is the phrase list joined with "|" (so the lazy chunk doesn't ship the
 * copy module), and [data-typer-text], the one text node that changes.
 *
 * Prerendered, it shows the first phrase in full with a still caret: that's
 * what JavaScript-off, reduced motion and Pause see. The line is one fixed
 * row (two on a phone: the prompt, then the phrase) that never wraps, and
 * typing only moves a clip-path and the caret's transform, both read from
 * --n (characters shown), so it can't shift the layout around it. It sits
 * above the fold.
 *
 * The moving text is decoration and aria-hidden. Screen readers, crawlers
 * and the text twins get one static sentence that says the same thing. It's
 * a span, not a paragraph, on purpose: Ask This Site indexes paragraphs,
 * and it shouldn't cite a sentence nobody can see on the page.
 *
 * OWNER: WS-B (landing).
 */
import { landing } from '../../content-landing';
import { esc } from '../html';

export function renderTyper(): string {
  const t = landing.typer;
  const first = t.phrases[0];
  return `<div class="lp-typer" data-typer="${esc(t.phrases.join('|'))}">
    <span class="sr-only">${esc(t.summary)}</span>
    <p class="lp-typer-line" aria-hidden="true" data-chrome><span class="lp-typer-prompt"><b>&gt;</b> ${esc(
      t.prompt,
    )}</span><span class="lp-typer-phrase" style="--n:${first.length}"><span class="lp-typer-text" data-typer-text>${esc(
      first,
    )}</span><i class="lp-typer-caret"></i></span></p>
  </div>`;
}
