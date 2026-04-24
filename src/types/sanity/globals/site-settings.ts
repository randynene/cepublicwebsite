import { z } from 'zod'

import { SanityBaseDocumentSchema, SanityImageSchema } from '../shared'

export const SiteSettingsSchema = SanityBaseDocumentSchema.extend({
  _type: z.literal('siteSettings'),
  siteName: z.string(),
  siteUrl: z.string().url(),
  defaultMetaTitle: z.string(),
  defaultMetaDescription: z.string(),
  defaultOgImage: SanityImageSchema,
  announcementBar: z
    .object({
      enabled: z.boolean(),
      text: z.string().optional(),
      ctaLabel: z.string().optional(),
      ctaLink: z.string().url().optional(),
    })
    .optional(),
  socialProof: z
    .object({
      organizationName: z.string().optional(),
      organizationUrl: z.string().url().optional(),
      logo: SanityImageSchema.optional(),
      foundingDate: z.string().optional(),
      description: z.string().optional(),
    })
    .optional(),
  claraChat: z
    .object({
      enabled: z.boolean(),
      workspaceId: z.string().optional(),
    })
    .optional(),
  hubspotPortalId: z.string(),
})
export type SiteSettings = z.infer<typeof SiteSettingsSchema>
