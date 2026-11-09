/**
 * Shared text extraction for the copy guards.
 *
 * check-voice and check-claims both read "the words on the page", but they
 * need different slices of it:
 *
 *   check-voice measures PROSE. Instrument chrome (readouts, chips, axis
 *   labels, code panes) is marked data-prose="off" and dropped, because a
 *   row of "LCP 0.38 s · CLS 0.000 · dom 1,184" has no sentence boundary and
 *   glues itself onto the next paragraph as one enormous "sentence", which
 *   would fail the average-length check for reasons that have nothing to do
 *   with the writing.
 *
 *   check-claims reads EVERYTHING a visitor could read, chrome included,
 *   plus the text inside application/json data blocks that the demos
 *   animate onto the page. A transcript that types "8.4% yield" into a
 *   console is a claim even though it lives in a <script> tag.
 */

const VOID = /^(area|base|br|col|embed|hr|img|input|link|meta|source|track|wbr)$/i;

/** Remove every element whose opening tag matches `test`, with its whole
 *  subtree, nested same-name elements included. */
export function stripElements(html, test) {
  const re = /<(\/?)([a-z][a-z0-9-]*)\b([^>]*?)(\/?)>/gi;
  let out = '';
  let last = 0;
  let depth = 0;
  let name = '';
  let m;
  while ((m = re.exec(html))) {
    const [whole, close, tag, rest, self] = m;
    const isVoid = VOID.test(tag) || self === '/';
    if (depth === 0) {
      if (!close && test(tag.toLowerCase(), rest)) {
        out += html.slice(last, m.index);
        if (isVoid) {
          last = m.index + whole.length;
          continue;
        }
        depth = 1;
        name = tag.toLowerCase();
      }
    } else if (tag.toLowerCase() === name && !isVoid) {
      depth += close ? -1 : 1;
      if (depth === 0) last = m.index + whole.length;
    }
  }
  if (depth === 0) out += html.slice(last);
  return out;
}

const decode = (s) =>
  s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&[a-z]+;/g, ' ');

/** Prose for check-voice: no scripts, styles, templates, code, chrome
 *  (data-prose="off") or decoration (aria-hidden="true"). The <title> stays,
 *  because a title is copy and the em-dash it carries counts. */
export function proseText(html) {
  let s = html
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<template[\s\S]*?<\/template>/g, ' ');
  s = stripElements(
    s,
    (tag, rest) =>
      tag === 'pre' ||
      tag === 'code' ||
      /\sdata-prose\s*=\s*"off"/.test(` ${rest}`) ||
      /\saria-hidden\s*=\s*"true"/.test(` ${rest}`),
  );
  return decode(s.replace(/<[^>]+>/g, ' '));
}

/** Everything a visitor could read, for check-claims: all visible text,
 *  chrome included, plus the string values inside JSON data blocks. */
export function readableText(html) {
  const json = [...html.matchAll(/<script\b[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/g)]
    .map((m) => {
      const out = [];
      const walk = (v) => {
        if (typeof v === 'string') out.push(v);
        else if (Array.isArray(v)) v.forEach(walk);
        else if (v && typeof v === 'object') Object.values(v).forEach(walk);
      };
      try {
        walk(JSON.parse(m[1]));
      } catch {
        out.push(m[1]);
      }
      return out.join(' \n ');
    })
    .join(' \n ');
  const visible = html
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, ' ');
  return decode(visible) + ' \n ' + json;
}
