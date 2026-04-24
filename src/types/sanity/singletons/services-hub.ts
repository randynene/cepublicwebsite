import { z } from 'zod'

import { collectionHubSchema } from './_factories'

export const ServicesHubSchema = collectionHubSchema('servicesHub')
export type ServicesHub = z.infer<typeof ServicesHubSchema>
