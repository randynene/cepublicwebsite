import { z } from 'zod'

import { collectionHubSchema } from './_factories'

export const ReviewsHubSchema = collectionHubSchema('reviewsHub')
export type ReviewsHub = z.infer<typeof ReviewsHubSchema>
