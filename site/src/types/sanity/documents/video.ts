import { z } from 'zod'

import { stegaEnum } from '@/lib/sanity/stega-enum'
import {
  LocaleFieldSchema,
  PortableTextSchema,
  SanityImageSchema,
} from '../shared'

// TEMPLATE-VIDEO read-model. Zod'd to the LIVE production data shape, not the
// Studio editorial schema. Two documented drifts vs studio/schemas/documents/video.ts
// (Step 0 probe / Tech Debt #53):
//   - `team`: production docs carry `*Team`-suffixed enum values that do NOT
//     match the Studio unsuffixed options. Parsed to the live values here.
//     Not rendered; parsed safely only. 1 doc has null.
//   - `type`: 1 doc has null (97% fill).
// metaTitle is 0% filled in production — nullable; route falls back to `name`.

const VideoTypeSchema = stegaEnum(['firesideChats', 'workingWithUs', 'interviews'])
export type VideoType = z.infer<typeof VideoTypeSchema>

// Live `*Team`-suffixed values (production data), NOT the Studio schema values.
const VideoTeamSchema = stegaEnum([
  'talentSuccessTeam',
  'clientSuccessTeam',
  'peopleAndCultureTeam',
  'engineeringTeam',
  'leadershipTeam',
  'talentRecruitmentTeam',
  'technicalVettingTeam',
  'hrComplianceAndLegalTeam',
  'learningAndDevelopmentTeam',
  'employeeExperienceTeam',
])

const VideoTagSchema = z.object({
  name: z.string(),
})
export type VideoTag = z.infer<typeof VideoTagSchema>

export const VideoSchema = z.object({
  _id: z.string(),
  _type: z.literal('video'),
  name: z.string(),
  slug: z.string(),
  label: z.string().nullable().optional(),
  type: VideoTypeSchema.nullable().optional(),
  team: VideoTeamSchema.nullable().optional(),
  mainVideoEmbedLink: z.string().nullable().optional(),
  backupImage: SanityImageSchema.nullable().optional(),
  descriptionOfVideo: PortableTextSchema.nullable().optional(),
  fullVideoTranscript: PortableTextSchema.nullable().optional(),
  linksMentionedInVideo: PortableTextSchema.nullable().optional(),
  linkedinProfilesOfSpeakersInVideo: PortableTextSchema.nullable().optional(),
  tags: z.array(VideoTagSchema).nullable().optional(),
  metaTitle: z.string().nullable().optional(),
  metaDescription: z.string(),
  locale: LocaleFieldSchema.nullable().optional(),
})
export type Video = z.infer<typeof VideoSchema>

export const VideoMetaSchema = z.object({
  _id: z.string(),
  name: z.string(),
  slug: z.string(),
  metaTitle: z.string().nullable().optional(),
  metaDescription: z.string(),
  backupImage: SanityImageSchema.nullable().optional(),
})
export type VideoMeta = z.infer<typeof VideoMetaSchema>
