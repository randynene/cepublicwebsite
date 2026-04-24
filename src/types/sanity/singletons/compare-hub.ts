import { z } from 'zod'

import { collectionHubSchema } from './_factories'

export const CompareHubSchema = collectionHubSchema('compareHub')
export type CompareHub = z.infer<typeof CompareHubSchema>
