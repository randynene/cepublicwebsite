// scripts/design/extract-design-tokens.mjs
// Step 1 per MYGRATR-DESIGN-1 brief v1.5 §5/Step 1.
//
// Plain Node ESM (no tsx) — Playwright `evaluate` serialization doesn't
// survive tsx's `__name` injection (per F1 v1.5 posture; matches
// scripts/design/verify-token-scope.mjs).
//
// Extracts computed styles + @media breakpoints from CE live site for
// downstream token derivation.

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

const STRUCTURAL = ['body', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'button', 'input', 'header', 'footer', 'nav'];

const PROPS = [
  'color', 'backgroundColor',
  'fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing',
  'borderRadius', 'borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomLeftRadius', 'borderBottomRightRadius',
  'boxShadow',
  'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
];

async function extractPage(browser, page) {
  console.log(`\n--- ${page.slug} (${page.url}) ---`);
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();

  let response;
  try {
    response = await p.goto(page.url, { waitUntil: 'networkidle', timeout: 60_000 });
  } catch {
    response = await p.goto(page.url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  }
  console.log('  status:', response?.status());

  await p.waitForTimeout(800);

  const data = await p.evaluate(({ STRUCTURAL, PROPS }) => {
    const snapshot = (el) => {
      const cs = getComputedStyle(el);
      const out = {};
      for (const prop of PROPS) out[prop] = cs.getPropertyValue(prop) || cs[prop];
      return out;
    };

    const structural = {};
    for (const sel of STRUCTURAL) {
      const el = document.querySelector(sel);
      structural[sel] = el ? {
        snippet: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80),
        styles: snapshot(el),
      } : null;
    }

    const ctaSelector = 'button, a.button-primary, a.button-secondary, a.cta-primary, a.cta-secondary, a[class*="button-"], a[class*="cta-"], a.btn, .button';
    const ctas = [];
    document.querySelectorAll(ctaSelector).forEach((el) => {
      ctas.push({
        snippet: el.outerHTML.slice(0, 200),
        styles: snapshot(el),
      });
    });

    const inputs = [];
    document.querySelectorAll('input, textarea, select').forEach((el) => {
      inputs.push({
        snippet: el.outerHTML.slice(0, 200),
        styles: snapshot(el),
      });
    });

    const decorated = [];
    const seenRadii = new Set();
    const seenShadows = new Set();
    document.querySelectorAll('*').forEach((el) => {
      const cs = getComputedStyle(el);
      const r = cs.borderRadius;
      const s = cs.boxShadow;
      const radiusInteresting = r && r !== '0px' && r !== '0px 0px 0px 0px';
      const shadowInteresting = s && s !== 'none';
      if (!radiusInteresting && !shadowInteresting) return;
      if (radiusInteresting) seenRadii.add(r);
      if (shadowInteresting) seenShadows.add(s);
      if (decorated.length < 80) {
        decorated.push({
          tag: el.tagName.toLowerCase(),
          classes: typeof el.className === 'string' ? el.className.slice(0, 120) : '',
          styles: snapshot(el),
        });
      }
    });

    const breakpoints = [];
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        const rules = sheet.cssRules;
        if (!rules) continue;
        for (const rule of Array.from(rules)) {
          if (rule.media) breakpoints.push(rule.conditionText || '');
        }
      } catch {
        // cross-origin — skip
      }
    }

    const loadedFonts = [];
    if (document.fonts) {
      for (const f of document.fonts) {
        loadedFonts.push({ family: f.family, style: f.style, weight: String(f.weight), status: f.status });
      }
    }

    return {
      structural,
      ctas,
      inputs,
      decorated,
      breakpoints: [...new Set(breakpoints)],
      uniqueRadii: [...seenRadii],
      uniqueShadows: [...seenShadows],
      loadedFonts,
      pageMeta: {
        url: location.href,
        viewport: `${innerWidth}×${innerHeight}`,
        scrollHeight: document.body.scrollHeight,
      },
    };
  }, { STRUCTURAL, PROPS });

  console.log('  structural elements captured:', Object.values(data.structural).filter(Boolean).length);
  console.log('  CTAs/buttons captured:        ', data.ctas.length);
  console.log('  inputs captured:              ', data.inputs.length);
  console.log('  decorated (radii/shadow):     ', data.decorated.length);
  console.log('  unique radii values:          ', data.uniqueRadii.length);
  console.log('  unique shadow values:         ', data.uniqueShadows.length);
  console.log('  @media conditions:            ', data.breakpoints.length);
  console.log('  loaded fonts:                 ', data.loadedFonts.length);

  await fs.writeFile(
    path.resolve(`audit-output/design-1/styles-${page.slug}.json`),
    JSON.stringify(data, null, 2),
  );

  await ctx.close();
  return data;
}

async function main() {
  await fs.mkdir(path.resolve('audit-output/design-1'), { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const aggregate = {};
  try {
    for (const page of PAGES) {
      try {
        aggregate[page.slug] = await extractPage(browser, page);
      } catch (err) {
        console.error(`  FAILED ${page.slug}:`, err?.message ?? err);
        aggregate[page.slug] = { error: String(err?.message ?? err) };
      }
    }
  } finally {
    await browser.close();
  }

  const allBreakpoints = new Set();
  const allRadii = new Set();
  const allShadows = new Set();
  const allFontFamilies = new Set();
  for (const slug of Object.keys(aggregate)) {
    const d = aggregate[slug];
    if (!d || d.error) continue;
    for (const b of d.breakpoints || []) allBreakpoints.add(b);
    for (const r of d.uniqueRadii || []) allRadii.add(r);
    for (const s of d.uniqueShadows || []) allShadows.add(s);
    for (const f of d.loadedFonts || []) allFontFamilies.add(f.family);
  }

  const summary = {
    breakpoints: [...allBreakpoints].sort(),
    radii: [...allRadii].sort(),
    shadows: [...allShadows],
    fontFamilies: [...allFontFamilies].sort(),
    pages: Object.keys(aggregate),
  };
  await fs.writeFile(path.resolve('audit-output/design-1/styles-summary.json'), JSON.stringify(summary, null, 2));

  console.log('\n--- cross-page summary ---');
  console.log('breakpoints:   ', summary.breakpoints.join(' | '));
  console.log('unique radii:  ', summary.radii.join(' | '));
  console.log('unique shadows count:', summary.shadows.length);
  console.log('font families: ', summary.fontFamilies.join(' | '));
  console.log('\nDone. Output: audit-output/design-1/styles-*.json + styles-summary.json');
}

main().catch((err) => { console.error(err); process.exit(1); });
