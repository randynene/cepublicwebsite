import { z } from 'zod'

import { staticPageSchema } from './_factories'

export const PrivacyPolicyPageSchema = staticPageSchema('privacyPolicyPage')
export type PrivacyPolicyPage = z.infer<typeof PrivacyPolicyPageSchema>
