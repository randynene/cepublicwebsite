// scripts/design/probe-accordion-marquee-styles.mjs
// Step 2.5 + 2.6 — probe CE for A5 Accordion + A6 Marquee (Hard Rule #2).
//
// A5 Accordion target pages: /technology has .s-accordion / .faq-item /
//   .accordion-trigger-* / .accordion-content-* (audit-output grep confirmed).
//   Capture: structure, opens-by-default, single-vs-multi-open, transition
//   timing, chevron behavior, padding, border, type tokens.
//
// A6 Marquee target pages: /home, /for-developers, /about-us all carry
//   marquee variants. Brief asserted .staff-benefits-marquee — does not
//   exist in CE source. Real classes: .marquee, .marquee-list, .cc-marquee,
//   .marquee-wrap-tech, .logos-marquee. Capture: direction, animation
//   duration, item-count, pause-on-hover, edge-fade/mask, distinct visual
//   variants.

import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const PAGES = {
  accordion: ['https://cloudemployee.io/technology'],
  marquee: [
    'https://cloudemployee.io/',
    'https://cloudemployee.io/for-developers',
    'https://cloudemployee.io/about-us',
  ],
};

async function probeAccordion(p) {
  return p.evaluate(() => {
    const out = { items: [], structure: null, computed: {} };
    const items = document.querySelectorAll('.faq-item, .s-accordion .accordion, .accordion-item, [class*="accordion-trigger"]');
    items.forEach((el) => {
      const cs = getComputedStyle(el);
      const trigger = el.querySelector('[class*="accordion-trigger"], button, [role="button"], summary');
      const content = el.querySelector('[class*="accordion-content"], [role="region"]');
      const chevron = el.querySelector('svg, [class*="chevron"], [class*="arrow"], [class*="caret"]');
      const triggerText = trigger ? trigger.textContent.replace(/\s+/g, ' ').trim().slice(0, 80) : null;
      const isOpen =
        el.getAttribute('aria-expanded') === 'true' ||
        el.getAttribute('data-state') === 'open' ||
        (content ? getComputedStyle(content).display !== 'none' && content.offsetHeight > 0 : false);
      out.items.push({
        classes: typeof el.className === 'string' ? el.className.slice(0, 120) : '',
        tag: el.tagName.toLowerCase(),
        triggerText,
        triggerTag: trigger ? trigger.tagName.toLowerCase() : null,
        contentTag: content ? content.tagName.toLowerCase() : null,
        contentClasses: content && typeof content.className === 'string' ? content.className.slice(0, 80) : '',
        contentTransition: content ? getComputedStyle(content).transition : null,
        contentMaxHeight: content ? getComputedStyle(content).maxHeight : null,
        contentOverflow: content ? getComputedStyle(content).overflow : null,
        chevronTransition: chevron ? getComputedStyle(chevron).transition : null,
        chevronTransform: chevron ? getComputedStyle(chevron).transform : null,
        isOpen,
        ariaExpanded: el.getAttribute('aria-expanded'),
        dataState: el.getAttribute('data-state'),
        outerWidth: el.getBoundingClientRect().width,
        borderRadius: cs.borderRadius,
        padding: [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].join(' '),
        backgroundColor: cs.backgroundColor,
        borderTop: `${cs.borderTopWidth} ${cs.borderTopStyle} ${cs.borderTopColor}`,
      });
    });
    // Track parent-container behavior for single-vs-multi-open detection
    const parent = document.querySelector('.s-accordion, [class*="accordion-wrap"]');
    if (parent) {
      out.structure = {
        parentClasses: typeof parent.className === 'string' ? parent.className.slice(0, 120) : '',
        childCount: parent.querySelectorAll('.faq-item, .accordion-item, [class*="accordion-trigger"]').length,
      };
    }
    return out;
  });
}

async function probeMarquee(p) {
  return p.evaluate(() => {
    const out = { instances: [] };
    const candidates = document.querySelectorAll(
      '[class*="marquee"], [class*="ticker"], [data-marquee-state]'
    );
    const seen = new Set();
    candidates.forEach((el) => {
      // Dedupe — top-level marquee containers only (skip the ::list inside)
      const parent = el.parentElement;
      if (parent && parent.matches('[class*="marquee"]')) return;
      if (seen.has(el)) return;
      seen.add(el);

      const cs = getComputedStyle(el);
      const list = el.querySelector('[class*="marquee-list"]') || el.firstElementChild;
      const listCs = list ? getComputedStyle(list) : null;
      const items = list ? Array.from(list.children) : [];
      const itemCount = items.length;
      const firstItem = items[0];
      const itemSig = firstItem ? {
        tag: firstItem.tagName.toLowerCase(),
        classes: typeof firstItem.className === 'string' ? firstItem.className.slice(0, 80) : '',
        text: (firstItem.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 50),
        hasImg: !!firstItem.querySelector('img'),
      } : null;

      // Animation introspection — Webflow marquees use CSS @keyframes typically
      const listAnimation = listCs ? listCs.animation : '';
      const listAnimationDuration = listCs ? listCs.animationDuration : '';
      const listAnimationDirection = listCs ? listCs.animationDirection : '';
      const listAnimationPlayState = listCs ? listCs.animationPlayState : '';
      const listTransform = listCs ? listCs.transform : '';

      // Edge-fade detection — common Webflow pattern uses CSS mask-image or pseudo-element
      const maskImage = cs.maskImage || cs.webkitMaskImage || 'none';
      const overflow = cs.overflow;

      // Pause-on-hover: data-marquee-state attr or :hover rule (we'll inspect via attribute)
      const hasPauseAttr = !!el.hasAttribute('data-marquee-state');

      out.instances.push({
        tag: el.tagName.toLowerCase(),
        classes: typeof el.className === 'string' ? el.className.slice(0, 140) : '',
        listClasses: list && typeof list.className === 'string' ? list.className.slice(0, 100) : '',
        itemCount,
        itemSig,
        listAnimation: listAnimation.slice(0, 100),
        listAnimationDuration,
        listAnimationDirection,
        listAnimationPlayState,
        listTransformPreview: listTransform.slice(0, 60),
        maskImage: maskImage.slice(0, 80),
        overflow,
        hasPauseAttr,
        outerWidth: el.getBoundingClientRect().width,
      });
    });
    return out;
  });
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const aggregate = { accordion: {}, marquee: {} };

  try {
    // ACCORDION pass
    for (const url of PAGES.accordion) {
      const slug = url.split('cloudemployee.io')[1] || '/';
      console.log(`\n=== ACCORDION pass: ${slug} ===`);
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const p = await ctx.newPage();
      try { await p.goto(url, { waitUntil: 'networkidle', timeout: 60_000 }); }
      catch { await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 }); }
      await p.waitForTimeout(1500);
      const data = await probeAccordion(p);
      aggregate.accordion[slug] = data;
      console.log(`  items found: ${data.items.length}`);
      console.log(`  structure: ${JSON.stringify(data.structure)}`);
      data.items.slice(0, 3).forEach((it, i) => {
        console.log(`  [${i}] tag=${it.tag} class="${it.classes.slice(0,60)}"`);
        console.log(`      trigger=${it.triggerTag} text="${(it.triggerText || '').slice(0,40)}"`);
        console.log(`      content tag=${it.contentTag} maxHeight=${it.contentMaxHeight} overflow=${it.contentOverflow}`);
        console.log(`      transitions: content="${it.contentTransition}" chevron="${it.chevronTransition}" chevronTransform="${it.chevronTransform}"`);
        console.log(`      open=${it.isOpen} aria-expanded=${it.ariaExpanded} data-state=${it.dataState}`);
        console.log(`      padding=${it.padding} radius=${it.borderRadius} bg=${it.backgroundColor} borderTop="${it.borderTop}"`);
      });
      // open-state aggregate
      const openCount = data.items.filter(it => it.isOpen).length;
      console.log(`  open-on-load: ${openCount}/${data.items.length}`);
      await ctx.close();
    }

    // MARQUEE pass
    for (const url of PAGES.marquee) {
      const slug = url.split('cloudemployee.io')[1] || '/';
      console.log(`\n=== MARQUEE pass: ${slug} ===`);
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const p = await ctx.newPage();
      try { await p.goto(url, { waitUntil: 'networkidle', timeout: 60_000 }); }
      catch { await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 }); }
      await p.waitForTimeout(2000); // marquees animate; let them settle
      const data = await probeMarquee(p);
      aggregate.marquee[slug] = data;
      console.log(`  marquee instances found: ${data.instances.length}`);
      data.instances.forEach((mq, i) => {
        console.log(`  [${i}] <${mq.tag} class="${mq.classes.slice(0,80)}">`);
        console.log(`       list="${mq.listClasses.slice(0,60)}" items=${mq.itemCount} firstItem.hasImg=${mq.itemSig?.hasImg}`);
        console.log(`       animation: "${mq.listAnimation}" duration=${mq.listAnimationDuration} direction=${mq.listAnimationDirection}`);
        console.log(`       playState=${mq.listAnimationPlayState} hasPauseAttr=${mq.hasPauseAttr}`);
        console.log(`       mask: "${mq.maskImage}" overflow=${mq.overflow}`);
      });
      await ctx.close();
    }
  } finally {
    await browser.close();
  }

  // Aggregate marquee distinct visual signatures
  console.log('\n=== A6 MARQUEE — distinct animation signatures ===');
  const sigs = new Map();
  for (const slug of Object.keys(aggregate.marquee)) {
    for (const mq of aggregate.marquee[slug].instances) {
      const key = `${mq.listAnimationDuration}|${mq.listAnimationDirection}|${mq.maskImage.slice(0,30)}`;
      if (!sigs.has(key)) sigs.set(key, { count: 0, samples: [], classes: new Set() });
      const g = sigs.get(key);
      g.count++;
      if (g.samples.length < 3) g.samples.push({ slug, classes: mq.classes.slice(0, 60), itemCount: mq.itemCount, hasImg: mq.itemSig?.hasImg });
      const tokens = mq.classes.split(/\s+/);
      tokens.forEach((t) => { if (/marquee|ticker/.test(t)) g.classes.add(t); });
    }
  }
  for (const [sig, g] of [...sigs.entries()].sort((a,b) => b[1].count - a[1].count)) {
    console.log(`\n  [${g.count}×] ${sig}`);
    console.log(`     classes seen: ${[...g.classes].slice(0,12).join(', ')}`);
    g.samples.forEach((s) => console.log(`     [${s.slug}] "${s.classes}" items=${s.itemCount} hasImg=${s.hasImg}`));
  }

  await fs.mkdir('audit-output/design-1', { recursive: true });
  await fs.writeFile(
    'audit-output/design-1/accordion-marquee-styles-probe.json',
    JSON.stringify(aggregate, null, 2),
  );
  console.log('\nWrote audit-output/design-1/accordion-marquee-styles-probe.json');
}

main().catch((err) => { console.error(err); process.exit(1); });
