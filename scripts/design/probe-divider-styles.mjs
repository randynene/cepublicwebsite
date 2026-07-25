// scripts/design/probe-divider-styles.mjs
// Step 2.16 — E4 Divider probe (Hard Rule #2).
//
// Goals:
//   1. Find <hr> elements + styled <div> dividers across 5 pages
//   2. Capture color, weight, opacity, orientation
//   3. Identify distinct variants
//   4. Confirm single-pattern OR surface multiple-variant inventory

import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const PAGES = [
  'https://cloudemployee.io/',
  'https://cloudemployee.io/services',
  'https://cloudemployee.io/technology',
  'https://cloudemployee.io/customer-stories',
  'https://cloudemployee.io/ai-in-software-development/securing-ai-the-ctos-guide-to-validation-and-minimum-safety-standards',
];

async function probe(p) {
  return p.evaluate(() => {
    const out = { hrs: [], divDividers: [] };

    // 1. Native <hr>
    document.querySelectorAll('hr').forEach((el) => {
      const cs = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      out.hrs.push({
        classes: typeof el.className === 'string' ? el.className : '',
        renderedWidth: Math.round(rect.width),
        renderedHeight: Math.round(rect.height),
        // border / outline / background-color combinations
        borderTop: `${cs.borderTopWidth} ${cs.borderTopStyle} ${cs.borderTopColor}`,
        borderBottom: `${cs.borderBottomWidth} ${cs.borderBottomStyle} ${cs.borderBottomColor}`,
        backgroundColor: cs.backgroundColor,
        height: cs.height,
        width: cs.width,
        margin: [cs.marginTop, cs.marginRight, cs.marginBottom, cs.marginLeft].join(' '),
        opacity: cs.opacity,
      });
    });

    // 2. Div dividers — common Webflow patterns
    document.querySelectorAll('.divider, [class*="divider"], [class*="separator"], [role="separator"]').forEach((el) => {
      const cs = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      // skip elements that are obviously not dividers (large containers etc.)
      if (rect.width < 20 && rect.height < 20) return;
      // a divider should be either thin-and-wide (horizontal) or tall-and-thin (vertical)
      const isHorizontal = rect.width > 50 && rect.height < 10;
      const isVertical = rect.height > 50 && rect.width < 10;
      if (!isHorizontal && !isVertical) return;
      out.divDividers.push({
        tag: el.tagName.toLowerCase(),
        classes: typeof el.className === 'string' ? el.className.slice(0, 100) : '',
        orientation: isHorizontal ? 'horizontal' : 'vertical',
        renderedWidth: Math.round(rect.width),
        renderedHeight: Math.round(rect.height),
        backgroundColor: cs.backgroundColor,
        borderTop: `${cs.borderTopWidth} ${cs.borderTopStyle} ${cs.borderTopColor}`,
        borderLeft: `${cs.borderLeftWidth} ${cs.borderLeftStyle} ${cs.borderLeftColor}`,
        margin: [cs.marginTop, cs.marginRight, cs.marginBottom, cs.marginLeft].join(' '),
        opacity: cs.opacity,
      });
    });

    return out;
  });
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const aggregate = {};
  try {
    for (const url of PAGES) {
      const slug = url.split('cloudemployee.io')[1] || '/';
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const p = await ctx.newPage();
      try { await p.goto(url, { waitUntil: 'networkidle', timeout: 60_000 }); }
      catch { await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 }); }
      await p.waitForTimeout(800);
      const data = await probe(p);
      aggregate[slug] = data;
      console.log(`[${slug}] hrs=${data.hrs.length} div-dividers=${data.divDividers.length}`);
      await ctx.close();
    }
  } finally {
    await browser.close();
  }

  console.log('\n=== <hr> ELEMENTS (aggregate) ===');
  let totalHr = 0;
  const hrSigs = new Map();
  for (const slug of Object.keys(aggregate)) {
    for (const h of aggregate[slug].hrs) {
      totalHr++;
      const sig = `border=${h.borderTop} | bg=${h.backgroundColor} | h=${h.height} | opacity=${h.opacity}`;
      if (!hrSigs.has(sig)) hrSigs.set(sig, { count: 0, samples: [] });
      const g = hrSigs.get(sig);
      g.count++;
      if (g.samples.length < 2) g.samples.push({ slug, classes: h.classes });
    }
  }
  console.log(`Total <hr>: ${totalHr}`);
  for (const [sig, g] of [...hrSigs.entries()].sort((a, b) => b[1].count - a[1].count)) {
    console.log(`\n  [${g.count}×] ${sig}`);
    g.samples.forEach((s) => console.log(`     [${s.slug}] class="${s.classes}"`));
  }

  console.log('\n=== DIV / SPAN DIVIDERS (aggregate) ===');
  let totalDiv = 0;
  const divSigs = new Map();
  for (const slug of Object.keys(aggregate)) {
    for (const d of aggregate[slug].divDividers) {
      totalDiv++;
      const sig = `${d.orientation} | bg=${d.backgroundColor} | border=${d.borderTop} | opacity=${d.opacity}`;
      if (!divSigs.has(sig)) divSigs.set(sig, { count: 0, samples: [], classGroups: new Set() });
      const g = divSigs.get(sig);
      g.count++;
      if (g.samples.length < 2) g.samples.push({ slug, classes: d.classes, w: d.renderedWidth, h: d.renderedHeight });
      const firstClass = d.classes.split(/\s+/).filter(Boolean)[0] || '(no-class)';
      g.classGroups.add(firstClass);
    }
  }
  console.log(`Total div/span dividers: ${totalDiv}`);
  for (const [sig, g] of [...divSigs.entries()].sort((a, b) => b[1].count - a[1].count)) {
    console.log(`\n  [${g.count}×] ${sig}`);
    console.log(`     classes: ${[...g.classGroups].slice(0, 5).join(', ')}`);
    g.samples.forEach((s) => console.log(`     [${s.slug}] "${s.classes.slice(0,60)}" ${s.w}×${s.h}`));
  }

  await fs.mkdir('audit-output/design-1', { recursive: true });
  await fs.writeFile('audit-output/design-1/divider-styles-probe.json', JSON.stringify(aggregate, null, 2));
  console.log('\nWrote audit-output/design-1/divider-styles-probe.json');
}

main().catch((err) => { console.error(err); process.exit(1); });
