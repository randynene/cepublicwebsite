import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { TemplateType, ClassificationMethod, UrlStatus } from '../../src/lib/audit-types';
import type { CanonicalUrl, TemplateClassification } from '../../src/lib/audit-types';
dotenv.config();

const AUDIT_DIR = path.join(process.cwd(), 'audit-output');
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const anthropic = ANTHROPIC_KEY ? new Anthropic({ apiKey: ANTHROPIC_KEY }) : null;
const MODEL = 'claude-opus-4-7';

const KNOWN_COLLECTION_ARCHIVES = new Set([
  '/blogs-guides', '/staff-augmentation', '/nearshoring-offshoring',
  '/scaling-teams', '/hiring-tips', '/managing-engineers',
  '/ai-in-software-development', '/compare', '/videos', '/reviews',
  '/customer-stories', '/team', '/technology', '/services',
  '/downloads', '/tools', '/blog',
]);

function applyRules(urlPath: string): TemplateType | null {
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
  return null;
}

async function classifyWithLLM(
  urls: Array<{ url: string; path: string; title?: string }>
): Promise<Array<{ path: string; templateType: TemplateType; confidence: 'high' | 'medium' | 'low'; reasoning: string }>> {
  if (!anthropic) return [];

  const batchSize = 20;
  const results: Array<{ path: string; templateType: TemplateType; confidence: 'high' | 'medium' | 'low'; reasoning: string }> = [];

  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    const urlList = batch.map(u => `- Path: ${u.path}${u.title ? ` | Title: "${u.title}"` : ''}`).join('\n');

    const prompt = `You are classifying pages on cloudemployee.io (a staff augmentation company) into template types.

Available template types:
- HOME, TECHNOLOGY, SERVICE, BLOG, COMPARE, CUSTOMER_STORY, TEAM_MEMBER, VIDEO, REVIEW
- BOOK_A_CALL, DOWNLOAD, TOOL, TAXONOMY, STATIC, UNKNOWN

For each URL, respond with: templateType, confidence (high/medium/low), brief reasoning.

URLs:
${urlList}

Respond ONLY as a JSON array (no prose):
[{"path": "...", "templateType": "...", "confidence": "high|medium|low", "reasoning": "..."}]`;

    try {
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      });

      const text = response.content[0].type === 'text' ? response.content[0].text : '[]';
      const clean = text.replace(/```json|```/g, '').trim();
      const jsonStart = clean.indexOf('[');
      const jsonEnd = clean.lastIndexOf(']');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const parsed = JSON.parse(clean.slice(jsonStart, jsonEnd + 1)) as typeof results;
        results.push(...parsed);
      }
    } catch (err) {
      console.error(`LLM batch ${i} failed: ${String(err).slice(0, 200)}`);
    }

    if (i + batchSize < urls.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}

export async function classifyTemplates(
  canonicalUrls: CanonicalUrl[],
  pageContents: Record<string, { title?: string }>
): Promise<TemplateClassification[]> {
  const classifications: TemplateClassification[] = [];
  const needsLLM: Array<{ url: string; path: string; title?: string }> = [];

  for (const cu of canonicalUrls) {
    if (cu.status === UrlStatus.REDIRECT_301 || cu.status === UrlStatus.REDIRECT_302) continue;
    if (cu.status !== UrlStatus.OK) continue;

    const rulesResult = applyRules(cu.path);
    if (rulesResult !== null) {
      classifications.push({
        url: cu.url,
        path: cu.path,
        templateType: rulesResult,
        classificationMethod: ClassificationMethod.RULES,
        confidence: 'high',
        requiresManualReview: false,
        locale: cu.locale,
        isLocaleVariant: cu.isLocaleVariant,
      });
    } else {
      needsLLM.push({
        url: cu.url,
        path: cu.path,
        title: pageContents[cu.path]?.title,
      });
    }
  }

  console.log(`Template classifier: ${classifications.length} by rules, ${needsLLM.length} need LLM`);

  let llmSkipped = 0;
  if (needsLLM.length > 0) {
    if (!anthropic) {
      console.log(`  ANTHROPIC_API_KEY missing — marking ${needsLLM.length} URLs as STATIC/manual-review`);
      llmSkipped = needsLLM.length;
      for (const { url, path: urlPath } of needsLLM) {
        const cu = canonicalUrls.find(u => u.path === urlPath);
        classifications.push({
          url,
          path: urlPath,
          templateType: TemplateType.STATIC,
          classificationMethod: ClassificationMethod.MANUAL,
          confidence: 'low',
          reasoning: 'Rules did not match and Anthropic key absent; defaulted to STATIC, requires manual review',
          requiresManualReview: true,
          locale: cu?.locale ?? 'us',
          isLocaleVariant: cu?.isLocaleVariant ?? false,
        });
      }
    } else {
      const llmResults = await classifyWithLLM(needsLLM);
      const llmMap = new Map(llmResults.map(r => [r.path, r]));

      for (const { url, path: urlPath } of needsLLM) {
        const result = llmMap.get(urlPath);
        const cu = canonicalUrls.find(u => u.path === urlPath);
        classifications.push({
          url,
          path: urlPath,
          templateType: result ? result.templateType : TemplateType.UNKNOWN,
          classificationMethod: ClassificationMethod.LLM,
          confidence: result?.confidence ?? 'low',
          reasoning: result?.reasoning,
          requiresManualReview: !result || result.confidence === 'low' || result.templateType === TemplateType.UNKNOWN,
          locale: cu?.locale ?? 'us',
          isLocaleVariant: cu?.isLocaleVariant ?? false,
        });
      }
    }
  }

  fs.writeFileSync(path.join(AUDIT_DIR, 'ce-template-map.json'), JSON.stringify(classifications, null, 2));

  const llmClassified = classifications
    .filter(c => c.classificationMethod === ClassificationMethod.LLM || c.classificationMethod === ClassificationMethod.MANUAL)
    .sort((a, b) => (b.requiresManualReview ? 1 : 0) - (a.requiresManualReview ? 1 : 0));
  fs.writeFileSync(path.join(AUDIT_DIR, 'ce-template-map-llm-review.json'), JSON.stringify(llmClassified, null, 2));

  const typeCounts: Record<string, number> = {};
  for (const c of classifications) typeCounts[c.templateType] = (typeCounts[c.templateType] ?? 0) + 1;
  const manualReview = classifications.filter(c => c.requiresManualReview);

  console.log('Template classification complete:');
  for (const [type, count] of Object.entries(typeCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${type}: ${count}`);
  }
  console.log(`  Requires manual review: ${manualReview.length}`);
  if (llmSkipped > 0) console.log(`  LLM skipped (no key):   ${llmSkipped}`);

  return classifications;
}
