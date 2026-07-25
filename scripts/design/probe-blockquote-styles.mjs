// scripts/design/probe-blockquote-styles.mjs
// HALT 4 Decision 6 — focused probe for CE blockquote computed styling.
// Probe-1 found 1 blockquote on /ai-in-software-development/why-staff-
// augmentation-matters-in-the-age-of-ai. Capture full computed style
// before locking the PortableText blockquote rendering.

import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  try {
    await p.goto(
      'https://cloudemployee.io/ai-in-software-development/why-staff-augmentation-matters-in-the-age-of-ai',
      { waitUntil: 'networkidle', timeout: 60_000 },
    );
  } catch {
    await p.goto(
      'https://cloudemployee.io/ai-in-software-development/why-staff-augmentation-matters-in-the-age-of-ai',
      { waitUntil: 'domcontentloaded', timeout: 60_000 },
    );
  }
  await p.waitForTimeout(1500);

  const data = await p.evaluate(() => {
    const out = [];
    document.querySelectorAll('blockquote').forEach((el) => {
      const cs = getComputedStyle(el);
      out.push({
        outerHTML: el.outerHTML.slice(0, 600),
        classes: typeof el.className === 'string' ? el.className : '',
        text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 100),
        // Borders (each side)
        borderTop: `${cs.borderTopWidth} ${cs.borderTopStyle} ${cs.borderTopColor}`,
        borderRight: `${cs.borderRightWidth} ${cs.borderRightStyle} ${cs.borderRightColor}`,
        borderBottom: `${cs.borderBottomWidth} ${cs.borderBottomStyle} ${cs.borderBottomColor}`,
        borderLeft: `${cs.borderLeftWidth} ${cs.borderLeftStyle} ${cs.borderLeftColor}`,
        // Spacing
        padding: [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].join(' '),
        margin: [cs.marginTop, cs.marginRight, cs.marginBottom, cs.marginLeft].join(' '),
        // Typography
        fontSize: cs.fontSize,
        fontStyle: cs.fontStyle,
        fontWeight: cs.fontWeight,
        lineHeight: cs.lineHeight,
        textAlign: cs.textAlign,
        // Surface
        backgroundColor: cs.backgroundColor,
        color: cs.color,
        // Quote marks (typographic)
        quotes: cs.quotes,
        // Pseudo-elements
        beforeContent: getComputedStyle(el, '::before').content,
        afterContent: getComputedStyle(el, '::after').content,
      });
    });
    return out;
  });

  console.log('=== CE BLOCKQUOTE COMPUTED STYLE ===\n');
  if (data.length === 0) {
    console.log('(no blockquote found)');
  } else {
    data.forEach((q, i) => {
      console.log(`[${i}] class="${q.classes}"`);
      console.log(`    text="${q.text}"`);
      console.log(`    --- TYPOGRAPHY ---`);
      console.log(`    fontSize=${q.fontSize}  fontStyle=${q.fontStyle}  fontWeight=${q.fontWeight}`);
      console.log(`    lineHeight=${q.lineHeight}  textAlign=${q.textAlign}`);
      console.log(`    color=${q.color}`);
      console.log(`    --- SURFACE ---`);
      console.log(`    backgroundColor=${q.backgroundColor}`);
      console.log(`    --- BORDERS ---`);
      console.log(`    border-top:    ${q.borderTop}`);
      console.log(`    border-right:  ${q.borderRight}`);
      console.log(`    border-bottom: ${q.borderBottom}`);
      console.log(`    border-left:   ${q.borderLeft}`);
      console.log(`    --- SPACING ---`);
      console.log(`    padding=${q.padding}`);
      console.log(`    margin=${q.margin}`);
      console.log(`    --- PSEUDO ---`);
      console.log(`    quotes="${q.quotes}"  ::before="${q.beforeContent}"  ::after="${q.afterContent}"`);
      console.log(`    --- HTML (first 600 chars) ---`);
      console.log(`    ${q.outerHTML}`);
    });
  }
  await browser.close();
}

main().catch((err) => { console.error(err); process.exit(1); });
