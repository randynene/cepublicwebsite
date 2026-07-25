// scripts/design/probe-video-embeds.mjs
// Step 2.14 — E2 VideoEmbed probe (Hard Rule #2).
//
// Goals:
//   1. Confirm CE uses Vimeo only (vs YouTube / direct mp4 / etc.)
//   2. Capture iframe attributes: allow, allowfullscreen, loading
//   3. Capture aspect ratios (16:9 dominant?)
//   4. Capture autoplay/muted/loop patterns
//   5. Capture poster thumbnail usage (does CE preload posters?)

import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const PAGES = [
  'https://cloudemployee.io/',
  'https://cloudemployee.io/technology',
  'https://cloudemployee.io/services',
  'https://cloudemployee.io/customer-stories',
  'https://cloudemployee.io/videos/how-cloud-employee-keeps-remote-developers-motivated',
];

async function probe(p) {
  return p.evaluate(() => {
    const out = { iframes: [], videos: [], lazyVideoMarkers: [] };

    document.querySelectorAll('iframe').forEach((el) => {
      const src = el.getAttribute('src') || el.dataset.src || '';
      // Filter to video-provider iframes
      const isVimeo = /vimeo\.com|player\.vimeo\.com/.test(src);
      const isYoutube = /youtube\.com\/embed|youtube-nocookie\.com/.test(src);
      if (!isVimeo && !isYoutube) return;
      const rect = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      out.iframes.push({
        provider: isVimeo ? 'vimeo' : 'youtube',
        src: src.slice(0, 200),
        title: el.getAttribute('title'),
        allow: el.getAttribute('allow'),
        allowfullscreen: el.hasAttribute('allowfullscreen') || el.hasAttribute('allowFullScreen'),
        loading: el.getAttribute('loading'),
        width: el.getAttribute('width'),
        height: el.getAttribute('height'),
        renderedWidth: Math.round(rect.width),
        renderedHeight: Math.round(rect.height),
        aspectRatio: rect.width && rect.height ? (rect.width / rect.height).toFixed(3) : null,
        parentClasses: el.parentElement && typeof el.parentElement.className === 'string' ? el.parentElement.className.slice(0, 100) : '',
        position: cs.position,
      });
    });

    // <video> elements (rare on CE but possible)
    document.querySelectorAll('video').forEach((el) => {
      const cs = getComputedStyle(el);
      out.videos.push({
        src: el.getAttribute('src') || (el.querySelector('source')?.getAttribute('src') ?? ''),
        autoplay: el.hasAttribute('autoplay'),
        muted: el.hasAttribute('muted'),
        loop: el.hasAttribute('loop'),
        controls: el.hasAttribute('controls'),
        poster: el.getAttribute('poster'),
        playsInline: el.hasAttribute('playsinline'),
        width: el.getAttribute('width'),
        height: el.getAttribute('height'),
        objectFit: cs.objectFit,
      });
    });

    // Look for lazy-load markers (CE may use a placeholder div + click-to-embed)
    document.querySelectorAll('[data-vimeo-id], [data-video-id], [data-yt-id], [data-vimeo], .vimeo-lazy, .lite-youtube').forEach((el) => {
      out.lazyVideoMarkers.push({
        tag: el.tagName.toLowerCase(),
        classes: typeof el.className === 'string' ? el.className.slice(0, 80) : '',
        dataAttrs: Object.fromEntries(Array.from(el.attributes).filter(a => a.name.startsWith('data-')).map(a => [a.name, a.value])),
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
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const p = await ctx.newPage();
      try { await p.goto(url, { waitUntil: 'networkidle', timeout: 60_000 }); }
      catch { await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 }); }
      await p.waitForTimeout(1500);
      const data = await probe(p);
      aggregate[slug] = data;
      console.log(`[${slug}] iframes=${data.iframes.length} <video>=${data.videos.length} lazy-markers=${data.lazyVideoMarkers.length}`);
      await ctx.close();
    }
  } finally {
    await browser.close();
  }

  console.log('\n=== VIDEO IFRAMES (aggregate) ===');
  let totalVimeo = 0, totalYoutube = 0;
  const aspectRatios = new Set();
  const allowPatterns = new Set();
  for (const slug of Object.keys(aggregate)) {
    for (const f of aggregate[slug].iframes) {
      if (f.provider === 'vimeo') totalVimeo++;
      if (f.provider === 'youtube') totalYoutube++;
      aspectRatios.add(f.aspectRatio);
      allowPatterns.add(f.allow || '(none)');
      console.log(`  [${slug}] ${f.provider} | ${f.renderedWidth}×${f.renderedHeight} (ratio ${f.aspectRatio}) | loading=${f.loading || 'eager'} | allowfullscreen=${f.allowfullscreen}`);
      console.log(`     allow="${(f.allow || '').slice(0, 80)}"`);
      console.log(`     src=${f.src.slice(0, 100)}`);
    }
  }
  console.log(`\n  Total: vimeo=${totalVimeo}, youtube=${totalYoutube}`);
  console.log(`  Distinct aspect ratios: ${[...aspectRatios].join(', ')}`);
  console.log(`  Distinct allow= patterns: ${[...allowPatterns].slice(0, 3).map(p => `"${p}"`).join(' | ')}`);

  console.log('\n=== <video> elements (native HTML5) ===');
  let totalVideo = 0;
  for (const slug of Object.keys(aggregate)) {
    for (const v of aggregate[slug].videos) {
      totalVideo++;
      console.log(`  [${slug}] src="${v.src.slice(0, 60)}" autoplay=${v.autoplay} muted=${v.muted} loop=${v.loop} poster=${!!v.poster}`);
    }
  }
  console.log(`  Total <video>: ${totalVideo}`);

  console.log('\n=== Lazy-load markers (placeholder→embed pattern) ===');
  let totalMarkers = 0;
  for (const slug of Object.keys(aggregate)) {
    for (const m of aggregate[slug].lazyVideoMarkers) {
      totalMarkers++;
      console.log(`  [${slug}] <${m.tag} class="${m.classes}"> ${JSON.stringify(m.dataAttrs)}`);
    }
  }
  console.log(`  Total lazy markers: ${totalMarkers} (zero = CE renders iframes directly, no lazy-pattern)`);

  await fs.mkdir('audit-output/design-1', { recursive: true });
  await fs.writeFile('audit-output/design-1/video-embeds-probe.json', JSON.stringify(aggregate, null, 2));
  console.log('\nWrote audit-output/design-1/video-embeds-probe.json');
}

main().catch((err) => { console.error(err); process.exit(1); });
