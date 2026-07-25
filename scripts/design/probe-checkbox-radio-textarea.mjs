// scripts/design/probe-checkbox-radio-textarea.mjs
// C2/C3/C4 batch probe — Hard Rule #2.
//
// C1 probe partial findings:
//   - Textarea: CE uses tall text input (.large modifier: 100px h, 20px radius),
//     not <textarea>. Confirm by enumerating <textarea> elements site-wide.
//   - Select: 1 instance on /for-developers — re-capture full styling.
//   - Checkbox: 9 instances on /for-developers — but C1 probe captured only
//     the hidden native input, not the visible custom-styled box.
//   - Radio: zero instances surfaced. Confirm CE has none.
//
// This probe captures:
//   - Native <textarea> elements (any page)
//   - Native <input type="radio"> elements (any page)
//   - Webflow checkbox structure: label.w-checkbox > input.w-checkbox-input
//     + visible custom box (::before pseudo OR sibling div)
//   - Select with full focus + open-state styling

import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const PAGES = [
  'https://cloudemployee.io/for-developers',
  'https://cloudemployee.io/contact',
  'https://cloudemployee.io/book-a-call',
];

async function probe(p) {
  return p.evaluate(() => {
    const out = {
      textareas: [],
      radios: [],
      checkboxStructures: [],
      selectDetails: [],
    };

    // 1. Native <textarea>
    document.querySelectorAll('textarea').forEach((el) => {
      const cs = getComputedStyle(el);
      out.textareas.push({
        classes: typeof el.className === 'string' ? el.className : '',
        name: el.getAttribute('name'),
        placeholder: el.getAttribute('placeholder'),
        rows: el.getAttribute('rows'),
        cols: el.getAttribute('cols'),
        padding: [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].join(' '),
        border: `${cs.borderTopWidth} ${cs.borderTopStyle} ${cs.borderTopColor}`,
        borderRadius: cs.borderRadius,
        background: cs.backgroundColor,
        color: cs.color,
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        lineHeight: cs.lineHeight,
        height: cs.height,
        minHeight: cs.minHeight,
        resize: cs.resize,
      });
    });

    // 2. <input type="radio">
    document.querySelectorAll('input[type="radio"]').forEach((el) => {
      const cs = getComputedStyle(el);
      out.radios.push({
        classes: typeof el.className === 'string' ? el.className : '',
        name: el.getAttribute('name'),
        id: el.id,
        appearance: cs.appearance,
        display: cs.display,
        width: cs.width,
        height: cs.height,
      });
    });

    // 3. Checkbox structure — look for Webflow's label.w-checkbox wrappers
    document.querySelectorAll('.w-checkbox').forEach((wrapper) => {
      const input = wrapper.querySelector('input[type="checkbox"]');
      if (!input) return;
      // Webflow renders a visible pseudo-checkbox (typically a sibling <div> styled as the box)
      const visibleBoxes = wrapper.querySelectorAll(':scope > *:not(input)');
      const labelText = wrapper.querySelector('.w-form-label, label, span') ;
      const inputCs = getComputedStyle(input);
      const wrapperCs = getComputedStyle(wrapper);

      // Capture the visible box (typically the first non-input child)
      const visibleBox = Array.from(visibleBoxes).find((c) => c.tagName.toLowerCase() === 'div' || (c.className && /checkbox/.test(c.className.toString())));
      let visibleBoxStyle = null;
      if (visibleBox) {
        const cs = getComputedStyle(visibleBox);
        visibleBoxStyle = {
          tag: visibleBox.tagName.toLowerCase(),
          classes: typeof visibleBox.className === 'string' ? visibleBox.className.slice(0, 100) : '',
          width: cs.width,
          height: cs.height,
          border: `${cs.borderTopWidth} ${cs.borderTopStyle} ${cs.borderTopColor}`,
          borderRadius: cs.borderRadius,
          background: cs.backgroundColor,
          marginRight: cs.marginRight,
          // Pseudo-checkmark — Webflow uses ::before or background-image
          beforeContent: getComputedStyle(visibleBox, '::before').content,
          beforeBackgroundImage: getComputedStyle(visibleBox, '::before').backgroundImage.slice(0, 80),
        };
      }

      out.checkboxStructures.push({
        wrapperClasses: typeof wrapper.className === 'string' ? wrapper.className.slice(0, 100) : '',
        wrapperDisplay: wrapperCs.display,
        wrapperGap: wrapperCs.gap || `${wrapperCs.columnGap}/${wrapperCs.rowGap}`,
        inputClasses: typeof input.className === 'string' ? input.className.slice(0, 100) : '',
        inputDisplay: inputCs.display,
        inputAppearance: inputCs.appearance,
        inputOpacity: inputCs.opacity,
        inputPosition: inputCs.position,
        // visible box (the styled checkbox replacement)
        visibleBox: visibleBoxStyle,
        labelText: labelText ? (labelText.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 50) : null,
      });
    });

    // 4. Select details (with focus state)
    document.querySelectorAll('select').forEach((el) => {
      const cs = getComputedStyle(el);
      out.selectDetails.push({
        classes: typeof el.className === 'string' ? el.className : '',
        name: el.getAttribute('name'),
        padding: [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].join(' '),
        border: `${cs.borderTopWidth} ${cs.borderTopStyle} ${cs.borderTopColor}`,
        borderRadius: cs.borderRadius,
        background: cs.backgroundColor,
        backgroundImage: cs.backgroundImage.slice(0, 100),
        color: cs.color,
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        height: cs.height,
        appearance: cs.appearance,
        // Webflow's select chevron is typically a CSS background-image SVG
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
      console.log(`\n=== ${slug} ===`);
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const p = await ctx.newPage();
      try { await p.goto(url, { waitUntil: 'networkidle', timeout: 60_000 }); }
      catch { await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 }); }
      await p.waitForTimeout(1500);
      const data = await probe(p);
      aggregate[slug] = data;
      console.log(`  textareas=${data.textareas.length} radios=${data.radios.length} checkbox-structures=${data.checkboxStructures.length} selects=${data.selectDetails.length}`);
      await ctx.close();
    }
  } finally {
    await browser.close();
  }

  console.log('\n=== TEXTAREAS (aggregate) ===');
  let textareaCount = 0;
  for (const slug of Object.keys(aggregate)) {
    aggregate[slug].textareas.forEach((t) => {
      textareaCount++;
      console.log(`\n  [${slug}] <textarea name=${t.name} rows=${t.rows}>`);
      console.log(`    classes="${t.classes}"`);
      console.log(`    padding=${t.padding}  border=${t.border}  radius=${t.borderRadius}`);
      console.log(`    bg=${t.background}  color=${t.color}  font=${t.fontSize}/${t.fontWeight}/${t.lineHeight}`);
      console.log(`    height=${t.height}  minHeight=${t.minHeight}  resize=${t.resize}`);
    });
  }
  console.log(`\n  TOTAL textareas across pages: ${textareaCount}`);

  console.log('\n=== RADIOS (aggregate) ===');
  let radioCount = 0;
  for (const slug of Object.keys(aggregate)) {
    aggregate[slug].radios.forEach((r) => {
      radioCount++;
      console.log(`  [${slug}] <input type="radio" name=${r.name}> classes="${r.classes}" appearance=${r.appearance}`);
    });
  }
  console.log(`  TOTAL radios across pages: ${radioCount}`);

  console.log('\n=== CHECKBOX STRUCTURES (Webflow w-checkbox wrapper) ===');
  let cbCount = 0;
  for (const slug of Object.keys(aggregate)) {
    aggregate[slug].checkboxStructures.slice(0, 3).forEach((cb, i) => {
      cbCount++;
      console.log(`\n  [${slug}][${i}] wrapper="${cb.wrapperClasses.slice(0,60)}"  display=${cb.wrapperDisplay}`);
      console.log(`     input: classes="${cb.inputClasses.slice(0,60)}"  display=${cb.inputDisplay}  opacity=${cb.inputOpacity}  position=${cb.inputPosition}`);
      if (cb.visibleBox) {
        console.log(`     visibleBox: <${cb.visibleBox.tag} class="${cb.visibleBox.classes.slice(0,60)}">`);
        console.log(`        size=${cb.visibleBox.width}×${cb.visibleBox.height}`);
        console.log(`        border=${cb.visibleBox.border}  radius=${cb.visibleBox.borderRadius}`);
        console.log(`        bg=${cb.visibleBox.background}  margin-right=${cb.visibleBox.marginRight}`);
        console.log(`        ::before content="${cb.visibleBox.beforeContent}"  bgImage="${cb.visibleBox.beforeBackgroundImage}"`);
      }
      console.log(`     label="${cb.labelText}"`);
    });
  }
  console.log(`\n  TOTAL checkboxes across pages (first 3 per page shown): ${cbCount}`);

  console.log('\n=== SELECTS (aggregate) ===');
  for (const slug of Object.keys(aggregate)) {
    aggregate[slug].selectDetails.forEach((s) => {
      console.log(`\n  [${slug}] <select name=${s.name}>`);
      console.log(`    classes="${s.classes}"`);
      console.log(`    padding=${s.padding}  border=${s.border}  radius=${s.borderRadius}`);
      console.log(`    bg=${s.background}  bgImage="${s.backgroundImage}"`);
      console.log(`    color=${s.color}  font=${s.fontSize}/${s.fontWeight}  height=${s.height}`);
      console.log(`    appearance=${s.appearance}`);
    });
  }

  await fs.mkdir('audit-output/design-1', { recursive: true });
  await fs.writeFile('audit-output/design-1/checkbox-radio-textarea-probe.json', JSON.stringify(aggregate, null, 2));
  console.log('\nWrote audit-output/design-1/checkbox-radio-textarea-probe.json');
}

main().catch((err) => { console.error(err); process.exit(1); });
