import { z } from 'zod'

import { staticPageSchema } from './_factories'

export const AboutUsPageSchema = staticPageSchema('aboutUsPage')
export type AboutUsPage = z.infer<typeof AboutUsPageSchema>
