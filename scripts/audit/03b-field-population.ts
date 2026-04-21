import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const AUDIT_DIR = path.join(process.cwd(), 'audit-output');
const WF_TOKEN = process.env.WEBFLOW_API_TOKEN!;
const WF_BASE = 'https://api.webflow.com/v2';

interface FieldPopulation {
  slug: string;
  displayName: string;
  type: string;
  usPopulatedCount: number;
  usPopulatedRate: number;
  classification: 'structural' | 'conditional' | 'edge_case';
  hasUkOverride: boolean;
  ukOverrideRate: number;
  ukOverrideExample?: string;
  isInJsonLd: boolean;
}

interface CollectionPopulationReport {
  collectionSlug: string;
  displayName: string;
  totalItems: number;
  totalUkItems: number;
  fields: FieldPopulation[];
  hasLocaleVariants: boolean;
  localeStrategy: 'single-document' | 'locale-fields-on-shared' | 'investigate';
  draftInUkCount: number;
  error?: string;
}

const JSONLD_FIELD_SLUGS = new Set([
  'slug', 'name', 'focus-1-blurb', 'short-description',
  'fold-3---item-2-header', 'fold-3---item-3-header',
  'fold-3---item-4-header', 'fold-3---item-5-header',
  'fold-3---item-6-header', 'focus-4-blurb',
]);

async function wfGet(endpoint: string, locale?: string): Promise<unknown> {
  const url = locale
    ? `${WF_BASE}${endpoint}${endpoint.includes('?') ? '&' : '?'}locale=${locale}`
    : `${WF_BASE}${endpoint}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${WF_TOKEN}`, accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`Webflow API ${endpoint}: ${res.status} ${await res.text()}`);
  return res.json();
}

async function fetchAllItems(
  collectionId: string,
  locale?: string
): Promise<Array<Record<string, unknown>>> {
  const items: Array<Record<string, unknown>> = [];
  let offset = 0;
  const limitPerPage = 100;
  const MAX_PAGES = 50;
  let pageCount = 0;

  while (pageCount < MAX_PAGES) {
    const endpoint = `/collections/${collectionId}/items?limit=${limitPerPage}&offset=${offset}`;
    let data: {
      items: Array<{ fieldData: Record<string, unknown>; isDraft?: boolean; isArchived?: boolean }>;
      pagination?: { total?: number };
    };
    try {
      data = await wfGet(endpoint, locale) as typeof data;
    } catch (err) {
      // Some collections may not support locales — treat unsupported-locale errors as "no UK items"
      if (locale && String(err).includes('locale')) return [];
      throw err;
    }

    let pageItems = 0;
    for (const item of data.items) {
      if (!item.isArchived) {
        items.push({ ...item.fieldData, _isDraft: item.isDraft ?? false });
      }
      pageItems++;
    }

    if (pageItems < limitPerPage) break;
    offset += limitPerPage;
    pageCount++;

    await new Promise(r => setTimeout(r, 100));
  }

  if (pageCount >= MAX_PAGES) {
    console.warn(`  Warning: hit MAX_PAGES (${MAX_PAGES}) for collection ${collectionId}`);
  }

  return items;
}

export async function analyseFieldPopulation(): Promise<CollectionPopulationReport[]> {
  const inventoryRaw = JSON.parse(
    fs.readFileSync(path.join(AUDIT_DIR, 'ce-inventory.json'), 'utf-8')
  ) as { collections?: Array<{ id: string; slug: string; displayName: string; fields?: Array<{ slug: string; displayName: string; type: string }> }> };

  const collections = inventoryRaw.collections ?? [];
  const reports: CollectionPopulationReport[] = [];

  for (const collection of collections) {
    console.log(`  Analysing: ${collection.displayName} (${collection.slug})`);

    try {
      const usItems = await fetchAllItems(collection.id, 'en');
      let ukItems: Array<Record<string, unknown>> = [];
      try {
        ukItems = await fetchAllItems(collection.id, 'en-GB');
      } catch (err) {
        console.warn(`    UK locale fetch failed, assuming no UK variants: ${String(err).slice(0, 80)}`);
      }

      const ukItemMap = new Map<string, Record<string, unknown>>();
      for (const item of ukItems) {
        const slug = item['slug'] as string;
        if (slug) ukItemMap.set(slug, item);
      }

      const fields: FieldPopulation[] = [];
      const collectionFields = collection.fields ?? [];

      for (const field of collectionFields) {
        let usPopulated = 0;
        for (const item of usItems) {
          const val = item[field.slug];
          if (val !== null && val !== undefined && val !== '') {
            usPopulated++;
          }
        }

        const usRate = usItems.length > 0
          ? Math.round((usPopulated / usItems.length) * 100)
          : 0;

        const classification: FieldPopulation['classification'] =
          usRate >= 80 ? 'structural' :
          usRate >= 40 ? 'conditional' : 'edge_case';

        let ukOverrideCount = 0;
        let ukExample: string | undefined;

        for (const usItem of usItems) {
          const slug = usItem['slug'] as string;
          const ukItem = ukItemMap.get(slug);
          if (!ukItem) continue;

          const usVal = String(usItem[field.slug] ?? '');
          const ukVal = String(ukItem[field.slug] ?? '');

          if (ukVal && ukVal !== usVal) {
            ukOverrideCount++;
            if (!ukExample) ukExample = ukVal.slice(0, 100);
          }
        }

        const ukOverrideRate = usItems.length > 0
          ? Math.round((ukOverrideCount / usItems.length) * 100)
          : 0;

        fields.push({
          slug: field.slug,
          displayName: field.displayName,
          type: field.type,
          usPopulatedCount: usPopulated,
          usPopulatedRate: usRate,
          classification,
          hasUkOverride: ukOverrideCount > 0,
          ukOverrideRate,
          ukOverrideExample: ukExample,
          isInJsonLd: JSONLD_FIELD_SLUGS.has(field.slug),
        });
      }

      let draftInUkCount = 0;
      for (const usItem of usItems) {
        const slug = usItem['slug'] as string;
        const ukItem = ukItemMap.get(slug);
        if (ukItem && ukItem['_isDraft']) draftInUkCount++;
      }

      const anyUkOverride = fields.some(f => f.hasUkOverride);
      const localeStrategy: CollectionPopulationReport['localeStrategy'] =
        ukItems.length === 0 ? 'single-document' :
        anyUkOverride ? 'locale-fields-on-shared' : 'single-document';

      reports.push({
        collectionSlug: collection.slug,
        displayName: collection.displayName,
        totalItems: usItems.length,
        totalUkItems: ukItems.length,
        fields,
        hasLocaleVariants: ukItems.length > 0,
        localeStrategy,
        draftInUkCount,
      });

      const edgeCases = fields.filter(f => f.classification === 'edge_case').length;
      const withUkOverride = fields.filter(f => f.hasUkOverride).length;
      console.log(`    US items: ${usItems.length}, UK items: ${ukItems.length}`);
      console.log(`    Edge case fields: ${edgeCases}, Fields with UK overrides: ${withUkOverride}`);
      if (draftInUkCount > 0) {
        console.log(`    WARN Draft in UK: ${draftInUkCount} items`);
      }

    } catch (err) {
      console.error(`    FAIL: ${String(err)}`);
      reports.push({
        collectionSlug: collection.slug,
        displayName: collection.displayName,
        totalItems: 0,
        totalUkItems: 0,
        fields: [],
        hasLocaleVariants: false,
        localeStrategy: 'investigate',
        draftInUkCount: 0,
        error: String(err),
      });
    }

    await new Promise(r => setTimeout(r, 250));
  }

  fs.writeFileSync(
    path.join(AUDIT_DIR, 'ce-field-population.json'),
    JSON.stringify(reports, null, 2)
  );

  const edgeCaseSummary = reports.map(r => ({
    collection: r.displayName,
    totalItems: r.totalItems,
    localeStrategy: r.localeStrategy,
    draftInUk: r.draftInUkCount,
    error: r.error,
    edgeCaseFields: r.fields
      .filter(f => f.classification === 'edge_case')
      .map(f => ({ field: f.slug, rate: `${f.usPopulatedRate}%` })),
    ukOverrideFields: r.fields
      .filter(f => f.hasUkOverride)
      .map(f => ({ field: f.slug, ukRate: `${f.ukOverrideRate}%` })),
  }));

  fs.writeFileSync(
    path.join(AUDIT_DIR, 'ce-field-population-summary.json'),
    JSON.stringify(edgeCaseSummary, null, 2)
  );

  console.log(`\nField population analysis complete: ${reports.length} collections`);
  return reports;
}

import { fileURLToPath } from 'url';
if (process.argv[1] && fs.existsSync(process.argv[1]) &&
    fileURLToPath(import.meta.url) === fs.realpathSync(process.argv[1])) {
  analyseFieldPopulation().catch(err => {
    console.error('Field population failed:', err);
    process.exit(1);
  });
}
