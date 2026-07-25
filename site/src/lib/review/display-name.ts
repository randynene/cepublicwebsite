// Company-facing label for review detail H1 / breadcrumbs.
//
// Sanity `nameClient` holds the reviewer person name (Marcus Kilgour), not the
// company (Salmon Software). metaTitle usually carries the company name in the
// segment before "|", but several docs fall back to a generic hub title —
// slug humanization is the last resort.

type ReviewNamingInput = {
  slug: string
  metaTitle: string
}

export function slugToDisplayName(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function getReviewCompanyName(review: ReviewNamingInput): string {
  const metaPart = review.metaTitle.split('|')[0]?.trim() ?? ''
  const fromMeta = metaPart.replace(/\s+Review\s*$/i, '').trim()

  if (fromMeta && !/^Cloud Employee Reviews/i.test(fromMeta)) {
    return fromMeta
  }

  return slugToDisplayName(review.slug)
}
