require('dotenv').config();
const { Client } = require('pg');

const blocks = [
  { name: 'Block 1: Enable UUID extension', sql: `create extension if not exists "uuid-ossp";` },
  { name: 'Block 2: organisations', sql: `create table if not exists organisations (id uuid primary key default uuid_generate_v4(), name text not null, slug text not null unique, plan text not null default 'internal', created_at timestamptz not null default now(), updated_at timestamptz not null default now()); alter table organisations enable row level security;` },
  { name: 'Block 3: migrations', sql: `create table if not exists migrations (id uuid primary key default uuid_generate_v4(), org_id uuid not null references organisations(id) on delete cascade, source_domain text not null, target_domain text, status text not null default 'pending', current_phase text not null default 'foundation', tier text not null default 'internal', started_at timestamptz not null default now(), completed_at timestamptz, metadata jsonb not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz not null default now()); alter table migrations enable row level security; create index if not exists idx_migrations_org_id on migrations(org_id); create index if not exists idx_migrations_status on migrations(status);` },
  { name: 'Block 4: audit_manifests', sql: `create table if not exists audit_manifests (id uuid primary key default uuid_generate_v4(), org_id uuid not null references organisations(id) on delete cascade, migration_id uuid not null references migrations(id) on delete cascade, total_pages integer not null default 0, total_collections integer not null default 0, total_cms_items integer not null default 0, total_forms integer not null default 0, page_inventory jsonb not null default '[]', collection_inventory jsonb not null default '[]', form_inventory jsonb not null default '[]', custom_code_inventory jsonb not null default '[]', raw_sitemap_urls jsonb not null default '[]', generated_at timestamptz not null default now(), created_at timestamptz not null default now(), updated_at timestamptz not null default now()); alter table audit_manifests enable row level security; create index if not exists idx_audit_manifests_migration_id on audit_manifests(migration_id); create index if not exists idx_audit_manifests_org_id on audit_manifests(org_id);` },
  { name: 'Block 5: schema_designs', sql: `create table if not exists schema_designs (id uuid primary key default uuid_generate_v4(), org_id uuid not null references organisations(id) on delete cascade, migration_id uuid not null references migrations(id) on delete cascade, collection_slug text not null, collection_display_name text not null, sanity_schema jsonb not null default '{}', version integer not null default 1, status text not null default 'draft', specialist_reviewed boolean not null default false, notes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()); alter table schema_designs enable row level security; create index if not exists idx_schema_designs_migration_id on schema_designs(migration_id); create index if not exists idx_schema_designs_org_id on schema_designs(org_id);` },
  { name: 'Block 6: content_migrations', sql: `create table if not exists content_migrations (id uuid primary key default uuid_generate_v4(), org_id uuid not null references organisations(id) on delete cascade, migration_id uuid not null references migrations(id) on delete cascade, collection_slug text not null, source_item_count integer not null default 0, migrated_item_count integer not null default 0, parity_score numeric(5,2), status text not null default 'pending', last_run_at timestamptz, error_log jsonb not null default '[]', created_at timestamptz not null default now(), updated_at timestamptz not null default now()); alter table content_migrations enable row level security; create index if not exists idx_content_migrations_migration_id on content_migrations(migration_id); create index if not exists idx_content_migrations_org_id on content_migrations(org_id);` },
  { name: 'Block 7: template_builds', sql: `create table if not exists template_builds (id uuid primary key default uuid_generate_v4(), org_id uuid not null references organisations(id) on delete cascade, migration_id uuid not null references migrations(id) on delete cascade, template_type text not null, git_sha text, preview_url text, current_qa_score numeric(5,2), status text not null default 'pending', attempt_count integer not null default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now()); alter table template_builds enable row level security; create index if not exists idx_template_builds_migration_id on template_builds(migration_id); create index if not exists idx_template_builds_org_id on template_builds(org_id);` },
  { name: 'Block 8: qa_runs', sql: `create table if not exists qa_runs (id uuid primary key default uuid_generate_v4(), org_id uuid not null references organisations(id) on delete cascade, migration_id uuid not null references migrations(id) on delete cascade, template_build_id uuid not null references template_builds(id) on delete cascade, template_type text not null, page_url text not null, passed boolean not null default false, visual_diff_score numeric(5,2), content_diff_passed boolean, meta_diff_passed boolean, structured_data_diff_passed boolean, lighthouse_scores jsonb not null default '{}', failure_reasons jsonb not null default '[]', screenshot_paths jsonb not null default '{}', attempt_number integer not null default 1, run_at timestamptz not null default now(), created_at timestamptz not null default now()); alter table qa_runs enable row level security; create index if not exists idx_qa_runs_migration_id on qa_runs(migration_id); create index if not exists idx_qa_runs_template_build_id on qa_runs(template_build_id); create index if not exists idx_qa_runs_org_id on qa_runs(org_id);` },
  { name: 'Block 9: redirects', sql: `create table if not exists redirects (id uuid primary key default uuid_generate_v4(), org_id uuid not null references organisations(id) on delete cascade, migration_id uuid not null references migrations(id) on delete cascade, source_url text not null, target_url text not null, status_code integer not null default 301, tested boolean not null default false, test_passed boolean, created_at timestamptz not null default now(), updated_at timestamptz not null default now()); alter table redirects enable row level security; create index if not exists idx_redirects_migration_id on redirects(migration_id); create index if not exists idx_redirects_org_id on redirects(org_id);` },
  { name: 'Block 10: launches', sql: `create table if not exists launches (id uuid primary key default uuid_generate_v4(), org_id uuid not null references organisations(id) on delete cascade, migration_id uuid not null references migrations(id) on delete cascade, cutover_date timestamptz, gsc_indexed_count integer, gsc_baseline_count integer, rank_preservation_score numeric(5,2), alert_thresholds jsonb not null default '{}', monitoring_active boolean not null default false, status text not null default 'pending', created_at timestamptz not null default now(), updated_at timestamptz not null default now()); alter table launches enable row level security; create index if not exists idx_launches_migration_id on launches(migration_id); create index if not exists idx_launches_org_id on launches(org_id);` },
  { name: 'Block 11: Seed CE org and migration', sql: `insert into organisations (id, name, slug, plan) values ('ce000000-0000-0000-0000-000000000001', 'Cloud Employee', 'cloud-employee', 'internal') on conflict (id) do nothing; insert into migrations (id, org_id, source_domain, target_domain, status, current_phase, tier) values ('ce000000-0000-0000-0000-000000000002', 'ce000000-0000-0000-0000-000000000001', 'cloudemployee.io', 'staging.jakevibes.dev', 'pending', 'foundation', 'internal') on conflict (id) do nothing;` },
];

async function main() {
  // Parse the pooler URL and use session mode (port 5432)
  const raw = process.env.SUPABASE_DB_URL;
  const match = raw.match(/postgres\.([^:]+):(.+)@([^:]+)/);
  const ref = match[1];
  const password = match[2];
  const host = match[3];
  const client = new Client({
    host: host,
    port: 5432,
    user: `postgres.${ref}`,
    password: decodeURIComponent(password),
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  console.log('Connected to Supabase postgres.\n');

  for (const block of blocks) {
    console.log(`Running: ${block.name}...`);
    try {
      await client.query(block.sql);
      console.log(`SUCCESS: ${block.name}`);
    } catch (err) {
      console.error(`FAILED: ${block.name}`);
      console.error(err.message);
      await client.end();
      process.exit(1);
    }
  }

  // Verify
  console.log('\n--- Verification ---');
  const tables = await client.query(`select table_name from information_schema.tables where table_schema = 'public' order by table_name;`);
  console.log('Tables:', tables.rows.map(r => r.table_name).join(', '));

  const orgs = await client.query(`select id, name, slug from organisations;`);
  console.log('Organisations:', JSON.stringify(orgs.rows));

  const migs = await client.query(`select id, source_domain, status from migrations;`);
  console.log('Migrations:', JSON.stringify(migs.rows));

  await client.end();
  console.log('\nAll 11 blocks completed successfully.');
}

main().catch(err => { console.error('Fatal:', err.message); process.exit(1); });
