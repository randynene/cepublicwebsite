import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

import { buildInteractionInventory } from './04-interaction-inventory';
import { buildScriptInventory } from './05-script-inventory';
import { buildFormsInventory } from './06-forms-inventory';
import { classifyTemplates } from './07-template-classifier';
import { diffTemplateCustomCode } from './03e-template-custom-code';
import { buildManifest } from './08-manifest-builder';
import { writeManifestToDb } from './09-manifest-writer';
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

function loadCanonicalUrls(): CanonicalUrl[] {
  const data = JSON.parse(
    fs.readFileSync(path.join(AUDIT_DIR, 'ce-canonical-urls.json'), 'utf-8')
  ) as { canonicalUrls: CanonicalUrl[] };
  return data.canonicalUrls;
}

async function runChunk2(): Promise<void> {
  console.log('\n=== MYGRATR-AUDIT-1: Site Audit Agent — CHUNK 2 (Steps 4 → 9) ===\n');
  const start = Date.now();

  // Load prerequisites from disk
  console.log('--- Loading prerequisites from disk ---');
  const canonicalUrls = loadCanonicalUrls();
  console.log(`  Canonical URLs:   ${canonicalUrls.length}`);
  const pageContents = loadPageContentsFromDisk();
  console.log(`  Page contents:    ${Object.keys(pageContents).length}`);

  console.log('\n--- Step 4: Interaction Inventory ---');
  try {
    await buildInteractionInventory(pageContents);
  } catch (err) {
    console.error(`  Step 4 failed: ${String(err)}`);
    if (String(err).includes('auth failed') || String(err).includes('quota exhausted')) throw err;
  }

  console.log('\n--- Step 5: Third-Party Script Inventory ---');
  await buildScriptInventory(pageContents);

  console.log('\n--- Step 6: Forms Inventory + HubSpot Verification ---');
  try {
    await buildFormsInventory(pageContents);
  } catch (err) {
    console.error(`  Step 6 failed (non-blocking): ${String(err)}`);
  }

  console.log('\n--- Step 7: Template Classification (rules + LLM) ---');
  const templateMap = await classifyTemplates(canonicalUrls, pageContents);

  console.log('\n--- Step 3e (refresh with full Step 5 inventory): Template Custom Code Diff ---');
  try {
    await diffTemplateCustomCode(templateMap, pageContents);
  } catch (err) {
    console.error(`  Step 3e refresh failed: ${String(err)}`);
  }

  console.log('\n--- Step 8: Manifest Builder ---');
  const manifest = await buildManifest();

  console.log('\n--- Step 9: Write Manifest to Supabase ---');
  await writeManifestToDb();

  const elapsed = Math.round((Date.now() - start) / 1000);
  console.log(`\n=== Chunk 2 (Steps 4 → 9) complete in ${elapsed}s ===\n`);

  const criticalCount = manifest.anomalies.filter(a => a.severity === 'critical').length;
  const warningCount = manifest.anomalies.filter(a => a.severity === 'warning').length;

  console.log('Outputs written to audit-output/:');
  console.log('  pages/{slug}/interactions.json      — per-page interactions (Step 4)');
  console.log('  ce-interactions-summary.json        — Step 4 summary');
  console.log('  ce-scripts.json                     — global + per-page scripts (Step 5)');
  console.log('  ce-forms.json                       — verified HubSpot forms (Step 6)');
  console.log('  ce-template-map.json                — full classified template map (Step 7)');
  console.log('  ce-template-map-llm-review.json     — URLs needing human review (Step 7)');
  console.log('  ce-template-custom-code.json        — template-level script diff (Step 3e)');
  console.log('  ce-template-custom-code-review.json — SEO-critical/ambiguous scripts (Step 3e)');
  console.log('  ce-manifest.json                    — full migration manifest (Step 8)');
  console.log('  Supabase audit_manifests            — DB write (Step 9)');
  console.log('  Supabase migrations.current_phase   — updated to audit_complete (Step 9)');

  if (criticalCount > 0) {
    console.log(`\n[!] CRITICAL ANOMALIES (${criticalCount}):`);
    for (const a of manifest.anomalies.filter(a => a.severity === 'critical').slice(0, 10)) {
      console.log(`  [${a.category}] ${a.description}`);
      if (a.affectedUrl) console.log(`    URL: ${a.affectedUrl}`);
      console.log(`    Fix: ${a.recommendation}`);
    }
  } else {
    console.log('\nNo critical anomalies.');
  }

  console.log(`\nSummary: ${manifest.totalIndexableUrls} indexable / ${manifest.totalForms} forms / ${manifest.totalCollections} collections / ${manifest.totalCmsItems} items / ${criticalCount} critical + ${warningCount} warning anomalies / ${manifest.requiresManualReviewCount} URLs need manual review`);
}

runChunk2().catch(err => {
  console.error('\nChunk 2 failed:', err);
  process.exit(1);
});
