import { toPlainText } from '@portabletext/toolkit'
import type { TypedObject } from '@portabletext/types'

import { type HubChildItem } from '@/lib/sanity/queries/hubs'

// Shared helpers for hub cards. Surfaces the canonical title / excerpt /
// byline / image / href off the polymorphic HubChildItem so each card
// component reads from a small uniform shape.

export function getCardExcerpt(item: HubChildItem): string | null {
  // Plain-string excerpt fields take priority — they're already short
  // and editor-curated.
  const string =
    item.resourceDescription ??
    item.subHeader ??
    item.snippetForMeta ??
    item.reviewSnippetForMeta ??
    item.shortLabel ??
    // metaDescription LAST, but it is the only one most blog posts have.
    //
    // Every card in the featured block rendered with no excerpt at all, because the
    // five fields above are empty on almost every blogPost and this one was not even
    // projected. It is a legitimate excerpt - a human wrote it to describe the article
    // - it just happens to have been written for Google first.
    item.metaDescription ??
    null
  if (string && string.trim().length > 0) return string

  // PortableText excerpts — pull first paragraph as plain text.
  const ptCandidates: Array<TypedObject[] | null | undefined> = [
    item.descriptionOfVideo as unknown as TypedObject[] | null | undefined,
    item.mainDescription as unknown as TypedObject[] | null | undefined,
    item.headerDescription as unknown as TypedObject[] | null | undefined,
  ]
  for (const pt of ptCandidates) {
    if (Array.isArray(pt) && pt.length > 0) {
      const text = toPlainText(pt as TypedObject[])
      if (text && text.trim().length > 0) {
        // Keep cards visually compact — trim to ~200 chars on word boundary.
        return text.length > 200 ? text.slice(0, 200).replace(/\s+\S*$/, '') + '...' : text
      }
    }
  }
  return null
}

export function formatCardDate(
  iso: string | null | undefined,
  locale = 'en-US',
): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d)
}

// Resource type label per doc _type. Single-source for the "VIDEO" /
// "TOOL" / "DOWNLOAD" / "EVENT" eyebrow on ResourceCard.
export function getResourceLabel(item: HubChildItem): string {
  switch (item._type) {
    case 'video':
      return 'Video'
    case 'tool':
      return 'Tool'
    case 'download':
      return 'Download'
    case 'event':
      return 'Event'
    default:
      return ''
  }
}
