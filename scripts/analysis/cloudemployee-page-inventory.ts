/**
 * cloudemployee-page-inventory.ts
 *
 * One-shot analysis script: joins AUDIT-1 artifacts to produce a complete
 * inventory of every published cloudemployee.io page, classified by page
 * type and funnel stage (TOFU/MOFU/BOFU) for the sales scoring system.
 *
 * Run: tsx scripts/analysis/cloudemployee-page-inventory.ts
 * Output: audit-output/sales-intel/cloudemployee-page-inventory.md
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'csv-parse/sync';

const ROOT = resolve(__dirname, '..', '..');
const SF_CSV = resolve(ROOT, 'audit-output/screaming-frog-export.csv');
const CANONICAL_JSON = resolve(ROOT, 'audit-output/ce-canonical-urls.json');
const TEMPLATE_MAP_JSON = resolve(ROOT, 'audit-output/ce-template-map.json');
const OUT_DIR = resolve(ROOT, 'audit-output/sales-intel');
const OUT_FILE = resolve(OUT_DIR, 'cloudemployee-page-inventory.md');

type CanonicalUrl = {
  url: string;
  path: string;
  slug: string;
  status: string;
  locale: string;
  isLocaleVariant: boolean;
  redirectTarget?: string;
};

type TemplateEntry = {
  url: string;
  path: string;
  templateType: string;
  classificationMethod: string;
  confidence: string;
  isLocaleVariant: boolean;
};

type SfRow = {
  Address: string;
  'Status Code': string;
  'Content Type': string;
  'Title 1': string;
  'Meta Description 1': string;
  'H1-1': string;
};

type PageType =
  | 'service-page'
  | 'comparison-page'
  | 'case-study'
  | 'blog-post'
  | 'pricing-page'
  | 'lead-magnet'
  | 'thank-you-page'
  | 'about-page'
  | 'contact-page'
  | 'other';

type FunnelStage = 'BOFU' | 'MOFU' | 'TOFU';

type Row = {
  url: string;
  path: string;
  title: string;
  pageType: PageType;
  description: string;
  funnel: FunnelStage;
  templateType: string;
};

const MOFU_HUB_ROOTS = new Set([
  '/services',
  '/technology',
  '/customer-stories',
  '/compare',
  '/reviews',
  '/downloads',
  '/tools',
  '/videos',
  '/events',
]);

const TOFU_BLOG_HUB_ROOTS = new Set([
  '/blog',
  '/staff-augmentation',
  '/nearshoring-offshoring',
  '/scaling-teams',
  '/hiring-tips',
  '/managing-engineers',
  '/ai-in-software-development',
]);

function stripWww(url: string): string {
  return url.replace(/^https?:\/\/www\./, 'https://');
}

function normalizeDashes(s: string): string {
  return s.replace(/—/g, ', ').replace(/–/g, ', ').replace(/\s+/g, ' ').trim();
}

function stripBrandSuffix(title: string): string {
  return title
    .replace(/\s*[|\-]\s*Cloud Employee.*$/i, '')
    .replace(/\s*[|\-]\s*Staff Augmentation.*$/i, '')
    .trim();
}

function buildDescription(sf: SfRow | undefined): string {
  const candidates = [
    sf?.['Meta Description 1'] ?? '',
    sf?.['H1-1'] ?? '',
    stripBrandSuffix(sf?.['Title 1'] ?? ''),
  ];
  for (const raw of candidates) {
    const cleaned = normalizeDashes(raw);
    if (cleaned.length > 0) {
      return cleaned.length > 140 ? cleaned.slice(0, 137) + '...' : cleaned;
    }
  }
  return '';
}

const PRICING_PHRASES = [
  'pricing',
  'how-much',
  'hidden-fee',
  'hidden-cost',
  'true-cost',
  'total-cost',
  'cost-breakdown',
  'cost-ownership',
  'cost-savings',
  'cost-by',
  'cost-of',
  'costs-by',
  'costs-of',
  '-cost-',
  '-costs',
  '-rates',
  '-fees',
];

// Words that contain 'cost' or 'price' but aren't pricing-related (adjective use).
const PRICING_FALSE_POSITIVES = ['cost-effective', 'cost-quality', 'costly', 'cost-driven'];

function hasPricingSignal(path: string): boolean {
  if (PRICING_FALSE_POSITIVES.some((fp) => path.includes(fp))) return false;
  return PRICING_PHRASES.some((kw) => path.includes(kw));
}

function isPricingPage(path: string): boolean {
  // BOFU pricing-page: CE-controlled pricing landing (on /compare/ funnel,
  // CE in the URL, or an interactive calculator).
  if (!hasPricingSignal(path)) return false;
  return path.startsWith('/compare/') || path.includes('cloud-employee') || path.includes('calculator');
}

function classifyPageType(path: string, templateType: string): PageType {
  const p = path.toLowerCase();
  if (/\/(thank-you|success|confirmation)(\/|$)/.test(p)) return 'thank-you-page';
  if (/^\/download\/[^/]+/.test(p)) return 'lead-magnet';
  if (/\/contact(\/|$)/.test(p)) return 'contact-page';
  if (/^\/(about-us|about|careers)(\/|$)/.test(p)) return 'about-page';
  if (/^\/team\/[^/]+/.test(p)) return 'about-page';
  if (isPricingPage(p)) return 'pricing-page';
  if (templateType === 'SERVICE' || templateType === 'TECHNOLOGY') return 'service-page';
  if (templateType === 'COMPARE' || p.startsWith('/compare/') || p === '/alternatives')
    return 'comparison-page';
  if (templateType === 'CUSTOMER_STORY' || p.startsWith('/customer-story/')) return 'case-study';
  if (templateType === 'BLOG' && !TOFU_BLOG_HUB_ROOTS.has(p)) return 'blog-post';
  return 'other';
}

function classifyFunnel(path: string, pageType: PageType): FunnelStage {
  const p = path.toLowerCase();
  const BOFU_TYPES: PageType[] = [
    'service-page',
    'pricing-page',
    'case-study',
    'thank-you-page',
    'contact-page',
  ];
  if (BOFU_TYPES.includes(pageType)) return 'BOFU';
  if (p.startsWith('/book-a-call') || p.startsWith('/work-with-')) return 'BOFU';
  if (pageType === 'comparison-page') return 'MOFU';
  if (pageType === 'lead-magnet') return 'MOFU';
  if (MOFU_HUB_ROOTS.has(p)) return 'MOFU';
  if (p.startsWith('/tools/') || p.startsWith('/events/')) return 'MOFU';
  // Pricing-focused blog articles: promote from TOFU to MOFU per user rule
  // ("any article about pricing should be MOFU"). The page TYPE remains
  // blog-post because they're structurally blog articles, not landing pages.
  if (pageType === 'blog-post' && hasPricingSignal(p)) return 'MOFU';
  return 'TOFU';
}

function isPagePath(path: string): boolean {
  if (path.startsWith('/cdn-cgi/')) return false;
  if (path.endsWith('.xml')) return false;
  if (path.endsWith('.js') || path.endsWith('.css')) return false;
  if (path.startsWith('/haqt6iy0')) return false;
  return true;
}

function readCanonical(): CanonicalUrl[] {
  const raw = JSON.parse(readFileSync(CANONICAL_JSON, 'utf-8'));
  return raw.canonicalUrls as CanonicalUrl[];
}

function readTemplateMap(): Map<string, TemplateEntry> {
  const raw = JSON.parse(readFileSync(TEMPLATE_MAP_JSON, 'utf-8')) as TemplateEntry[];
  const map = new Map<string, TemplateEntry>();
  for (const t of raw) {
    map.set(stripWww(t.url), t);
  }
  return map;
}

function readScreamingFrog(): Map<string, SfRow> {
  const csv = readFileSync(SF_CSV, 'utf-8');
  const rows = parse(csv, {
    columns: true,
    bom: true,
    relax_quotes: true,
    skip_empty_lines: true,
    relax_column_count: true,
  }) as SfRow[];
  const map = new Map<string, SfRow>();
  for (const r of rows) {
    map.set(stripWww(r.Address), r);
  }
  return map;
}

function escapeMd(s: string): string {
  return s.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

function main(): void {
  console.log('Reading audit artifacts...');
  const canonical = readCanonical();
  const templateMap = readTemplateMap();
  const sfMap = readScreamingFrog();

  console.log(`  canonical: ${canonical.length}`);
  console.log(`  template-map: ${templateMap.size}`);
  console.log(`  screaming-frog: ${sfMap.size}`);

  const filtered = canonical.filter(
    (u) => u.status === '200' && u.isLocaleVariant === false && u.locale === 'us',
  );
  console.log(`  after status=200 + locale=us + !isLocaleVariant: ${filtered.length}`);

  const rows: Row[] = [];
  let skipped_nonhtml = 0;
  let skipped_nonpage = 0;

  for (const u of filtered) {
    if (!isPagePath(u.path)) {
      skipped_nonpage++;
      continue;
    }
    const sf = sfMap.get(u.url);
    if (sf && !sf['Content Type'].startsWith('text/html')) {
      skipped_nonhtml++;
      continue;
    }
    const templateType = templateMap.get(u.url)?.templateType ?? 'UNKNOWN';
    const pageType = classifyPageType(u.path, templateType);
    const funnel = classifyFunnel(u.path, pageType);
    const title = normalizeDashes(sf?.['Title 1'] ?? '') || stripBrandSuffix(u.slug);
    const description = buildDescription(sf);
    rows.push({
      url: u.url,
      path: u.path,
      title,
      pageType,
      description,
      funnel,
      templateType,
    });
  }

  console.log(`  rows after filtering non-page paths: skipped ${skipped_nonpage}`);
  console.log(`  rows after filtering non-HTML by content-type: skipped ${skipped_nonhtml}`);
  console.log(`  final row count: ${rows.length}`);

  rows.sort((a, b) => a.url.localeCompare(b.url));

  const funnelCounts = { BOFU: 0, MOFU: 0, TOFU: 0 };
  const typeCounts: Record<string, number> = {};
  for (const r of rows) {
    funnelCounts[r.funnel]++;
    typeCounts[r.pageType] = (typeCounts[r.pageType] ?? 0) + 1;
  }
  console.log('  by funnel:', funnelCounts);
  console.log('  by type:', typeCounts);

  const generated = new Date().toISOString();

  let md = '';
  md += `# CloudEmployee.io Page Inventory, Sales Intelligence\n\n`;
  md += `Generated: ${generated}\n`;
  md += `Source: AUDIT-1 artifacts (April 2026)\n`;
  md += `Locale scope: US (default) only; UK variants excluded\n`;
  md += `Total pages: ${rows.length}\n\n`;
  md += `Distribution:\n\n`;
  md += `- BOFU: ${funnelCounts.BOFU}\n`;
  md += `- MOFU: ${funnelCounts.MOFU}\n`;
  md += `- TOFU: ${funnelCounts.TOFU}\n\n`;
  md += `Page-type counts:\n\n`;
  for (const [t, c] of Object.entries(typeCounts).sort((a, b) => b[1] - a[1])) {
    md += `- ${t}: ${c}\n`;
  }
  md += `\n---\n\n## Full inventory (sorted by URL)\n\n`;
  md += `| URL | Title | Page type | Description |\n`;
  md += `|---|---|---|---|\n`;
  for (const r of rows) {
    const title = escapeMd(r.title) || '(no title)';
    const desc = escapeMd(r.description) || '(no description)';
    md += `| ${r.url} | ${title} | ${r.pageType} | ${desc} |\n`;
  }

  md += `\n---\n\n## Funnel classification\n\n`;
  for (const stage of ['BOFU', 'MOFU', 'TOFU'] as const) {
    md += `### ${stage} `;
    if (stage === 'BOFU') md += `(high signal weight)\n\n`;
    else if (stage === 'MOFU') md += `(medium signal weight)\n\n`;
    else md += `(low signal weight)\n\n`;
    const stageRows = rows.filter((r) => r.funnel === stage);
    for (const r of stageRows) {
      const title = r.title || '(no title)';
      md += `- ${r.url}, ${escapeMd(title)}\n`;
    }
    md += `\n`;
  }

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_FILE, md);
  console.log(`\nWrote ${OUT_FILE}`);
  console.log(`  ${rows.length} rows total`);

  const emDashCount = (md.match(/[—–]/g) ?? []).length;
  if (emDashCount > 0) {
    console.warn(`  WARN: ${emDashCount} em/en dashes remain in output`);
  } else {
    console.log(`  clean: 0 em/en dashes in output`);
  }
}

main();
