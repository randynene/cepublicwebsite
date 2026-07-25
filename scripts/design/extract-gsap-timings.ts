// scripts/design/extract-gsap-timings.ts
// Sub-step 1a per MYGRATR-DESIGN-1 brief v1.5 §5/Step 1.
//
// GSAP runtime instrumentation shim. Webflow custom code is minified;
// reading source is unreliable. Inject a Proxy in front of `window.gsap`
// BEFORE the real GSAP loads, capture every gsap.to/from/fromTo/timeline/
// set call's args, then serialize with a function/Element replacer.
//
// Best-effort by design — known limitations (per F10/F11/F12 v1.4 +
// F12/F13/F14 v1.5; v2 hardening deferred to Tech Debt #20):
//
//   F10: pre-assignment calls dropped — site code that reads `window.gsap`
//        and invokes methods BEFORE realGsap is assigned hits the no-op
//        fallback and is silently lost. Minified Webflow startup may race
//        exactly here.
//
//   F11: ScrollTrigger.create configs that lazy-init on resize, media
//        query match, intersection, or delayed callbacks are NOT captured
//        by scroll-only automation. The scroll loop runs after networkidle;
//        anything queued for later can be missed.
//
//   F12: serializer is fragile. Replacer handles `function` and `Element`
//        but breaks on NodeList, HTMLCollection, window, document, and
//        circular refs. Output may lose entries on real-world pages.
//
// Output: audit-output/design-1/gsap-{slug}.json — JSON array of
// { method, args } records, one per intercepted call.

import { chromium, Browser } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const SHIM = `
  (() => {
    const log = [];
    window.__gsapShim = log;
    let realGsap = null;
    Object.defineProperty(window, 'gsap', {
      configurable: true,
      get() {
        return new Proxy({}, {
          get: (_, prop) => {
            if (!realGsap) return () => {}; // F10: pre-assignment no-op
            const orig = realGsap[prop];
            if (typeof orig !== 'function') return orig;
            return (...args) => {
              try {
                log.push({
                  method: String(prop),
                  args: JSON.parse(JSON.stringify(args, replacer)),
                });
              } catch (e) {
                // F12: serialization may fail on cycles or unknown surfaces.
                log.push({
                  method: String(prop),
                  args: ['<serialization-failed: ' + (e && e.message) + '>'],
                });
              }
              return orig.apply(realGsap, args);
            };
          },
        });
      },
      set(v) { realGsap = v; },
    });
    function replacer(_, v) {
      if (typeof v === 'function') return '<fn>';
      if (v instanceof Element) return '<' + v.tagName.toLowerCase() + (v.id ? '#' + v.id : '') + (v.className && typeof v.className === 'string' ? '.' + v.className.split(' ').filter(Boolean).join('.') : '') + '>';
      if (v instanceof NodeList) return '<NodeList n=' + v.length + '>';
      if (v instanceof HTMLCollection) return '<HTMLCollection n=' + v.length + '>';
      if (v === window) return '<window>';
      if (v === document) return '<document>';
      return v;
    }
  })();
`;

type Page = {
  url: string;
  slug: string;
  // Optional: pages that need extra interactions to trigger timelines
  // (hover, click). For Step 1 token extraction, scroll-only is enough.
};

const PAGES: Page[] = [
  { url: 'https://cloudemployee.io/',          slug: 'home' },
  { url: 'https://cloudemployee.io/about-us',  slug: 'about' },
  { url: 'https://cloudemployee.io/technology', slug: 'technology' },
];

async function extract(browser: Browser, page: Page) {
  console.log(`\n--- ${page.slug} (${page.url}) ---`);
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 mygratr-design-1-shim',
  });
  const p = await ctx.newPage();
  await p.addInitScript(SHIM);

  let response;
  try {
    response = await p.goto(page.url, { waitUntil: 'networkidle', timeout: 60_000 });
  } catch (err: any) {
    console.warn('  networkidle timeout — falling back to domcontentloaded:', err?.message);
    response = await p.goto(page.url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  }
  console.log('  status:', response?.status());

  // Scroll through the page in increments to trigger scroll-bound timelines.
  // F11 caveat: lazy ScrollTriggers (resize/intersection/timeout-driven) may
  // not fire from scroll alone.
  await p.evaluate(async () => {
    const total = document.body.scrollHeight;
    const step = window.innerHeight / 2;
    for (let y = 0; y <= total; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 400));
    }
  });

  // Give async tweens a moment to register after final scroll.
  await p.waitForTimeout(1000);

  const log = await p.evaluate(() => (window as any).__gsapShim ?? []);

  console.log('  intercepted gsap calls:', log.length);

  await fs.writeFile(
    path.resolve(`audit-output/design-1/gsap-${page.slug}.json`),
    JSON.stringify(log, null, 2),
  );

  await ctx.close();
}

async function main() {
  await fs.mkdir(path.resolve('audit-output/design-1'), { recursive: true });
  const browser = await chromium.launch({ headless: true });
  try {
    for (const p of PAGES) {
      try {
        await extract(browser, p);
      } catch (err: any) {
        console.error(`  FAILED ${p.slug}:`, err?.message ?? err);
        // Write a sentinel so the file exists for verifier review.
        await fs.writeFile(
          path.resolve(`audit-output/design-1/gsap-${p.slug}.json`),
          JSON.stringify({ error: String(err?.message ?? err) }, null, 2),
        );
      }
    }
  } finally {
    await browser.close();
  }
  console.log('\nDone. Output: audit-output/design-1/gsap-*.json');
}

main().catch((err) => { console.error(err); process.exit(1); });
