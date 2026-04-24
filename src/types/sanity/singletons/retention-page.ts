import { z } from 'zod'

import { staticPageSchema } from './_factories'

export const RetentionPageSchema = staticPageSchema('retentionPage')
export type RetentionPage = z.infer<typeof RetentionPageSchema>
