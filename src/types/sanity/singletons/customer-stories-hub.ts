import { z } from 'zod'

import { collectionHubSchema } from './_factories'

export const CustomerStoriesHubSchema = collectionHubSchema('customerStoriesHub')
export type CustomerStoriesHub = z.infer<typeof CustomerStoriesHubSchema>
