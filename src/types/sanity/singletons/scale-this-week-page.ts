import { z } from 'zod'

import { staticPageSchema } from './_factories'

export const ScaleThisWeekPageSchema = staticPageSchema('scaleThisWeekPage')
export type ScaleThisWeekPage = z.infer<typeof ScaleThisWeekPageSchema>
