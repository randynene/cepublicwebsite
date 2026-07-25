// scripts/design/probe-image-quality.mjs
// HALT 7 Q4 — capture CE's hero-image quality settings.
//
// Webflow CDN URLs typically carry quality hints in the URL OR encode quality
// in the served format. Probe captures:
//   1. Full URL of the largest above-fold image on each page (LCP candidate)
//   2. Any `q=`, `quality=`, `Q=` URL params
//   3. Content-Length response header (file size in bytes)
//   4. Computed bytes-per-pixel ratio (rough quality proxy)
//
// Reference benchmarks for AVIF at 1440×800 typical hero size:
//   - Quality 85: ~150-200 KB (Webflow's historical default)
//   - Quality 75: ~80-120 KB (next/image default)
//   - Quality 65: ~50-80 KB (aggressive)

import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const PAGES = [
  'https://cloudemployee.io/',
  'https://cloudemployee.io/technology',
  'https://cloudemployee.io/services',
  'https://cloudemployee.io/customer-stories',
  'https://cloudemployee.io/ai-in-software-development/securing-ai-the-ctos-guide-to-validation-and-minimum-safety-standards',
];

async function main() {
  const browser = await chromium.launch({ headless: true });
  const out = [];
  try {
    for (const url of PAGES) {
      const slug = url.split('cloudemployee.io')[1] || '/';
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const p = await ctx.newPage();

      // Capture all image responses for size info
      const imgResponses = new Map();
      p.on('response', async (resp) => {
        const u = resp.url();
        if (!/\.(avif|jpg|jpeg|png|webp)(\?|$)/i.test(u)) return;
        try {
          const headers = resp.headers();
          imgResponses.set(u, {
            status: resp.status(),
            contentLength: parseInt(headers['content-length'] || '0'),
            contentType: headers['content-type'] || '',
          });
        } catch {}
      });

      try { await p.goto(url, { waitUntil: 'networkidle', timeout: 60_000 }); }
      catch { await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 }); }
      await p.waitForTimeout(2000);

      // Find the largest above-fold image — LCP candidate
      const lcp = await p.evaluate(() => {
        const viewportH = window.innerHeight;
        let best = null;
        document.querySelectorAll('img').forEach((el) => {
          const rect = el.getBoundingClientRect();
          if (rect.top > viewportH || rect.top < -100) return;
          const area = rect.width * rect.height;
          if (area < 10000) return;  // skip small icons
          if (!best || area > best.area) {
            best = {
              src: el.currentSrc || el.src,
              renderedWidth: Math.round(rect.width),
              renderedHeight: Math.round(rect.height),
              naturalWidth: el.naturalWidth,
              naturalHeight: el.naturalHeight,
              alt: (el.getAttribute('alt') || '').slice(0, 50),
              area,
            };
          }
        });
        return best;
      });

      if (!lcp) {
        console.log(`[${slug}] no LCP candidate found`);
        out.push({ slug, lcp: null });
        await ctx.close();
        continue;
      }

      const respMeta = imgResponses.get(lcp.src);
      // Parse URL params
      const u = new URL(lcp.src);
      const params = Object.fromEntries(u.searchParams.entries());
      const bpp = respMeta?.contentLength
        ? respMeta.contentLength / (lcp.naturalWidth * lcp.naturalHeight || lcp.renderedWidth * lcp.renderedHeight)
        : null;

      console.log(`\n[${slug}] LCP candidate:`);
      console.log(`  src: ${lcp.src.slice(0, 140)}`);
      console.log(`  alt: "${lcp.alt}"`);
      console.log(`  rendered: ${lcp.renderedWidth}×${lcp.renderedHeight}px`);
      console.log(`  natural:  ${lcp.naturalWidth}×${lcp.naturalHeight}px`);
      console.log(`  URL params: ${JSON.stringify(params)}`);
      console.log(`  Content-Length: ${respMeta?.contentLength ?? '(not captured)'} bytes`);
      console.log(`  Content-Type: ${respMeta?.contentType ?? '(unknown)'}`);
      if (bpp !== null) console.log(`  bytes-per-pixel: ${bpp.toFixed(3)} (lower = more compression)`);

      out.push({ slug, lcp, params, contentLength: respMeta?.contentLength, bpp });
      await ctx.close();
    }
  } finally {
    await browser.close();
  }

  console.log('\n=== AGGREGATE — quality signal across LCP images ===');
  const allParams = out.flatMap((r) => Object.keys(r.params || {}));
  const distinctParams = [...new Set(allParams)];
  console.log(`URL params seen across hero images: ${distinctParams.length === 0 ? '(none — Webflow CDN uses path-based, not query-based)' : distinctParams.join(', ')}`);
  const bppValues = out.map((r) => r.bpp).filter((v) => v != null);
  if (bppValues.length) {
    const avg = bppValues.reduce((a, b) => a + b, 0) / bppValues.length;
    console.log(`bytes-per-pixel: avg=${avg.toFixed(3)}, min=${Math.min(...bppValues).toFixed(3)}, max=${Math.max(...bppValues).toFixed(3)}`);
    console.log(`\nReference (AVIF):`);
    console.log(`  q=85 ≈ 0.10 bpp`);
    console.log(`  q=75 ≈ 0.06 bpp`);
    console.log(`  q=65 ≈ 0.04 bpp`);
  }

  await fs.mkdir('audit-output/design-1', { recursive: true });
  await fs.writeFile('audit-output/design-1/image-quality-probe.json', JSON.stringify(out, null, 2));
  console.log('\nWrote audit-output/design-1/image-quality-probe.json');
}

main().catch((err) => { console.error(err); process.exit(1); });
