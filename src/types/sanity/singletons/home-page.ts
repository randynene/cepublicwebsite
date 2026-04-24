import { z } from 'zod'

import { staticPageSchema } from './_factories'

export const HomePageSchema = staticPageSchema('homePage')
export type HomePage = z.infer<typeof HomePageSchema>
