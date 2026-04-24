import { z } from 'zod'

import { staticPageSchema } from './_factories'

export const ForDevelopersPageSchema = staticPageSchema('forDevelopersPage')
export type ForDevelopersPage = z.infer<typeof ForDevelopersPageSchema>
