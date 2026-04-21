import fs from 'fs';
import path from 'path';
import pLimit from 'p-limit';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';
import { UrlStatus } from '../../src/lib/audit-types';
import type { PageContent, ImageRecord, CanonicalUrl } from '../../src/lib/audit-types';
dotenv.config();

const AUDIT_DIR = path.join(process.cwd(), 'audit-output');
const PAGES_DIR = path.join(AUDIT_DIR, 'pages');
const FIRECRAWL_BASE = 'https://api.firecrawl.dev/v1';
const FIRECRAWL_KEY = process.env.FIRECRAWL_API_KEY!;
const CONCURRENCY = 5;

async function firecrawlScrape(url: string): Promise<{ success: boolean; html?: string; error?: string }> {
  try {
    const res = await fetch(`${FIRECRAWL_BASE}/scrape`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${FIRECRAWL_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['html', 'rawHtml'],
        onlyMainContent: false,
        waitFor: 1500,
        timeout: 30000,
      }),
    });

    if (!res.ok) {
      return { success: false, error: `HTTP ${res.status}: ${(await res.text()).slice(0, 200)}` };
    }

    const data = await res.json() as { success?: boolean; data?: { html?: string; rawHtml?: string }; error?: string };
    if (!data.success) return { success: false, error: data.error ?? 'Firecrawl returned success:false' };
    const html = data.data?.rawHtml ?? data.data?.html;
    if (!html) return { success: false, error: 'No HTML in response' };
    return { success: true, html };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

function extractStructuredData(html: string): unknown[] {
  const $ = cheerio.load(html);
  const results: unknown[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      results.push(JSON.parse($(el).html() ?? '{}'));
    } catch { /* malformed JSON-LD */ }
  });
  return results;
}

function extractImages($: cheerio.CheerioAPI): ImageRecord[] {
  const images: ImageRecord[] = [];
  $('img').each((_, el) => {
    const src = $(el).attr('src') ?? $(el).attr('data-src') ?? '';
    if (!src) return;
    images.push({
      src,
      alt: $(el).attr('alt') ?? '',
      width: parseInt($(el).attr('width') ?? '0') || undefined,
      height: parseInt($(el).attr('height') ?? '0') || undefined,
      isAboveFold: false,
      lazyLoaded: $(el).attr('loading') === 'lazy',
    });
  });
  return images;
}

function extractCustomHeadCode($: cheerio.CheerioAPI): string | undefined {
  const customBlocks: string[] = [];
  $('head script:not([src])').each((_, el) => {
    const content = $(el).html() ?? '';
    if (content.includes('hbspt') || content.includes('gtag') ||
      content.includes('dataLayer') || content.includes('_linkedin')) {
      return;
    }
    if (content.trim().length > 0) customBlocks.push(content.trim());
  });
  return customBlocks.length > 0 ? customBlocks.join('\n\n') : undefined;
}

export async function extractPageContent(
  canonicalUrls: CanonicalUrl[],
  options: { skipExisting?: boolean } = {}
): Promise<Record<string, PageContent>> {
  fs.mkdirSync(PAGES_DIR, { recursive: true });

  const skipExisting = options.skipExisting ?? (process.env.AUDIT_SKIP_EXISTING !== '0');

  const candidates = canonicalUrls.filter(u => u.status === UrlStatus.OK && !u.isLocaleVariant);
  const toExtract = skipExisting
    ? candidates.filter(cu => !fs.existsSync(path.join(PAGES_DIR, cu.slug, 'content.json')))
    : candidates;

  const skippedCount = candidates.length - toExtract.length;
  console.log(`Content extractor: ${toExtract.length} pages to extract${skippedCount > 0 ? ` (${skippedCount} already on disk, skipped)` : ''} (concurrency ${CONCURRENCY})`);

  const limit = pLimit(CONCURRENCY);
  const results: Record<string, PageContent> = {};
  let completed = 0;
  let failed = 0;
  const failures: Array<{ url: string; error: string }> = [];
  let consecutiveFailures = 0;
  const MAX_CONSECUTIVE_FAILURES = 15;
  const PHASE_TIMEOUT_MS = 600_000;
  const phaseStart = Date.now();
  let stoppedEarly = false;

  await Promise.all(
    toExtract.map(cu =>
      limit(async () => {
        if (stoppedEarly) return;
        if (Date.now() - phaseStart > PHASE_TIMEOUT_MS) {
          stoppedEarly = true;
          console.error(`  Phase timeout reached — stopping extraction early. ${completed}/${toExtract.length} done.`);
          return;
        }
        if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
          stoppedEarly = true;
          console.error(`  Circuit breaker: ${MAX_CONSECUTIVE_FAILURES} consecutive failures — aborting.`);
          return;
        }

        const pageDir = path.join(PAGES_DIR, cu.slug);
        fs.mkdirSync(pageDir, { recursive: true });

        const { success, html, error } = await firecrawlScrape(cu.url);

        if (!success || !html) {
          consecutiveFailures++;
          failed++;
          failures.push({ url: cu.url, error: error ?? 'unknown' });
          if (failed <= 10) console.error(`  FAIL ${cu.url}: ${error}`);
          return;
        }

        try {
          if (!html.includes('<head') && !html.includes('<HEAD')) {
            console.warn(`  WARN: ${cu.url} — response missing <head>, script/meta extraction incomplete`);
          }

          const $ = cheerio.load(html);

          const content: PageContent = {
            url: cu.url,
            path: cu.path,
            title: $('title').text().trim(),
            metaDescription: $('meta[name="description"]').attr('content') ?? '',
            h1: $('h1').first().text().trim(),
            headings: [],
            bodyText: $('body').text().replace(/\s+/g, ' ').trim(),
            internalLinks: [],
            externalLinks: [],
            images: extractImages($),
            structuredData: extractStructuredData(html),
            canonicalTag: $('link[rel="canonical"]').attr('href'),
            robotsMeta: $('meta[name="robots"]').attr('content'),
            ogTitle: $('meta[property="og:title"]').attr('content'),
            ogDescription: $('meta[property="og:description"]').attr('content'),
            ogImage: $('meta[property="og:image"]').attr('content'),
            hreflangTags: [],
            customHeadCode: extractCustomHeadCode($),
            rawHtml: html,
          };

          $('h1, h2, h3, h4, h5, h6').each((_, el) => {
            const tagName = (el as { tagName?: string }).tagName ?? '';
            const level = parseInt(tagName.replace(/h/i, ''));
            if (!isNaN(level)) content.headings.push({ level, text: $(el).text().trim() });
          });

          $('a[href]').each((_, el) => {
            const href = $(el).attr('href') ?? '';
            if (href.startsWith('/') || href.includes('cloudemployee.io')) {
              content.internalLinks.push(href);
            } else if (href.startsWith('http')) {
              content.externalLinks.push(href);
            }
          });

          $('link[rel="alternate"]').each((_, el) => {
            const lang = $(el).attr('hreflang');
            const href = $(el).attr('href');
            if (lang && href) content.hreflangTags.push({ lang, href });
          });

          results[cu.path] = content;

          fs.writeFileSync(
            path.join(pageDir, 'content.json'),
            JSON.stringify(content, null, 2)
          );

          consecutiveFailures = 0;
          completed++;
          if (completed % 25 === 0 || completed === toExtract.length) {
            const elapsedSec = Math.round((Date.now() - phaseStart) / 1000);
            console.log(`  Progress: ${completed}/${toExtract.length} (${elapsedSec}s elapsed)`);
          }
        } catch (err) {
          consecutiveFailures++;
          failed++;
          failures.push({ url: cu.url, error: String(err) });
          console.error(`  PARSE FAIL ${cu.url}: ${String(err)}`);
        }
      })
    )
  );

  // Persist summary
  fs.writeFileSync(
    path.join(AUDIT_DIR, 'ce-content-extraction-summary.json'),
    JSON.stringify({
      attempted: toExtract.length,
      completed,
      failed,
      stoppedEarly,
      elapsedSec: Math.round((Date.now() - phaseStart) / 1000),
      failures: failures.slice(0, 100),
      extractedAt: new Date().toISOString(),
    }, null, 2)
  );

  console.log(`Content extraction complete: ${completed} done, ${failed} failed${stoppedEarly ? ' (stopped early)' : ''}`);
  return results;
}

import { fileURLToPath } from 'url';
if (process.argv[1] && fs.existsSync(process.argv[1]) &&
    fileURLToPath(import.meta.url) === fs.realpathSync(process.argv[1])) {
  (async () => {
    const canonicalData = JSON.parse(fs.readFileSync(path.join(AUDIT_DIR, 'ce-canonical-urls.json'), 'utf-8')) as { canonicalUrls: CanonicalUrl[] };
    await extractPageContent(canonicalData.canonicalUrls);
  })().catch(err => {
    console.error('Content extraction failed:', err);
    process.exit(1);
  });
}
