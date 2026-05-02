import * as dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

const schema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_DB_URL: z.string().optional().default(''),

  WEBFLOW_API_TOKEN: z.string().optional().default(''),
  WEBFLOW_SITE_ID: z.string().optional().default(''),

  FIRECRAWL_API_KEY: z.string().optional().default(''),
  ANTHROPIC_API_KEY: z.string().optional().default(''),

  HUBSPOT_ACCESS_TOKEN: z.string().optional().default(''),
  HUBSPOT_PORTAL_ID: z.string().optional().default(''),

  AHREFS_API_KEY: z.string().optional().default(''),

  SANITY_PROJECT_ID: z.string().optional().default(''),
  SANITY_DATASET: z.string().optional().default(''),
  // Legacy general-purpose token. Retained for SCHEMA-lane seed scripts
  // (seed-singletons, smoke-test-seed). Migration scripts use
  // SANITY_MIGRATION_WRITE_TOKEN — see ensureSanityMigrationWriteToken().
  SANITY_API_TOKEN: z.string().optional().default(''),
  // CONTENT-1D §0.1 — least-privilege migration token, single-dataset scope.
  SANITY_MIGRATION_WRITE_TOKEN: z.string().optional().default(''),
  // Site read-token. MUST be unset when migration scripts run — its presence
  // signals the wrong client context. Asserted at sanityWriteClient load.
  SANITY_API_READ_TOKEN: z.string().optional().default(''),
})

export const env = schema.parse(process.env)

export function ensureWebflow(): void {
  if (!env.WEBFLOW_API_TOKEN) throw new Error('WEBFLOW_API_TOKEN not configured — set in .env')
  if (!env.WEBFLOW_SITE_ID) throw new Error('WEBFLOW_SITE_ID not configured — set in .env')
}

export function ensureFirecrawl(): void {
  if (!env.FIRECRAWL_API_KEY) throw new Error('FIRECRAWL_API_KEY not configured — set in .env')
}

export function ensureAnthropic(): void {
  if (!env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not configured — set in .env')
}

export function ensureHubspot(): void {
  if (!env.HUBSPOT_ACCESS_TOKEN) throw new Error('HUBSPOT_ACCESS_TOKEN not configured — set in .env')
  if (!env.HUBSPOT_PORTAL_ID) throw new Error('HUBSPOT_PORTAL_ID not configured — set in .env')
}

export function ensureAhrefs(): void {
  if (!env.AHREFS_API_KEY) throw new Error('AHREFS_API_KEY not configured — set in .env')
}

export function ensureSanity(): void {
  if (!env.SANITY_PROJECT_ID) throw new Error('SANITY_PROJECT_ID not configured — set in .env')
  if (!env.SANITY_DATASET) throw new Error('SANITY_DATASET not configured — set in .env')
  if (!env.SANITY_API_TOKEN) throw new Error('SANITY_API_TOKEN not configured — set in .env')
}

// Migration-script preflight. Asserts the dedicated write token is present
// and the site's read token is absent in the current process — read-token
// presence indicates the script is running in the wrong client context.
export function ensureSanityMigrationWriteToken(): void {
  if (!env.SANITY_PROJECT_ID) throw new Error('SANITY_PROJECT_ID not configured — set in .env')
  if (!env.SANITY_DATASET) throw new Error('SANITY_DATASET not configured — set in .env')
  if (!env.SANITY_MIGRATION_WRITE_TOKEN) {
    throw new Error('SANITY_MIGRATION_WRITE_TOKEN required — set in .env (migration scripts only)')
  }
  if (env.SANITY_API_READ_TOKEN) {
    throw new Error(
      'SANITY_API_READ_TOKEN must NOT be present in migration script context — read token belongs in site/.env.local',
    )
  }
}

export function ensureSupabaseDb(): void {
  if (!env.SUPABASE_DB_URL) throw new Error('SUPABASE_DB_URL not configured — set in .env')
}
