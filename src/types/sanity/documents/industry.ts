import { z } from 'zod'

import { landingPageSchema } from './_landing-page-factory'

export const IndustrySchema = landingPageSchema('industry')
export type Industry = z.infer<typeof IndustrySchema>
