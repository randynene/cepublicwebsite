import { env } from '@/lib/env'

// Thin wrapper around Webflow REST API v2.
// All content migration scripts read from Webflow through this module only.
// Never call the Webflow API directly in migration scripts.

const BASE_URL = 'https://api.webflow.com/v2'

async function webflowGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${env.WEBFLOW_API_TOKEN}`,
      'accept-version': '2.0.0',
    },
  })
  if (!res.ok) {
    throw new Error(`Webflow API error ${res.status} on ${path}: ${await res.text()}`)
  }
  return res.json() as Promise<T>
}

export async function getCollectionItems(collectionId: string): Promise<WebflowItem[]> {
  // Webflow paginates at 100 items. Fetch all pages.
  // Exit when a page returns fewer items than the limit — safer than
  // comparing against total which can shift on live data.
  const items: WebflowItem[] = []
  let offset = 0
  const limit = 100

  while (true) {
    const data = await webflowGet<{ items: WebflowItem[]; pagination: { total: number } }>(
      `/collections/${collectionId}/items?offset=${offset}&limit=${limit}`,
    )
    items.push(...data.items)
    if (data.items.length < limit) break
    offset += limit
  }

  return items
}

export type WebflowItem = {
  id: string
  fieldData: Record<string, unknown>
  slug: string
  lastPublished: string | null
  lastUpdated: string
  createdOn: string
  isArchived: boolean
  isDraft: boolean
}
