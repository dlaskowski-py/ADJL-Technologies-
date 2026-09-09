import { chromium } from 'playwright-core';
import { globSync, writeFileSync } from 'node:fs';
const CHROME = globSync('/opt/pw-browsers/chromium-*/chrome-linux/chrome')[0];
const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox','--autoplay-policy=no-user-gesture-required'] });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
await p.goto('http://localhost:4173/work/trading-infrastructure/', { waitUntil: 'networkidle' });
await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await p.waitForTimeout(900);
await p.evaluate(() => window.scrollTo(0, 0));
await p.waitForTimeout(700);

const info = await p.evaluate(() => {
  const ems = Array.from(document.querySelectorAll('em'));
  const t = ems.find(e => e.textContent.includes('breaking'));
  if (!t) return { err: 'not found', all: ems.map(e=>e.textContent) };
  const sec = t.closest('section');
  t.scrollIntoView({ block: 'center', behavior: 'instant' });
  t.style.visibility = 'hidden';
  const r = t.getBoundingClientRect();
  return {
    section: sec.className, secId: sec.id,
    fontSize: getComputedStyle(t).fontSize,
    color: getComputedStyle(t).color,
    rect: { x: r.x, y: r.y, w: r.width, h: r.height },
    hasBackdrop: !!sec.querySelector(':scope > .backdrop'),
    video: sec.querySelector('video')?.currentSrc ?? 'none',
  };
});
console.log(JSON.stringify(info, null, 2));
if (!info.err) {
  await p.waitForTimeout(300);
  const clip = { x: Math.max(0,Math.floor(info.rect.x)), y: Math.max(0,Math.floor(info.rect.y)), width: Math.floor(info.rect.w), height: Math.floor(info.rect.h) };
  writeFileSync('artifacts/dbg-clip2.png', await p.screenshot({ clip }));
  // wider context
  writeFileSync('artifacts/dbg-ctx.png', await p.screenshot({ clip: { x:0, y:Math.max(0,Math.floor(info.rect.y)-120), width:1440, height:340 } }));
  console.log('saved clips');
}
await b.close();
