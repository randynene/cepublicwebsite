// scripts/design/probe-image-styles.mjs
// Step 2.13 / HALT 7 — E1 Image probe (Hard Rule #2).
//
// Goals:
//   1. Per-image-context computed styles (object-fit, width/height,
//      loading, fetchpriority, sizes, srcset, decoding).
//   2. Format distribution (jpg/png/webp/avif).
//   3. Image role identification — hero / article-body / card-thumbnail /
//      avatar / icon-inline / background.
//   4. Above-fold vs below-fold split (LCP candidate identification).
//
// Sweeps 5 representative pages × 1 viewport (1440px desktop).

import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const PAGES = [
  'https://cloudemployee.io/',
  'https://cloudemployee.io/technology',
  'https://cloudemployee.io/services',
  'https://cloudemployee.io/customer-stories',
  'https://cloudemployee.io/ai-in-software-development/securing-ai-the-ctos-guide-to-validation-and-minimum-safety-standards',
];

async function probe(p) {
  return p.evaluate(() => {
    const out = { images: [], bgImages: [] };
    const viewportH = window.innerHeight;

    document.querySelectorAll('img').forEach((el) => {
      // skip vendor / chat-widget tracking pixels
      if (el.width <= 1 || el.height <= 1) return;
      const cs = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      const aboveFold = rect.top < viewportH && rect.top >= 0;
      const src = el.currentSrc || el.src || '';
      const ext = (src.match(/\.([a-z0-9]+)(?:\?|$)/i)?.[1] || '').toLowerCase();
      const role = (() => {
        // Heuristic role classification
        const cls = (typeof el.className === 'string' ? el.className : '').toLowerCase();
        const inHero = !!el.closest('[class*="hero"], [class*="banner"]');
        const inCard = !!el.closest('[class*="card"], [class*="grid-item"], [class*="resources-item"], [class*="testimonies"]');
        const inArticle = !!el.closest('article, [class*="rich-content"], [class*="w-richtext"]');
        const inNav = !!el.closest('nav, [class*="navbar"], [class*="nav-menu"]');
        const inFooter = !!el.closest('footer');
        if (inNav) return 'nav-logo';
        if (inFooter && rect.width < 200) return 'footer-icon';
        if (inHero && rect.width > 400) return 'hero-image';
        if (cls.includes('avatar') || cls.includes('headshot') || cls.includes('face') || cls.includes('member-image')) return 'avatar';
        if (rect.width <= 64 && rect.height <= 64) return 'icon-inline';
        if (inCard) return 'card-thumbnail';
        if (inArticle) return 'article-body';
        if (rect.width > 800) return 'wide-content';
        return 'misc';
      })();

      out.images.push({
        src: src.slice(0, 140),
        ext,
        intrinsicWidth: el.naturalWidth,
        intrinsicHeight: el.naturalHeight,
        renderedWidth: Math.round(rect.width),
        renderedHeight: Math.round(rect.height),
        widthAttr: el.getAttribute('width'),
        heightAttr: el.getAttribute('height'),
        loading: el.getAttribute('loading'),
        fetchpriority: el.getAttribute('fetchpriority'),
        decoding: el.getAttribute('decoding'),
        sizesAttr: el.getAttribute('sizes'),
        hasSrcset: !!el.getAttribute('srcset'),
        srcsetEntries: (el.getAttribute('srcset') || '').split(',').length || 0,
        alt: (el.getAttribute('alt') || '').slice(0, 40),
        objectFit: cs.objectFit,
        objectPosition: cs.objectPosition,
        borderRadius: cs.borderRadius,
        aboveFold,
        role,
        classes: typeof el.className === 'string' ? el.className.slice(0, 80) : '',
        parentTag: el.parentElement?.tagName.toLowerCase() || null,
      });
    });

    // CSS-driven background images (decorative)
    document.querySelectorAll('[style*="background-image"], [class*="bg-image"]').forEach((el) => {
      const cs = getComputedStyle(el);
      if (cs.backgroundImage === 'none') return;
      const rect = el.getBoundingClientRect();
      if (rect.width < 50 || rect.height < 50) return;
      out.bgImages.push({
        tag: el.tagName.toLowerCase(),
        classes: typeof el.className === 'string' ? el.className.slice(0, 80) : '',
        backgroundImage: cs.backgroundImage.slice(0, 140),
        backgroundSize: cs.backgroundSize,
        backgroundPosition: cs.backgroundPosition,
        renderedWidth: Math.round(rect.width),
        renderedHeight: Math.round(rect.height),
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
      await p.waitForTimeout(1200);
      const data = await probe(p);
      aggregate[slug] = data;
      console.log(`[${slug}] images=${data.images.length} bg-images=${data.bgImages.length}`);
      await ctx.close();
    }
  } finally {
    await browser.close();
  }

  // Aggregate by role
  console.log('\n=== E1 IMAGE — role distribution + averaged styling per role ===');
  const byRole = new Map();
  for (const slug of Object.keys(aggregate)) {
    for (const img of aggregate[slug].images) {
      if (!byRole.has(img.role)) byRole.set(img.role, []);
      byRole.get(img.role).push({ slug, ...img });
    }
  }
  for (const [role, arr] of [...byRole.entries()].sort((a, b) => b[1].length - a[1].length)) {
    console.log(`\n--- role=${role} (${arr.length}×) ---`);
    // Aggregate stats
    const formats = new Set(arr.map(i => i.ext).filter(Boolean));
    const loadingValues = new Set(arr.map(i => i.loading || '(unset)'));
    const fetchPriValues = new Set(arr.map(i => i.fetchpriority || '(unset)'));
    const sizesPresent = arr.filter(i => i.sizesAttr).length;
    const srcsetPresent = arr.filter(i => i.hasSrcset).length;
    const objectFits = new Set(arr.map(i => i.objectFit));
    const aboveFoldCount = arr.filter(i => i.aboveFold).length;
    console.log(`  formats: ${[...formats].join(',')}`);
    console.log(`  loading: ${[...loadingValues].join(' | ')}`);
    console.log(`  fetchpriority: ${[...fetchPriValues].join(' | ')}`);
    console.log(`  sizes attr present: ${sizesPresent}/${arr.length}`);
    console.log(`  srcset present: ${srcsetPresent}/${arr.length} (avg ${arr.reduce((a, i) => a + i.srcsetEntries, 0) / arr.length} entries)`);
    console.log(`  object-fit: ${[...objectFits].join(',')}`);
    console.log(`  above-fold: ${aboveFoldCount}/${arr.length}`);
    arr.slice(0, 3).forEach(i => {
      console.log(`  [${i.slug}] ${i.renderedWidth}×${i.renderedHeight}px | natural=${i.intrinsicWidth}×${i.intrinsicHeight} | loading=${i.loading} | fp=${i.fetchpriority} | sizes="${(i.sizesAttr||'').slice(0,40)}" | alt="${i.alt}"`);
    });
  }

  // Format distribution overall
  console.log('\n=== FORMAT DISTRIBUTION (overall) ===');
  const formatCounts = new Map();
  let total = 0;
  for (const slug of Object.keys(aggregate)) {
    for (const img of aggregate[slug].images) {
      total++;
      formatCounts.set(img.ext || 'unknown', (formatCounts.get(img.ext || 'unknown') || 0) + 1);
    }
  }
  for (const [fmt, count] of [...formatCounts.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  .${fmt}: ${count} (${(count / total * 100).toFixed(1)}%)`);
  }

  await fs.mkdir('audit-output/design-1', { recursive: true });
  await fs.writeFile('audit-output/design-1/image-styles-probe.json', JSON.stringify(aggregate, null, 2));
  console.log('\nWrote audit-output/design-1/image-styles-probe.json');
}

main().catch((err) => { console.error(err); process.exit(1); });
