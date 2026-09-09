/**
 * The home page's section order, in ONE place.
 *
 * Capital kept this list twice — once for the dev shell and once for the
 * build-time prerender — and they drifted, so production served an order
 * nobody had looked at since dev was the copy being edited. Both entry
 * points here call this function, so they cannot disagree.
 *
 * The shape: what we do, in one line → the three practices → the process
 * that makes them work → the work itself → proof you can watch → how to
 * hire us → what it is built from → who you actually get → the objections
 * → the close.
 */

import * as C from '../content';
import { renderNav } from './nav';
import { renderFlowSection } from './flow';
import { renderHero, renderPractices, renderStrip } from './top';
import { renderWorkBand } from './work';
import {
  renderCta,
  renderDemo,
  renderFaq,
  renderFooter,
  renderFounder,
  renderMethod,
  renderStack,
} from './bottom';

export function renderPage(): { navHtml: string; pageHtml: string } {
  return {
    navHtml: renderNav('/'),
    pageHtml: [
      renderHero(),
      renderStrip(),
      renderPractices(),
      renderFlowSection(C.flow),
      renderWorkBand(C.work),
      renderDemo(),
      renderMethod(),
      renderStack(),
      renderFounder(),
      renderFaq(),
      renderCta(C.cta),
      renderFooter(),
    ].join(''),
  };
}
