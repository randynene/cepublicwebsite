// scripts/design/probe-container-styles.mjs
// Step 2.15 / HALT 8 — E3 Container probe (Hard Rule #2).
//
// Goals:
//   1. Distinct container max-width values per breakpoint
//   2. Horizontal padding cascade per breakpoint
//   3. Centering pattern (margin: 0 auto vs flex)
//   4. Grid patterns: how many distinct col-counts? asymmetric splits?
//   5. Container variant inventory: full-bleed / default / narrow / wide

import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const PAGES = [
  'https://cloudemployee.io/',
  'https://cloudemployee.io/services',
  'https://cloudemployee.io/technology',
  'https://cloudemployee.io/customer-stories',
  'https://cloudemployee.io/ai-in-software-development/securing-ai-the-ctos-guide-to-validation-and-minimum-safety-standards',
];

const VIEWPORTS = [
  { name: 'mobile',  width: 375,  height: 812 },
  { name: 'tablet',  width: 768,  height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'wide',    width: 1920, height: 1080 },
];

async function probe(p) {
  return p.evaluate(() => {
    const out = { containers: [], grids: [] };

    // 1. Likely container elements: top-level direct children of <main> or
    //    elements with container-suggesting classes
    const candidates = document.querySelectorAll(
      '.container, .w-container, [class*="container"], [class*="wrapper"], main > *, main > section > *',
    );

    const seen = new Set();
    candidates.forEach((el) => {
      if (seen.has(el)) return;
      const cs = getComputedStyle(el);
      const maxWidth = parseFloat(cs.maxWidth) || 0;
      const padLeft = parseFloat(cs.paddingLeft) || 0;
      const padRight = parseFloat(cs.paddingRight) || 0;
      const marginLeft = cs.marginLeft;
      const marginRight = cs.marginRight;
      const isCentered = marginLeft === marginRight && /auto/.test(marginLeft);
      const rect = el.getBoundingClientRect();

      // Filter: non-zero max-width OR centered horizontal margins (likely a container)
      if (maxWidth === 0 && !isCentered) return;
      // Skip tiny elements (badges, buttons mistakenly captured)
      if (rect.width < 200) return;
      if (rect.height < 50) return;
      seen.add(el);

      out.containers.push({
        tag: el.tagName.toLowerCase(),
        classes: typeof el.className === 'string' ? el.className.slice(0, 120) : '',
        renderedWidth: Math.round(rect.width),
        maxWidth: maxWidth || null,
        paddingLeft: padLeft,
        paddingRight: padRight,
        isCentered,
        display: cs.display,
      });
    });

    // 2. Grids — capture grid-template-columns patterns
    document.querySelectorAll('[style*="grid-template-columns"], .w-layout-grid, [class*="grid-"]').forEach((el) => {
      const cs = getComputedStyle(el);
      if (cs.display !== 'grid') return;
      const cols = cs.gridTemplateColumns;
      if (!cols || cols === 'none') return;
      const colCount = cols.split(/\s+/).length;
      const rect = el.getBoundingClientRect();
      out.grids.push({
        tag: el.tagName.toLowerCase(),
        classes: typeof el.className === 'string' ? el.className.slice(0, 100) : '',
        gridTemplateColumns: cols.slice(0, 100),
        colCount,
        gap: cs.gap,
        rowGap: cs.rowGap,
        columnGap: cs.columnGap,
        renderedWidth: Math.round(rect.width),
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
      aggregate[slug] = {};
      console.log(`\n=== ${slug} ===`);
      for (const vp of VIEWPORTS) {
        const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
        const p = await ctx.newPage();
        try { await p.goto(url, { waitUntil: 'networkidle', timeout: 60_000 }); }
        catch { await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 }); }
        await p.waitForTimeout(800);
        const data = await probe(p);
        aggregate[slug][vp.name] = data;
        console.log(`  [${vp.name} ${vp.width}px] containers=${data.containers.length} grids=${data.grids.length}`);
        await ctx.close();
      }
    }
  } finally {
    await browser.close();
  }

  // Aggregate distinct container max-widths per viewport
  console.log('\n=== CONTAINER MAX-WIDTH DISTRIBUTION (per viewport) ===');
  for (const vp of VIEWPORTS) {
    console.log(`\n--- viewport ${vp.name} (${vp.width}px) ---`);
    const sigs = new Map();
    for (const slug of Object.keys(aggregate)) {
      for (const c of aggregate[slug][vp.name].containers) {
        const sig = `maxW=${c.maxWidth ?? 'none'} | px=${c.paddingLeft}/${c.paddingRight} | centered=${c.isCentered}`;
        if (!sigs.has(sig)) sigs.set(sig, { count: 0, samples: [], classes: new Set() });
        const g = sigs.get(sig);
        g.count++;
        if (g.samples.length < 2) g.samples.push({ slug, classes: c.classes.slice(0, 50), renderedWidth: c.renderedWidth });
        const firstClass = c.classes.split(/\s+/).filter(Boolean)[0] || '(no-class)';
        g.classes.add(firstClass);
      }
    }
    for (const [sig, g] of [...sigs.entries()].sort((a, b) => b[1].count - a[1].count)) {
      if (g.count < 2) continue; // filter one-offs
      console.log(`  [${g.count}×] ${sig}`);
      console.log(`     class-tokens: ${[...g.classes].slice(0, 6).join(', ')}`);
      g.samples.forEach(s => console.log(`     [${s.slug}] "${s.classes}" rendered=${s.renderedWidth}px`));
    }
  }

  // Grid patterns
  console.log('\n=== GRID COL-COUNT DISTRIBUTION (desktop) ===');
  const colCounts = new Map();
  for (const slug of Object.keys(aggregate)) {
    for (const g of aggregate[slug].desktop.grids) {
      const key = `cols=${g.colCount} | template=${g.gridTemplateColumns.slice(0, 60)}`;
      if (!colCounts.has(key)) colCounts.set(key, { count: 0, classes: new Set(), gaps: new Set() });
      const m = colCounts.get(key);
      m.count++;
      const firstClass = g.classes.split(/\s+/).filter(Boolean)[0] || '(no-class)';
      m.classes.add(firstClass);
      m.gaps.add(g.gap);
    }
  }
  for (const [key, m] of [...colCounts.entries()].sort((a, b) => b[1].count - a[1].count)) {
    console.log(`  [${m.count}×] ${key}`);
    console.log(`     classes: ${[...m.classes].slice(0, 5).join(', ')}`);
    console.log(`     gap: ${[...m.gaps].slice(0, 3).join(' | ')}`);
  }

  await fs.mkdir('audit-output/design-1', { recursive: true });
  await fs.writeFile('audit-output/design-1/container-styles-probe.json', JSON.stringify(aggregate, null, 2));
  console.log('\nWrote audit-output/design-1/container-styles-probe.json');
}

main().catch((err) => { console.error(err); process.exit(1); });
