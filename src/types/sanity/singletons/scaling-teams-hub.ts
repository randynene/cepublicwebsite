import { z } from 'zod'

import { blogHubSchema } from './_factories'

export const ScalingTeamsHubSchema = blogHubSchema('scalingTeamsHub')
export type ScalingTeamsHub = z.infer<typeof ScalingTeamsHubSchema>
