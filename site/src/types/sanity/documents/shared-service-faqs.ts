import { z } from 'zod'

import { FaqItemSchema } from './service'

// Read-model for the `sharedServiceFaqs` singleton (Studio). Three themed FAQ
// groups reused across every service + technology detail page (launch parity
// with live). A page reads these unless it has its own `faqs` override.
export const SharedServiceFaqsSchema = z.object({
  serviceModel: z.array(FaqItemSchema).nullable().optional(),
  productBuilds: z.array(FaqItemSchema).nullable().optional(),
  consulting: z.array(FaqItemSchema).nullable().optional(),
})
export type SharedServiceFaqs = z.infer<typeof SharedServiceFaqsSchema>
