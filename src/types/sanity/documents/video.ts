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

export const VideoSchema = SanityBaseDocumentSchema.extend({
  _type: z.literal('video'),
  name: z.string(),
  slug: SanitySlugSchema,
  label: z.string().optional(),
  type: z.enum(['firesideChats', 'workingWithUs', 'interviews']).optional(),
  team: z
    .enum([
      'talentSuccess',
      'clientSuccess',
      'peopleAndCulture',
      'engineering',
      'leadership',
      'talentRecruitment',
      'technicalVetting',
      'hrComplianceLegal',
      'learningDevelopment',
      'employeeExperience',
    ])
    .optional(),
  order: z.number().optional(),
  featured: z.boolean(),
  mainVideoEmbedLink: z.string().url().optional(),
  backgroundVideoPreviewLink: z.string().optional(),
  vimeoYoutubeStandardLink: z.string().optional(),
  backupImage: SanityImageSchema,
  descriptionOfVideo: PortableTextSchema.optional(),
  fullVideoTranscript: PortableTextSchema.optional(),
  linksMentionedInVideo: PortableTextSchema.optional(),
  linkedinProfilesOfSpeakersInVideo: PortableTextSchema.optional(),
  tags: z.array(SanityRefSchema).optional(),
  locale: LocaleSchema,
}).merge(MetaFieldsNoOgSchema)
export type Video = z.infer<typeof VideoSchema>
