import { z } from 'zod'

import { collectionHubSchema } from './_factories'

export const DownloadsHubSchema = collectionHubSchema('downloadsHub', {
  heroDescriptionRequired: true,
})
export type DownloadsHub = z.infer<typeof DownloadsHubSchema>
