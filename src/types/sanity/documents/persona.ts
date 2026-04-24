import { z } from 'zod'

import { landingPageSchema } from './_landing-page-factory'

export const PersonaSchema = landingPageSchema('persona')
export type Persona = z.infer<typeof PersonaSchema>
