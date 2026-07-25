// scripts/design/diagnostic-3-gap-probes.mjs
// HALT 4 final-pass gap probes:
//   Gap 1 — Footer text actual computed color (the structural-selector
//           extraction captured the parent <footer>'s color, not the
//           text-bearing children inside it).
//   Gap 3 — Container max-width — CE's content-width discipline.

import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const PAGES = [
  { url: 'https://cloudemployee.io/',           slug: 'home' },
  { url: 'https://cloudemployee.io/about-us',   slug: 'about' },
  { url: 'https://cloudemployee.io/technology', slug: 'technology' },
  { url: 'https://cloudemployee.io/services',   slug: 'services' },
  { url: 'https://cloudemployee.io/blog',       slug: 'blog' },
];

// WCAG contrast ratio calculator
function relativeLuminance(rgb) {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function parseRgb(str) {
  const m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  return m ? [+m[1], +m[2], +m[3]] : null;
}
function contrastRatio(c1, c2) {
  const a = parseRgb(c1), b = parseRgb(c2);
  if (!a || !b) return null;
  const L1 = relativeLuminance(a), L2 = relativeLuminance(b);
  const [hi, lo] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (hi + 0.05) / (lo + 0.05);
}

async function probe(p) {
  return p.evaluate(() => {
    // ─── Gap 1: footer text-bearing descendants ───
    const footer = document.querySelector('footer');
    let footerData = null;
    if (footer) {
      const fcs = getComputedStyle(footer);
      const textColors = new Map(); // computed color → array of element samples
      footer.querySelectorAll('*').forEach((el) => {
        const text = Array.from(el.childNodes || []).filter(n => n.nodeType === 3 && (n.textContent || '').trim().length > 0);
        if (text.length === 0) return; // not a text-bearing element directly
        const cs = getComputedStyle(el);
        const color = cs.color;
        const e = textColors.get(color) || { count: 0, samples: [] };
        e.count++;
        if (e.samples.length < 3) {
          e.samples.push({
            tag: el.tagName.toLowerCase(),
            classes: typeof el.className === 'string' ? el.className.slice(0, 60) : '',
            text: text.map(t => t.textContent.trim()).join(' ').slice(0, 50),
            fontSize: cs.fontSize,
            fontWeight: cs.fontWeight,
          });
        }
        textColors.set(color, e);
      });
      footerData = {
        bg: fcs.backgroundColor,
        parentColor: fcs.color, // what was reported in earlier extraction
        textChildrenColors: [...textColors.entries()].map(([color, e]) => ({ color, count: e.count, samples: e.samples })),
      };
    }

    // ─── Gap 3: container max-width discipline ───
    const candidateSelectors = [
      '.container', '.w-container', '.main-wrapper', '.section',
      'main', '[class*="container"]', '[class*="wrapper"]',
    ];
    const containerData = [];
    const seenSig = new Set();
    for (const sel of candidateSelectors) {
      document.querySelectorAll(sel).forEach((el) => {
        const cs = getComputedStyle(el);
        const sig = (typeof el.className === 'string' ? el.className.slice(0, 80) : '') + '|' + cs.maxWidth + '|' + cs.width;
        if (seenSig.has(sig)) return;
        seenSig.add(sig);
        if (containerData.length < 25) {
          containerData.push({
            selector: sel,
            tag: el.tagName.toLowerCase(),
            classes: typeof el.className === 'string' ? el.className.slice(0, 80) : '',
            maxWidth: cs.maxWidth,
            width: cs.width,
            paddingLeft: cs.paddingLeft,
            paddingRight: cs.paddingRight,
          });
        }
      });
    }

    return { footerData, containerData };
  });
}

async function main() {
  await fs.mkdir(path.resolve('audit-output/design-1'), { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const result = {};
  try {
    for (const page of PAGES) {
      console.log(`\n--- ${page.slug} (${page.url}) ---`);
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const p = await ctx.newPage();
      try {
        await p.goto(page.url, { waitUntil: 'networkidle', timeout: 60_000 });
      } catch {
        await p.goto(page.url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
      }
      await p.waitForTimeout(800);
      result[page.slug] = await probe(p);
      await ctx.close();
    }
  } finally {
    await browser.close();
  }

  await fs.writeFile(
    path.resolve('audit-output/design-1/diagnostic-3-gap-probes.json'),
    JSON.stringify(result, null, 2),
  );

  // ─── Surface Gap 1 ───
  console.log('\n=== GAP 1 — footer text actual computed colors ===');
  for (const slug of Object.keys(result)) {
    const f = result[slug].footerData;
    if (!f) { console.log(`${slug}: no footer found`); continue; }
    console.log(`\n${slug} (footer bg ${f.bg}, parentColor ${f.parentColor}):`);
    for (const tc of f.textChildrenColors) {
      const cr = contrastRatio(tc.color, f.bg);
      const wcag = cr >= 4.5 ? '✓ AA' : cr >= 3 ? '⚠ AA-large' : '✗ FAIL';
      console.log(`  ${tc.color.padEnd(28)} count=${String(tc.count).padStart(3)} contrast=${cr ? cr.toFixed(2) : '?'}:1 ${wcag}`);
      for (const s of tc.samples.slice(0, 2)) {
        console.log(`    <${s.tag} class="${s.classes}"> "${s.text}" ${s.fontSize}/${s.fontWeight}`);
      }
    }
  }

  // ─── Surface Gap 3 ───
  console.log('\n=== GAP 3 — container max-width discipline ===');
  for (const slug of Object.keys(result)) {
    const cs = result[slug].containerData;
    console.log(`\n${slug}:`);
    // Aggregate unique max-width values
    const mwTally = new Map();
    for (const c of cs) {
      if (!c.maxWidth || c.maxWidth === 'none') continue;
      const e = mwTally.get(c.maxWidth) || [];
      e.push(c.classes.slice(0, 40));
      mwTally.set(c.maxWidth, e);
    }
    if (mwTally.size === 0) {
      console.log('  (no max-width on container candidates — full-bleed pattern)');
    } else {
      for (const [mw, classes] of [...mwTally.entries()].sort()) {
        console.log(`  max-width: ${mw.padEnd(12)} count=${classes.length} sample classes: ${[...new Set(classes)].slice(0,3).join(' | ')}`);
      }
    }
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
