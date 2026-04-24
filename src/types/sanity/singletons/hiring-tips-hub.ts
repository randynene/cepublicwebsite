import { z } from 'zod'

import { blogHubSchema } from './_factories'

export const HiringTipsHubSchema = blogHubSchema('hiringTipsHub')
export type HiringTipsHub = z.infer<typeof HiringTipsHubSchema>
