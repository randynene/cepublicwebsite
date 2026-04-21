import fs from 'fs';
import path from 'path';
import { parse as csvParse } from 'csv-parse/sync';
import dotenv from 'dotenv';
import { UrlStatus } from '../../src/lib/audit-types';
import type { CanonicalUrl, AuditAnomaly } from '../../src/lib/audit-types';
dotenv.config();

const AUDIT_DIR = path.join(process.cwd(), 'audit-output');
const CE_ORIGIN = 'https://cloudemployee.io';

function normUrl(url: string): string {
  if (!url) return '';
  try {
    const u = new URL(url);
    // Normalize www.cloudemployee.io → cloudemployee.io so all sources align
    const host = u.hostname.replace(/^www\./, '');
    return (`${u.protocol}//${host}${u.pathname}`).toLowerCase().replace(/\/$/, '');
  } catch {
    return url.toLowerCase().replace(/\/$/, '');
  }
}

function buildSlug(urlPath: string): string {
  return urlPath
    .replace(/^\/|\/$/g, '')
    .replace(/\//g, '__')
    .replace(/[^a-z0-9_]/gi, '-')
    .replace(/-+/g, '-')
    .slice(0, 80) || 'home';
}

function detectLocale(urlPath: string): { locale: 'us' | 'uk'; isVariant: boolean; baseUrl?: string } {
  if (urlPath.startsWith('/uk/') || urlPath === '/uk') {
    const base = urlPath === '/uk' ? '/' : urlPath.replace(/^\/uk/, '');
    return { locale: 'uk', isVariant: true, baseUrl: `${CE_ORIGIN}${base}` };
  }
  return { locale: 'us', isVariant: false };
}

function isPaginationUrl(urlPath: string, queryString: string): boolean {
  return /\/page\/\d+\/?$/.test(urlPath) ||
    /\/p\/\d+\/?$/.test(urlPath) ||
    /[?&]page=\d+/.test(urlPath) ||
    /_page=\d+/.test(queryString);
}

async function fetchSitemapXml(): Promise<string[]> {
  const sitemapPath = path.join(AUDIT_DIR, 'ce-sitemap-xml.json');
  if (fs.existsSync(sitemapPath)) {
    return JSON.parse(fs.readFileSync(sitemapPath, 'utf-8')) as string[];
  }

  console.log('  ce-sitemap-xml.json missing — fetching sitemap.xml live');
  try {
    const res = await fetch(`${CE_ORIGIN}/sitemap.xml`);
    if (!res.ok) {
      console.warn(`  Sitemap fetch failed: HTTP ${res.status} — continuing without sitemap source`);
      return [];
    }
    const xml = await res.text();
    const urls = Array.from(xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)).map(m => m[1]);
    fs.writeFileSync(sitemapPath, JSON.stringify(urls, null, 2));
    console.log(`  sitemap.xml: ${urls.length} URLs parsed and cached`);
    return urls;
  } catch (err) {
    console.warn(`  Sitemap fetch failed: ${String(err)} — continuing without sitemap source`);
    return [];
  }
}

export async function reconcileUrls(): Promise<{
  canonicalUrls: CanonicalUrl[];
  anomalies: AuditAnomaly[];
}> {
  const anomalies: AuditAnomaly[] = [];

  const sfRaw = fs.readFileSync(path.join(AUDIT_DIR, 'screaming-frog-export.csv'), 'utf-8');
  const sfRows = csvParse(sfRaw, { columns: true, skip_empty_lines: true, bom: true, relax_column_count: true }) as Record<string, string>[];

  const sfMap = new Map<string, Record<string, string>>();
  for (const row of sfRows) {
    const norm = normUrl(row['Address'] ?? '');
    if (norm) sfMap.set(norm, row);
  }
  console.log(`  Screaming Frog: ${sfMap.size} URLs loaded`);

  const sfRedirectRaw = fs.readFileSync(path.join(AUDIT_DIR, 'screaming-frog-redirects.csv'), 'utf-8');
  const sfRedirectRows = csvParse(sfRedirectRaw, { columns: true, skip_empty_lines: true, bom: true, relax_column_count: true }) as Record<string, string>[];
  const redirectMap = new Map<string, string>();
  for (const row of sfRedirectRows) {
    const src = normUrl(row['Source'] ?? row['Address'] ?? '');
    const dst = row['Destination'] ?? row['Redirect URL'] ?? '';
    if (src) redirectMap.set(src, dst);
  }
  console.log(`  Screaming Frog redirects: ${redirectMap.size} entries`);

  const wfRedirectRaw = fs.readFileSync(path.join(AUDIT_DIR, 'webflow-redirects.csv'), 'utf-8');
  const wfRedirectRows = csvParse(wfRedirectRaw, { columns: true, skip_empty_lines: true, bom: true, relax_column_count: true }) as Record<string, string>[];

  const regexRedirects: Array<{ pattern: string; target: string }> = [];

  for (const row of wfRedirectRows) {
    const keys = Object.keys(row);
    const sourceKey = keys.find(k => /^source$/i.test(k)) ?? 'source';
    const targetKey = keys.find(k => /^target$|^destination$/i.test(k)) ?? 'target';
    const source = (row[sourceKey] ?? '').trim();
    const target = (row[targetKey] ?? '').trim();
    if (!source) continue;

    if (source.includes('(.*)') || /[+?{}[\]]/.test(source)) {
      regexRedirects.push({ pattern: source, target });
      continue;
    }

    const sourceUrl = source.startsWith('http') ? source : `${CE_ORIGIN}${source.startsWith('/') ? source : '/' + source}`;
    const normalisedSource = normUrl(sourceUrl);
    if (normalisedSource) redirectMap.set(normalisedSource, target);
  }
  console.log(`  Webflow redirects: ${wfRedirectRows.length} rows parsed, ${regexRedirects.length} regex patterns`);

  fs.writeFileSync(
    path.join(AUDIT_DIR, 'ce-regex-redirects.json'),
    JSON.stringify({ count: regexRedirects.length, redirects: regexRedirects }, null, 2)
  );

  const EXCLUDED_PREFIXES = ['/ph', '/live-job-role'];
  const isExcludedPath = (p: string): boolean =>
    EXCLUDED_PREFIXES.some(prefix => p === prefix || p.startsWith(prefix + '/'));

  const sitemapXml = await fetchSitemapXml();
  const sitemapSet = new Set(sitemapXml.map(normUrl).filter(Boolean));
  console.log(`  Sitemap.xml: ${sitemapSet.size} URLs`);

  const firecrawlData = JSON.parse(fs.readFileSync(path.join(AUDIT_DIR, 'ce-sitemap.json'), 'utf-8'));
  const firecrawlUrls: string[] = Array.isArray(firecrawlData)
    ? firecrawlData.map((item: unknown) => typeof item === 'string' ? item : (item as Record<string, string>).url ?? '')
    : Array.isArray((firecrawlData as { urls?: string[] }).urls)
      ? (firecrawlData as { urls: string[] }).urls
      : [];
  const firecrawlSet = new Set(firecrawlUrls.map(normUrl).filter(Boolean));
  console.log(`  Firecrawl crawl: ${firecrawlSet.size} URLs`);

  const allUrls = new Set<string>([...sfMap.keys(), ...sitemapSet, ...firecrawlSet]);
  console.log(`  Union total: ${allUrls.size}`);

  const canonicalUrls: CanonicalUrl[] = [];

  for (const normU of allUrls) {
    if (!normU) continue;

    const urlObj = (() => { try { return new URL(normU); } catch { return null; } })();
    const urlPath = urlObj?.pathname ?? '';
    const queryString = urlObj?.search ?? '';
    const url = urlObj ? urlObj.href : normU;

    if (isPaginationUrl(urlPath, queryString)) continue;
    if (isExcludedPath(urlPath)) continue;

    const sfRow = sfMap.get(normU);
    const contentType = sfRow?.['Content Type'] ?? '';
    if (contentType && !contentType.toLowerCase().includes('text/html')) continue;

    const statusCode = sfRow?.['Status Code'] ?? 'unknown';
    const indexability = sfRow?.['Indexability'] ?? '';
    const indexStatus = sfRow?.['Indexability Status'] ?? '';
    if (indexability === 'Non-Indexable' && indexStatus === 'Blocked by robots.txt') continue;

    // Screaming Frog crawls hit Cloudflare rate-limits (429) on some URLs — those pages
    // still exist in production and must be treated as indexable when sitemap or Firecrawl
    // confirm them. Same logic applies to any transient 4xx/5xx if sitemap/Firecrawl says so.
    const confirmedLive = sitemapSet.has(normU) || firecrawlSet.has(normU);

    let status: UrlStatus;
    if (statusCode === '200') status = UrlStatus.OK;
    else if (statusCode === '301') status = UrlStatus.REDIRECT_301;
    else if (statusCode === '302') status = UrlStatus.REDIRECT_302;
    else if (statusCode === '404') status = UrlStatus.NOT_FOUND;
    else if (statusCode === 'unknown') status = UrlStatus.OK;
    else if (statusCode === '429' && confirmedLive) status = UrlStatus.OK;
    else if (confirmedLive && /^[45]\d\d$/.test(statusCode)) status = UrlStatus.OK;
    else status = UrlStatus.ERROR;

    const localeInfo = detectLocale(urlPath);

    if (status === UrlStatus.NOT_FOUND && sitemapSet.has(normU)) {
      anomalies.push({
        severity: 'critical',
        category: 'url',
        description: 'URL in sitemap returns 404',
        affectedUrl: url,
        recommendation: 'Verify this page exists in Webflow. May need to be removed from sitemap pre-migration.',
      });
    }

    if (!sitemapSet.has(normU) && !firecrawlSet.has(normU) && sfMap.has(normU) && status === UrlStatus.OK) {
      anomalies.push({
        severity: 'warning',
        category: 'url',
        description: 'URL found by Screaming Frog but absent from both sitemap and Firecrawl crawl',
        affectedUrl: url,
        recommendation: 'Verify this is not an orphan page. If real, add to canonical list and investigate why it was not crawled.',
      });
    }

    const sourcesMatched = [
      sitemapSet.has(normU) && 'sitemap',
      firecrawlSet.has(normU) && 'firecrawl',
      sfMap.has(normU) && 'screaming_frog',
    ].filter(Boolean) as string[];

    const source: CanonicalUrl['source'] = sourcesMatched.length > 1
      ? 'multiple'
      : (sourcesMatched[0] as 'sitemap' | 'firecrawl' | 'screaming_frog' ?? 'firecrawl');

    const entry: CanonicalUrl = {
      url,
      path: urlPath,
      slug: buildSlug(urlPath),
      status,
      inSitemap: sitemapSet.has(normU),
      inFirecrawl: firecrawlSet.has(normU),
      inScreamingFrog: sfMap.has(normU),
      locale: localeInfo.locale,
      isLocaleVariant: localeInfo.isVariant,
      baseUrl: localeInfo.baseUrl,
      redirectTarget: redirectMap.get(normU),
      source,
    };

    canonicalUrls.push(entry);
  }

  const output = { canonicalUrls, anomalies, generatedAt: new Date().toISOString() };
  fs.writeFileSync(path.join(AUDIT_DIR, 'ce-canonical-urls.json'), JSON.stringify(output, null, 2));

  const indexable = canonicalUrls.filter(u => u.status === UrlStatus.OK);
  console.log(`URL Reconciliation complete:`);
  console.log(`  Total canonical URLs: ${canonicalUrls.length}`);
  console.log(`  Indexable (200):      ${indexable.length}`);
  console.log(`  Redirects:            ${canonicalUrls.filter(u => u.status === UrlStatus.REDIRECT_301 || u.status === UrlStatus.REDIRECT_302).length}`);
  console.log(`  Not found:            ${canonicalUrls.filter(u => u.status === UrlStatus.NOT_FOUND).length}`);
  console.log(`  Anomalies:            ${anomalies.length}`);
  console.log(`  UK locale variants:   ${canonicalUrls.filter(u => u.isLocaleVariant).length}`);
  console.log(`  Regex redirects:      ${regexRedirects.length} (ce-regex-redirects.json)`);

  return { canonicalUrls, anomalies };
}

import { fileURLToPath } from 'url';
if (process.argv[1] && fs.existsSync(process.argv[1]) &&
    fileURLToPath(import.meta.url) === fs.realpathSync(process.argv[1])) {
  reconcileUrls().catch(err => {
    console.error('URL reconciliation failed:', err);
    process.exit(1);
  });
}
