import { z } from 'zod'

import { collectionHubSchema } from './_factories'

export const ToolsHubSchema = collectionHubSchema('toolsHub', { heroDescriptionRequired: true })
export type ToolsHub = z.infer<typeof ToolsHubSchema>
