// scripts/design/probe-eyebrow-styles.mjs
// Verification 1 — eyebrow text-transform check.
// Probe captured <h5 class="label-bold black/ai/blue"> with line-height 1.50.
// Need to confirm: is eyebrow ALWAYS uppercase on CE? If yes → separate
// Eyebrow primitive. If no → Heading variant.

import { chromium } from 'playwright';

const PAGES = [
  'https://cloudemployee.io/technology',
  'https://cloudemployee.io/services',
];

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const out = [];
  try {
    for (const url of PAGES) {
      const slug = url.split('cloudemployee.io')[1] || '/';
      const p = await ctx.newPage();
      try { await p.goto(url, { waitUntil: 'networkidle', timeout: 60_000 }); }
      catch { await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 }); }
      await p.waitForTimeout(800);
      const data = await p.evaluate(() => {
        const result = [];
        // capture .label-bold first
        document.querySelectorAll('.label-bold, [class*="label-bold"]').forEach((el) => {
          const cs = getComputedStyle(el);
          result.push({
            scope: 'label-bold',
            tag: el.tagName.toLowerCase(),
            classes: typeof el.className === 'string' ? el.className.slice(0, 100) : '',
            text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 50),
            rawTextLooksUpper: /^[^a-z]+$/.test((el.textContent || '').trim()),
            textTransform: cs.textTransform,
            letterSpacing: cs.letterSpacing,
            fontSize: cs.fontSize,
            fontWeight: cs.fontWeight,
            lineHeight: cs.lineHeight,
          });
        });
        // also capture any other 18px h5 instances
        document.querySelectorAll('h5').forEach((el) => {
          const cs = getComputedStyle(el);
          if (parseFloat(cs.fontSize) > 19) return;
          result.push({
            scope: 'h5-small',
            tag: el.tagName.toLowerCase(),
            classes: typeof el.className === 'string' ? el.className.slice(0, 100) : '',
            text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 50),
            rawTextLooksUpper: /^[^a-z]+$/.test((el.textContent || '').trim()),
            textTransform: cs.textTransform,
            letterSpacing: cs.letterSpacing,
            fontSize: cs.fontSize,
            fontWeight: cs.fontWeight,
            lineHeight: cs.lineHeight,
          });
        });
        return result;
      });
      data.forEach((d) => out.push({ slug, ...d }));
      await p.close();
    }
  } finally {
    await browser.close();
  }

  console.log('=== EYEBROW (label-bold + small h5) text-transform probe ===\n');
  out.forEach((e, i) => {
    console.log(`[${i}] [${e.slug}] ${e.scope}`);
    console.log(`    <${e.tag} class="${e.classes}">`);
    console.log(`    text="${e.text}"  rawTextLooksUpper=${e.rawTextLooksUpper}`);
    console.log(`    textTransform="${e.textTransform}"  letterSpacing="${e.letterSpacing}"`);
    console.log(`    fontSize=${e.fontSize}  fontWeight=${e.fontWeight}  lineHeight=${e.lineHeight}`);
    console.log();
  });

  const tt = new Set(out.map((e) => e.textTransform));
  const ls = new Set(out.map((e) => e.letterSpacing));
  console.log(`=== AGGREGATE ===`);
  console.log(`text-transform values: ${[...tt].join(', ')}`);
  console.log(`letter-spacing values: ${[...ls].join(', ')}`);
  console.log(`Texts visually all-caps (raw character check): ${out.filter(e => e.rawTextLooksUpper).length} / ${out.length}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
