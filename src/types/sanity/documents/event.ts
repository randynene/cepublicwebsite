import { z } from 'zod'

import {
  LocaleSchema,
  MetaFieldsNoOgSchema,
  PortableTextSchema,
  SanityBaseDocumentSchema,
  SanityImageSchema,
  SanityRefSchema,
  SanitySlugSchema,
} from '../shared'

export const EventSchema = SanityBaseDocumentSchema.extend({
  _type: z.literal('event'),
  name: z.string(),
  slug: SanitySlugSchema,
  dateTime: z.string().datetime(),
  headerDescription: PortableTextSchema.optional(),
  headerDescriptionPostEvent: PortableTextSchema.optional(),
  headerButtonText: z.string().optional(),
  featuredImage: SanityImageSchema.optional(),
  thumbnailImage: SanityImageSchema.optional(),
  topics: z
    .object({
      header: z.string().optional(),
      description: PortableTextSchema.optional(),
      items: z
        .array(
          z.object({
            title: z.string(),
            description: z.string(),
          }),
        )
        .max(4)
        .optional(),
    })
    .optional(),
  speakers: z.array(SanityRefSchema).optional(),
  signUp: z
    .object({
      header: z.string().optional(),
      description: PortableTextSchema.optional(),
      formEmbed: PortableTextSchema.optional(),
    })
    .optional(),
  onDemandEmbedDescription: PortableTextSchema.optional(),
  eventType: SanityRefSchema.optional(),
  eventCategory: z.array(SanityRefSchema).optional(),
  locale: LocaleSchema,
}).merge(MetaFieldsNoOgSchema)
export type Event = z.infer<typeof EventSchema>
