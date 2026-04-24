import { z } from 'zod'

import { blogHubSchema } from './_factories'

export const BlogHubSchema = blogHubSchema('blogHub')
export type BlogHub = z.infer<typeof BlogHubSchema>
