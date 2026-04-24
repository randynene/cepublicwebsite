import { z } from 'zod'

import { collectionHubSchema } from './_factories'

export const TechnologyHubSchema = collectionHubSchema('technologyHub')
export type TechnologyHub = z.infer<typeof TechnologyHubSchema>
