// scripts/design/probe-richtext-styles.mjs
// Step 2.8 / HALT 4 — B3 PortableText probe (Hard Rule #2).
//
// Pass 1: enumerate every distinct HTML element + inline mark appearing inside
//   CE's `.rich-content.w-richtext` (Webflow rich-text blocks). This determines
//   the block-types and mark-types that the PortableText renderer must
//   support when consuming Sanity body fields migrated by CONTENT-1C.
//
// Pass 2 (separate script): inspect the actual Portable-Text JSON in Sanity
//   for one blogPost / customerStory to verify alignment.

import { chromium } from 'playwright';
import fs from 'node:fs/promises';

// Mix of blog posts + AI articles + customer stories where rich-content lives.
const PAGES = [
  'https://cloudemployee.io/ai-in-software-development/securing-ai-the-ctos-guide-to-validation-and-minimum-safety-standards',
  'https://cloudemployee.io/ai-in-software-development/shaping-whats-next-how-future-forward-is-advancing-ai-at-cloud-employee',
  'https://cloudemployee.io/ai-in-software-development/why-staff-augmentation-matters-in-the-age-of-ai',
  'https://cloudemployee.io/customer-stories',
  'https://cloudemployee.io/scaling-teams/building-a-software-development-team-core-roles-dedicated-dev',
];

async function probeRichText(p) {
  return p.evaluate(() => {
    const out = { blocks: {}, marks: {}, customClasses: new Map(), nestingPatterns: new Set() };

    document.querySelectorAll('.rich-content, .w-richtext, [class*="rich-content"]').forEach((wrapper) => {
      // 1. Block-level elements (direct + nested children)
      wrapper.querySelectorAll(':scope > *, :scope > * > *').forEach((el) => {
        const tag = el.tagName.toLowerCase();
        if (!out.blocks[tag]) out.blocks[tag] = { count: 0, samples: [], classes: new Set() };
        out.blocks[tag].count++;
        const text = (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 50);
        const cls = typeof el.className === 'string' ? el.className.slice(0, 80) : '';
        if (out.blocks[tag].samples.length < 3) out.blocks[tag].samples.push({ text, classes: cls });
        if (cls) out.blocks[tag].classes.add(cls);
      });

      // 2. Inline marks (em, strong, a, code, mark, sub, sup, kbd) — anywhere in tree
      ['em', 'strong', 'a', 'code', 'mark', 'sub', 'sup', 'kbd', 'b', 'i', 'u', 's', 'del', 'ins'].forEach((tag) => {
        const found = wrapper.querySelectorAll(tag);
        if (found.length === 0) return;
        if (!out.marks[tag]) out.marks[tag] = { count: 0, samples: [], hrefSamples: [] };
        out.marks[tag].count += found.length;
        found.forEach((el) => {
          const text = (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40);
          if (out.marks[tag].samples.length < 3) out.marks[tag].samples.push(text);
          if (tag === 'a' && el.href) {
            const isExternal = !el.href.startsWith(window.location.origin);
            if (out.marks[tag].hrefSamples.length < 3) out.marks[tag].hrefSamples.push({ href: el.href.slice(0, 80), external: isExternal });
          }
        });
      });

      // 3. Lists — capture ul/ol structure
      wrapper.querySelectorAll('ul, ol').forEach((list) => {
        const tag = list.tagName.toLowerCase();
        const itemCount = list.querySelectorAll(':scope > li').length;
        const nested = !!list.closest('ul, ol').parentElement?.closest('ul, ol');
        out.nestingPatterns.add(`${tag}: items=${itemCount} nested=${nested}`);
      });

      // 4. Custom Webflow embeds (figure, blockquote, iframe, picture)
      wrapper.querySelectorAll('figure, blockquote, iframe, picture, video, table, hr, pre').forEach((el) => {
        const tag = el.tagName.toLowerCase();
        if (!out.blocks[tag]) out.blocks[tag] = { count: 0, samples: [], classes: new Set() };
        // already counted above; just track nested presence
      });
    });

    // Convert sets to arrays for JSON serialization
    for (const tag of Object.keys(out.blocks)) {
      out.blocks[tag].classes = [...out.blocks[tag].classes];
    }
    out.nestingPatterns = [...out.nestingPatterns];
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
      await p.waitForTimeout(800);
      const data = await probeRichText(p);
      aggregate[slug] = data;
      const blockSummary = Object.entries(data.blocks).map(([t, g]) => `${t}=${g.count}`).join(' ');
      const markSummary = Object.entries(data.marks).map(([t, g]) => `${t}=${g.count}`).join(' ');
      console.log(`\n--- ${slug} ---`);
      console.log(`  blocks: ${blockSummary || '(none)'}`);
      console.log(`  marks:  ${markSummary || '(none)'}`);
      console.log(`  nesting: ${data.nestingPatterns.join(' | ')}`);
      await ctx.close();
    }
  } finally {
    await browser.close();
  }

  // Aggregate
  console.log('\n=== B3 PORTABLETEXT — aggregate block + mark inventory ===');
  const blockTotals = {};
  const markTotals = {};
  const blockClasses = {};
  for (const slug of Object.keys(aggregate)) {
    for (const [tag, g] of Object.entries(aggregate[slug].blocks)) {
      blockTotals[tag] = (blockTotals[tag] || 0) + g.count;
      if (!blockClasses[tag]) blockClasses[tag] = new Set();
      g.classes.forEach((c) => blockClasses[tag].add(c));
    }
    for (const [tag, g] of Object.entries(aggregate[slug].marks)) {
      markTotals[tag] = (markTotals[tag] || 0) + g.count;
    }
  }
  console.log('\n--- BLOCK TYPES (rich-content children) ---');
  for (const [tag, count] of [...Object.entries(blockTotals)].sort((a, b) => b[1] - a[1])) {
    const classes = [...blockClasses[tag]].slice(0, 5);
    console.log(`  <${tag}> ${count}× | distinct-classes-seen: ${classes.length} ${classes.length ? '— ' + classes.slice(0,3).join(' | ') : ''}`);
  }
  console.log('\n--- INLINE MARKS ---');
  for (const [tag, count] of [...Object.entries(markTotals)].sort((a, b) => b[1] - a[1])) {
    const examples = [];
    for (const slug of Object.keys(aggregate)) {
      if (aggregate[slug].marks[tag]) {
        examples.push(...aggregate[slug].marks[tag].samples.slice(0, 1));
      }
    }
    console.log(`  <${tag}> ${count}× | examples: ${examples.slice(0, 3).map((e) => `"${e}"`).join(' | ')}`);
  }

  // Anchor href patterns — internal vs external split for Link primitive
  console.log('\n--- ANCHOR (a) — internal vs external split ---');
  let intCount = 0, extCount = 0;
  for (const slug of Object.keys(aggregate)) {
    const aMark = aggregate[slug].marks.a;
    if (!aMark) continue;
    aMark.hrefSamples.forEach((h) => { if (h.external) extCount++; else intCount++; });
  }
  console.log(`  internal samples=${intCount} | external samples=${extCount}`);

  await fs.mkdir('audit-output/design-1', { recursive: true });
  await fs.writeFile('audit-output/design-1/richtext-styles-probe.json', JSON.stringify(aggregate, null, 2));
  console.log('\nWrote audit-output/design-1/richtext-styles-probe.json');
}

main().catch((err) => { console.error(err); process.exit(1); });
