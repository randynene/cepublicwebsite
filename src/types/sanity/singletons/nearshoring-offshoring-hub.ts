import { z } from 'zod'

import { blogHubSchema } from './_factories'

export const NearshoringOffshoringHubSchema = blogHubSchema('nearshoringOffshoringHub')
export type NearshoringOffshoringHub = z.infer<typeof NearshoringOffshoringHubSchema>
