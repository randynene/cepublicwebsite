// scripts/design/probe-text-styles.mjs
// Step 2.7 — B2 Text body-typography probe (Hard Rule #2).
//
// Goals:
//   1. Per <p> / lead-class / caption-class: computed font-size + line-height
//      + font-weight + color per breakpoint.
//   2. Distribution — how many distinct body sizes does CE actually use?
//   3. Are sizes tied to a tone axis (default / muted / inverted) or a
//      size axis (small / default / lead) or both?
//   4. Is there a body+lead distinction (large intro paragraph)?
//
// Three viewport widths matching CE breakpoints:
//   - 375px (mobile)
//   - 768px (tablet)
//   - 1440px (desktop)
//
// Pages chosen for body-text density: homepage, /technology (technology
// listing intro paragraphs), /services (service description bodies),
// /customer-stories (story summary bodies), and a blog post detail
// (rich-content paragraphs in article body).

import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const PAGES = [
  'https://cloudemployee.io/',
  'https://cloudemployee.io/technology',
  'https://cloudemployee.io/services',
  'https://cloudemployee.io/customer-stories',
  'https://cloudemployee.io/ai-in-software-development/securing-ai-the-ctos-guide-to-validation-and-minimum-safety-standards',
];

const VIEWPORTS = [
  { name: 'mobile',  width: 375,  height: 812 },
  { name: 'tablet',  width: 768,  height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
];

async function probeText(p) {
  return p.evaluate(() => {
    const out = { ps: [], leadCandidates: [], captionCandidates: [] };

    // 1. All <p> elements
    document.querySelectorAll('p').forEach((el) => {
      const cs = getComputedStyle(el);
      const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
      if (!text) return;
      if (cs.display === 'none' || cs.visibility === 'hidden') return;

      // role-context — is this in a hero, lead, card body, footer, etc.?
      const inHero = !!el.closest('[class*="hero"], [class*="banner"]');
      const inFooter = !!el.closest('footer');
      const inCard = !!el.closest('[class*="card"], [class*="grid-item"], [class*="resources-item"], [class*="testimon"]');
      const inArticle = !!el.closest('article, [class*="rich-content"], [class*="w-richtext"]');
      const inForm = !!el.closest('form');

      // explicit class indicators — leads, captions, etc.
      const cls = typeof el.className === 'string' ? el.className.toLowerCase() : '';
      const hasLeadClass = /lead|intro|sub-?heading|hero-text|preamble/.test(cls);
      const hasCaptionClass = /caption|small|note|disclaimer|footnote/.test(cls);

      out.ps.push({
        text: text.slice(0, 60),
        textLen: text.length,
        classes: typeof el.className === 'string' ? el.className.slice(0, 100) : '',
        fontSize: cs.fontSize,
        lineHeight: cs.lineHeight,
        fontWeight: cs.fontWeight,
        color: cs.color,
        textAlign: cs.textAlign,
        marginTop: cs.marginTop,
        marginBottom: cs.marginBottom,
        inHero,
        inFooter,
        inCard,
        inArticle,
        inForm,
        hasLeadClass,
        hasCaptionClass,
      });
    });

    // 2. Lead-text candidates by sibling/style heuristic — large paragraph that
    //    immediately follows a heading and has font-size > 16px.
    document.querySelectorAll('h1, h2').forEach((heading) => {
      let next = heading.nextElementSibling;
      // skip wrapper divs that contain the lead
      if (next && next.tagName !== 'P' && next.children.length > 0) {
        const innerP = next.querySelector(':scope > p');
        if (innerP) next = innerP;
      }
      if (!next || next.tagName.toLowerCase() !== 'p') return;
      const cs = getComputedStyle(next);
      const fontSize = parseFloat(cs.fontSize) || 0;
      if (fontSize < 17) return; // body or smaller — not a lead
      const text = (next.textContent || '').replace(/\s+/g, ' ').trim();
      if (!text) return;
      out.leadCandidates.push({
        text: text.slice(0, 60),
        afterHeading: heading.tagName.toLowerCase(),
        classes: typeof next.className === 'string' ? next.className.slice(0, 100) : '',
        fontSize: cs.fontSize,
        lineHeight: cs.lineHeight,
        fontWeight: cs.fontWeight,
        color: cs.color,
      });
    });

    // 3. Caption-style candidates — small text under images, in figcaptions, or
    //    sized below body-sm
    document.querySelectorAll('figcaption, [class*="caption"], small, [class*="small-text"], [class*="footnote"], [class*="disclaim"]').forEach((el) => {
      const cs = getComputedStyle(el);
      const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
      if (!text) return;
      if (cs.display === 'none' || cs.visibility === 'hidden') return;
      out.captionCandidates.push({
        tag: el.tagName.toLowerCase(),
        text: text.slice(0, 50),
        classes: typeof el.className === 'string' ? el.className.slice(0, 80) : '',
        fontSize: cs.fontSize,
        lineHeight: cs.lineHeight,
        fontWeight: cs.fontWeight,
        color: cs.color,
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
      aggregate[slug] = {};
      console.log(`\n=== ${slug} ===`);
      for (const vp of VIEWPORTS) {
        const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
        const p = await ctx.newPage();
        try { await p.goto(url, { waitUntil: 'networkidle', timeout: 60_000 }); }
        catch { await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 }); }
        await p.waitForTimeout(800);
        const data = await probeText(p);
        aggregate[slug][vp.name] = data;
        console.log(`  [${vp.name} ${vp.width}px] p=${data.ps.length} lead-candidates=${data.leadCandidates.length} caption-candidates=${data.captionCandidates.length}`);
        await ctx.close();
      }
    }
  } finally {
    await browser.close();
  }

  // Aggregate by breakpoint — distinct font-size + line-height + weight signatures
  console.log('\n=== B2 TEXT — distinct <p> signatures per breakpoint ===');
  const sigByVp = {};
  for (const vp of VIEWPORTS) {
    sigByVp[vp.name] = new Map();
    for (const slug of Object.keys(aggregate)) {
      for (const e of aggregate[slug][vp.name].ps) {
        const sig = `${e.fontSize}|lh=${e.lineHeight}|w=${e.fontWeight}|color=${e.color}`;
        if (!sigByVp[vp.name].has(sig)) sigByVp[vp.name].set(sig, { count: 0, samples: [], contexts: { hero: 0, footer: 0, card: 0, article: 0, form: 0 }, classGroups: new Map() });
        const g = sigByVp[vp.name].get(sig);
        g.count++;
        if (g.samples.length < 3) g.samples.push({ slug, text: e.text.slice(0, 50), classes: e.classes.slice(0, 60) });
        if (e.inHero) g.contexts.hero++;
        if (e.inFooter) g.contexts.footer++;
        if (e.inCard) g.contexts.card++;
        if (e.inArticle) g.contexts.article++;
        if (e.inForm) g.contexts.form++;
        const firstClass = e.classes.split(/\s+/).filter(Boolean)[0] || '(no-class)';
        g.classGroups.set(firstClass, (g.classGroups.get(firstClass) || 0) + 1);
      }
    }
  }

  for (const vp of VIEWPORTS) {
    const map = sigByVp[vp.name];
    const sorted = [...map.entries()].sort((a, b) => b[1].count - a[1].count);
    console.log(`\n--- [${vp.name}] ${sorted.length} distinct signatures ---`);
    for (const [sig, g] of sorted) {
      if (g.count < 2) continue; // filter one-off noise
      const ctx = Object.entries(g.contexts).filter(([, n]) => n > 0).map(([k, n]) => `${k}=${n}`).join(' ');
      const cls = [...g.classGroups.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([c, n]) => `${c}×${n}`).join(' | ');
      console.log(`  [${g.count}×] ${sig}`);
      console.log(`        contexts: ${ctx || '(none specific)'}`);
      console.log(`        class-groups: ${cls}`);
      g.samples.forEach((s) => console.log(`        [${s.slug}] "${s.text}"  class="${s.classes}"`));
    }
  }

  // Lead-candidate aggregate
  console.log('\n=== LEAD CANDIDATES (paragraphs immediately after h1/h2 with fontSize ≥ 17px) ===');
  const leadSigs = new Map();
  for (const slug of Object.keys(aggregate)) {
    for (const lc of aggregate[slug].desktop.leadCandidates) {
      const sig = `${lc.fontSize}|lh=${lc.lineHeight}|w=${lc.fontWeight}`;
      if (!leadSigs.has(sig)) leadSigs.set(sig, { count: 0, samples: [] });
      const g = leadSigs.get(sig);
      g.count++;
      if (g.samples.length < 3) g.samples.push({ slug, text: lc.text, afterHeading: lc.afterHeading, classes: lc.classes });
    }
  }
  for (const [sig, g] of [...leadSigs.entries()].sort((a, b) => b[1].count - a[1].count)) {
    console.log(`\n  [${g.count}×] ${sig}`);
    g.samples.forEach((s) => console.log(`     [${s.slug}] after-${s.afterHeading} "${s.text}"  class="${s.classes}"`));
  }

  // Caption aggregate
  console.log('\n=== CAPTION / SMALL-TEXT CANDIDATES ===');
  const captionSigs = new Map();
  for (const slug of Object.keys(aggregate)) {
    for (const c of aggregate[slug].desktop.captionCandidates) {
      const sig = `${c.fontSize}|lh=${c.lineHeight}|w=${c.fontWeight}`;
      if (!captionSigs.has(sig)) captionSigs.set(sig, { count: 0, samples: [] });
      const g = captionSigs.get(sig);
      g.count++;
      if (g.samples.length < 3) g.samples.push({ slug, tag: c.tag, text: c.text, classes: c.classes });
    }
  }
  for (const [sig, g] of [...captionSigs.entries()].sort((a, b) => b[1].count - a[1].count)) {
    console.log(`\n  [${g.count}×] ${sig}`);
    g.samples.forEach((s) => console.log(`     [${s.slug}] <${s.tag}> "${s.text}"  class="${s.classes}"`));
  }

  await fs.mkdir('audit-output/design-1', { recursive: true });
  await fs.writeFile('audit-output/design-1/text-styles-probe.json', JSON.stringify(aggregate, null, 2));
  console.log('\nWrote audit-output/design-1/text-styles-probe.json');
}

main().catch((err) => { console.error(err); process.exit(1); });
