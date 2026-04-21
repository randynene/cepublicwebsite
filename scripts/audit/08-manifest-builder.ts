import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { TemplateType, UrlStatus } from '../../src/lib/audit-types';
import type {
  CanonicalUrl, TemplateClassification, ScreenshotRecord, InteractionElement,
  ScriptInventory, HubSpotForm, CollectionRecord, AuditAnomaly, PageContent,
} from '../../src/lib/audit-types';
dotenv.config();

const AUDIT_DIR = path.join(process.cwd(), 'audit-output');
const PAGES_DIR = path.join(AUDIT_DIR, 'pages');

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
}

function safeRead<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return readJson<T>(filePath);
  } catch {
    return fallback;
  }
}

export interface MigrationManifest {
  version: string;
  generatedAt: string;
  sourceUrl: string;
  migrationId: string;
  orgId: string;

  canonicalUrls: CanonicalUrl[];
  totalCanonicalUrls: number;
  totalIndexableUrls: number;
  totalRedirects: number;
  totalExcluded: number;

  templateMap: TemplateClassification[];
  templateTypeCounts: Record<TemplateType, number>;
  requiresManualReviewCount: number;

  pageContents: Record<string, Omit<PageContent, 'rawHtml'>>;

  screenshots: ScreenshotRecord[];
  screenshotsCaptured: number;
  screenshotsFailed: string[];

  interactionInventory: Record<string, InteractionElement[]>;
  pagesWithContentAffectingInteractions: string[];

  scriptInventory: ScriptInventory;

  forms: HubSpotForm[];
  totalForms: number;
  formsVerifiedInHubSpot: number;
  formsFailedVerification: string[];

  collections: CollectionRecord[];
  totalCollections: number;
  totalCmsItems: number;

  anomalies: AuditAnomaly[];
}

export async function buildManifest(): Promise<MigrationManifest> {
  console.log('Building migration manifest...');

  const canonicalData = readJson<{ canonicalUrls: CanonicalUrl[]; anomalies: AuditAnomaly[] }>(
    path.join(AUDIT_DIR, 'ce-canonical-urls.json')
  );
  const templateMap = safeRead<TemplateClassification[]>(path.join(AUDIT_DIR, 'ce-template-map.json'), []);
  const screenshotsData = safeRead<{ screenshots: ScreenshotRecord[]; failed: string[] }>(
    path.join(AUDIT_DIR, 'ce-screenshots.json'),
    { screenshots: [], failed: [] }
  );
  const scriptInventory = safeRead<ScriptInventory>(
    path.join(AUDIT_DIR, 'ce-scripts.json'),
    { global: [], perPage: {}, summary: { hasGTM: false, gtmContainerIds: [], hasGA4: false, ga4MeasurementIds: [], hasLinkedIn: false, hasCookieConsent: false, hasChat: false, hasHeatmap: false, otherScripts: [] } }
  );
  const formsData = safeRead<{ forms: HubSpotForm[]; anomalies: AuditAnomaly[] }>(
    path.join(AUDIT_DIR, 'ce-forms.json'),
    { forms: [], anomalies: [] }
  );
  const ceInventory = safeRead<{ collections: CollectionRecord[] }>(
    path.join(AUDIT_DIR, 'ce-inventory.json'),
    { collections: [] }
  );

  const pageContents: Record<string, Omit<PageContent, 'rawHtml'>> = {};
  const interactionInventory: Record<string, InteractionElement[]> = {};

  if (fs.existsSync(PAGES_DIR)) {
    for (const slugDir of fs.readdirSync(PAGES_DIR)) {
      const contentFile = path.join(PAGES_DIR, slugDir, 'content.json');
      const interactionsFile = path.join(PAGES_DIR, slugDir, 'interactions.json');

      if (fs.existsSync(contentFile)) {
        try {
          const content = readJson<PageContent>(contentFile);
          const urlPath = content.path;
          if (urlPath) {
            const { rawHtml: _raw, ...contentWithoutHtml } = content;
            pageContents[urlPath] = contentWithoutHtml;
          }
        } catch { /* skip malformed */ }
      }

      if (fs.existsSync(interactionsFile)) {
        try {
          const raw = readJson<InteractionElement[]>(interactionsFile);
          // Slug → path reversal: we stored with /uk/ or / prefix logic during Step 4
          // content.path already holds the canonical path, so use pageContents key if matching slug
          const contentPath = Object.keys(pageContents).find(p => p.replace(/^\/|\/$/g, '').replace(/\//g, '__').replace(/[^a-z0-9_]/gi, '-').replace(/-+/g, '-') === slugDir);
          const urlPath = contentPath ?? '/' + slugDir.replace(/__/g, '/');
          interactionInventory[urlPath] = raw;
        } catch { /* skip malformed */ }
      }
    }
  }

  const templateTypeCounts = Object.fromEntries(
    Object.values(TemplateType).map(t => [t, 0])
  ) as Record<TemplateType, number>;
  for (const c of templateMap) {
    templateTypeCounts[c.templateType] = (templateTypeCounts[c.templateType] ?? 0) + 1;
  }

  const allAnomalies: AuditAnomaly[] = [
    ...canonicalData.anomalies,
    ...formsData.anomalies,
    ...screenshotsData.failed.map(url => ({
      severity: 'warning' as const,
      category: 'url' as const,
      description: 'Screenshot capture failed',
      affectedUrl: url,
      recommendation: 'Manually screenshot this page before template build session. Possible cause: networkidle never fires on embedded-media pages — consider domcontentloaded.',
    })),
    ...templateMap
      .filter(t => t.requiresManualReview)
      .map(t => ({
        severity: 'warning' as const,
        category: 'template' as const,
        description: 'Template classification requires manual review',
        affectedUrl: t.url,
        recommendation: 'Review ce-template-map-llm-review.json and manually set templateType.',
      })),
  ];

  const manifest: MigrationManifest = {
    version: '1.0',
    generatedAt: new Date().toISOString(),
    sourceUrl: 'https://cloudemployee.io',
    migrationId: process.env.CE_MIGRATION_ID ?? 'ce000000-0000-0000-0000-000000000002',
    orgId: process.env.CE_ORG_ID ?? 'ce000000-0000-0000-0000-000000000001',

    canonicalUrls: canonicalData.canonicalUrls,
    totalCanonicalUrls: canonicalData.canonicalUrls.length,
    totalIndexableUrls: canonicalData.canonicalUrls.filter(u => u.status === UrlStatus.OK).length,
    totalRedirects: canonicalData.canonicalUrls.filter(u =>
      u.status === UrlStatus.REDIRECT_301 || u.status === UrlStatus.REDIRECT_302
    ).length,
    totalExcluded: canonicalData.canonicalUrls.filter(u => u.status === UrlStatus.ERROR).length,

    templateMap,
    templateTypeCounts,
    requiresManualReviewCount: templateMap.filter(t => t.requiresManualReview).length,

    pageContents,

    screenshots: screenshotsData.screenshots,
    screenshotsCaptured: screenshotsData.screenshots.length,
    screenshotsFailed: screenshotsData.failed,

    interactionInventory,
    pagesWithContentAffectingInteractions: Object.entries(interactionInventory)
      .filter(([, elements]) => elements.some(e => e.isContentAffecting))
      .map(([urlPath]) => urlPath),

    scriptInventory,

    forms: formsData.forms,
    totalForms: formsData.forms.length,
    formsVerifiedInHubSpot: formsData.forms.filter(f => f.apiVerified).length,
    formsFailedVerification: formsData.forms.filter(f => !f.apiVerified).map(f => f.formGuid),

    collections: ceInventory.collections ?? [],
    totalCollections: (ceInventory.collections ?? []).length,
    totalCmsItems: (ceInventory.collections ?? []).reduce((sum, c) => sum + (c.itemCount ?? 0), 0),

    anomalies: allAnomalies,
  };

  fs.writeFileSync(path.join(AUDIT_DIR, 'ce-manifest.json'), JSON.stringify(manifest, null, 2));

  console.log('Migration manifest built:');
  console.log(`  Total canonical URLs:    ${manifest.totalCanonicalUrls}`);
  console.log(`  Indexable:               ${manifest.totalIndexableUrls}`);
  console.log(`  Redirects:               ${manifest.totalRedirects}`);
  console.log(`  Excluded (error):        ${manifest.totalExcluded}`);
  console.log(`  Page contents on disk:   ${Object.keys(manifest.pageContents).length}`);
  console.log(`  Screenshots captured:    ${manifest.screenshotsCaptured}`);
  console.log(`  Forms found:             ${manifest.totalForms} (verified ${manifest.formsVerifiedInHubSpot})`);
  console.log(`  Collections:             ${manifest.totalCollections}`);
  console.log(`  CMS items:               ${manifest.totalCmsItems}`);
  console.log(`  Total anomalies:         ${allAnomalies.length}`);
  console.log(`  Critical anomalies:      ${allAnomalies.filter(a => a.severity === 'critical').length}`);
  console.log(`  Requires manual review:  ${manifest.requiresManualReviewCount} URLs`);

  return manifest;
}
