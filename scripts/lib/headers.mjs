/**
 * Writes Netlify's dist/_headers file, one block per path.
 *
 *   addHeaders('/index.md', {
 *     'Content-Type': 'text/markdown; charset=utf-8',
 *     Link: '<https://adjltechnology.com/>; rel="canonical"',
 *   });
 *
 * Netlify applies _headers on top of the [[headers]] in netlify.toml, which
 * is where the per-file rules belong: netlify.toml can't know the list of
 * markdown twins or source sheets, and the build can. Several generators
 * write here (gen-machine, gen-llms, gen-report), so every call reads the
 * file, merges, and writes it back. Calling it twice with the same path
 * replaces that path's values instead of adding a duplicate block, so a
 * re-run of one generator can't double a header.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

export const HEADERS_FILE = 'dist/_headers';

/** Parse _headers into ordered blocks: [{ path, headers: [[name, value]] }]. */
export function readHeaders(file = HEADERS_FILE) {
  const blocks = [];
  if (!existsSync(file)) return blocks;
  let block = null;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    if (!/^\s/.test(line)) {
      block = { path: line.trim(), headers: [] };
      blocks.push(block);
      continue;
    }
    const m = /^\s+([^:]+):\s*(.*)$/.exec(line);
    if (m && block) block.headers.push([m[1].trim(), m[2].trim()]);
  }
  return blocks;
}

function write(blocks, file) {
  const body = blocks
    .map((b) => [b.path, ...b.headers.map(([k, v]) => `  ${k}: ${v}`)].join('\n'))
    .join('\n\n');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, body + '\n');
}

/** Set headers for one path pattern, merging with what's already there.
 *  A header already set for that path is replaced (names compare without
 *  case); new ones are appended. */
export function addHeaders(path, headers, file = HEADERS_FILE) {
  if (!path.startsWith('/')) throw new Error(`addHeaders: "${path}" must start with /`);
  const blocks = readHeaders(file);
  let block = blocks.find((b) => b.path === path);
  if (!block) blocks.push((block = { path, headers: [] }));
  for (const [name, value] of Object.entries(headers)) {
    if (/[\r\n]/.test(String(value))) throw new Error(`addHeaders: ${name} for ${path} contains a newline`);
    const i = block.headers.findIndex(([k]) => k.toLowerCase() === name.toLowerCase());
    if (i >= 0) block.headers[i] = [name, String(value)];
    else block.headers.push([name, String(value)]);
  }
  write(blocks, file);
}
