import { z } from 'zod'

import { collectionHubSchema } from './_factories'

export const EventsHubSchema = collectionHubSchema('eventsHub', { heroDescriptionRequired: true })
export type EventsHub = z.infer<typeof EventsHubSchema>
