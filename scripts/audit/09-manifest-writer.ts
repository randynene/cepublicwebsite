import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import type { MigrationManifest } from './08-manifest-builder';
dotenv.config();

const AUDIT_DIR = path.join(process.cwd(), 'audit-output');

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CE_ORG_ID = 'ce000000-0000-0000-0000-000000000001';
const CE_MIGRATION_ID = 'ce000000-0000-0000-0000-000000000002';

export async function writeManifestToDb(): Promise<void> {
  console.log('Writing manifest to Supabase...');

  const manifest: MigrationManifest = JSON.parse(
    fs.readFileSync(path.join(AUDIT_DIR, 'ce-manifest.json'), 'utf-8')
  );

  const record = {
    org_id: CE_ORG_ID,
    migration_id: CE_MIGRATION_ID,
    total_pages: manifest.totalIndexableUrls,
    total_collections: manifest.totalCollections,
    total_cms_items: manifest.totalCmsItems,
    total_forms: manifest.totalForms,
    page_inventory: manifest.templateMap,
    collection_inventory: manifest.collections,
    form_inventory: manifest.forms,
    custom_code_inventory: manifest.scriptInventory,
    raw_sitemap_urls: manifest.canonicalUrls,
    generated_at: manifest.generatedAt,
  };

  // Check for existing row, then insert or update (upsert may need unique constraint on migration_id)
  const { data: existing, error: selectErr } = await supabase
    .from('audit_manifests')
    .select('id')
    .eq('migration_id', CE_MIGRATION_ID)
    .eq('org_id', CE_ORG_ID)
    .maybeSingle();

  if (selectErr) {
    throw new Error(`audit_manifests select failed: ${selectErr.message}`);
  }

  if (existing) {
    const { error } = await supabase
      .from('audit_manifests')
      .update(record)
      .eq('id', existing.id);
    if (error) throw new Error(`audit_manifests update failed: ${error.message}`);
    console.log(`  Updated audit_manifests row ${existing.id}`);
  } else {
    const { data: inserted, error } = await supabase
      .from('audit_manifests')
      .insert(record)
      .select('id')
      .single();
    if (error) throw new Error(`audit_manifests insert failed: ${error.message}`);
    console.log(`  Inserted audit_manifests row ${inserted.id}`);
  }

  const criticalAnomalies = manifest.anomalies.filter(a => a.severity === 'critical').length;

  const { data: migrationData, error: migrationError } = await supabase
    .from('migrations')
    .update({
      current_phase: 'audit_complete',
      status: 'audit_complete',
      metadata: {
        auditCompletedAt: manifest.generatedAt,
        totalCanonicalUrls: manifest.totalCanonicalUrls,
        totalIndexableUrls: manifest.totalIndexableUrls,
        totalForms: manifest.totalForms,
        formsVerified: manifest.formsVerifiedInHubSpot,
        criticalAnomalies,
        requiresManualReview: manifest.requiresManualReviewCount,
      },
    })
    .eq('id', CE_MIGRATION_ID)
    .eq('org_id', CE_ORG_ID)
    .select('id')
    .single();

  if (migrationError || !migrationData) {
    throw new Error(
      `Migration row missing or update affected zero rows. ` +
      `Verify MYGRATR-0 seed row exists for migration_id=${CE_MIGRATION_ID}. ` +
      `Error: ${migrationError?.message ?? 'no row returned'}`
    );
  }

  console.log(`  Updated migration ${CE_MIGRATION_ID} → current_phase=audit_complete`);
  console.log('Manifest written to DB successfully.');
}
