import { z } from 'zod'

import { staticPageSchema } from './_factories'

export const StartHiringPageSchema = staticPageSchema('startHiringPage')
export type StartHiringPage = z.infer<typeof StartHiringPageSchema>
