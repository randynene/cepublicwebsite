// scripts/design/probe-accordion-chevron.mjs
// Verification 3 — focused probe for CE accordion chevron behavior.
// Initial accordion probe returned chevronTransition=null for all 10 items.
// Need to determine what visual indicator CE uses (SVG, pseudo-element,
// background-image, plus/minus glyph) and how it transitions on open/close.

import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  try {
    await p.goto('https://cloudemployee.io/technology', { waitUntil: 'networkidle', timeout: 60_000 });
  } catch {
    await p.goto('https://cloudemployee.io/technology', { waitUntil: 'domcontentloaded', timeout: 60_000 });
  }
  await p.waitForTimeout(1500);

  // 1. CLOSED state — full inner HTML of first .faq-item, plus all descendants' classes
  const closedSnapshot = await p.evaluate(() => {
    const item = document.querySelector('.faq-item');
    if (!item) return null;
    return {
      outerHTML: item.outerHTML.slice(0, 1500),
      descendantTags: Array.from(item.querySelectorAll('*')).map((el) => ({
        tag: el.tagName.toLowerCase(),
        classes: typeof el.className === 'string' ? el.className : '',
      })),
    };
  });
  console.log('=== CLOSED first .faq-item — outerHTML (first 1500 chars) ===');
  console.log(closedSnapshot?.outerHTML || '(no .faq-item found)');
  console.log('\n=== descendant tags + classes ===');
  closedSnapshot?.descendantTags?.forEach((d) => {
    console.log(`  <${d.tag} class="${d.classes.slice(0, 80)}">`);
  });

  // 2. Probe ::before / ::after pseudo-elements for visual indicators
  const pseudoProbe = await p.evaluate(() => {
    const item = document.querySelector('.faq-item');
    if (!item) return null;
    const result = [];
    const all = [item, ...item.querySelectorAll('*')];
    for (const el of all) {
      for (const pseudo of ['::before', '::after']) {
        const cs = getComputedStyle(el, pseudo);
        const content = cs.content;
        const bgImage = cs.backgroundImage;
        const transform = cs.transform;
        const transition = cs.transition;
        const width = cs.width;
        const height = cs.height;
        // Skip pseudos with no visual presence
        if (content === 'none' && bgImage === 'none' && (parseFloat(width) < 1 || parseFloat(height) < 1)) continue;
        result.push({
          el: `<${el.tagName.toLowerCase()} class="${(typeof el.className === 'string' ? el.className : '').slice(0, 50)}">`,
          pseudo,
          content,
          backgroundImage: bgImage.slice(0, 100),
          width,
          height,
          transform,
          transition: transition.slice(0, 100),
        });
      }
    }
    return result;
  });
  console.log('\n=== pseudo-element scan (::before / ::after with content or bg-image) ===');
  pseudoProbe?.forEach((p) => {
    console.log(`  ${p.el} ${p.pseudo}`);
    console.log(`    content="${p.content}" bgImage="${p.backgroundImage}"`);
    console.log(`    size=${p.width}×${p.height} transform="${p.transform}" transition="${p.transition}"`);
  });

  // 3. Click first item, then re-snapshot OPEN state
  const trigger = await p.$('.faq-item');
  if (trigger) {
    await trigger.click();
    await p.waitForTimeout(800);
  }
  const openSnapshot = await p.evaluate(() => {
    const item = document.querySelector('.faq-item');
    if (!item) return null;
    return {
      outerHTML: item.outerHTML.slice(0, 1500),
      classChange: item.className,
    };
  });
  console.log('\n=== OPEN first .faq-item — outerHTML (first 1500 chars, after click) ===');
  console.log(openSnapshot?.outerHTML || '(no .faq-item)');
  console.log(`\n  parent class after click: "${openSnapshot?.classChange}"`);

  // 4. Re-probe pseudos in OPEN state to detect transform changes
  const openPseudoProbe = await p.evaluate(() => {
    const item = document.querySelector('.faq-item');
    if (!item) return null;
    const result = [];
    const all = [item, ...item.querySelectorAll('*')];
    for (const el of all) {
      for (const pseudo of ['::before', '::after']) {
        const cs = getComputedStyle(el, pseudo);
        const content = cs.content;
        const bgImage = cs.backgroundImage;
        const transform = cs.transform;
        const width = cs.width;
        if (content === 'none' && bgImage === 'none' && parseFloat(width) < 1) continue;
        result.push({
          el: `<${el.tagName.toLowerCase()} class="${(typeof el.className === 'string' ? el.className : '').slice(0, 50)}">`,
          pseudo,
          content,
          bgImage: bgImage.slice(0, 80),
          transform,
        });
      }
    }
    return result;
  });
  console.log('\n=== pseudo-element scan AFTER click (OPEN state) ===');
  openPseudoProbe?.forEach((p) => {
    console.log(`  ${p.el} ${p.pseudo} content="${p.content}" bgImage="${p.bgImage}" transform="${p.transform}"`);
  });

  await browser.close();
}

main().catch((err) => { console.error(err); process.exit(1); });
