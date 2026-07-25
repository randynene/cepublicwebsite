// scripts/design/diagnostic-2-navy-contexts.mjs
// Diagnostic 2 per /Users/jakehall/.claude/plans/staged-growing-grove.md.
//
// Goal: classify each element using rgb(34, 60, 108) (= #223c6c) by which
// CSS property it appears on (color / backgroundColor / borderColor /
// outlineColor) and where on the page (in-fold vs below). Result decides
// whether the token is `--color-bg-hero-dark` (bg-only, hero) or
// `--color-brand-tertiary` (multi-property brand color).

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

const NAVY = 'rgb(34, 60, 108)';

async function probe(p, page) {
  return p.evaluate((NAVY) => {
    const out = [];
    document.querySelectorAll('*').forEach((el) => {
      const cs = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      const inFold = rect.top < window.innerHeight && rect.top > -rect.height;
      const properties = [];
      if (cs.color === NAVY) properties.push('color');
      if (cs.backgroundColor === NAVY) properties.push('backgroundColor');
      if (cs.borderTopColor === NAVY || cs.borderRightColor === NAVY ||
          cs.borderBottomColor === NAVY || cs.borderLeftColor === NAVY) properties.push('borderColor');
      if (cs.outlineColor === NAVY) properties.push('outlineColor');
      if (cs.fill === NAVY) properties.push('fill');
      if (cs.stroke === NAVY) properties.push('stroke');
      if (properties.length === 0) return;
      out.push({
        tag: el.tagName.toLowerCase(),
        classes: typeof el.className === 'string' ? el.className.slice(0, 120) : '',
        text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80),
        properties,
        position: {
          top: Math.round(rect.top),
          left: Math.round(rect.left),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        },
        inFold,
      });
    });
    return out;
  }, NAVY);
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

      const matches = await probe(p, page);
      result[page.slug] = matches;
      console.log('  matches:', matches.length);

      // Quick property breakdown
      const propCounts = { color: 0, backgroundColor: 0, borderColor: 0, outlineColor: 0, fill: 0, stroke: 0 };
      for (const m of matches) for (const prop of m.properties) propCounts[prop]++;
      console.log('  properties:', JSON.stringify(propCounts));

      await ctx.close();
    }
  } finally {
    await browser.close();
  }

  await fs.writeFile(
    path.resolve('audit-output/design-1/diagnostic-2.json'),
    JSON.stringify(result, null, 2),
  );
  console.log('\nWrote audit-output/design-1/diagnostic-2.json');

  // Cross-page summary
  console.log('\n--- CROSS-PAGE SUMMARY ---');
  const totals = { color: 0, backgroundColor: 0, borderColor: 0, outlineColor: 0, fill: 0, stroke: 0 };
  let totalMatches = 0;
  let inFoldMatches = 0;
  for (const slug of Object.keys(result)) {
    for (const m of result[slug]) {
      totalMatches++;
      if (m.inFold) inFoldMatches++;
      for (const p of m.properties) totals[p]++;
    }
  }
  console.log('total matches:', totalMatches, '| in-fold:', inFoldMatches);
  console.log('property totals:', JSON.stringify(totals));

  // Sample: first 8 unique class signatures
  console.log('\n--- sample unique element contexts ---');
  const seen = new Set();
  for (const slug of Object.keys(result)) {
    for (const m of result[slug]) {
      const sig = m.tag + '.' + m.classes.slice(0, 50) + ':' + m.properties.join(',');
      if (seen.has(sig)) continue;
      seen.add(sig);
      console.log(`  [${slug}] <${m.tag} class="${m.classes.slice(0, 60)}"> via ${m.properties.join('+')} ${m.inFold?'inFold':'belowFold'} | "${m.text.slice(0, 40)}"`);
      if (seen.size > 12) break;
    }
    if (seen.size > 12) break;
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
