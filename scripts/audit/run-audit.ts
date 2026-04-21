import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

import { verifyInputs } from './00-verify-inputs';
import { captureAhrefsBaseline } from './00-ahrefs-baseline';
import { reconcileUrls } from './01-reconcile-urls';
import { extractPageContent } from './03-content-extractor';
import { analyseFieldPopulation } from './03b-field-population';
import { buildGlobalComponentInventory } from './03c-global-components';
import { buildAssetManifest } from './03d-asset-manifest';
import { buildRulesOnlyTemplateMap, runScreenshotAgent } from './02-screenshot-agent';
import { diffTemplateCustomCode } from './03e-template-custom-code';
import type { CanonicalUrl, PageContent } from '../../src/lib/audit-types';

const AUDIT_DIR = path.join(process.cwd(), 'audit-output');
const PAGES_DIR = path.join(AUDIT_DIR, 'pages');

function loadPageContentsFromDisk(): Record<string, PageContent> {
  const contents: Record<string, PageContent> = {};
  if (!fs.existsSync(PAGES_DIR)) return contents;
  for (const slugDir of fs.readdirSync(PAGES_DIR)) {
    const contentFile = path.join(PAGES_DIR, slugDir, 'content.json');
    if (!fs.existsSync(contentFile)) continue;
    try {
      const content = JSON.parse(fs.readFileSync(contentFile, 'utf-8')) as PageContent;
      if (content.path) contents[content.path] = content;
    } catch (err) {
      console.warn(`  Could not parse ${contentFile}: ${String(err)}`);
    }
  }
  return contents;
}

async function runAudit(): Promise<void> {
  console.log('\n=== MYGRATR-AUDIT-1: Site Audit Agent (Steps 00 → 3e) ===\n');
  const start = Date.now();

  await verifyInputs();

  console.log('\n--- Step 00: Ahrefs SEO Baseline ---');
  try {
    await captureAhrefsBaseline();
  } catch (err) {
    console.warn(`  Ahrefs step failed (non-blocking): ${String(err)}`);
  }

  console.log('\n--- Step 1: URL Reconciliation ---');
  const { canonicalUrls } = await reconcileUrls();

  console.log('\n--- Step 3: Content Extraction (Firecrawl) ---');
  let pageContents = await extractPageContent(canonicalUrls);

  // If nothing was extracted in memory (e.g. circuit breaker tripped), hydrate from disk
  if (Object.keys(pageContents).length === 0) {
    console.log('  In-memory extraction empty — hydrating from disk');
    pageContents = loadPageContentsFromDisk();
  } else {
    // Merge disk + memory for subsequent phases (covers partial re-runs)
    const fromDisk = loadPageContentsFromDisk();
    for (const [p, c] of Object.entries(fromDisk)) {
      if (!pageContents[p]) pageContents[p] = c;
    }
  }
  console.log(`  Total page contents available: ${Object.keys(pageContents).length}`);

  console.log('\n--- Step 3b: Webflow Field Population + Locale Diff ---');
  try {
    await analyseFieldPopulation();
  } catch (err) {
    console.warn(`  Step 3b failed (non-blocking): ${String(err)}`);
  }

  console.log('\n--- Step 3c: Global Component Inventory ---');
  try {
    await buildGlobalComponentInventory(pageContents);
  } catch (err) {
    console.warn(`  Step 3c failed (non-blocking): ${String(err)}`);
  }

  console.log('\n--- Step 3d: Asset Manifest ---');
  try {
    await buildAssetManifest(pageContents);
  } catch (err) {
    console.warn(`  Step 3d failed (non-blocking): ${String(err)}`);
  }

  console.log('\n--- Rules-only template classification (for Steps 2 and 3e) ---');
  const templateMap = buildRulesOnlyTemplateMap(canonicalUrls);
  fs.writeFileSync(
    path.join(AUDIT_DIR, 'ce-template-map-rules.json'),
    JSON.stringify(templateMap, null, 2)
  );
  console.log(`  Rules-classified ${templateMap.length} URLs → audit-output/ce-template-map-rules.json`);

  console.log('\n--- Step 2: Playwright Screenshot Agent ---');
  try {
    await runScreenshotAgent(canonicalUrls, templateMap);
  } catch (err) {
    console.warn(`  Step 2 failed (non-blocking): ${String(err)}`);
  }

  console.log('\n--- Step 3e: Template Custom Code Diff ---');
  try {
    await diffTemplateCustomCode(templateMap, pageContents);
  } catch (err) {
    console.warn(`  Step 3e failed (non-blocking): ${String(err)}`);
  }

  const elapsed = Math.round((Date.now() - start) / 1000);
  console.log(`\n=== Audit (Steps 00 → 3e) complete in ${elapsed}s ===\n`);
  console.log('Outputs written to audit-output/:');
  console.log('  ce-ahrefs-baseline.json            — SEO baseline (Step 00)');
  console.log('  ce-canonical-urls.json             — reconciled URL inventory (Step 1)');
  console.log('  ce-regex-redirects.json            — regex redirects for next.config.js (Step 1)');
  console.log('  ce-sitemap-xml.json                — sitemap.xml cache (Step 1 helper)');
  console.log('  ce-content-extraction-summary.json — Firecrawl extraction summary (Step 3)');
  console.log('  pages/{slug}/content.json          — per-page content (Step 3)');
  console.log('  ce-field-population.json           — field population + locale diff (Step 3b)');
  console.log('  ce-field-population-summary.json   — human-readable edge cases (Step 3b)');
  console.log('  ce-global-components.json          — nav, footer, Clara, Finsweet (Step 3c)');
  console.log('  ce-assets.json                     — CDN asset manifest (Step 3d)');
  console.log('  ce-template-map-rules.json         — rules-based template classification');
  console.log('  ce-screenshots.json                — screenshot index (Step 2)');
  console.log('  screenshots/{slug}/{bp}.png        — baseline screenshots (Step 2)');
  console.log('  ce-template-custom-code.json       — per-template script diff (Step 3e)');
  console.log('  ce-template-custom-code-review.json — items needing human review (Step 3e)');
}

runAudit().catch(err => {
  console.error('\nAudit failed:', err);
  process.exit(1);
});
