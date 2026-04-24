import { z } from 'zod'

import { blogHubSchema } from './_factories'

export const AiInSoftwareDevelopmentHubSchema = blogHubSchema('aiInSoftwareDevelopmentHub')
export type AiInSoftwareDevelopmentHub = z.infer<typeof AiInSoftwareDevelopmentHubSchema>
