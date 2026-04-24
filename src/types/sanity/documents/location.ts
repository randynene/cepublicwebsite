import { z } from 'zod'

import { landingPageSchema } from './_landing-page-factory'

export const LocationSchema = landingPageSchema('location')
export type Location = z.infer<typeof LocationSchema>
