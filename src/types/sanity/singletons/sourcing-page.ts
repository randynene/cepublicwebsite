import { z } from 'zod'

import { staticPageSchema } from './_factories'

export const SourcingPageSchema = staticPageSchema('sourcingPage')
export type SourcingPage = z.infer<typeof SourcingPageSchema>
