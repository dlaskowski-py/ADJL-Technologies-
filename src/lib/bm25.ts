/**
 * Ask This Site: the retrieval, in one pure file.
 *
 * The same code runs in two places, and that's the point of it:
 *
 *   scripts/gen-machine.mjs   builds /search-index.json from the built
 *                             pages, precomputes every chip's answer for
 *                             the JS-off page, and fails the build if a
 *                             chip stops doing what it promises
 *   src/motion/ask.ts         answers the visitor's own question, in the
 *                             browser, against that same index
 *
 * Because both import this file, the answer in the HTML and the answer a
 * visitor gets live can't drift apart. No DOM, no Node APIs.
 *
 * The method, end to end:
 *
 *   tokens   lowercase, NFKD with the accents dropped, ’ → ', a trailing
 *            's dropped, split on anything that isn't a letter or digit,
 *            stopwords removed, then a six-rule suffix stemmer applied the
 *            same way to the index and to the question
 *   score    BM25, k1 = 1.2, b = 0.75, over a passage's heading and words
 *            (an FAQ answer is scored with its question)
 *   confidence
 *            the score divided by the best score the question could reach,
 *            Σ idf(t)·(k1+1) over its terms. A term the site never uses
 *            still counts in that ceiling (its df is 0, so its idf is the
 *            largest there is), which is what makes a question about
 *            something we don't do score low. That's the abstain.
 *   gate     passages under the confidence floor are never quoted
 *   answer   1 to 3 passages from different sections, quoted verbatim, up
 *            to 320 characters, cut at a sentence end
 *
 * A question that asks two things at once ("…, and who owns the code?")
 * is split into its parts first, and each part is scored on its own terms.
 * Otherwise each half would be judged against the other half's words and
 * neither could clear the floor. The QUERY stage shows the split.
 */

export const K1 = 1.2;
export const B = 0.75;
/** The default confidence floor, and the slider's range and step. */
export const FLOOR = 0.35;
export const FLOOR_MIN = 0.15;
export const FLOOR_MAX = 0.75;
export const FLOOR_STEP = 0.05;
/** Passages shown in the RETRIEVE stage. */
export const TOP = 8;
/** Passages quoted in an answer, at most. */
export const MAX_ANSWERS = 3;
/** Longest quote, in characters. */
export const MAX_QUOTE = 320;
/** Parts a compound question is split into, at most. */
export const MAX_PARTS = 3;

/* ── Tokens ─────────────────────────────────────────────────────────── */

/** About a hundred function words. "own" is deliberately NOT here (most
 *  lists have it): "who owns the code" is a question this site answers.
 *
 *  The list is data, and it travels with the index: buildIndex() writes it
 *  into /search-index.json and createEngine() reads it back from there, so
 *  the browser never ships a second copy in its script, and an index is
 *  always searched with the stopwords it was built with. */
export const STOPWORDS =
  'a about above after again all also am an and any are as at be because been before being below between both ' +
  'but by can could d did didn do does doesn doing don done down during each either else ever for from get gets ' +
  'got had has have having he her here him his how i if in into is isn it its itself just let ll m may me might ' +
  'more most much must my no nor not now of off on once only onto or other our ours out over per re s same she ' +
  'should so some such t than that the their theirs them then there these they this those through to too under ' +
  'until up us ve very via was we were what when where which while who whom whose why will with won would yes ' +
  'yet you your yours';

/** Lowercase, decompose and drop accents, drop a trailing 's (with any
 *  apostrophe: ’ counts as '). Everything the stemmer sees has been
 *  through this. Other apostrophes split words like any punctuation. */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['’‘ʼ]s\b/g, '');
}

/** The six rules, in order. 1–4 are alternatives (the first that applies
 *  wins); 5 and 6 then apply in turn. Lengths are of the word at that
 *  step. Crude on purpose: "code" becomes "cod", and that's fine, because
 *  the index went through exactly the same rules. */
export function stem(w: string): string {
  if (w.length > 4 && w.endsWith('ies')) w = w.slice(0, -3) + 'y';
  else if (w.length > 5 && w.endsWith('ing')) w = w.slice(0, -3);
  else if (w.length > 4 && w.endsWith('ed')) w = w.slice(0, -2);
  else if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) w = w.slice(0, -1);
  if (w.length > 5 && w.endsWith('ly')) w = w.slice(0, -2);
  if (w.length > 3 && w.endsWith('e')) w = w.slice(0, -1);
  return w;
}

/** One word of the question, as the QUERY stage shows it. */
export type Tok = {
  /** The word after normalizing. */
  word: string;
  /** Its stem, or null when it's a stopword. */
  term: string | null;
};

/** A stopword list, as a set. */
export type Stop = ReadonlySet<string>;

/** Every word, stopwords included, for the trace. */
export function tokenize(s: string, stop: Stop): Tok[] {
  const out: Tok[] = [];
  for (const word of normalize(s).split(/[^a-z0-9]+/)) {
    if (!word) continue;
    out.push({ word, term: stop.has(word) ? null : stem(word) });
  }
  return out;
}

/** Just the terms, in order, duplicates kept: what gets indexed. */
export function terms(s: string, stop: Stop): string[] {
  const out: string[] = [];
  for (const t of tokenize(s, stop)) if (t.term) out.push(t.term);
  return out;
}

/* ── Compound questions ─────────────────────────────────────────────── */

/** Words that start a new question after "and" / "also" / "plus". */
const ASKS =
  'who|whom|whose|what|when|where|why|how|which|do|does|did|can|could|is|are|was|were|will|would|should|have|has';
const SPLIT = new RegExp(`[?;]+|,?\\s+(?:and|also|plus)\\s+(?=(?:${ASKS})\\b)`, 'i');

/** "Do you build iOS apps, and who owns the code?" → its two questions.
 *  A part with no terms of its own is folded into the one before it. */
export function parts(q: string, stop: Stop): string[] {
  const raw = q.split(SPLIT).map((s) => s.trim()).filter(Boolean);
  const out: string[] = [];
  for (const p of raw) {
    if (out.length && (!terms(p, stop).length || out.length >= MAX_PARTS)) out[out.length - 1] += ' ' + p;
    else out.push(p);
  }
  return out.length ? out : [q.trim()];
}

/* ── The index ──────────────────────────────────────────────────────── */

/** One quotable passage. */
export type Passage = {
  /** Its position in the index. */
  id: number;
  /** The page it's on: '/services/seo/'. */
  route: string;
  /** The nearest id at or before it on that page, for the citation link. */
  anchor: string;
  /** The heading it sits under: its section's h1 or h2, or for an FAQ
   *  answer, its question. */
  heading: string;
  /** The words, verbatim. */
  text: string;
  /** Its top-level section, when that isn't `anchor`. Answers quote at
   *  most one passage per section. */
  sec?: string;
};

/**
 * /search-index.json. Each passage is stored as {route, anchor, heading,
 * text}, with `heading` left out when it's the same as the passage before
 * it. Passage ids are their positions. Term statistics (df) and postings
 * are derived on load from the text, by the same tokenizer that wrote
 * N and avgdl here; createEngine() recomputes both and refuses to answer
 * if they disagree with the file. (df isn't stored: at about 4 kB gz it
 * would only repeat what the text already says, and the index has a
 * 22 kB budget.)
 */
export type IndexFile = {
  v: 1;
  /** Passages in the corpus. */
  N: number;
  /** Their average length, in terms (heading included). */
  avgdl: number;
  /** The stopwords it was built with, space-separated. */
  stop: string;
  passages: { route: string; anchor: string; heading?: string; text: string; sec?: string }[];
};

/**
 * What gets scored for a passage: its heading, then its words. An FAQ
 * answer ("Yes. Native iOS and Android from one codebase…") only makes
 * sense with its question ("Do you build mobile apps?"). Only `text` is
 * ever quoted.
 */
export const docOf = (p: { heading?: string; text: string }): string =>
  p.heading ? `${p.heading} ${p.text}` : p.text;

const avg = (total: number, n: number) => (n ? Math.round((total / n) * 1e4) / 1e4 : 0);

/** Build the index file from passages in reading order. */
export function buildIndex(list: Omit<Passage, 'id'>[]): IndexFile {
  const stop: Stop = new Set(STOPWORDS.split(' '));
  let total = 0;
  let prev = '';
  const passages = list.map((p) => {
    total += terms(docOf(p), stop).length;
    const out: IndexFile['passages'][number] = { route: p.route, anchor: p.anchor, text: p.text };
    if (p.heading !== prev) out.heading = p.heading;
    if (p.sec) out.sec = p.sec;
    prev = p.heading;
    return out;
  });
  return { v: 1, N: passages.length, avgdl: avg(total, passages.length), stop: STOPWORDS, passages };
}

/** Postings and term statistics, built once from the file. */
export type Engine = {
  passages: Passage[];
  N: number;
  avgdl: number;
  /** term → [[passage id, term frequency], …]. A term's df is its length. */
  post: Map<string, [number, number][]>;
  /** The stopwords the index was built with. */
  stop: Stop;
  /** passage id → length in terms */
  dl: number[];
  /** The file's N and avgdl match what this code computes from its text.
   *  When they don't, the index was built by different code and its
   *  scores can't be trusted: the panel won't search it (it falls back to
   *  the build's answers) and the build stops. */
  ok: boolean;
};

export function createEngine(file: IndexFile): Engine {
  const stop: Stop = new Set((file.stop || '').split(' '));
  const post = new Map<string, [number, number][]>();
  const dl: number[] = [];
  const passages: Passage[] = [];
  let heading = '';
  let total = 0;
  file.passages.forEach((s, id) => {
    if (s.heading !== undefined) heading = s.heading;
    const p = { ...s, id, heading };
    passages.push(p);
    const ts = terms(docOf(p), stop);
    dl[id] = ts.length;
    total += ts.length;
    const tf = new Map<string, number>();
    for (const t of ts) tf.set(t, (tf.get(t) ?? 0) + 1);
    for (const [t, n] of tf) {
      let list = post.get(t);
      if (!list) post.set(t, (list = []));
      list.push([id, n]);
    }
  });
  const N = passages.length;
  const avgdl = avg(total, N);
  const ok = file.v === 1 && stop.size > 1 && file.N === N && Math.abs(file.avgdl - avgdl) < 1e-3;
  return { passages, N, avgdl, post, dl, stop, ok };
}

export const dfOf = (e: Engine, term: string): number => e.post.get(term)?.length ?? 0;

/** BM25's idf, in the form that never goes negative. A term with df 0 gets
 *  the largest idf there is. */
export function idf(df: number, N: number): number {
  return Math.log(1 + (N - df + 0.5) / (df + 0.5));
}

/** One passage per section per answer. */
export const sectionOf = (p: Passage): string => `${p.route}#${p.sec ?? p.anchor}`;

/* ── Search ─────────────────────────────────────────────────────────── */

export type Term = { term: string; df: number; idf: number };

export type Part = {
  text: string;
  toks: Tok[];
  /** Its distinct terms. */
  terms: Term[];
  /** The best score this part could reach: Σ idf·(k1+1). */
  ceiling: number;
};

export type Hit = {
  p: Passage;
  /** Raw BM25 against the part it matched best. */
  score: number;
  /** score ÷ that part's ceiling, 0 to 1. */
  conf: number;
  /** Which part of the question it answers (0 for a single question). */
  part: number;
  /** The query terms it contains. */
  matched: string[];
};

export type Search = {
  parts: Part[];
  /** Every passage that shares a term with the question, best first. */
  hits: Hit[];
};

export function search(e: Engine, query: string): Search {
  const ps: Part[] = parts(query, e.stop).map((text) => {
    const toks = tokenize(text, e.stop);
    const seen = new Set<string>();
    const ts: Term[] = [];
    for (const t of toks) {
      if (!t.term || seen.has(t.term)) continue;
      seen.add(t.term);
      const d = dfOf(e, t.term);
      ts.push({ term: t.term, df: d, idf: idf(d, e.N) });
    }
    return { text, toks, terms: ts, ceiling: ts.reduce((s, t) => s + t.idf * (K1 + 1), 0) };
  });

  const best = new Map<number, Hit>();
  ps.forEach((part, pi) => {
    if (!part.ceiling) return;
    const acc = new Map<number, { score: number; matched: string[] }>();
    for (const t of part.terms) {
      for (const [id, tf] of e.post.get(t.term) ?? []) {
        const norm = K1 * (1 - B + (B * e.dl[id]) / (e.avgdl || 1));
        const a = acc.get(id) ?? { score: 0, matched: [] };
        a.score += (t.idf * tf * (K1 + 1)) / (tf + norm);
        a.matched.push(t.term);
        acc.set(id, a);
      }
    }
    for (const [id, a] of acc) {
      const conf = a.score / part.ceiling;
      const prev = best.get(id);
      if (!prev || conf > prev.conf) {
        best.set(id, { p: e.passages[id], score: a.score, conf, part: pi, matched: a.matched });
      }
    }
  });

  const hits = [...best.values()].sort((a, b) => b.conf - a.conf || a.p.id - b.p.id);
  return { parts: ps, hits };
}

/* ── Gate and answer ────────────────────────────────────────────────── */

export type Answer = {
  /** Hits at or above the floor, best first. */
  above: Hit[];
  /** What gets quoted: at most MAX_ANSWERS, one per section, and each
   *  part of a compound question served before any part gets a second. */
  cited: Hit[];
  /** The best confidence, answered or not. */
  best: number;
};

/** Floors are compared at the precision they're shown at, so a passage
 *  printed as 0.35 is never refused by a floor printed as 0.35. */
const at2 = (n: number) => Math.round(n * 100);

export function gate(s: Search, floor = FLOOR): Answer {
  const above = s.hits.filter((h) => at2(h.conf) >= at2(floor));
  const cited: Hit[] = [];
  const used = new Set<string>();
  const take = (h: Hit) => {
    const k = sectionOf(h.p);
    if (cited.length >= MAX_ANSWERS || used.has(k)) return;
    used.add(k);
    cited.push(h);
  };
  for (let pi = 0; pi < s.parts.length; pi++) {
    const h = above.find((x) => x.part === pi && !used.has(sectionOf(x.p)));
    if (h) take(h);
  }
  for (const h of above) if (!cited.includes(h)) take(h);
  cited.sort((a, b) => a.part - b.part || b.conf - a.conf);
  return { above, cited, best: s.hits[0]?.conf ?? 0 };
}

/** What a "Break the input" chip promises. */
export type Expect = 'answer' | 'abstain' | 'answer-2';

/** Did the answer do what was promised? `answer-2` means at least two
 *  passages, which gate() guarantees are from two sections (the build's
 *  evaluation checks that separately). The build's evaluation and the
 *  live verdicts both use this, so they can't disagree about what passing
 *  means. */
export const meets = (expect: Expect, a: Answer): boolean =>
  expect === 'abstain' ? !a.cited.length : a.cited.length >= (expect === 'answer-2' ? 2 : 1);

/** The whole pipeline: search, then gate. */
export function run(e: Engine, query: string, floor = FLOOR): { search: Search; answer: Answer } {
  const s = search(e, query);
  return { search: s, answer: gate(s, floor) };
}

/* ── Quoting ────────────────────────────────────────────────────────── */

export type Quote = {
  text: string;
  /** Sentences were left out before / after the quote. */
  before: boolean;
  after: boolean;
};

/** Sentences, verbatim. */
export function sentences(text: string): string[] {
  return text.split(/(?<=[.!?…][’”"')\]]?)\s+(?=[A-Z0-9“‘"'(])/).filter(Boolean);
}

/**
 * The passage, verbatim, up to MAX_QUOTE characters and cut at a sentence
 * end. When it's longer, the quote starts from the sentence holding the
 * most matched terms (the earliest, on a tie), so the sentence that
 * matched is the one you read, then takes the sentences after it, then
 * the ones before, while they fit. A single sentence longer than the
 * limit is cut at a word and marked as cut. `stop` is the engine's list.
 */
export function quote(text: string, matched: readonly string[], stop: Stop, max = MAX_QUOTE): Quote {
  if (text.length <= max) return { text, before: false, after: false };
  const ss = sentences(text);
  const want = new Set(matched);
  let i = 0;
  let most = -1;
  ss.forEach((s, k) => {
    const w = terms(s, stop).filter((t) => want.has(t)).length;
    if (w > most) [most, i] = [w, k];
  });
  let j = i;
  let len = ss[i].length;
  if (len > max) return { text: `${ss[i].slice(0, max - 1).replace(/\s+\S*$/, '')}…`, before: i > 0, after: true };
  while (j + 1 < ss.length && len + ss[j + 1].length < max) len += ss[++j].length + 1;
  while (i > 0 && len + ss[i - 1].length < max) len += ss[--i].length + 1;
  return { text: ss.slice(i, j + 1).join(' '), before: i > 0, after: j < ss.length - 1 };
}

/** A confidence or floor, the way every readout prints it (and the way
 *  the gate compares them). */
export const fmt = (n: number): string => (at2(n) / 100).toFixed(2);
