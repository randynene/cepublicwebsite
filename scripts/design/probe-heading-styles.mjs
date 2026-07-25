// scripts/design/probe-heading-styles.mjs
// Step 2.6 — B1 Heading probe (HALT 3 first-of-kind: responsive cascade).
//
// Goals (per HALT 3 spec):
//   1. Per <h1>-<h6> element: computed font-size + line-height per breakpoint,
//      font-weight, semantic match (does <h1> match the visual H1?).
//   2. Distribution counts — how many of each tag appear on each page?
//   3. At what viewport width does each font-size step change? (cascade)
//   4. Are there role variants (visual H1 used for non-<h1>, or .heading-h2
//      class on <h3>) suggesting size-decoupled-from-tag?
//
// Sweeps three viewport widths matching CE breakpoints + Step 1 tokens:
//   - 375px (mobile / ≤479) — `--text-h1` (48px) baseline
//   - 768px (tablet  / 480-991) — Step 1 says apply `--text-h*-tablet` via `sm:`
//   - 1440px (desktop / ≥992) — `--text-h*-desktop` via `lg:`
//
// Pages chosen for heading-density: homepage, /technology (h2-rich technology
// listing), /services (service h2/h3), /customer-stories (post titles), and
// a blog post detail (rich-content h2-h4 cascade inside the article).

import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const PAGES = [
  'https://cloudemployee.io/',
  'https://cloudemployee.io/technology',
  'https://cloudemployee.io/services',
  'https://cloudemployee.io/customer-stories',
  'https://cloudemployee.io/ai-in-software-development/securing-ai-the-ctos-guide-to-validation-and-minimum-safety-standards',
];

const VIEWPORTS = [
  { name: 'mobile',  width: 375,  height: 812 },
  { name: 'tablet',  width: 768,  height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
];

async function probeHeadings(p) {
  return p.evaluate(() => {
    const out = { byTag: { h1: [], h2: [], h3: [], h4: [], h5: [], h6: [] } };
    for (const tag of ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']) {
      document.querySelectorAll(tag).forEach((el) => {
        const cs = getComputedStyle(el);
        const text = (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60);
        // skip hidden/empty headings
        if (!text) return;
        if (cs.display === 'none' || cs.visibility === 'hidden') return;
        const rect = el.getBoundingClientRect();
        out.byTag[tag].push({
          text,
          classes: typeof el.className === 'string' ? el.className.slice(0, 100) : '',
          fontSize: cs.fontSize,
          lineHeight: cs.lineHeight,
          fontWeight: cs.fontWeight,
          fontFamily: cs.fontFamily.slice(0, 60),
          letterSpacing: cs.letterSpacing,
          textTransform: cs.textTransform,
          color: cs.color,
          width: Math.round(rect.width),
          // Parent context — helps distinguish "hero h1" vs "card h1" vs "section h2"
          parentTag: el.parentElement ? el.parentElement.tagName.toLowerCase() : null,
          parentClasses: el.parentElement && typeof el.parentElement.className === 'string'
            ? el.parentElement.className.slice(0, 60) : '',
          // Inside an article/main/section/nav?
          inMain: !!el.closest('main, article, [role="main"]'),
          inHero: !!el.closest('[class*="hero"], [class*="banner"]'),
          inFooter: !!el.closest('footer'),
          inCard: !!el.closest('[class*="card"], [class*="grid-item"], [class*="resources-item"]'),
        });
      });
    }
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
        const data = await probeHeadings(p);
        aggregate[slug][vp.name] = data;
        const counts = Object.fromEntries(Object.entries(data.byTag).map(([t, arr]) => [t, arr.length]));
        console.log(`  [${vp.name} ${vp.width}px] h1=${counts.h1} h2=${counts.h2} h3=${counts.h3} h4=${counts.h4} h5=${counts.h5} h6=${counts.h6}`);
        await ctx.close();
      }
    }
  } finally {
    await browser.close();
  }

  // Aggregate analysis
  console.log('\n=== B1 HEADING — distinct font-size per tag per breakpoint ===');
  const dist = {}; // dist[tag][vp] = Map<fontSize, {count, samples[]}>
  for (const tag of ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']) {
    dist[tag] = {};
    for (const vp of VIEWPORTS) {
      dist[tag][vp.name] = new Map();
      for (const slug of Object.keys(aggregate)) {
        const items = aggregate[slug][vp.name].byTag[tag];
        items.forEach((it) => {
          const key = it.fontSize;
          if (!dist[tag][vp.name].has(key)) dist[tag][vp.name].set(key, { count: 0, samples: [], weights: new Set(), lineHeights: new Set(), classGroups: new Map() });
          const g = dist[tag][vp.name].get(key);
          g.count++;
          g.weights.add(it.fontWeight);
          g.lineHeights.add(it.lineHeight);
          if (g.samples.length < 3) g.samples.push({ slug, text: it.text.slice(0, 50), classes: it.classes.slice(0, 60) });
          // Group by leading className token (e.g. "heading-style-h1" or "h-tag-text")
          const firstClass = it.classes.split(/\s+/).find((c) => /heading|h-tag|hero|hd-/.test(c)) || '(no-heading-class)';
          g.classGroups.set(firstClass, (g.classGroups.get(firstClass) || 0) + 1);
        });
      }
    }
  }

  for (const tag of ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']) {
    let totalAcrossViewports = 0;
    for (const vp of VIEWPORTS) totalAcrossViewports += [...dist[tag][vp.name].values()].reduce((a, g) => a + g.count, 0);
    if (totalAcrossViewports === 0) continue;
    console.log(`\n--- <${tag}> ---`);
    for (const vp of VIEWPORTS) {
      const map = dist[tag][vp.name];
      const sortedSizes = [...map.entries()].sort((a, b) => b[1].count - a[1].count);
      if (sortedSizes.length === 0) continue;
      console.log(`  [${vp.name}]`);
      for (const [size, g] of sortedSizes) {
        const weights = [...g.weights].join(',');
        const lhs = [...g.lineHeights].join(',');
        const classNotes = [...g.classGroups.entries()].map(([c, n]) => `${c}×${n}`).join(' | ');
        console.log(`     ${size}  [${g.count}×]  weights=${weights}  line-height=${lhs}`);
        console.log(`        class-groups: ${classNotes}`);
        g.samples.forEach((s) => console.log(`        [${s.slug}] "${s.text}"  class="${s.classes}"`));
      }
    }
  }

  // SEO check — h1 count per page
  console.log('\n=== H1 SEO check (one h1 per page is canonical) ===');
  for (const slug of Object.keys(aggregate)) {
    const desktopH1 = aggregate[slug].desktop.byTag.h1;
    console.log(`  [${slug}] desktop h1 count: ${desktopH1.length}`);
    desktopH1.forEach((h, i) => console.log(`     [${i}] "${h.text.slice(0,60)}" classes="${h.classes.slice(0,60)}"`));
  }

  // Role-variant check — same tag with multiple sizes at same breakpoint = role variants
  console.log('\n=== Role-variant detection — tags with >1 distinct font-size at desktop ===');
  for (const tag of ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']) {
    const map = dist[tag].desktop;
    if (map.size > 1) {
      console.log(`  <${tag}> has ${map.size} distinct desktop font-sizes:`);
      for (const [size, g] of map) {
        const classNotes = [...g.classGroups.entries()].map(([c, n]) => `${c}×${n}`).join(' | ');
        console.log(`     ${size} (${g.count}× — ${classNotes})`);
      }
    }
  }

  await fs.mkdir('audit-output/design-1', { recursive: true });
  await fs.writeFile('audit-output/design-1/heading-styles-probe.json', JSON.stringify(aggregate, null, 2));
  console.log('\nWrote audit-output/design-1/heading-styles-probe.json');
}

main().catch((err) => { console.error(err); process.exit(1); });
