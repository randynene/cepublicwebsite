import 'server-only'

import { z } from 'zod'

import { sanityFetch } from '@/lib/sanity/live'

// siteSettings fetch — sitewide JSON-LD (Organization + WebSite).
//
// Schema: studio/schemas/globals/site-settings.ts.
// Trimmed to entity fields only; no SearchAction (Clara widget is not
// query-param search).

const SanityImageSchema = z
  .object({
    asset: z.object({ _ref: z.string() }).passthrough().optional(),
    alt: z.string().nullable().optional(),
  })
  .passthrough()

const SocialProofSchema = z
  .object({
    organizationName: z.string().nullable().optional(),
    organizationUrl: z.string().nullable().optional(),
    logo: SanityImageSchema.nullable().optional(),
    foundingDate: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
  })
  .nullable()
  .optional()

export const SiteSettingsJsonLdSchema = z.object({
  siteName: z.string(),
  siteUrl: z.string(),
  socialProof: SocialProofSchema,
})

export type SiteSettingsJsonLd = z.infer<typeof SiteSettingsJsonLdSchema>

const SITE_SETTINGS_JSON_LD_QUERY = /* groq */ `
*[_id == "siteSettings"][0]{
  siteName,
  siteUrl,
  socialProof{
    organizationName,
    organizationUrl,
    foundingDate,
    description,
    logo
  }
}
`

export async function fetchSiteSettingsForJsonLd(): Promise<SiteSettingsJsonLd | null> {
  const { data } = await sanityFetch({ query: SITE_SETTINGS_JSON_LD_QUERY })
  if (data === null || data === undefined) return null
  return SiteSettingsJsonLdSchema.parse(data)
}
