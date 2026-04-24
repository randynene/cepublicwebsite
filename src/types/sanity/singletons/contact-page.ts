import { z } from 'zod'

import { staticPageSchema } from './_factories'

export const ContactPageSchema = staticPageSchema('contactPage')
export type ContactPage = z.infer<typeof ContactPageSchema>
