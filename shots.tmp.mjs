import { chromium } from 'playwright-core';
import { globSync } from 'node:fs';
const CHROME = globSync('/opt/pw-browsers/chromium-*/chrome-linux/chrome')[0];
const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox','--autoplay-policy=no-user-gesture-required'] });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
const targets = process.argv.slice(2);
for (const t of targets) {
  const [url, sel, name] = t.split('|');
  await p.goto('http://localhost:4173' + url, { waitUntil: 'networkidle' });
  await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await p.waitForTimeout(600);
  await p.evaluate(() => window.scrollTo(0, 0));
  await p.waitForTimeout(400);
  if (sel === 'viewport') {
    await p.waitForTimeout(1500);
    await p.screenshot({ path: `artifacts/${name}.png` });
  } else {
    const el = await p.$(sel);
    if (!el) { console.log('missing', sel); continue; }
    await el.scrollIntoViewIfNeeded();
    await p.waitForTimeout(1600);
    await el.screenshot({ path: `artifacts/${name}.png` });
  }
  console.log('shot', name);
}
await b.close();
