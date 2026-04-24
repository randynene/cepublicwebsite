import { z } from 'zod'

import { SanityBaseDocumentSchema, SanitySlugSchema } from '../shared'

export const DownloadAccessSchema = SanityBaseDocumentSchema.extend({
  _type: z.literal('downloadAccess'),
  name: z.string(),
  slug: SanitySlugSchema,
  downloadFileLink: z.string().url(),
})
export type DownloadAccess = z.infer<typeof DownloadAccessSchema>
