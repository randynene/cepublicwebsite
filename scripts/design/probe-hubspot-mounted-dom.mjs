// scripts/design/probe-hubspot-mounted-dom.mjs
// Verification 2 — capture full HubSpot-injected DOM structure so the
// CSS-in-component override selectors hit the right elements.

import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const URL = 'https://cloudemployee.io/start-hiring/contact-info';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  try { await p.goto(URL, { waitUntil: 'networkidle', timeout: 60_000 }); }
  catch { await p.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60_000 }); }

  // Trigger any intersection-observer lazy-load by scrolling the embed
  // container into view.
  await p.evaluate(() => {
    const el = document.querySelector('.hbspt-form, [id^="hbspt-form-"]');
    if (el) el.scrollIntoView({ block: 'center' });
    window.scrollTo(0, document.body.scrollHeight / 2);
  });
  await p.waitForTimeout(2000);

  // Wait for HubSpot's async form-render to actually mount inputs.
  try {
    await p.waitForSelector('.hs-form .hs-input', { timeout: 25_000 });
  } catch {
    console.log('WARN: HubSpot form did not mount within 25s; capturing whatever rendered.');
  }
  await p.waitForTimeout(2000);

  const data = await p.evaluate(() => {
    const out = { foundForms: 0, structures: [] };
    const forms = document.querySelectorAll('.hs-form, form.hs-form, .hbspt-form form');
    out.foundForms = forms.length;
    forms.forEach((form, i) => {
      const fields = Array.from(form.querySelectorAll('.hs-form-field')).map((field) => {
        const label = field.querySelector('label.hs-form-label, label');
        const required = field.querySelector('.hs-form-required');
        const inputWrapper = field.querySelector('.input');
        const directInput = field.querySelector('input.hs-input, textarea.hs-input, select.hs-input');
        const errorList = field.querySelector('.hs-error-msgs, .hs-error-msg');
        return {
          fieldClasses: typeof field.className === 'string' ? field.className.slice(0, 120) : '',
          labelTag: label ? label.tagName.toLowerCase() : null,
          labelClasses: label && typeof label.className === 'string' ? label.className.slice(0, 80) : '',
          labelTextPreview: label ? (label.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40) : null,
          requiredTag: required ? required.tagName.toLowerCase() : null,
          requiredClasses: required && typeof required.className === 'string' ? required.className.slice(0, 80) : '',
          requiredText: required ? (required.textContent || '').slice(0, 5) : null,
          hasInputWrapper: !!inputWrapper,
          inputTag: directInput ? directInput.tagName.toLowerCase() : null,
          inputType: directInput ? directInput.getAttribute('type') : null,
          inputClasses: directInput && typeof directInput.className === 'string' ? directInput.className.slice(0, 80) : '',
          errorTag: errorList ? errorList.tagName.toLowerCase() : null,
          errorClasses: errorList && typeof errorList.className === 'string' ? errorList.className.slice(0, 80) : '',
        };
      });
      const submitWrapper = form.querySelector('.hs-submit, .hs-button-wrapper');
      const submit = form.querySelector('input[type="submit"], button[type="submit"], .hs-button');
      out.structures.push({
        formIndex: i,
        formClasses: typeof form.className === 'string' ? form.className.slice(0, 140) : '',
        fieldCount: fields.length,
        fields: fields.slice(0, 5),
        submitWrapperClasses: submitWrapper && typeof submitWrapper.className === 'string' ? submitWrapper.className.slice(0, 80) : null,
        submitTag: submit ? submit.tagName.toLowerCase() : null,
        submitClasses: submit && typeof submit.className === 'string' ? submit.className.slice(0, 80) : null,
        submitValue: submit ? (submit.getAttribute('value') || submit.textContent?.trim().slice(0, 40)) : null,
        firstFieldOuterHTML: form.querySelector('.hs-form-field')?.outerHTML?.slice(0, 800) || null,
      });
    });
    return out;
  });

  console.log(`=== HubSpot-mounted forms found: ${data.foundForms} ===\n`);
  data.structures.forEach((s) => {
    console.log(`Form [${s.formIndex}] classes="${s.formClasses}"`);
    console.log(`  fieldCount=${s.fieldCount}  submitWrapper="${s.submitWrapperClasses}"  submit=<${s.submitTag} class="${s.submitClasses}">`);
    console.log(`  submitValue="${s.submitValue}"`);
    console.log(`\n  --- Per-field structure (first ${s.fields.length}) ---`);
    s.fields.forEach((f, i) => {
      console.log(`\n  Field [${i}] field-classes="${f.fieldClasses}"`);
      console.log(`    label: <${f.labelTag} class="${f.labelClasses}">  text="${f.labelTextPreview}"`);
      console.log(`    required: ${f.requiredTag ? `<${f.requiredTag} class="${f.requiredClasses}">"${f.requiredText}"` : '(no required asterisk)'}`);
      console.log(`    input-wrapper-div: ${f.hasInputWrapper ? 'YES (.input)' : 'NO (input is direct child of .hs-form-field)'}`);
      console.log(`    input: <${f.inputTag} type=${f.inputType} class="${f.inputClasses}">`);
      console.log(`    error: ${f.errorTag ? `<${f.errorTag} class="${f.errorClasses}">` : '(no error wrapper rendered initially)'}`);
    });
    if (s.firstFieldOuterHTML) {
      console.log(`\n  --- First field outerHTML (first 800 chars) ---`);
      console.log(`  ${s.firstFieldOuterHTML.replace(/\s+/g, ' ')}`);
    }
  });

  await fs.mkdir('audit-output/design-1', { recursive: true });
  await fs.writeFile('audit-output/design-1/hubspot-mounted-dom-probe.json', JSON.stringify(data, null, 2));
  console.log('\nWrote audit-output/design-1/hubspot-mounted-dom-probe.json');
  await browser.close();
}

main().catch((err) => { console.error(err); process.exit(1); });
