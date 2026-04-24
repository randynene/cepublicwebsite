import { z } from 'zod'

import { staticPageSchema } from './_factories'

export const NotFoundPageSchema = staticPageSchema('notFoundPage')
export type NotFoundPage = z.infer<typeof NotFoundPageSchema>
