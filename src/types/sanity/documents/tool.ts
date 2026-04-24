import { z } from 'zod'

import {
  FaqItemSchema,
  LocaleSchema,
  PortableTextSchema,
  SanityBaseDocumentSchema,
  SanityImageSchema,
  SanityRefSchema,
  SanitySlugSchema,
} from '../shared'

export const ToolSchema = SanityBaseDocumentSchema.extend({
  _type: z.literal('tool'),
  name: z.string(),
  slug: SanitySlugSchema,
  subHeader: z.string().optional(),
  headerBlurb: PortableTextSchema.optional(),
  description: PortableTextSchema.optional(),
  button1Text: z.string().optional(),
  button1Link: z.string().url().optional(),
  button2Text: z.string().optional(),
  button2Link: z.string().url().optional(),
  toolEmbed: PortableTextSchema.optional(),
  hiddenCode: PortableTextSchema.optional(),
  videoOverview: PortableTextSchema.optional(),
  faqs: z.array(FaqItemSchema).max(10).optional(),
  thumbnail: SanityImageSchema.optional(),
  metaTitle: z.string(),
  metaDescription: z.string(),
  tags: z.array(SanityRefSchema).optional(),
  featured: z.boolean(),
  locale: LocaleSchema,
})
export type Tool = z.infer<typeof ToolSchema>
