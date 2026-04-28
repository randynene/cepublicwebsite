// Shared helpers for CONTENT-1B migration scripts.
//
// CONVENTIONS.md §"Content Migration Conventions" — every migrator imports
// from here; never duplicate inline. Image upload (`uploadImage`) replaces
// the CONTENT-1A staging-URL pattern: in CONTENT-1B images become real
// Sanity assets at write time.
import { Schema } from '@sanity/schema'
import { htmlToBlocks } from '@sanity/block-tools'

import { sanityWriteClient } from '@/lib/content/sanity-write-client'

const defaultSchema = Schema.compile({
  name: 'default',
  types: [
    {
      type: 'object',
      name: 'blogPost',
      fields: [{ name: 'body', type: 'array', of: [{ type: 'block' }] }],
    },
  ],
})
const blockContentType = defaultSchema
  .get('blogPost')
  .fields.find((f: { name: string }) => f.name === 'body').type

// Convert a Webflow RichText HTML string to a Sanity Portable Text array.
// Falls back to a single plain-text block on parser error so a malformed
// item never crashes the migration; logs a warning so the failure surfaces.
export function toPortableText(html: unknown): unknown[] {
  if (!html || typeof html !== 'string' || html.trim() === '') return []
  try {
    return htmlToBlocks(html, blockContentType)
  } catch {
    console.warn(`toPortableText fallback for value: ${String(html).slice(0, 80)}`)
    return [
      {
        _type: 'block',
        _key: Math.random().toString(36).slice(2, 10),
        children: [{ _type: 'span', text: String(html) }],
        markDefs: [],
        style: 'normal',
      },
    ]
  }
}

// Pull the URL string out of a Webflow Link field object.
export function extractUrl(linkField: unknown): string | null {
  if (!linkField || typeof linkField !== 'object') return null
  const link = linkField as Record<string, unknown>
  return (link['url'] as string) ?? (link['href'] as string) ?? null
}

// Upload a Webflow CDN image to Sanity and return a Sanity image asset
// reference. Returns null if the image field is absent OR if the upload
// fails — a missing image is acceptable (Studio shows a validation
// warning) but a crashed migration is not.
export async function uploadImage(imageField: unknown): Promise<unknown | null> {
  if (!imageField || typeof imageField !== 'object') return null
  const img = imageField as Record<string, unknown>
  const url = (img['url'] as string) ?? null
  if (!url) return null
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`HTTP ${response.status} fetching ${url}`)
    const buffer = await response.arrayBuffer()
    const filename = url.split('/').pop()?.split('?')[0] ?? 'image.jpg'
    const asset = await sanityWriteClient.assets.upload('image', Buffer.from(buffer), {
      filename,
    })
    return { _type: 'image', asset: { _type: 'reference', _ref: asset._id } }
  } catch (err) {
    console.warn(
      `Image upload failed for ${url}: ${err instanceof Error ? err.message : String(err)}`,
    )
    return null
  }
}

// Convert a Webflow MultiReference field into a Sanity reference array.
// `refPrefix` is the deterministic _id prefix used when the referenced docs
// were created (e.g. 'tag' → _ref becomes 'tag-{webflowId}').
export function toRefs(
  multiRefField: unknown,
  refPrefix: string,
): Array<{ _type: 'reference'; _ref: string; _key: string }> {
  if (!Array.isArray(multiRefField)) return []
  return multiRefField
    .filter((ref): ref is { id: string } => !!ref?.id)
    .map((ref) => ({
      _type: 'reference' as const,
      _ref: `${refPrefix}-${ref.id}`,
      _key: ref.id.slice(0, 8),
    }))
}

// Pull the option name from a Webflow Option field object.
export function extractOption(optionField: unknown): string | null {
  if (!optionField || typeof optionField !== 'object') return null
  return ((optionField as Record<string, unknown>)['name'] as string) ?? null
}
