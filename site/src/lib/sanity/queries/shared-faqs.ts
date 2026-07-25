import 'server-only'

import { sanityFetch } from '@/lib/sanity/live'
import {
  SharedServiceFaqsSchema,
  type SharedServiceFaqs,
} from '@/types/sanity/documents/shared-service-faqs'

// Fetch the single shared FAQ block reused by every service + technology detail
// page. Uses sanityFetch (live) so edits show in Presentation. Returns null if
// the singleton has not been created yet (pages then render no FAQ section).
export const SHARED_SERVICE_FAQS_QUERY = /* groq */ `
*[_type == "sharedServiceFaqs"][0]{
  serviceModel[]{ _key, question, answer },
  productBuilds[]{ _key, question, answer },
  consulting[]{ _key, question, answer }
}
`

export async function fetchSharedServiceFaqs(): Promise<SharedServiceFaqs | null> {
  const { data } = await sanityFetch({ query: SHARED_SERVICE_FAQS_QUERY })
  if (data === null || data === undefined) return null
  return SharedServiceFaqsSchema.parse(data)
}
