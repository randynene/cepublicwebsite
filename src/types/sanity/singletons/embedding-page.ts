import { z } from 'zod'

import { staticPageSchema } from './_factories'

export const EmbeddingPageSchema = staticPageSchema('embeddingPage')
export type EmbeddingPage = z.infer<typeof EmbeddingPageSchema>
