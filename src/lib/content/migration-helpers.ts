// Shared helpers for CONTENT-1B/1C migration scripts.
//
// CONVENTIONS.md §"Content Migration Conventions" — every migrator imports
// from here; never duplicate inline. Image upload (`uploadImage`) replaces
// the CONTENT-1A staging-URL pattern: in CONTENT-1B+ images become real
// Sanity assets at write time. CONTENT-1C upgraded `toPortableText` to
// upload inline `<img>` tags from Webflow RichText to real Sanity assets
// (a two-pass walk: extract+upload, then deserialize with the src→assetRef
// map). `Promise.allSettled` guarantees a single broken CDN image cannot
// abort the whole document.
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
      fields: [
        {
          name: 'body',
          type: 'array',
          of: [
            { type: 'block' },
            // Register image type so block-tools can emit image blocks
            // alongside text blocks. CONTENT-1C: inline images in Webflow
            // RichText must round-trip into Sanity Portable Text.
            {
              type: 'image',
              name: 'image',
              fields: [{ type: 'string', name: 'alt' }],
            },
          ],
        },
      ],
    },
  ],
})
const blockContentType = defaultSchema
  .get('blogPost')
  .fields.find((f: { name: string }) => f.name === 'body').type

// JSDOM-backed parser for `@sanity/block-tools`. The library defaults to the
// browser DOMParser global, which doesn't exist in Node. The two-pass image
// upload below also uses JSDOM, so src URLs are decoded identically in both
// passes (avoids regex-vs-DOM entity-encoding mismatches).
function parseHtml(input: string): Document {
  return new JSDOM(input).window.document
}

// Upload a CDN URL to Sanity and return the asset _id (e.g.
// `image-abc123-...-jpg`). Used by inline-image upload below and the
// public `uploadImage` field helper. Returns null on any failure (network
// error, non-OK status, Sanity upload error).
async function uploadAssetFromUrl(url: string): Promise<string | null> {
  if (!url || typeof url !== 'string') return null
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`HTTP ${response.status} fetching ${url}`)
    const buffer = await response.arrayBuffer()
    const filename = url.split('/').pop()?.split('?')[0] ?? 'image.jpg'
    const asset = await sanityWriteClient.assets.upload('image', Buffer.from(buffer), {
      filename,
    })
    return asset._id
  } catch (err) {
    console.warn(
      `Image upload failed for ${url}: ${err instanceof Error ? err.message : String(err)}`,
    )
    return null
  }
}

// Convert a Webflow RichText HTML string to a Sanity Portable Text array.
//
// Async because it uploads inline images. Two-pass:
//   Pass 1 — JSDOM-parse the HTML, extract every `<img>` src, upload each
//            via `Promise.allSettled` (broken images don't abort the doc).
//   Pass 2 — deserialize with `htmlToBlocks`. Custom rule emits image
//            blocks for `<img>` and `<figure><img>...</figure>`; iframe-in-
//            figure (Vimeo embeds) is skipped (no `<img>` child).
//
// Null guard at entry — `null`, `undefined`, or `""` returns `[]`. Protects
// every call site including nullable customerStory fields and FAQ answers.
export async function toPortableText(html: unknown): Promise<unknown[]> {
  if (!html || typeof html !== 'string' || html.trim() === '') return []

  // Pass 1 — extract and upload inline images.
  const srcToAssetRef = new Map<string, string>()
  try {
    const doc = parseHtml(html)
    const imgEls = Array.from(doc.querySelectorAll('img'))
    const srcs = imgEls
      .map((img) => img.getAttribute('src'))
      .filter((s): s is string => typeof s === 'string' && s.trim() !== '')
    if (srcs.length > 0) {
      const results = await Promise.allSettled(srcs.map((src) => uploadAssetFromUrl(src)))
      srcs.forEach((src, i) => {
        const r = results[i]
        if (r.status === 'fulfilled' && r.value) {
          srcToAssetRef.set(src, r.value)
        } else {
          const reason = r.status === 'rejected' ? r.reason : 'returned null'
          console.warn(
            `[toPortableText] Failed to upload inline image: ${src} — ${
              reason instanceof Error ? reason.message : String(reason)
            }`,
          )
        }
      })
    }
  } catch (err) {
    console.warn(
      `[toPortableText] Pass 1 image extraction failed: ${
        err instanceof Error ? err.message : String(err)
      }`,
    )
  }

  // Pass 2 — deserialize with image rules.
  try {
    return htmlToBlocks(html, blockContentType, {
      parseHtml,
      rules: [
        {
          deserialize(el, _next, block) {
            const node = el as Element
            if (!node || typeof node.tagName !== 'string') return undefined
            const tag = node.tagName.toUpperCase()

            if (tag === 'FIGURE') {
              const img = node.querySelector('img')
              if (!img) return undefined // iframe-in-figure (e.g. Vimeo) — skip
              const src = img.getAttribute('src') ?? ''
              const ref = srcToAssetRef.get(src)
              if (!ref) return undefined // upload failed — skip rather than emit broken ref
              const captionEl = node.querySelector('figcaption')
              const caption = captionEl?.textContent?.trim() || undefined
              return block({
                _type: 'image',
                asset: { _type: 'reference', _ref: ref },
                ...(caption ? { caption } : {}),
              })
            }

            if (tag === 'IMG') {
              const src = node.getAttribute('src') ?? ''
              const ref = srcToAssetRef.get(src)
              if (!ref) return undefined
              const alt = node.getAttribute('alt')?.trim() || undefined
              return block({
                _type: 'image',
                asset: { _type: 'reference', _ref: ref },
                ...(alt ? { alt } : {}),
              })
            }

            return undefined
          },
        },
      ],
    })
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
  const assetId = await uploadAssetFromUrl(url)
  if (!assetId) return null
  return { _type: 'image', asset: { _type: 'reference', _ref: assetId } }
}

// Convert a Webflow MultiReference field into a Sanity reference array.
// `refPrefix` is the deterministic _id prefix used when the referenced docs
// were created (e.g. 'tag' → _ref becomes 'tag-{webflowId}').
//
// Webflow v2 returns MultiReference items in two shapes depending on the
// collection: a plain string ID (e.g. video `tags`) or an object with
// `.id` (e.g. older shapes). Both are accepted; non-string, non-object
// entries are dropped.
//
// CONTENT-1C: every extracted ref ID is validated against /^[a-f0-9]{24}$/i
// (Webflow ObjectId shape). Malformed values are logged and dropped rather
// than written as broken `_ref` strings (e.g. `tag-[object Object]`).
const WEBFLOW_ID_RE = /^[a-f0-9]{24}$/i

export function toRefs(
  multiRefField: unknown,
  refPrefix: string,
): Array<{ _type: 'reference'; _ref: string; _key: string }> {
  if (!Array.isArray(multiRefField)) return []
  const ids: string[] = []
  for (const entry of multiRefField) {
    let candidate: string | null = null
    if (typeof entry === 'string' && entry.trim() !== '') {
      candidate = entry.trim()
    } else if (entry && typeof entry === 'object') {
      const id = (entry as { id?: unknown }).id
      if (typeof id === 'string' && id.trim() !== '') candidate = id.trim()
    }
    if (!candidate) continue
    if (!WEBFLOW_ID_RE.test(candidate)) {
      console.warn(`[toRefs:${refPrefix}] dropping malformed ref id: ${JSON.stringify(entry)}`)
      continue
    }
    ids.push(candidate)
  }
  // Deterministic _key — uses the full Webflow ID so re-runs are idempotent.
  return ids.map((id) => ({
    _type: 'reference' as const,
    _ref: `${refPrefix}-${id}`,
    _key: id,
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
