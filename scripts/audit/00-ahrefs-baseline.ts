import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const AUDIT_DIR = path.join(process.cwd(), 'audit-output');
const TARGET = 'cloudemployee.io';
const AHREFS_BASE = 'https://api.ahrefs.com/v3';
const API_KEY = process.env.AHREFS_API_KEY;

export interface AhrefsBaseline {
  capturedAt: string;
  domain: string;
  domainRating: number | null;
  referringDomains: number | null;
  organicKeywords: number | null;
  estimatedMonthlyTraffic: number | null;
  topKeywords: Array<{
    keyword: string;
    position: number;
    volume: number;
    url: string;
    country: string;
  }>;
  topPages: Array<{
    url: string;
    organicTraffic: number;
    topKeyword: string;
  }>;
  notes: string[];
}

async function ahrefsGet(endpoint: string, params: Record<string, string>): Promise<unknown> {
  const url = new URL(`${AHREFS_BASE}${endpoint}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });

  if (!res.ok) {
    throw new Error(`Ahrefs API ${endpoint} returned ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

export async function captureAhrefsBaseline(): Promise<AhrefsBaseline | null> {
  if (!API_KEY) {
    console.warn('  AHREFS_API_KEY not set — skipping baseline snapshot');
    return null;
  }

  console.log(`Ahrefs baseline: fetching data for ${TARGET}`);
  const baseline: AhrefsBaseline = {
    capturedAt: new Date().toISOString(),
    domain: TARGET,
    domainRating: null,
    referringDomains: null,
    organicKeywords: null,
    estimatedMonthlyTraffic: null,
    topKeywords: [],
    topPages: [],
    notes: [],
  };

  try {
    const metrics = await ahrefsGet('/site-explorer/metrics', {
      target: TARGET,
      mode: 'domain',
      date: new Date().toISOString().split('T')[0],
    }) as { metrics?: { domain_rating?: number; refdomains?: number; org_keywords?: number; org_traffic?: number } };

    const m = metrics.metrics ?? {};
    baseline.domainRating = m.domain_rating ?? null;
    baseline.referringDomains = m.refdomains ?? null;
    baseline.organicKeywords = m.org_keywords ?? null;
    baseline.estimatedMonthlyTraffic = m.org_traffic ?? null;
    console.log(`  DR: ${baseline.domainRating}, Traffic: ${baseline.estimatedMonthlyTraffic}, Keywords: ${baseline.organicKeywords}`);
  } catch (err) {
    const msg = `Could not fetch site metrics: ${String(err)}`;
    console.warn(`  ${msg}`);
    baseline.notes.push(msg);
  }

  try {
    const kw = await ahrefsGet('/site-explorer/organic-keywords', {
      target: TARGET,
      mode: 'domain',
      limit: '100',
      order_by: 'traffic:desc',
      country: 'us',
      select: 'keyword,rank_type,pos,volume,url',
    }) as { keywords?: Array<{ keyword: string; rank_type: string; pos: number; volume: number; url: string }> };

    baseline.topKeywords = (kw.keywords ?? []).map(k => ({
      keyword: k.keyword,
      position: k.pos,
      volume: k.volume,
      url: k.url,
      country: 'us',
    }));
    console.log(`  Top keywords captured: ${baseline.topKeywords.length}`);
  } catch (err) {
    const msg = `Could not fetch organic keywords: ${String(err)}`;
    console.warn(`  ${msg}`);
    baseline.notes.push(msg);
  }

  try {
    const pages = await ahrefsGet('/site-explorer/top-pages', {
      target: TARGET,
      mode: 'domain',
      limit: '20',
      order_by: 'traffic:desc',
      select: 'url,traffic,top_keyword',
    }) as { pages?: Array<{ url: string; traffic: number; top_keyword: string }> };

    baseline.topPages = (pages.pages ?? []).map(p => ({
      url: p.url,
      organicTraffic: p.traffic,
      topKeyword: p.top_keyword,
    }));
    console.log(`  Top pages captured: ${baseline.topPages.length}`);
  } catch (err) {
    const msg = `Could not fetch top pages: ${String(err)}`;
    console.warn(`  ${msg}`);
    baseline.notes.push(msg);
  }

  fs.mkdirSync(AUDIT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(AUDIT_DIR, 'ce-ahrefs-baseline.json'),
    JSON.stringify(baseline, null, 2)
  );
  console.log('  Ahrefs baseline written to audit-output/ce-ahrefs-baseline.json');

  return baseline;
}

import { fileURLToPath } from 'url';
import fs2 from 'fs';
if (process.argv[1] && fs2.existsSync(process.argv[1]) &&
    fileURLToPath(import.meta.url) === fs2.realpathSync(process.argv[1])) {
  captureAhrefsBaseline().catch(err => {
    console.error('Ahrefs baseline failed:', err);
    process.exit(1);
  });
}
