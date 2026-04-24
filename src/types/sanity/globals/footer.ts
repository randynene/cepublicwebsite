import { z } from 'zod'

import { SanityBaseDocumentSchema } from '../shared'

const FooterLinkSchema = z.object({
  _key: z.string().optional(),
  label: z.string(),
  url: z.string().url(),
})

const FooterColumnSchema = z.object({
  _key: z.string().optional(),
  heading: z.string(),
  links: z.array(FooterLinkSchema).optional(),
})

export const FooterSchema = SanityBaseDocumentSchema.extend({
  _type: z.literal('footer'),
  newsletterFormId: z.string().optional(),
  copyrightText: z.string().optional(),
  columns: z.array(FooterColumnSchema).optional(),
  legalLinks: z.array(FooterLinkSchema).optional(),
})
export type Footer = z.infer<typeof FooterSchema>
