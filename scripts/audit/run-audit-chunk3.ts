import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

import { buildInteractionInventory } from './04-interaction-inventory';
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

async function runChunk3(): Promise<void> {
  console.log('\n=== MYGRATR-AUDIT-1: CHUNK 3 (LLM refresh — Steps 4, 7, 3e, 8, 9) ===\n');
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY missing — abort. Add it to .env before running Chunk 3.');
  }
  const start = Date.now();

  console.log('--- Loading prerequisites from disk ---');
  const canonicalUrls = loadCanonicalUrls();
  const pageContents = loadPageContentsFromDisk();
  console.log(`  Canonical URLs:   ${canonicalUrls.length}`);
  console.log(`  Page contents:    ${Object.keys(pageContents).length}`);

  console.log('\n--- Step 4 (refresh): Interaction Inventory with Claude tier-2 ---');
  await buildInteractionInventory(pageContents);

  console.log('\n--- Step 7 (refresh): Template Classification with LLM tier ---');
  const templateMap = await classifyTemplates(canonicalUrls, pageContents);

  console.log('\n--- Step 3e (refresh): Template Custom Code Diff ---');
  await diffTemplateCustomCode(templateMap, pageContents);

  console.log('\n--- Step 8 (refresh): Manifest Builder ---');
  const manifest = await buildManifest();

  console.log('\n--- Step 9 (refresh): Write Manifest to Supabase ---');
  await writeManifestToDb();

  const elapsed = Math.round((Date.now() - start) / 1000);
  console.log(`\n=== Chunk 3 complete in ${elapsed}s ===`);

  const criticalCount = manifest.anomalies.filter(a => a.severity === 'critical').length;
  const warningCount = manifest.anomalies.filter(a => a.severity === 'warning').length;
  console.log(`\nFinal: ${manifest.totalIndexableUrls} indexable / ${manifest.totalForms} forms / ${manifest.totalCollections} collections / ${manifest.totalCmsItems} items / ${criticalCount} critical + ${warningCount} warning anomalies / ${manifest.requiresManualReviewCount} URLs need manual review`);
}

runChunk3().catch(err => {
  console.error('\nChunk 3 failed:', err);
  process.exit(1);
});
