// scripts/design/probe-link-tag-styles.mjs
// Step 2.3 — probe CE for A2 Link + A3 Tag actual usage (Hard Rule #2).
//
// A2 Link variants / tones:
//   - .txt-link (default)         | inline variant
//   - .txt-link.cc-blue            | inline variant + cc-blue tone
//   - .txt-link.cc-white           | inline variant + cc-white tone
//   - .txt-link-arrow              | cta-arrow variant
//   - nav links (per brief)        | nav variant
//
// A3 Tag tones:
//   - .tag (default)
//   - .tag.cc-blue
//   - .tag.cc-yellow
//   - Plus: is Tag routable (rendered as <a>) or decorative (<span>/<div>)?

import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const PAGES = [
  'https://cloudemployee.io/',
  'https://cloudemployee.io/technology',
  'https://cloudemployee.io/services',
  'https://cloudemployee.io/customer-stories',
  'https://cloudemployee.io/blog',
  'https://cloudemployee.io/ai-in-software-development/securing-ai-the-ctos-guide-to-validation-and-minimum-safety-standards',
];

async function probe(p) {
  return p.evaluate(() => {
    const out = {
      txtLink: { default: [], ccBlue: [], ccWhite: [] },
      txtLinkArrow: [],
      navLinks: [],
      tags: { default: [], ccBlue: [], ccYellow: [], otherClasses: [] },
    };

    const captureStyle = (el) => {
      const cs = getComputedStyle(el);
      return {
        tag: el.tagName.toLowerCase(),
        classes: typeof el.className === 'string' ? el.className.slice(0, 120) : '',
        text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60),
        href: el.tagName.toLowerCase() === 'a' ? (el.getAttribute('href') || '') : null,
        color: cs.color,
        backgroundColor: cs.backgroundColor,
        textDecoration: cs.textDecorationLine,
        fontWeight: cs.fontWeight,
        fontSize: cs.fontSize,
        padding: [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].join(' '),
        borderRadius: cs.borderRadius,
      };
    };

    // .txt-link family
    document.querySelectorAll('[class*="txt-link"]').forEach((el) => {
      const c = el.className.toLowerCase();
      const data = captureStyle(el);
      if (c.includes('txt-link-arrow')) {
        out.txtLinkArrow.push(data);
      } else if (c.includes('cc-white')) {
        out.txtLink.ccWhite.push(data);
      } else if (c.includes('cc-blue')) {
        out.txtLink.ccBlue.push(data);
      } else {
        out.txtLink.default.push(data);
      }
    });

    // Nav links — typical Webflow `<a>` inside `<nav>` or with class `.nav-link`/`.w-nav-link`
    const navContainers = document.querySelectorAll('nav, [class*="navbar"], [class*="nav-menu"]');
    navContainers.forEach((nav) => {
      nav.querySelectorAll('a').forEach((el) => {
        const c = el.className.toLowerCase();
        if (c.includes('logo') || c.includes('button')) return; // skip logo/button anchors
        out.navLinks.push(captureStyle(el));
      });
    });

    // .tag family
    document.querySelectorAll('[class*="tag"]').forEach((el) => {
      const c = el.className.toLowerCase();
      if (!/\btag\b/.test(c)) return; // .tag must be a whole-word class, not e.g. .stage
      const data = captureStyle(el);
      data.parentTag = el.parentElement ? el.parentElement.tagName.toLowerCase() : null;
      data.parentClasses = el.parentElement && typeof el.parentElement.className === 'string'
        ? el.parentElement.className.slice(0, 80)
        : '';
      data.tag = el.tagName.toLowerCase();
      data.isInsideAnchor = !!el.closest('a');
      data.isAnchor = el.tagName.toLowerCase() === 'a';
      if (c.includes('cc-yellow')) {
        out.tags.ccYellow.push(data);
      } else if (c.includes('cc-blue')) {
        out.tags.ccBlue.push(data);
      } else if (c.split(/\s+/).includes('tag')) {
        out.tags.default.push(data);
      } else {
        out.tags.otherClasses.push({ ...data, classes: el.className });
      }
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
      await p.waitForTimeout(800);
      const data = await probe(p);
      aggregate[slug] = data;
      console.log(`  txt-link: default=${data.txtLink.default.length} ccBlue=${data.txtLink.ccBlue.length} ccWhite=${data.txtLink.ccWhite.length}`);
      console.log(`  txt-link-arrow: ${data.txtLinkArrow.length}`);
      console.log(`  nav-links: ${data.navLinks.length}`);
      console.log(`  tag: default=${data.tags.default.length} ccBlue=${data.tags.ccBlue.length} ccYellow=${data.tags.ccYellow.length} other=${data.tags.otherClasses.length}`);
      await ctx.close();
    }
  } finally {
    await browser.close();
  }

  // Aggregate
  console.log('\n=== A2 LINK — aggregate ===');
  let totalDefault = 0, totalCcBlue = 0, totalCcWhite = 0, totalArrow = 0, totalNav = 0;
  const sigDefault = new Set(), sigCcBlue = new Set(), sigCcWhite = new Set(), sigArrow = new Set(), sigNav = new Set();
  for (const slug of Object.keys(aggregate)) {
    const d = aggregate[slug];
    totalDefault += d.txtLink.default.length;
    totalCcBlue += d.txtLink.ccBlue.length;
    totalCcWhite += d.txtLink.ccWhite.length;
    totalArrow += d.txtLinkArrow.length;
    totalNav += d.navLinks.length;
    d.txtLink.default.forEach((e) => sigDefault.add(`${e.color}|${e.textDecoration}|${e.fontWeight}`));
    d.txtLink.ccBlue.forEach((e) => sigCcBlue.add(`${e.color}|${e.textDecoration}|${e.fontWeight}`));
    d.txtLink.ccWhite.forEach((e) => sigCcWhite.add(`${e.color}|${e.textDecoration}|${e.fontWeight}`));
    d.txtLinkArrow.forEach((e) => sigArrow.add(`${e.color}|${e.fontWeight}`));
    d.navLinks.forEach((e) => sigNav.add(`${e.color}|${e.fontWeight}|${e.textDecoration}`));
  }

  console.log(`txt-link.default      total=${totalDefault} unique-style-sigs=${sigDefault.size}`);
  for (const s of sigDefault) console.log(`  ${s}`);
  console.log(`txt-link.cc-blue      total=${totalCcBlue} unique-style-sigs=${sigCcBlue.size}`);
  for (const s of sigCcBlue) console.log(`  ${s}`);
  console.log(`txt-link.cc-white     total=${totalCcWhite} unique-style-sigs=${sigCcWhite.size}`);
  for (const s of sigCcWhite) console.log(`  ${s}`);
  console.log(`txt-link-arrow        total=${totalArrow} unique-style-sigs=${sigArrow.size}`);
  for (const s of sigArrow) console.log(`  ${s}`);
  console.log(`nav-links             total=${totalNav} unique-style-sigs=${sigNav.size}`);
  for (const s of sigNav) console.log(`  ${s}`);

  console.log('\n=== A3 TAG — aggregate ===');
  let tagDefault = 0, tagBlue = 0, tagYellow = 0, tagOther = 0;
  let tagAsAnchor = 0, tagAsSpan = 0, tagAsDiv = 0, tagInsideAnchor = 0;
  const tagBgs = new Set();
  for (const slug of Object.keys(aggregate)) {
    const d = aggregate[slug];
    tagDefault += d.tags.default.length;
    tagBlue += d.tags.ccBlue.length;
    tagYellow += d.tags.ccYellow.length;
    tagOther += d.tags.otherClasses.length;
    [...d.tags.default, ...d.tags.ccBlue, ...d.tags.ccYellow].forEach((e) => {
      tagBgs.add(`bg=${e.backgroundColor} | color=${e.color} | radius=${e.borderRadius} | tag=${e.tag} | parent=${e.parentTag} | inAnchor=${e.isInsideAnchor}`);
      if (e.isAnchor) tagAsAnchor++;
      else if (e.tag === 'span') tagAsSpan++;
      else if (e.tag === 'div') tagAsDiv++;
      if (e.isInsideAnchor) tagInsideAnchor++;
    });
  }
  console.log(`Counts: default=${tagDefault} ccBlue=${tagBlue} ccYellow=${tagYellow} other-tag-classes=${tagOther}`);
  console.log(`Element shape: as <a>=${tagAsAnchor} | as <span>=${tagAsSpan} | as <div>=${tagAsDiv} | inside <a>=${tagInsideAnchor}`);
  console.log('Unique bg+color+radius+tag+parent signatures:');
  for (const s of tagBgs) console.log(`  ${s}`);

  if (tagOther > 0) {
    console.log('\n--- OTHER TAG-CLASS samples (likely false positives or extra variants) ---');
    let n = 0;
    for (const slug of Object.keys(aggregate)) {
      for (const e of aggregate[slug].tags.otherClasses) {
        console.log(`  [${slug}] <${e.tag} class="${e.classes.slice(0,80)}">`);
        if (++n >= 10) break;
      }
      if (n >= 10) break;
    }
  }

  await fs.mkdir('audit-output/design-1', { recursive: true });
  await fs.writeFile('audit-output/design-1/link-tag-styles-probe.json', JSON.stringify(aggregate, null, 2));
  console.log('\nWrote audit-output/design-1/link-tag-styles-probe.json');
}

main().catch((err) => { console.error(err); process.exit(1); });
