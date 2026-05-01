import { createClient } from '@sanity/client'

import { env, ensureSanityMigrationWriteToken } from '@/lib/env'

// Migration write client — used only by CONTENT-lane scripts, never by the
// Next.js app or by SCHEMA-lane seed scripts.
//
// Token scoping (CONTENT-1D §0.1, F3):
//   - Reads SANITY_MIGRATION_WRITE_TOKEN, NOT SANITY_API_TOKEN. The migration
//     token is least-privilege: single-dataset (production) scope, document
//     patch / delete / asset upload only — no project-admin, no all-datasets.
//   - At module load, throws if the migration token is unset OR if
//     SANITY_API_READ_TOKEN is also present in the same process. The read
//     token's presence signals the wrong client context (the read client is
//     for the site, not migration scripts) and is an early-fail guard
//     against the @/* path-alias collision (F14).
//
// Do NOT add 'server-only' here — migration scripts run via tsx, not Next.js.
//
// Rotation: SANITY_MIGRATION_WRITE_TOKEN is rotated post-CONTENT-1D
// (Exit Criterion #10 — MUST resolve before MYGRATR-LAUNCH).
ensureSanityMigrationWriteToken()

export const sanityWriteClient = createClient({
  projectId: env.SANITY_PROJECT_ID,
  dataset: env.SANITY_DATASET,
  apiVersion: '2024-01-01',
  useCdn: false,
  token: env.SANITY_MIGRATION_WRITE_TOKEN,
})
