// scripts/design/probe-card-styles.mjs
// Step 2.4 (HALT 2) — probe CE for A4 Card patterns (Hard Rule #2).
//
// Brief inventory says Card has variants `content | featured | bordered`.
// That assertion is extrapolated; this probe verifies it against the live site
// and surfaces what slot composition (header/body/footer) actually appears.
//
// Detection strategy (two-pronged):
//   1. CLASS-NAME MATCH — any element whose className contains the substring
//      "card" as a whole-word token (`.feature-card`, `.team-card`, etc.).
//   2. STRUCTURAL FINGERPRINT — any element whose computed style matches a
//      card-shaped container heuristic: border-radius >= 4px
//      AND (box-shadow != 'none' OR has visible border OR has non-transparent bg
//           differing from its parent) AND padding-top >= 8px.
//      This catches CE's rounded-content tiles that don't use "card" in className.
//
// For each match, capture:
//   - Tag, class signature, computed styles (radius, shadow, border, bg, padding)
//   - Slot composition: heading present? paragraph/body present? footer/button present?
//     image present? image-position relative to other content?
//   - Routability: wrapped in <a>? contains <a> children? plain <div>?
//
// Aggregate by visual signature (radius + shadow + bg + border) so we can
// answer: "how many DISTINCT card visual variants does CE actually have?"

import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const PAGES = [
  'https://cloudemployee.io/',
  'https://cloudemployee.io/technology',
  'https://cloudemployee.io/services',
  'https://cloudemployee.io/customer-stories',
  'https://cloudemployee.io/blog',
];

async function probe(p) {
  return p.evaluate(() => {
    const out = { byClass: [], byFingerprint: [] };

    const TRANSPARENT_BGS = new Set([
      'rgba(0, 0, 0, 0)',
      'rgba(255, 255, 255, 0)',
      'transparent',
    ]);

    const captureCandidate = (el, source) => {
      const cs = getComputedStyle(el);
      const radius = parseFloat(cs.borderTopLeftRadius) || 0;
      const padTop = parseFloat(cs.paddingTop) || 0;
      const padLeft = parseFloat(cs.paddingLeft) || 0;
      const borderTopW = parseFloat(cs.borderTopWidth) || 0;
      const hasShadow = cs.boxShadow !== 'none';
      const hasBorder = borderTopW > 0;
      const bg = cs.backgroundColor;

      // slot composition — what's inside?
      const heading = el.querySelector('h1, h2, h3, h4, h5, h6, [class*="heading"]');
      const paragraph = el.querySelector('p, [class*="text"], [class*="body"]');
      const button = el.querySelector('a[class*="button"], button, .w-button, [class*="btn"]');
      const link = el.querySelector('a:not([class*="button"]):not(.w-button)');
      const img = el.querySelector('img, [style*="background-image"], picture, .w-background-video');
      const imgFirst = img && el.children[0] && el.children[0].contains(img);
      const imgLast = img && el.children[el.children.length - 1] && el.children[el.children.length - 1].contains(img);

      // routability
      const isAnchor = el.tagName.toLowerCase() === 'a';
      const isWrappedInAnchor = !!el.closest('a') && !isAnchor;
      const containsAnchor = !!el.querySelector('a');

      // direct children — slot pattern signature (depth-1 element types)
      const childSig = Array.from(el.children).map((c) => {
        const cls = typeof c.className === 'string' ? c.className.slice(0, 40) : '';
        return `${c.tagName.toLowerCase()}${cls ? '.' + cls.split(/\s+/)[0] : ''}`;
      }).join(' > ');

      return {
        source,
        tag: el.tagName.toLowerCase(),
        classes: typeof el.className === 'string' ? el.className.slice(0, 140) : '',
        textPreview: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80),
        bg,
        radius,
        boxShadow: cs.boxShadow.slice(0, 100),
        border: hasBorder ? `${cs.borderTopWidth} ${cs.borderTopStyle} ${cs.borderTopColor}` : 'none',
        padding: [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].join(' '),
        slots: {
          heading: !!heading,
          headingText: heading ? heading.textContent.trim().slice(0, 40) : null,
          paragraph: !!paragraph,
          button: !!button,
          link: !!link && !button,
          image: !!img,
          imageFirst: imgFirst,
          imageLast: imgLast,
        },
        routability: {
          isAnchor,
          isWrappedInAnchor,
          containsAnchor,
        },
        childSig: childSig.slice(0, 200),
        directChildCount: el.children.length,
      };
    };

    // 1. CLASS-NAME MATCH — any element with "card" as token in className
    document.querySelectorAll('[class*="card"]').forEach((el) => {
      if (typeof el.className !== 'string') return;
      const tokens = el.className.toLowerCase().split(/\s+/);
      // whole-word match — accept tokens that ARE "card" or END in "-card" or START with "card-" or "card_"
      const isCardToken = tokens.some((t) =>
        t === 'card' ||
        /-card$/.test(t) ||
        /^card[-_]/.test(t) ||
        /-card-/.test(t)
      );
      if (!isCardToken) return;
      // skip card-shaped descendants of another already-captured card to reduce noise
      // (we'll dedup at aggregate stage by signature anyway)
      out.byClass.push(captureCandidate(el, 'class'));
    });

    // 2. STRUCTURAL FINGERPRINT — rounded + (shadow OR border OR distinct-bg) + padded
    const all = document.querySelectorAll('div, article, section, li');
    all.forEach((el) => {
      const cs = getComputedStyle(el);
      const radius = parseFloat(cs.borderTopLeftRadius) || 0;
      const padTop = parseFloat(cs.paddingTop) || 0;
      const borderW = parseFloat(cs.borderTopWidth) || 0;
      const hasShadow = cs.boxShadow !== 'none';
      const hasBorder = borderW > 0;
      const bg = cs.backgroundColor;
      const parentBg = el.parentElement ? getComputedStyle(el.parentElement).backgroundColor : 'transparent';
      const hasDistinctBg = !TRANSPARENT_BGS.has(bg) && bg !== parentBg;

      if (radius < 4) return;
      if (padTop < 8) return;
      if (!hasShadow && !hasBorder && !hasDistinctBg) return;

      // skip elements that are obviously the page background or full-width sections
      const rect = el.getBoundingClientRect();
      if (rect.width > 1200) return; // exclude full-width sections
      if (rect.width < 120) return;  // exclude badges/pills (Tag will catch those)
      if (rect.height < 80) return;  // exclude single-line elements

      // skip elements already captured by class-name match (avoid double-count)
      const classes = typeof el.className === 'string' ? el.className.toLowerCase() : '';
      const tokens = classes.split(/\s+/);
      const isCardToken = tokens.some((t) =>
        t === 'card' ||
        /-card$/.test(t) ||
        /^card[-_]/.test(t) ||
        /-card-/.test(t)
      );
      if (isCardToken) return;

      out.byFingerprint.push(captureCandidate(el, 'fingerprint'));
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
      console.log(`\n--- ${slug} ---`);
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const p = await ctx.newPage();
      try {
        await p.goto(url, { waitUntil: 'networkidle', timeout: 60_000 });
      } catch {
        await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
      }
      await p.waitForTimeout(1200);
      const data = await probe(p);
      aggregate[slug] = data;
      console.log(`  by-class: ${data.byClass.length}  | by-fingerprint: ${data.byFingerprint.length}`);
      await ctx.close();
    }
  } finally {
    await browser.close();
  }

  // Aggregate by visual signature
  console.log('\n=== A4 CARD — class-token-match aggregate ===');
  const classGroups = new Map();
  for (const slug of Object.keys(aggregate)) {
    for (const e of aggregate[slug].byClass) {
      const sig = `radius=${e.radius}px | bg=${e.bg} | shadow=${e.boxShadow.slice(0,60)} | border=${e.border}`;
      if (!classGroups.has(sig)) classGroups.set(sig, { count: 0, samples: [], slots: { heading: 0, paragraph: 0, button: 0, link: 0, image: 0 }, routability: { isAnchor: 0, isWrappedInAnchor: 0, containsAnchor: 0 }, classTokens: new Set() });
      const g = classGroups.get(sig);
      g.count++;
      if (g.samples.length < 3) g.samples.push({ slug, classes: e.classes, text: e.textPreview, childSig: e.childSig });
      Object.keys(e.slots).forEach((k) => { if (e.slots[k] === true) g.slots[k] = (g.slots[k] || 0) + 1; });
      Object.keys(e.routability).forEach((k) => { if (e.routability[k]) g.routability[k] = (g.routability[k] || 0) + 1; });
      // collect distinct card-token classes for this signature
      const tokens = e.classes.toLowerCase().split(/\s+/).filter((t) => /card/.test(t));
      tokens.forEach((t) => g.classTokens.add(t));
    }
  }
  for (const [sig, g] of classGroups) {
    console.log(`\n  [${g.count}×] ${sig}`);
    console.log(`     class-tokens: ${[...g.classTokens].slice(0, 12).join(', ')}`);
    console.log(`     slots:        heading=${g.slots.heading || 0} para=${g.slots.paragraph || 0} btn=${g.slots.button || 0} link=${g.slots.link || 0} img=${g.slots.image || 0}`);
    console.log(`     routability:  isAnchor=${g.routability.isAnchor || 0} wrappedInAnchor=${g.routability.isWrappedInAnchor || 0} containsAnchor=${g.routability.containsAnchor || 0}`);
    g.samples.forEach((s) => {
      console.log(`     [${s.slug}] "${s.text.slice(0,50)}"`);
      console.log(`        children: ${s.childSig}`);
    });
  }

  console.log('\n=== A4 CARD — fingerprint-match aggregate (NOT name-tagged "card") ===');
  const fpGroups = new Map();
  for (const slug of Object.keys(aggregate)) {
    for (const e of aggregate[slug].byFingerprint) {
      const sig = `radius=${e.radius}px | bg=${e.bg} | shadow=${e.boxShadow.slice(0,60)} | border=${e.border}`;
      if (!fpGroups.has(sig)) fpGroups.set(sig, { count: 0, samples: [], slots: {}, routability: {}, classTokens: new Set() });
      const g = fpGroups.get(sig);
      g.count++;
      if (g.samples.length < 3) g.samples.push({ slug, classes: e.classes.slice(0,80), text: e.textPreview, childSig: e.childSig });
      Object.keys(e.slots).forEach((k) => { if (e.slots[k] === true) g.slots[k] = (g.slots[k] || 0) + 1; });
      Object.keys(e.routability).forEach((k) => { if (e.routability[k]) g.routability[k] = (g.routability[k] || 0) + 1; });
      const firstClass = e.classes.toLowerCase().split(/\s+/)[0] || '(no-class)';
      g.classTokens.add(firstClass);
    }
  }
  // Sort fp groups by count desc — highest-impact patterns first
  const sortedFp = [...fpGroups.entries()].sort((a, b) => b[1].count - a[1].count);
  for (const [sig, g] of sortedFp) {
    if (g.count < 2) continue; // filter one-off noise
    console.log(`\n  [${g.count}×] ${sig}`);
    console.log(`     first-class samples: ${[...g.classTokens].slice(0, 8).join(', ')}`);
    console.log(`     slots:        heading=${g.slots.heading || 0} para=${g.slots.paragraph || 0} btn=${g.slots.button || 0} link=${g.slots.link || 0} img=${g.slots.image || 0}`);
    console.log(`     routability:  isAnchor=${g.routability.isAnchor || 0} wrappedInAnchor=${g.routability.isWrappedInAnchor || 0} containsAnchor=${g.routability.containsAnchor || 0}`);
    g.samples.forEach((s) => {
      console.log(`     [${s.slug}] <${s.classes.split(/\s+/)[0]}> "${s.text.slice(0,50)}"`);
      console.log(`        children: ${s.childSig.slice(0,140)}`);
    });
  }

  await fs.mkdir('audit-output/design-1', { recursive: true });
  await fs.writeFile('audit-output/design-1/card-styles-probe.json', JSON.stringify(aggregate, null, 2));
  console.log('\nWrote audit-output/design-1/card-styles-probe.json');
}

main().catch((err) => { console.error(err); process.exit(1); });
