import { z } from 'zod'

import { blogHubSchema } from './_factories'

export const ManagingEngineersHubSchema = blogHubSchema('managingEngineersHub')
export type ManagingEngineersHub = z.infer<typeof ManagingEngineersHubSchema>
