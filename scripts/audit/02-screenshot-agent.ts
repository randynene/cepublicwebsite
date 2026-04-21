import { chromium, type Browser } from 'playwright';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { TemplateType, UrlStatus, ClassificationMethod } from '../../src/lib/audit-types';
import type { CanonicalUrl, TemplateClassification, ScreenshotRecord } from '../../src/lib/audit-types';
dotenv.config();

const AUDIT_DIR = path.join(process.cwd(), 'audit-output');
const SCREENSHOTS_DIR = path.join(AUDIT_DIR, 'screenshots');

const BREAKPOINTS = [
  { name: 'mobile' as const, width: 390, height: 844 },
  { name: 'tablet' as const, width: 768, height: 1024 },
  { name: 'desktop' as const, width: 1440, height: 900 },
];

const CMS_SAMPLE_COUNT = parseInt(process.env.AUDIT_CMS_SAMPLE_COUNT ?? '1', 10);
const TAXONOMY_SAMPLE_COUNT = parseInt(process.env.AUDIT_TAXONOMY_SAMPLE_COUNT ?? '1', 10);

// STATIC-path exclusions for screenshots — these are 404s, Cloudflare assets, or stale archive pages
const STATIC_EXCLUDE_PREFIXES = ['/cdn-cgi', '/404', '/archive/'];
// Hash-like first-segment slugs (40+ alphanumeric chars with no vowels or real-word shape)
const STATIC_EXCLUDE_SLUG_HASH = /^\/[a-z0-9]{40,}(\/|$)/i;
// Non-HTML URL patterns that slip through (sitemap.xml, favicons, etc)
const STATIC_EXCLUDE_EXTENSIONS = /\.(xml|json|txt|ico|js|css|webmanifest)(\?|$)/i;

const KNOWN_COLLECTION_ARCHIVES = new Set([
  '/blogs-guides', '/staff-augmentation', '/nearshoring-offshoring',
  '/scaling-teams', '/hiring-tips', '/managing-engineers',
  '/ai-in-software-development', '/compare', '/videos', '/reviews',
  '/customer-stories', '/team', '/technology', '/services',
  '/downloads', '/tools', '/blog',
]);

function rulesClassify(urlPath: string): TemplateType {
  // Strip /uk prefix for pattern matching (locale variants share template)
  const p = urlPath.startsWith('/uk/') ? urlPath.slice(3) : urlPath === '/uk' ? '/' : urlPath;

  if (p === '/' || p === '') return TemplateType.HOME;
  if (/^\/technology\/[^/]+\/?$/.test(p)) return TemplateType.TECHNOLOGY;
  if (/^\/services\/[^/]+\/?$/.test(p)) return TemplateType.SERVICE;
  if (/^\/compare\/[^/]+\/?$/.test(p)) return TemplateType.COMPARE;
  if (/^\/(customer-story|customer-stories)\/[^/]+\/?$/.test(p)) return TemplateType.CUSTOMER_STORY;
  if (/^\/team\/[^/]+\/?$/.test(p)) return TemplateType.TEAM_MEMBER;
  if (/^\/(videos|video)\/[^/]+\/?$/.test(p)) return TemplateType.VIDEO;
  if (/^\/reviews\/[^/]+\/?$/.test(p)) return TemplateType.REVIEW;
  if (/^\/book-a-call\/[^/]+\/?$/.test(p)) return TemplateType.BOOK_A_CALL;
  if (/^\/download\/[^/]+\/?$/.test(p)) return TemplateType.DOWNLOAD;
  if (/^\/tools\/[^/]+\/?$/.test(p)) return TemplateType.TOOL;
  if (/^\/(blog|staff-augmentation|nearshoring|nearshoring-offshoring|scaling-teams|hiring-tips|managing-engineers|ai-in-software-development)\/[^/]+\/?$/.test(p)) return TemplateType.BLOG;
  if (/^\/(tags|category|topics)\//.test(p)) return TemplateType.TAXONOMY;
  if (KNOWN_COLLECTION_ARCHIVES.has(p.replace(/\/$/, ''))) return TemplateType.TAXONOMY;
  return TemplateType.STATIC;
}

export function buildRulesOnlyTemplateMap(canonicalUrls: CanonicalUrl[]): TemplateClassification[] {
  return canonicalUrls
    .filter(cu => cu.status === UrlStatus.OK)
    .map(cu => ({
      url: cu.url,
      path: cu.path,
      templateType: rulesClassify(cu.path),
      classificationMethod: ClassificationMethod.RULES,
      confidence: 'high' as const,
      requiresManualReview: false,
      locale: cu.locale,
      isLocaleVariant: cu.isLocaleVariant,
    }));
}

export async function runScreenshotAgent(
  canonicalUrls: CanonicalUrl[],
  templateMap: TemplateClassification[],
  options: { phaseTimeoutMs?: number } = {}
): Promise<{ screenshots: ScreenshotRecord[]; failed: string[] }> {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

  const phaseTimeoutMs = options.phaseTimeoutMs ?? 30 * 60 * 1000;
  const phaseStart = Date.now();

  const classMap = new Map(templateMap.map(t => [t.url, t]));

  const toScreenshot: CanonicalUrl[] = [];
  const cmsTypeSeen = new Map<TemplateType, number>();
  const CMS_TYPES = new Set<TemplateType>([
    TemplateType.TECHNOLOGY, TemplateType.SERVICE, TemplateType.BLOG,
    TemplateType.COMPARE, TemplateType.CUSTOMER_STORY, TemplateType.TEAM_MEMBER,
    TemplateType.VIDEO, TemplateType.REVIEW, TemplateType.BOOK_A_CALL,
    TemplateType.DOWNLOAD, TemplateType.TOOL,
  ]);

  // Skip locale variants in the main loop — handled separately
  for (const cu of canonicalUrls) {
    if (cu.status !== UrlStatus.OK) continue;
    if (cu.isLocaleVariant) continue;

    const classification = classMap.get(cu.url);
    const templateType = classification?.templateType ?? TemplateType.UNKNOWN;

    if (templateType === TemplateType.STATIC) {
      if (STATIC_EXCLUDE_PREFIXES.some(pref => cu.path === pref || cu.path.startsWith(pref + '/') || cu.path === pref.replace(/\/$/, ''))) continue;
      if (STATIC_EXCLUDE_SLUG_HASH.test(cu.path)) continue;
      if (STATIC_EXCLUDE_EXTENSIONS.test(cu.path)) continue;
      toScreenshot.push(cu);
    } else if (templateType === TemplateType.HOME ||
      templateType === TemplateType.UNKNOWN ||
      classification?.requiresManualReview) {
      toScreenshot.push(cu);
    } else if (templateType === TemplateType.TAXONOMY) {
      const count = cmsTypeSeen.get(templateType) ?? 0;
      if (count < TAXONOMY_SAMPLE_COUNT) {
        toScreenshot.push(cu);
        cmsTypeSeen.set(templateType, count + 1);
      }
    } else if (CMS_TYPES.has(templateType)) {
      const count = cmsTypeSeen.get(templateType) ?? 0;
      if (count < CMS_SAMPLE_COUNT) {
        toScreenshot.push(cu);
        cmsTypeSeen.set(templateType, count + 1);
      }
    }
  }

  // UK locale variants — one per template type
  const ukUrls = canonicalUrls.filter(u => u.isLocaleVariant && u.status === UrlStatus.OK);
  const ukTypeSeen = new Map<TemplateType, number>();
  for (const cu of ukUrls) {
    const classification = classMap.get(cu.url);
    const templateType = classification?.templateType ?? TemplateType.UNKNOWN;
    const count = ukTypeSeen.get(templateType) ?? 0;
    if (count < 1) {
      toScreenshot.push(cu);
      ukTypeSeen.set(templateType, count + 1);
    }
  }

  const skipExisting = process.env.AUDIT_SKIP_EXISTING !== '0';
  const screenshots: ScreenshotRecord[] = [];
  const failed: string[] = [];

  // Pre-populate screenshots array with entries for URLs that already have all 3 PNGs on disk
  const remaining: CanonicalUrl[] = [];
  for (const cu of toScreenshot) {
    const dir = path.join(SCREENSHOTS_DIR, cu.slug);
    const allPresent = skipExisting &&
      fs.existsSync(path.join(dir, 'mobile.png')) &&
      fs.existsSync(path.join(dir, 'tablet.png')) &&
      fs.existsSync(path.join(dir, 'desktop.png'));
    if (allPresent) {
      const classification = classMap.get(cu.url);
      screenshots.push({
        url: cu.url,
        templateType: classification?.templateType ?? TemplateType.UNKNOWN,
        breakpoints: {
          mobile: path.relative(process.cwd(), path.join(dir, 'mobile.png')),
          tablet: path.relative(process.cwd(), path.join(dir, 'tablet.png')),
          desktop: path.relative(process.cwd(), path.join(dir, 'desktop.png')),
        },
        capturedAt: new Date(fs.statSync(path.join(dir, 'desktop.png')).mtimeMs).toISOString(),
        fullPageHeight: { mobile: 0, tablet: 0, desktop: 0 },
      });
    } else {
      remaining.push(cu);
    }
  }

  console.log(`Screenshot agent: ${toScreenshot.length} targets, ${screenshots.length} already on disk, ${remaining.length} to capture × 3 breakpoints`);

  if (remaining.length === 0) {
    fs.writeFileSync(
      path.join(AUDIT_DIR, 'ce-screenshots.json'),
      JSON.stringify({ screenshots, failed, capturedAt: new Date().toISOString() }, null, 2)
    );
    console.log(`Screenshots: nothing new to capture, index written with ${screenshots.length} existing`);
    return { screenshots, failed };
  }

  let browser: Browser | null = null;

  try {
    browser = await chromium.launch({ headless: true });
    browser.on('disconnected', () => {
      console.warn('  Browser disconnected unexpectedly');
    });

    for (const cu of remaining) {
      if (Date.now() - phaseStart > phaseTimeoutMs) {
        console.warn(`  Phase timeout reached — ${screenshots.length} captured, ${toScreenshot.length - screenshots.length - failed.length} skipped`);
        break;
      }

      let attempt = 0;
      let success = false;
      const dir = path.join(SCREENSHOTS_DIR, cu.slug);
      fs.mkdirSync(dir, { recursive: true });

      while (attempt < 2 && !success) {
        const page = await browser.newPage();
        try {
          const result = { breakpoints: { mobile: '', tablet: '', desktop: '' }, fullPageHeight: { mobile: 0, tablet: 0, desktop: 0 } };

          for (const bp of BREAKPOINTS) {
            await page.setViewportSize({ width: bp.width, height: bp.height });
            await page.goto(cu.url, { waitUntil: 'networkidle', timeout: 30000 });

            // Trigger GSAP scroll animations by scrolling to bottom, then back to top
            await page.evaluate(async () => {
              const scrollHeight = document.body.scrollHeight;
              for (let pos = 0; pos <= scrollHeight; pos += 200) {
                window.scrollTo(0, pos);
                await new Promise(r => setTimeout(r, 16));
              }
              window.scrollTo(0, 0);
            });

            await page.waitForTimeout(500);

            await page.evaluate(() => {
              return new Promise<void>((resolve) => {
                document.querySelectorAll('img[loading="lazy"]').forEach(() => {});
                setTimeout(resolve, 1500);
              });
            });

            const fullHeight = await page.evaluate(() => document.body.scrollHeight);
            const filePath = path.join(dir, `${bp.name}.png`);
            const relativePath = path.relative(process.cwd(), filePath);

            await page.screenshot({ path: filePath, fullPage: true });

            result.breakpoints[bp.name] = relativePath;
            result.fullPageHeight[bp.name] = fullHeight;
          }

          const classification = classMap.get(cu.url);
          screenshots.push({
            url: cu.url,
            templateType: classification?.templateType ?? TemplateType.UNKNOWN,
            breakpoints: result.breakpoints,
            capturedAt: new Date().toISOString(),
            fullPageHeight: result.fullPageHeight,
          });
          success = true;
          if (screenshots.length % 10 === 0) {
            console.log(`  Progress: ${screenshots.length}/${toScreenshot.length}`);
          }
        } catch (err) {
          attempt++;
          if (attempt >= 2) {
            failed.push(cu.url);
            console.error(`  FAIL (attempt ${attempt}/2) ${cu.url}: ${String(err).slice(0, 150)}`);
          }
        } finally {
          try { await page.close(); } catch { /* page already closed */ }
        }
      }
    }
  } finally {
    if (browser) {
      try { await browser.close(); } catch { /* browser already closed */ }
    }
  }

  fs.writeFileSync(
    path.join(AUDIT_DIR, 'ce-screenshots.json'),
    JSON.stringify({ screenshots, failed, capturedAt: new Date().toISOString() }, null, 2)
  );

  console.log(`Screenshots complete: ${screenshots.length} captured, ${failed.length} failed`);
  return { screenshots, failed };
}
