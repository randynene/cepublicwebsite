// scripts/design/diagnostic-1-type-source.mjs
// Diagnostic 1 per /Users/jakehall/.claude/plans/staged-growing-grove.md.
//
// Goal: capture the SOURCE-CSS unit for h1/h2/h3 declarations on
// cloudemployee.io. Computed style flattens to px; we need rem/em/px
// from the raw declaration to know whether token names should preserve
// the source unit.
//
// Two-tier strategy:
//   Tier 1 — same-origin stylesheet walk via document.styleSheets.
//   Tier 2 — Playwright CDP (CSS.getMatchedStylesForNode) if Tier 1
//            doesn't surface the heading rules (cross-origin sheets).

import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const PAGES = [
  { url: 'https://cloudemployee.io/',          slug: 'home',  expectedH1Px: '68.8px' },
  { url: 'https://cloudemployee.io/about-us',  slug: 'about', expectedH1Px: '88px'   },
  { url: 'https://cloudemployee.io/blog',      slug: 'blog',  expectedH1Px: '88px'   },
];

const HEADING_SELECTORS = ['h1', 'h2', 'h3', 'h4'];

async function tier1StylesheetWalk(p) {
  return p.evaluate((HEADING_SELECTORS) => {
    const out = [];
    const seen = new Set();
    for (const sheet of Array.from(document.styleSheets)) {
      let href = '';
      try { href = sheet.href || '(inline)'; } catch { href = '(throws)'; }
      try {
        const rules = sheet.cssRules;
        if (!rules) continue;
        const walk = (rule) => {
          if (rule.cssRules) for (const r of Array.from(rule.cssRules)) walk(r);
          if (!rule.selectorText) return;
          const sel = rule.selectorText;
          // Match h1/h2/h3/h4 selectors (also class-based heading utilities)
          if (!/(^|,\s*)(h[1-6]|\.heading-style|\.h[1-6]\b|\.display\b|\.title\b)/i.test(sel)) return;
          const fontSize = rule.style?.fontSize || '';
          const lineHeight = rule.style?.lineHeight || '';
          const fontWeight = rule.style?.fontWeight || '';
          if (!fontSize && !lineHeight) return;
          const key = sel + '|' + fontSize + '|' + lineHeight;
          if (seen.has(key)) return;
          seen.add(key);
          out.push({ sheet: href, selector: sel, fontSize, lineHeight, fontWeight, mediaCondition: rule.parentRule?.conditionText || null });
        };
        for (const rule of Array.from(rules)) walk(rule);
      } catch (err) {
        out.push({ sheet: href, error: 'cross-origin or throws: ' + err.message });
      }
    }
    return out;
  }, HEADING_SELECTORS);
}

async function tier2CDP(p, pageObj) {
  const cdp = await p.context().newCDPSession(p);
  await cdp.send('DOM.enable');
  await cdp.send('CSS.enable');
  const { root } = await cdp.send('DOM.getDocument', { depth: -1 });

  // Locate first node per heading selector
  const findNode = async (selector) => {
    const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector });
    return nodeId || null;
  };

  const out = [];
  for (const sel of HEADING_SELECTORS) {
    const nodeId = await findNode(sel);
    if (!nodeId) continue;
    const matches = await cdp.send('CSS.getMatchedStylesForNode', { nodeId });
    // matchedCSSRules: array of { rule: { selectorList, style: { cssText, cssProperties, ... } } }
    const fontSizeProps = [];
    for (const m of matches.matchedCSSRules || []) {
      const props = m.rule?.style?.cssProperties || [];
      const fs = props.find(x => x.name === 'font-size');
      const lh = props.find(x => x.name === 'line-height');
      const fw = props.find(x => x.name === 'font-weight');
      if (fs || lh) {
        fontSizeProps.push({
          selectorList: m.rule.selectorList?.text || '',
          fontSize: fs?.value || '',
          lineHeight: lh?.value || '',
          fontWeight: fw?.value || '',
          origin: m.rule.origin || '',
        });
      }
    }
    out.push({ selector: sel, sources: fontSizeProps });
  }
  return out;
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

      const tier1 = await tier1StylesheetWalk(p);
      const tier1Headings = tier1.filter(x => !x.error && /^(h[1-6]\b|\.heading|\.display|\.title)/i.test(x.selector));
      console.log('  Tier 1 sheet entries:', tier1.length, '| heading rules with fontSize/lh:', tier1Headings.length);

      let tier2 = null;
      if (tier1Headings.length === 0 || !tier1Headings.some(x => x.fontSize)) {
        console.log('  Tier 1 insufficient — running Tier 2 (CDP)…');
        tier2 = await tier2CDP(p, page);
        console.log('  Tier 2 captured:', tier2.length, 'headings');
      }

      result[page.slug] = {
        url: page.url,
        expectedH1Px: page.expectedH1Px,
        tier1: tier1,
        tier2,
      };

      await ctx.close();
    }
  } finally {
    await browser.close();
  }

  await fs.writeFile(
    path.resolve('audit-output/design-1/diagnostic-1.json'),
    JSON.stringify(result, null, 2),
  );
  console.log('\nWrote audit-output/design-1/diagnostic-1.json');

  // Summary
  console.log('\n--- SUMMARY ---');
  for (const slug of Object.keys(result)) {
    const r = result[slug];
    console.log(`\n${slug}:`);
    const tier1Hits = (r.tier1 || []).filter(x => !x.error && x.fontSize);
    if (tier1Hits.length) {
      for (const h of tier1Hits.slice(0, 6)) {
        console.log(`  T1 ${h.selector.slice(0,60).padEnd(60)} fontSize: ${h.fontSize.padEnd(12)} lh: ${h.lineHeight}`);
      }
    }
    if (r.tier2) {
      for (const t of r.tier2) {
        console.log(`  T2 ${t.selector}:`);
        for (const s of t.sources.slice(-3)) {
          console.log(`     [${s.origin}] ${s.selectorList.slice(0,50).padEnd(50)} fontSize: ${s.fontSize.padEnd(12)} lh: ${s.lineHeight}`);
        }
      }
    }
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
