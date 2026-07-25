// scripts/design/preflight-migrations-check.ts
// Pre-flight #5 + #6 — read-only check of migrations row for CE migration.
// Halts non-zero on assertion failure (CONTENT-1D verifier-style).

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const ORG_ID = 'ce000000-0000-0000-0000-000000000001';
const MIGRATION_ID = 'ce000000-0000-0000-0000-000000000002';

async function main() {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data, error } = await supabase
    .from('migrations')
    .select('id, status, current_phase, metadata')
    .eq('id', MIGRATION_ID)
    .eq('org_id', ORG_ID)
    .single();

  if (error) throw new Error(`Supabase: ${error.message}`);
  if (!data) throw new Error('No migrations row found for CE migration');

const status = data.status;
const totalCmsDocs =
  data.metadata?.content_phase?.total_cms_docs;
const contentMigrationsRows =
  data.metadata?.content_phase?.content_migrations_rows;
const completedAt = data.metadata?.content_phase?.completed_at;

  console.log('--- migrations row state ---');
  console.log('status:                    ', status);
  console.log('current_phase:             ', data.current_phase);
  console.log('total_cms_docs:            ', totalCmsDocs);
  console.log('content_migrations_rows:   ', contentMigrationsRows, '(expect 38; brief Step 0a refreshes to 42)');
  console.log('completed_at:              ', completedAt);

  console.log('\n--- pre-flight assertions ---');

  // Pre-flight #5
  if (status !== 'content_complete') {
    console.error(`✗ #5 FAIL: status=${status}, expected 'content_complete'`);
    process.exit(1);
  }
  console.log("✓ #5 PASS: status === 'content_complete'");

  // Pre-flight #6
  if (totalCmsDocs !== 388) {
    console.error(`✗ #6 FAIL: total_cms_docs=${totalCmsDocs}, expected 388`);
    process.exit(1);
  }
  console.log('✓ #6 PASS: total_cms_docs === 388');
}

main().catch((err) => { console.error(err); process.exit(1); });
