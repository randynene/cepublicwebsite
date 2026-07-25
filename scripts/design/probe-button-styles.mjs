// scripts/design/probe-button-styles.mjs
// HALT 1B Action 1 — live-site probe before locking secondary-outline + tertiary-ghost.

import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const PAGES = [
  'https://cloudemployee.io/',
  'https://cloudemployee.io/technology',
  'https://cloudemployee.io/services',
  'https://cloudemployee.io/customer-stories',
  'https://cloudemployee.io/ai-in-software-development/securing-ai-the-ctos-guide-to-validation-and-minimum-safety-standards',
];

async function probe(p, url) {
  return p.evaluate(() => {
    const out = { secondaryButtons: [], ghostCandidates: [] };

    // 1a — .secondary-button
    document.querySelectorAll('[class*="secondary-button"]').forEach((el) => {
      const cs = getComputedStyle(el);
      out.secondaryButtons.push({
        tag: el.tagName.toLowerCase(),
        classes: typeof el.className === 'string' ? el.className.slice(0, 120) : '',
        text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 50),
        bg: cs.backgroundColor,
        color: cs.color,
        borderTop: `${cs.borderTopWidth} ${cs.borderTopStyle} ${cs.borderTopColor}`,
        padding: [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].join(' '),
        fontWeight: cs.fontWeight,
        fontSize: cs.fontSize,
        borderRadius: cs.borderRadius,
      });
    });

    // 1b — ghost-style button candidates:
    //   transparent bg + no visible border + brand-teal text + used as button or link
    const TEAL = 'rgb(28, 120, 124)';
    const TRANSPARENT_BGS = new Set([
      'rgba(0, 0, 0, 0)',
      'rgba(255, 255, 255, 0)',
      'transparent',
    ]);

    document.querySelectorAll('a, button, [role="button"]').forEach((el) => {
      const cs = getComputedStyle(el);
      if (!TRANSPARENT_BGS.has(cs.backgroundColor)) return;
      const hasBorder = parseFloat(cs.borderTopWidth) > 0 || parseFloat(cs.borderLeftWidth) > 0;
      if (hasBorder) return;
      if (cs.color !== TEAL) return;
      // Looks like a ghost — capture
      out.ghostCandidates.push({
        tag: el.tagName.toLowerCase(),
        classes: typeof el.className === 'string' ? el.className.slice(0, 120) : '',
        text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 50),
        bg: cs.backgroundColor,
        color: cs.color,
        padding: [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].join(' '),
        fontWeight: cs.fontWeight,
        textDecoration: cs.textDecorationLine,
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
      console.log(`\n--- ${slug} ---`);
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const p = await ctx.newPage();
      try {
        await p.goto(url, { waitUntil: 'networkidle', timeout: 60_000 });
      } catch {
        await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
      }
      await p.waitForTimeout(800);
      const data = await probe(p, url);
      aggregate[slug] = data;
      console.log('  .secondary-button matches:', data.secondaryButtons.length);
      console.log('  ghost-candidate matches:  ', data.ghostCandidates.length);
      await ctx.close();
    }
  } finally {
    await browser.close();
  }

  console.log('\n=== AGGREGATE — .secondary-button across 5 pages ===');
  let totalSecondary = 0;
  for (const [slug, d] of Object.entries(aggregate)) {
    for (const e of d.secondaryButtons) {
      totalSecondary++;
      console.log(`[${slug}] <${e.tag} class="${e.classes}"> "${e.text}"`);
      console.log(`        bg=${e.bg}  color=${e.color}  border=${e.borderTop}  radius=${e.borderRadius}`);
      console.log(`        padding=${e.padding}  fontWeight=${e.fontWeight}  fontSize=${e.fontSize}`);
    }
  }
  if (totalSecondary === 0) console.log('  (zero .secondary-button matches across all 5 pages)');

  console.log('\n=== AGGREGATE — ghost-style candidates across 5 pages ===');
  let totalGhost = 0;
  for (const [slug, d] of Object.entries(aggregate)) {
    for (const e of d.ghostCandidates) {
      totalGhost++;
      console.log(`[${slug}] <${e.tag} class="${e.classes}"> "${e.text}"`);
      console.log(`        bg=${e.bg}  color=${e.color}  padding=${e.padding}  textDecor=${e.textDecoration}`);
    }
  }
  if (totalGhost === 0) console.log('  (zero ghost-style button candidates across all 5 pages)');

  await fs.mkdir('audit-output/design-1', { recursive: true });
  await fs.writeFile('audit-output/design-1/button-styles-probe.json', JSON.stringify(aggregate, null, 2));
  console.log('\nWrote audit-output/design-1/button-styles-probe.json');
}

main().catch((err) => { console.error(err); process.exit(1); });
