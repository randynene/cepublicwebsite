import { z } from 'zod'

import {
  LocaleSchema,
  MetaFieldsNoOgSchema,
  PortableTextSchema,
  SanityBaseDocumentSchema,
  SanityImageSchema,
  SanitySlugSchema,
} from '../shared'

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
}).merge(MetaFieldsNoOgSchema)
export type TeamMember = z.infer<typeof TeamMemberSchema>
