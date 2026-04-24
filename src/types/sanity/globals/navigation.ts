import { z } from 'zod'

import { SanityBaseDocumentSchema } from '../shared'

const DropdownItemSchema = z.object({
  _key: z.string().optional(),
  label: z.string(),
  url: z.string().url(),
})

const PrimaryLinkSchema = z.object({
  _key: z.string().optional(),
  label: z.string(),
  url: z.string().url(),
  cmsDriven: z.boolean(),
  cmsCollection: z.string().optional(),
  dropdownItems: z.array(DropdownItemSchema).optional(),
})

const CtaButtonSchema = z.object({
  label: z.string(),
  link: z.string().url(),
  type: z.enum(['calendly', 'link', 'hubspotForm']),
})

const LocaleOptionSchema = z.object({
  _key: z.string().optional(),
  label: z.string(),
  url: z.string().url(),
  hreflang: z.string(),
})

export const NavigationSchema = SanityBaseDocumentSchema.extend({
  _type: z.literal('navigation'),
  primaryLinks: z.array(PrimaryLinkSchema).optional(),
  ctaButton: CtaButtonSchema.optional(),
  localeDropdown: z
    .object({
      enabled: z.boolean(),
      options: z.array(LocaleOptionSchema).optional(),
    })
    .optional(),
})
export type Navigation = z.infer<typeof NavigationSchema>
