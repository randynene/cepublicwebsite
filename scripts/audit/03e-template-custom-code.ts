import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { TemplateType } from '../../src/lib/audit-types';
import type { TemplateClassification } from '../../src/lib/audit-types';
dotenv.config();

const AUDIT_DIR = path.join(process.cwd(), 'audit-output');

interface ScriptBlock {
  type: 'inline' | 'external';
  content: string;
  location: 'head' | 'body';
  fingerprint: string;
}

interface TemplateCodeFinding {
  templateType: TemplateType;
  representativeUrl: string;
  uniqueScripts: Array<ScriptBlock & {
    scope: 'template_level' | 'page_level' | 'semi_global' | 'unknown';
    isSeoCritical: boolean;
    seoImpact?: string;
    requiresHumanReview: boolean;
    reviewReason?: string;
  }>;
  noTemplateCode: boolean;
}

function fingerprint(content: string): string {
  return content.replace(/\s+/g, ' ').trim().slice(0, 120);
}

function isSeoScript(content: string): boolean {
  return (
    content.includes('application/ld+json') ||
    /canonical|hreflang|robots/.test(content) ||
    content.includes('og:') ||
    content.includes('priceCurrency') ||
    content.includes('BreadcrumbList')
  );
}

function extractScriptBlocks($: cheerio.CheerioAPI): ScriptBlock[] {
  const blocks: ScriptBlock[] = [];

  $('head script').each((_, el) => {
    const src = $(el).attr('src');
    const inline = $(el).html() ?? '';
    if (src) {
      blocks.push({ type: 'external', content: src, location: 'head', fingerprint: src });
    } else if (inline.trim()) {
      blocks.push({ type: 'inline', content: inline, location: 'head', fingerprint: fingerprint(inline) });
    }
  });

  $('body script').each((_, el) => {
    const src = $(el).attr('src');
    const inline = $(el).html() ?? '';
    if (src) {
      blocks.push({ type: 'external', content: src, location: 'body', fingerprint: src });
    } else if (inline.trim()) {
      blocks.push({ type: 'inline', content: inline, location: 'body', fingerprint: fingerprint(inline) });
    }
  });

  return blocks;
}

// Build a minimal ce-scripts.json on the fly — scripts appearing on >80% of pages become "global"
function buildMinimalGlobalInventory(
  pageContents: Record<string, { rawHtml?: string }>
): { globalFingerprints: Set<string>; totalPages: number } {
  const frequencyMap = new Map<string, number>();
  let totalPages = 0;

  for (const content of Object.values(pageContents)) {
    if (!content.rawHtml) continue;
    totalPages++;
    const $ = cheerio.load(content.rawHtml);
    const blocks = extractScriptBlocks($);
    const seenOnThisPage = new Set<string>();
    for (const b of blocks) {
      if (seenOnThisPage.has(b.fingerprint)) continue;
      seenOnThisPage.add(b.fingerprint);
      frequencyMap.set(b.fingerprint, (frequencyMap.get(b.fingerprint) ?? 0) + 1);
    }
  }

  const threshold = Math.max(1, Math.floor(totalPages * 0.8));
  const globalFingerprints = new Set<string>();
  for (const [fp, count] of frequencyMap.entries()) {
    if (count >= threshold) globalFingerprints.add(fp);
  }

  return { globalFingerprints, totalPages };
}

export async function diffTemplateCustomCode(
  templateMap: TemplateClassification[],
  pageContents: Record<string, { rawHtml?: string; url?: string }>
): Promise<TemplateCodeFinding[]> {

  // Source: prefer existing ce-scripts.json from step 5; fall back to inline computation
  const sciptsPath = path.join(AUDIT_DIR, 'ce-scripts.json');
  let globalFingerprints: Set<string>;

  if (fs.existsSync(sciptsPath)) {
    const scriptInventory = JSON.parse(fs.readFileSync(sciptsPath, 'utf-8')) as {
      global: Array<{ src?: string; rawSnippet: string }>;
    };
    globalFingerprints = new Set<string>();
    for (const s of scriptInventory.global) {
      globalFingerprints.add(s.src ?? fingerprint(s.rawSnippet));
    }
    console.log(`  Using existing ce-scripts.json global inventory (${globalFingerprints.size} fingerprints)`);
  } else {
    console.log(`  ce-scripts.json absent — computing minimal global script inventory inline`);
    const result = buildMinimalGlobalInventory(pageContents);
    globalFingerprints = result.globalFingerprints;
    console.log(`  Computed global inventory: ${globalFingerprints.size} fingerprints across ${result.totalPages} pages`);
  }

  // One representative URL per template type (skip locale variants)
  const typeToUrl = new Map<TemplateType, string>();
  for (const t of templateMap) {
    if (!typeToUrl.has(t.templateType) && !t.isLocaleVariant) {
      typeToUrl.set(t.templateType, t.url);
    }
  }

  const findings: TemplateCodeFinding[] = [];

  for (const [templateType, url] of typeToUrl.entries()) {
    const urlObj = (() => { try { return new URL(url); } catch { return null; } })();
    const urlPath = urlObj?.pathname ?? url;
    const content = pageContents[urlPath];

    if (!content?.rawHtml) {
      console.log(`  Skipping ${templateType} — no HTML available for ${urlPath}`);
      continue;
    }

    const $ = cheerio.load(content.rawHtml);
    const allBlocks = extractScriptBlocks($);

    const uniqueBlocks = allBlocks.filter(
      b => !globalFingerprints.has(b.fingerprint) &&
           !b.content.includes('jquery') &&
           !b.content.includes('cloudemployee.62b1833e') &&
           !b.content.includes('webfont') &&
           !b.content.includes('w-mod-')
    );

    const findingsForType: TemplateCodeFinding['uniqueScripts'] = uniqueBlocks.map(block => {
      const seoC = isSeoScript(block.content);
      const requiresReview = seoC ||
        block.content.includes('canonical') ||
        block.content.includes('priceCurrency') ||
        block.content.length > 500;

      return {
        ...block,
        scope: 'unknown' as const,
        isSeoCritical: seoC,
        seoImpact: seoC ? 'Modifies SEO-critical tags — must be rebuilt as server-side logic in Next.js' : undefined,
        requiresHumanReview: requiresReview,
        reviewReason: requiresReview
          ? (seoC ? 'SEO-critical script' : 'Large inline script — verify intent')
          : undefined,
      };
    });

    findings.push({
      templateType,
      representativeUrl: url,
      uniqueScripts: findingsForType,
      noTemplateCode: findingsForType.length === 0,
    });

    const reviewCount = findingsForType.filter(f => f.requiresHumanReview).length;
    console.log(`  ${templateType}: ${findingsForType.length} unique scripts (${reviewCount} need review)`);
  }

  // Second pass: classify scope by cross-referencing across template types
  const fingerprintToTemplates = new Map<string, Set<TemplateType>>();
  for (const finding of findings) {
    for (const script of finding.uniqueScripts) {
      if (!fingerprintToTemplates.has(script.fingerprint)) {
        fingerprintToTemplates.set(script.fingerprint, new Set());
      }
      fingerprintToTemplates.get(script.fingerprint)!.add(finding.templateType);
    }
  }

  for (const finding of findings) {
    for (const script of finding.uniqueScripts) {
      const appearsIn = fingerprintToTemplates.get(script.fingerprint)!;
      if (appearsIn.size === 1) {
        script.scope = 'template_level';
      } else if (appearsIn.size >= 3) {
        script.scope = 'semi_global';
        script.requiresHumanReview = true;
        script.reviewReason = `Appears on ${appearsIn.size} template types but not in global inventory — investigate`;
      } else {
        script.scope = 'unknown';
      }
    }
  }

  fs.writeFileSync(
    path.join(AUDIT_DIR, 'ce-template-custom-code.json'),
    JSON.stringify(findings, null, 2)
  );

  const needsReview = findings.flatMap(f =>
    f.uniqueScripts
      .filter(s => s.requiresHumanReview)
      .map(s => ({
        template: f.templateType,
        url: f.representativeUrl,
        scope: s.scope,
        isSeoCritical: s.isSeoCritical,
        reviewReason: s.reviewReason,
        snippet: s.content.slice(0, 200),
      }))
  );

  fs.writeFileSync(
    path.join(AUDIT_DIR, 'ce-template-custom-code-review.json'),
    JSON.stringify(needsReview, null, 2)
  );

  console.log(`Template custom code diff complete:`);
  console.log(`  Templates checked:       ${findings.length}`);
  console.log(`  Templates with no code:  ${findings.filter(f => f.noTemplateCode).length}`);
  console.log(`  Items for review:        ${needsReview.length}`);
  if (needsReview.length > 0) {
    console.log(`  Review file:             audit-output/ce-template-custom-code-review.json`);
  }

  return findings;
}
