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

import { env } from '@/lib/env'
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

// Fetch the option-id → option-name map for a Webflow Option field. Webflow
// v2 stores Option fields in fieldData as opaque IDs; the `validations.options`
// list on the collection schema gives the human-readable names. Cache callers
// outside any item loop — Webflow rate-limits at 60 req/min.
export async function fetchOptionIdMap(
  collectionId: string,
  fieldSlug: string,
): Promise<Record<string, string>> {
  const r = await fetch(`https://api.webflow.com/v2/collections/${collectionId}`, {
    headers: {
      Authorization: `Bearer ${env.WEBFLOW_API_TOKEN}`,
      'accept-version': '2.0.0',
    },
  })
  if (!r.ok) {
    throw new Error(`Webflow collection schema fetch failed: ${r.status} ${await r.text()}`)
  }
  const data = (await r.json()) as {
    fields: Array<{
      slug: string
      validations?: { options?: Array<{ id: string; name: string }> }
    }>
  }
  const field = data.fields.find((f) => f.slug === fieldSlug)
  const options = field?.validations?.options ?? []
  return Object.fromEntries(options.map((o) => [o.id, o.name]))
}

// Resolve a Webflow Option field value (an opaque ID) to a Sanity enum string.
// Two-step resolution: option ID → option name (via `idToName`), then name →
// camelCase enum value (via `enumMap`). Returns null on any miss, with a
// console.warn so missing data surfaces during migration.
export function resolveOption(
  optionId: unknown,
  idToName: Record<string, string>,
  enumMap: Record<string, string>,
  fieldName: string,
  itemId: string,
): string | null {
  if (!optionId) return null
  const id = typeof optionId === 'string' ? optionId : null
  if (!id) return null
  const name = idToName[id]
  if (!name) {
    console.warn(`[${itemId}] unknown option id "${id}" for field "${fieldName}"`)
    return null
  }
  const camel = enumMap[name]
  if (!camel) {
    console.warn(`[${itemId}] no camelCase mapping for ${fieldName}="${name}"`)
    return null
  }
  return camel
}

// Decode common HTML entities in a URL or text string. Webflow VideoLink
// objects sometimes return `?h=xxx&amp;title=0` — running the URL through
// this helper before storing prevents broken query strings on the live site.
export function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

// CONTENT-1D §7 (F11, F19) — strict-by-_id deletion helper.
//
// Migration scripts MUST use this helper for all deletions. Query-based
// delete patterns (`*[name == ...]` then iterate-and-delete, or
// `*[slug.current == ...]`) are forbidden — `name` and `slug` are
// mutable, non-unique fields and using one as a deletion key is a
// single-keystroke disaster waiting to happen.
//
// The double-guard:
//   1. Caller passes the exact `_id` (no querying for it).
//   2. We fetch the doc and assert `_type === expectedType` BEFORE delete.
//      Even if the wrong `_id` is passed, the type mismatch halts before
//      any destructive call.
//
// Throws on:
//   - doc not found at the supplied _id
//   - doc found but _type doesn't match expectedType
//
// Idempotency: callers handle "doc already gone" themselves (catch the
// not-found throw and continue). The strict default keeps accidental
// no-ops from masking deletion-graph mistakes.
type SanityWriteClient = typeof import('./sanity-write-client').sanityWriteClient

export async function deleteByIdStrict(
  client: SanityWriteClient,
  id: string,
  expectedType: string,
): Promise<void> {
  if (!id || typeof id !== 'string') {
    throw new Error(`deleteByIdStrict: id must be a non-empty string (got ${typeof id})`)
  }
  if (!expectedType || typeof expectedType !== 'string') {
    throw new Error(`deleteByIdStrict: expectedType must be a non-empty string`)
  }
  const doc = await client.getDocument(id)
  if (!doc) throw new Error(`deleteByIdStrict: doc ${id} not found`)
  if (doc._type !== expectedType) {
    throw new Error(
      `deleteByIdStrict: ${id} expected _type="${expectedType}", got "${doc._type}"`,
    )
  }
  // Best-effort human label for the audit log line.
  const d = doc as Record<string, unknown>
  const slug = d['slug'] as { current?: string } | undefined
  const label =
    (typeof d['name'] === 'string' && d['name']) ||
    (typeof d['title'] === 'string' && d['title']) ||
    slug?.current ||
    '(no label)'
  console.log(`Deleting ${id} (_type=${expectedType}, label="${label}")`)
  await client.delete(id)
}
