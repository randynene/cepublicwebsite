import type { PortableText as PortableTextValue } from '@/types/sanity/shared'

// Where a person's real booking link lives, and how to get it.
//
// A `bookACall` document does not carry the scheduling URL in a plain string
// field. `calendlyUrl`, `meetingUrl` and `embedUrl` all exist on the schema and
// all migrated as null; the live value sits inside `calendlyEmbed`, a Portable
// Text array, on a `videoEmbed` block. That is a migration artefact rather than
// a design, but it is what every one of the six live booking pages actually
// reads, so it is the truth on the site.
//
// This lived inside the book-a-call template until /work-with-molly needed the
// same answer. It is shared rather than copied so the two can never disagree
// about which link is Molly's: both resolve the SAME document the same way, and
// an edit in Studio moves both pages at once.
export function extractSchedulingUrl(
  blocks: PortableTextValue | null | undefined,
): string | null {
  if (!blocks) return null
  for (const block of blocks) {
    if (block._type === 'videoEmbed') {
      const url = (block as { url?: string }).url
      if (url?.trim()) return url.trim()
    }
  }
  return null
}
