import { z } from 'zod'

// downloadAccess — private lead-magnet thank-you page (noindex).
// Thin type: name + slug + downloadFileLink only (no meta/locale fields).
export const DownloadAccessSchema = z.object({
  _id: z.string(),
  _type: z.literal('downloadAccess'),
  name: z.string(),
  slug: z.string(),
  downloadFileLink: z.string(),
})

export type DownloadAccess = z.infer<typeof DownloadAccessSchema>

// Meta subset for generateMetadata (mirrors the video Meta-schema pattern).
export const DownloadAccessMetaSchema = z.object({
  _id: z.string(),
  name: z.string(),
  slug: z.string(),
})

export type DownloadAccessMeta = z.infer<typeof DownloadAccessMetaSchema>
