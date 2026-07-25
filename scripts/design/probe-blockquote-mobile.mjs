// scripts/design/probe-blockquote-mobile.mjs
// Correction 1 + 2 — focused probe of CE blockquote at mobile (375px) +
// pseudo-element parity check (::after close-quote).

import { chromium } from 'playwright';

const URL = 'https://cloudemployee.io/ai-in-software-development/why-staff-augmentation-matters-in-the-age-of-ai';
const VIEWPORTS = [
  { name: 'mobile',  width: 375,  height: 812 },
  { name: 'tablet',  width: 768,  height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
];

async function main() {
  const browser = await chromium.launch({ headless: true });
  const all = [];
  try {
    for (const vp of VIEWPORTS) {
      const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const p = await ctx.newPage();
      try { await p.goto(URL, { waitUntil: 'networkidle', timeout: 60_000 }); }
      catch { await p.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60_000 }); }
      await p.waitForTimeout(1200);
      const data = await p.evaluate(() => {
        const out = [];
        document.querySelectorAll('blockquote').forEach((el) => {
          const cs = getComputedStyle(el);
          const before = getComputedStyle(el, '::before');
          const after = getComputedStyle(el, '::after');
          out.push({
            // Spacing
            padding: [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].join(' '),
            margin: [cs.marginTop, cs.marginRight, cs.marginBottom, cs.marginLeft].join(' '),
            // Typography
            fontSize: cs.fontSize,
            lineHeight: cs.lineHeight,
            lineHeightRatio: (parseFloat(cs.lineHeight) / parseFloat(cs.fontSize)).toFixed(3),
            // Pseudo content
            beforeContent: before.content,
            beforeFontSize: before.fontSize,
            beforePosition: before.position,
            afterContent: after.content,
            afterFontSize: after.fontSize,
            afterPosition: after.position,
          });
        });
        return out;
      });
      data.forEach((q) => all.push({ vp: vp.name, vpWidth: vp.width, ...q }));
      await ctx.close();
    }
  } finally {
    await browser.close();
  }

  console.log('=== CE BLOCKQUOTE — responsive padding + pseudo-element parity ===\n');
  all.forEach((q) => {
    console.log(`[${q.vp} ${q.vpWidth}px]`);
    console.log(`  padding=${q.padding}`);
    console.log(`  margin=${q.margin}`);
    console.log(`  fontSize=${q.fontSize}  lineHeight=${q.lineHeight}  ratio=${q.lineHeightRatio}`);
    console.log(`  ::before content=${q.beforeContent}  size=${q.beforeFontSize}`);
    console.log(`  ::after  content=${q.afterContent}  size=${q.afterFontSize}`);
    console.log();
  });
}

main().catch((err) => { console.error(err); process.exit(1); });
