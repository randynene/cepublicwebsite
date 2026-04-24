// Zod factories mirroring studio/schemas/singletons/_factories.ts.
import { z } from 'zod'

import {
  FaqItemSchema,
  LocaleSchema,
  MetaFieldsSchema,
  PortableTextSchema,
  SanityBaseDocumentSchema,
  SanityImageSchema,
  SanityRefSchema,
  SectionSchema,
} from '../shared'

export function blogHubSchema<T extends string>(typeName: T) {
  return SanityBaseDocumentSchema.extend({
    _type: z.literal(typeName),
    title: z.string(),
    eyebrow: z.string().optional(),
    heroDescription: PortableTextSchema,
    heroImage: SanityImageSchema.optional(),
    featuredArticles: z.array(SanityRefSchema).max(2).optional(),
    introContent: PortableTextSchema.optional(),
    topicsHeader: z.string().optional(),
  }).merge(MetaFieldsSchema)
}

export function collectionHubSchema<T extends string>(
  typeName: T,
  opts: { heroDescriptionRequired?: boolean } = {},
) {
  return SanityBaseDocumentSchema.extend({
    _type: z.literal(typeName),
    title: z.string(),
    eyebrow: z.string().optional(),
    heroDescription: opts.heroDescriptionRequired
      ? PortableTextSchema
      : PortableTextSchema.optional(),
    heroImage: SanityImageSchema.optional(),
    featuredItems: z.array(SanityRefSchema).max(2).optional(),
    introContent: PortableTextSchema.optional(),
  }).merge(MetaFieldsSchema)
}

export function staticPageSchema<T extends string>(typeName: T) {
  return SanityBaseDocumentSchema.extend({
    _type: z.literal(typeName),
    title: z.string(),
    eyebrow: z.string().optional(),
    heroDescription: PortableTextSchema.optional(),
    heroImage: SanityImageSchema.optional(),
    sections: z.array(SectionSchema).min(1),
    locale: LocaleSchema,
  }).merge(MetaFieldsSchema)
}

export function calculatorPageSchema<T extends string>(typeName: T) {
  return SanityBaseDocumentSchema.extend({
    _type: z.literal(typeName),
    title: z.string(),
    eyebrow: z.string().optional(),
    heroDescription: PortableTextSchema.optional(),
    belowCalculatorContent: PortableTextSchema.optional(),
    faqs: z.array(FaqItemSchema).max(10).optional(),
  }).merge(MetaFieldsSchema)
}
