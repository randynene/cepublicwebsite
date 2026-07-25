// scripts/design/probe-input-styles.mjs
// Step 2.10 / HALT 5 — C1 Input probe (Hard Rule #2).
//
// CE form architecture: Webflow + HubSpot hybrid. Native <input> elements
// styled by Webflow's `.w-input` class, posting via HubSpot's API. NOT a
// vendor JS-embed iframe (that's C6 scope). These are real HTML inputs we
// must style.
//
// Probe targets (pages with native inputs found via audit-output grep):
//   - /contact       — richest form: firstname / lastname / Email / Message + meta dropdown
//   - /book-a-call   — form + textarea
//   - /for-developers — checkbox-heavy form
//   - /home          — newsletter email (footer pattern, present on all pages)
//
// Capture per input:
//   - tag, type, name, classes, placeholder
//   - DEFAULT computed style (padding, border, radius, font, color, bg, height)
//   - FOCUS computed style (programmatic focus then re-measure)
//   - INVALID computed style (set element.setCustomValidity then check :invalid)
//   - PLACEHOLDER pseudo style (::placeholder)
//   - Associated <label> position + classes
//   - Required attribute presence
//   - Width relative to parent

import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const PAGES = [
  'https://cloudemployee.io/contact',
  'https://cloudemployee.io/book-a-call',
  'https://cloudemployee.io/for-developers',
  'https://cloudemployee.io/',
];

async function captureInput(p, selector) {
  return p.evaluate((sel) => {
    const out = [];
    document.querySelectorAll(sel).forEach((el) => {
      // skip submit / hidden / chat-bot inputs
      const tag = el.tagName.toLowerCase();
      const type = el.getAttribute('type') || tag;
      if (type === 'submit' || type === 'hidden') return;
      if ((el.className || '').includes('cb-input')) return; // chat-bot

      const cs = getComputedStyle(el);
      const ph = getComputedStyle(el, '::placeholder');

      // find associated label
      let label = null;
      const id = el.id;
      if (id) label = document.querySelector(`label[for="${id}"]`);
      if (!label) {
        // sibling label or label-wrapping
        const parent = el.parentElement;
        if (parent && parent.tagName.toLowerCase() === 'label') label = parent;
        if (!label && parent) label = parent.querySelector('label');
      }
      const labelStyle = label ? getComputedStyle(label) : null;

      out.push({
        tag,
        type,
        name: el.getAttribute('name') || null,
        id: el.id || null,
        classes: typeof el.className === 'string' ? el.className.slice(0, 140) : '',
        placeholder: el.getAttribute('placeholder') || null,
        required: el.hasAttribute('required') || el.getAttribute('aria-required') === 'true',
        // Default style
        default: {
          padding: [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].join(' '),
          border: `${cs.borderTopWidth} ${cs.borderTopStyle} ${cs.borderTopColor}`,
          borderLeft: `${cs.borderLeftWidth} ${cs.borderLeftStyle} ${cs.borderLeftColor}`,
          borderRadius: cs.borderRadius,
          background: cs.backgroundColor,
          color: cs.color,
          fontSize: cs.fontSize,
          fontWeight: cs.fontWeight,
          lineHeight: cs.lineHeight,
          height: cs.height,
          width: cs.width,
          boxShadow: cs.boxShadow.slice(0, 80),
          outline: cs.outline,
        },
        placeholder_style: {
          color: ph.color,
          opacity: ph.opacity,
          fontSize: ph.fontSize,
          fontStyle: ph.fontStyle,
        },
        label: label
          ? {
              text: (label.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60),
              classes: typeof label.className === 'string' ? label.className.slice(0, 80) : '',
              fontSize: labelStyle.fontSize,
              fontWeight: labelStyle.fontWeight,
              color: labelStyle.color,
              display: labelStyle.display,
              marginBottom: labelStyle.marginBottom,
              position: labelStyle.position,
            }
          : null,
      });
    });
    return out;
  }, selector);
}

async function captureFocusStyle(p, selector) {
  return p.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    el.focus();
    const cs = getComputedStyle(el);
    const ret = {
      border: `${cs.borderTopWidth} ${cs.borderTopStyle} ${cs.borderTopColor}`,
      borderRadius: cs.borderRadius,
      background: cs.backgroundColor,
      boxShadow: cs.boxShadow.slice(0, 100),
      outline: cs.outline,
      outlineOffset: cs.outlineOffset,
    };
    el.blur();
    return ret;
  }, selector);
}

async function captureErrorPattern(p) {
  // Look for any error-message structure that might be hidden by default
  return p.evaluate(() => {
    const errors = [];
    // common Webflow + form-error class names
    const selectors = ['.w-form-fail', '.error-message', '.field-error', '[class*="error"]', '[class*="invalid"]', '.w-form-error', '.hs-error'];
    selectors.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => {
        const cs = getComputedStyle(el);
        const visible = cs.display !== 'none' && cs.visibility !== 'hidden';
        errors.push({
          selector: sel,
          tag: el.tagName.toLowerCase(),
          classes: typeof el.className === 'string' ? el.className.slice(0, 100) : '',
          textPreview: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60),
          display: cs.display,
          visible,
          color: cs.color,
          fontSize: cs.fontSize,
          marginTop: cs.marginTop,
        });
      });
    });
    return errors;
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

      const inputs = await captureInput(p, 'input, textarea, select');
      console.log(`  Found ${inputs.length} relevant inputs (excl. submit/hidden/chatbot)`);
      // Capture focus styling for the FIRST text-like input we find
      const firstTextInput = inputs.find((i) => /^(text|email|tel|password|search)$/.test(i.type));
      let focusStyle = null;
      if (firstTextInput && firstTextInput.id) {
        focusStyle = await captureFocusStyle(p, `#${firstTextInput.id}`);
      }
      const errorPattern = await captureErrorPattern(p);
      aggregate[slug] = { inputs, focusStyle, errorPattern };

      await ctx.close();
    }
  } finally {
    await browser.close();
  }

  // Summarize per-page
  for (const slug of Object.keys(aggregate)) {
    const d = aggregate[slug];
    console.log(`\n=== ${slug} — input details ===`);
    d.inputs.slice(0, 10).forEach((inp, i) => {
      console.log(`\n  [${i}] <${inp.tag} type=${inp.type} name=${inp.name}>`);
      console.log(`    classes="${inp.classes}"`);
      console.log(`    placeholder="${inp.placeholder}" required=${inp.required}`);
      console.log(`    DEFAULT: padding=${inp.default.padding}`);
      console.log(`             border=${inp.default.border}  radius=${inp.default.borderRadius}`);
      console.log(`             bg=${inp.default.background}  color=${inp.default.color}`);
      console.log(`             font=${inp.default.fontSize}/${inp.default.fontWeight}/${inp.default.lineHeight}`);
      console.log(`             height=${inp.default.height}  shadow="${inp.default.boxShadow}"`);
      console.log(`    PLACEHOLDER: color=${inp.placeholder_style.color} opacity=${inp.placeholder_style.opacity}`);
      if (inp.label) {
        console.log(`    LABEL: "${inp.label.text}"  display=${inp.label.display}  fontSize=${inp.label.fontSize}/${inp.label.fontWeight}`);
        console.log(`           marginBottom=${inp.label.marginBottom}  position=${inp.label.position}`);
      } else {
        console.log(`    LABEL: (none associated)`);
      }
    });
    if (d.focusStyle) {
      console.log(`\n  FOCUS state (first text-like input):`);
      console.log(`    border=${d.focusStyle.border}  radius=${d.focusStyle.borderRadius}`);
      console.log(`    bg=${d.focusStyle.background}`);
      console.log(`    boxShadow="${d.focusStyle.boxShadow}"`);
      console.log(`    outline="${d.focusStyle.outline}"  offset=${d.focusStyle.outlineOffset}`);
    }
    if (d.errorPattern.length > 0) {
      console.log(`\n  ERROR pattern elements (${d.errorPattern.length}):`);
      d.errorPattern.slice(0, 5).forEach((e) => {
        console.log(`    [${e.selector}] <${e.tag} class="${e.classes.slice(0, 60)}"> visible=${e.visible} text="${e.textPreview}"`);
        console.log(`      display=${e.display}  color=${e.color}  fontSize=${e.fontSize}`);
      });
    }
  }

  await fs.mkdir('audit-output/design-1', { recursive: true });
  await fs.writeFile('audit-output/design-1/input-styles-probe.json', JSON.stringify(aggregate, null, 2));
  console.log('\nWrote audit-output/design-1/input-styles-probe.json');
}

main().catch((err) => { console.error(err); process.exit(1); });
