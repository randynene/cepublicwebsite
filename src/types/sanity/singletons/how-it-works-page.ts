import { z } from 'zod'

import { staticPageSchema } from './_factories'

export const HowItWorksPageSchema = staticPageSchema('howItWorksPage')
export type HowItWorksPage = z.infer<typeof HowItWorksPageSchema>
