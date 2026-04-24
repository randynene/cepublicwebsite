import { z } from 'zod'

import { blogHubSchema } from './_factories'

export const StaffAugmentationHubSchema = blogHubSchema('staffAugmentationHub')
export type StaffAugmentationHub = z.infer<typeof StaffAugmentationHubSchema>
