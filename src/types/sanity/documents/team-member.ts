import { z } from 'zod'

import {
  LocaleSchema,
  MetaFieldsNoOgSchema,
  MetaSourceFieldsSchema,
  PortableTextSchema,
  SanityBaseDocumentSchema,
  SanityImageSchema,
  SanitySlugSchema,
  SourceTrackingFieldsCarryoverSchema,
} from '../shared'

// Pre-CONTENT-1D docs have source: undefined despite initialValue. See Finding F18.

export const TeamMemberSchema = SanityBaseDocumentSchema.extend({
  _type: z.literal('teamMember'),
  name: z.string(),
  slug: SanitySlugSchema,
  order: z.number().optional(),
  position: z.string().optional(),
  teamMemberImage: SanityImageSchema,
  aboutContent: PortableTextSchema.optional(),
  timeAtCloudEmployee: z.string().optional(),
  areasOfExpertise: PortableTextSchema.optional(),
  linkedinLink: z.string().url().optional(),
  bookACallLink: z.string().url().optional(),
  hideFromTeamAboutPage: z.boolean(),
  locale: LocaleSchema,
})
  .merge(MetaFieldsNoOgSchema)
  .merge(MetaSourceFieldsSchema)
  .merge(SourceTrackingFieldsCarryoverSchema)
export type TeamMember = z.infer<typeof TeamMemberSchema>
