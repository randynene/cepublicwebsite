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
  SANITY_API_TOKEN: z.string().optional().default(''),
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

export function ensureSupabaseDb(): void {
  if (!env.SUPABASE_DB_URL) throw new Error('SUPABASE_DB_URL not configured — set in .env')
}
