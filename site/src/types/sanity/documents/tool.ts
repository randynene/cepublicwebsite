import { z } from 'zod'

import {
  FaqItemSchema,
  LocaleFieldSchema,
  PortableTextSchema,
  SanityImageSchema,
} from '../shared'

// TEMPLATE-TOOL read-model. metaTitle is 0/2 filled in production — nullable;
// route falls back to `name` (same pattern as TEMPLATE-VIDEO).

const ToolTagSchema = z.object({
  name: z.string(),
})
export type ToolTag = z.infer<typeof ToolTagSchema>

export const ToolSchema = z.object({
  _id: z.string(),
  _type: z.literal('tool'),
  name: z.string(),
  slug: z.string(),
  subHeader: z.string().nullable().optional(),
  headerBlurb: PortableTextSchema.nullable().optional(),
  description: PortableTextSchema.nullable().optional(),
  button1Text: z.string().nullable().optional(),
  button1Link: z.string().nullable().optional(),
  button2Text: z.string().nullable().optional(),
  button2Link: z.string().nullable().optional(),
  toolEmbed: PortableTextSchema.nullable().optional(),
  videoOverview: PortableTextSchema.nullable().optional(),
  faqs: z.array(FaqItemSchema).nullable().optional(),
  thumbnail: SanityImageSchema.nullable().optional(),
  tags: z.array(ToolTagSchema).nullable().optional(),
  featured: z.boolean().nullable().optional(),
  metaTitle: z.string().nullable().optional(),
  metaDescription: z.string(),
  locale: LocaleFieldSchema.nullable().optional(),
})
export type Tool = z.infer<typeof ToolSchema>

export const ToolMetaSchema = z.object({
  _id: z.string(),
  name: z.string(),
  slug: z.string(),
  metaTitle: z.string().nullable().optional(),
  metaDescription: z.string(),
  thumbnail: SanityImageSchema.nullable().optional(),
})
export type ToolMeta = z.infer<typeof ToolMetaSchema>
