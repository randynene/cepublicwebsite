// scripts/design/refresh-content-migrations-rows.ts
// Sub-step 0a per MYGRATR-DESIGN-1 brief v1.5 §5/Step 0.
// Refresh migrations.metadata.content_phase.content_migrations_rows from
// stale 38 to actual count (post-CONTENT-1D-CLEANUP audit rows landed
// without the metadata being touched).
//
// Brief notes Tech Debt #12: direct Postgres broken; REST writes work.
// This script uses supabase-js REST (sanctioned per CLAUDE.md).

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const ORG_ID = 'ce000000-0000-0000-0000-000000000001';
const MIGRATION_ID = 'ce000000-0000-0000-0000-000000000002';

async function main() {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // 1. Count actual content_migrations rows for CE migration.
  const { count, error: countErr } = await supabase
    .from('content_migrations')
    .select('id', { count: 'exact', head: true })
    .eq('migration_id', MIGRATION_ID)
    .eq('org_id', ORG_ID);

  if (countErr) throw new Error(`count: ${countErr.message}`);
  if (count === null) throw new Error('count returned null');
  console.log('Actual content_migrations rows:', count);

  // 2. Read current migrations row metadata.
  const { data: current, error: readErr } = await supabase
    .from('migrations')
    .select('metadata')
    .eq('id', MIGRATION_ID)
    .eq('org_id', ORG_ID)
    .single();

  if (readErr) throw new Error(`read: ${readErr.message}`);
  if (!current) throw new Error('migrations row not found');

  const before = current.metadata?.content_phase?.content_migrations_rows;
  console.log('Stored content_migrations_rows (before):', before);

  if (before === count) {
    console.log('Already in sync — no write needed.');
    return;
  }

  // 3. Patch metadata.content_phase.content_migrations_rows = count.
  const newMetadata = {
    ...current.metadata,
    content_phase: {
      ...current.metadata.content_phase,
      content_migrations_rows: count,
    },
  };

  const { error: updateErr } = await supabase
    .from('migrations')
    .update({ metadata: newMetadata })
    .eq('id', MIGRATION_ID)
    .eq('org_id', ORG_ID);

  if (updateErr) throw new Error(`update: ${updateErr.message}`);

  // 4. Verify.
  const { data: verify, error: verifyErr } = await supabase
    .from('migrations')
    .select('metadata, status')
    .eq('id', MIGRATION_ID)
    .eq('org_id', ORG_ID)
    .single();

  if (verifyErr) throw new Error(`verify: ${verifyErr.message}`);
  const after = verify!.metadata?.content_phase?.content_migrations_rows;
  console.log('Stored content_migrations_rows (after): ', after);
  console.log('migrations.status (must be unchanged): ', verify!.status);

  if (after !== count) throw new Error(`sync failed: ${after} !== ${count}`);
  if (verify!.status !== 'content_complete') {
    throw new Error(`status drifted: ${verify!.status}`);
  }
  console.log('✓ refresh complete; migrations.status unchanged.');
}

main().catch((err) => { console.error(err); process.exit(1); });
