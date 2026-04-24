import { z } from 'zod'

import { collectionHubSchema } from './_factories'

export const VideosHubSchema = collectionHubSchema('videosHub', { heroDescriptionRequired: true })
export type VideosHub = z.infer<typeof VideosHubSchema>
