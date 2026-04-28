// Shared helpers for CONTENT-1B migration scripts.
//
// CONVENTIONS.md §"Content Migration Conventions" — every migrator imports
// from here; never duplicate inline. Image upload (`uploadImage`) replaces
// the CONTENT-1A staging-URL pattern: in CONTENT-1B images become real
// Sanity assets at write time.
import { Schema } from '@sanity/schema'
import { htmlToBlocks } from '@sanity/block-tools'
import { JSDOM } from 'jsdom'

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
// `@sanity/block-tools` defaults to the browser DOMParser global, which
// doesn't exist in Node.js — inject a JSDOM-backed parser instead.
// Falls back to a single plain-text block on parser error so a malformed
// item never crashes the migration; logs a warning so the failure surfaces.
function parseHtml(input: string): Document {
  return new JSDOM(input).window.document
}

export function toPortableText(html: unknown): unknown[] {
  if (!html || typeof html !== 'string' || html.trim() === '') return []
  try {
    return htmlToBlocks(html, blockContentType, { parseHtml })
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

// Pull the URL string out of a Webflow Link field. Webflow returns Link
// fields in two shapes depending on the collection: an object with `url`
// (e.g. video `main-video-embed-link`) or a plain string (e.g. team
// `linkedin-link`). Both are accepted; null/empty becomes null.
export function extractUrl(linkField: unknown): string | null {
  if (!linkField) return null
  if (typeof linkField === 'string') {
    const trimmed = linkField.trim()
    return trimmed === '' ? null : trimmed
  }
  if (typeof linkField !== 'object') return null
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
//
// Webflow v2 returns MultiReference items in two shapes depending on the
// collection: a plain string ID (e.g. video `tags`) or an object with
// `.id` (e.g. older shapes). Both are accepted; non-string, non-object
// entries are dropped.
export function toRefs(
  multiRefField: unknown,
  refPrefix: string,
): Array<{ _type: 'reference'; _ref: string; _key: string }> {
  if (!Array.isArray(multiRefField)) return []
  const ids: string[] = []
  for (const entry of multiRefField) {
    if (typeof entry === 'string' && entry.trim() !== '') {
      ids.push(entry)
    } else if (entry && typeof entry === 'object') {
      const id = (entry as { id?: unknown }).id
      if (typeof id === 'string' && id.trim() !== '') ids.push(id)
    }
  }
  return ids.map((id) => ({
    _type: 'reference' as const,
    _ref: `${refPrefix}-${id}`,
    _key: id.slice(0, 8),
  }))
}

// Pull the option name from a Webflow Option field object.
export function extractOption(optionField: unknown): string | null {
  if (!optionField || typeof optionField !== 'object') return null
  return ((optionField as Record<string, unknown>)['name'] as string) ?? null
}

// Resolve a Webflow item's slug. Webflow v2 returns the slug on
// `fieldData.slug` for every collection; the top-level `item.slug` is
// inconsistent (`null` for some collections, populated for others).
// Always prefer fieldData; fall back to top-level only if missing.
export function webflowSlug(item: {
  slug?: string | null
  fieldData: Record<string, unknown>
}): string | null {
  const fromFieldData = item.fieldData['slug']
  if (typeof fromFieldData === 'string' && fromFieldData.trim() !== '') {
    return fromFieldData
  }
  return item.slug ?? null
}
