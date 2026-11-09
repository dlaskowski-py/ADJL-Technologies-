/* Runs in the head, before first paint. Three jobs.
 *
 * 1. Set html.js. Reveal styles hide content only under .js, so with
 *    scripting off (or this file failing to load) nothing is hidden.
 *
 * 2. Resolve the motion tier ONCE, before any CSS paints, so the first frame
 *    already matches it: 'reduced' (prefers-reduced-motion, or the visitor
 *    pressed Pause motion on an earlier page), 'lite' (save-data, 2g, low
 *    memory or a coarse pointer) or 'full'. A module bundle can't do this:
 *    module scripts are deferred, so the page would paint once in the wrong
 *    tier and then change under the reader.
 *
 * A classic script on the same origin, so script-src 'self' covers it. */
(function () {
  var d = document.documentElement;
  d.className += ' js';
  var paused = false;
  try {
    paused = localStorage.getItem('adjl:motion') === 'off';
  } catch (e) {}
  var t = 'full';
  var n = navigator;
  var c = n.connection || {};
  var mq = function (q) {
    return window.matchMedia && window.matchMedia(q).matches;
  };
  if (mq('(prefers-reduced-motion: reduce)')) t = 'reduced';
  else if (
    c.saveData ||
    /(^|-)(2g|slow-2g)$/.test(c.effectiveType || '') ||
    (typeof n.deviceMemory === 'number' && n.deviceMemory < 4) ||
    mq('(pointer: coarse)')
  )
    t = 'lite';
  d.setAttribute('data-motion-detected', t);
  d.setAttribute('data-motion', paused ? 'reduced' : t);
  if (paused) d.setAttribute('data-paused', 'true');

  /* 3. The opening sequence (home page). The FIRST page view of a browser
   *    session decides, once: it plays if that view is the home page itself,
   *    reached from outside this site, with no #fragment, motion allowed and
   *    a real visitor on the other end. Whatever it decides, the session is
   *    marked, so the sequence can't appear later in the visit: a link to a
   *    section (/#contact), a click from another page of this site, a
   *    reload and a second visit all go straight to the page.
   *
   *    Decided here so the overlay is in the very first frame: a deferred
   *    script would show the page, then cover it. If the mark can't be
   *    written (storage blocked), it never plays, because "once" couldn't
   *    be kept. A crawler gets the page, not the curtain. */
  var first = false;
  try {
    first = !sessionStorage.getItem('adjl:intro');
    if (first) sessionStorage.setItem('adjl:intro', 'seen');
  } catch (e) {
    first = false;
  }
  if (
    first &&
    !paused &&
    t !== 'reduced' &&
    location.pathname === '/' &&
    !location.hash &&
    document.referrer.indexOf(location.origin + '/') !== 0 &&
    !/bot|crawl|spider/i.test(n.userAgent)
  ) {
    d.setAttribute('data-intro', 'play');
  }
})();
