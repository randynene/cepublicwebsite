import { z } from 'zod'

import { staticPageSchema } from './_factories'

export const WorkWithShawneePageSchema = staticPageSchema('workWithShawneePage')
export type WorkWithShawneePage = z.infer<typeof WorkWithShawneePageSchema>
