// CONTENT-1D §3 — meta normaliser.
//
// Strips brand suffixes from titles, applies length compliance
// (metaTitle ≤ 60, metaDescription 140–160), truncates at word
// boundaries with the F17 whitespace-prefix fix.
//
// Hard rule: never pad / fabricate a metaDescription to hit 140 chars.
// Short is recoverable in Studio. Fabricated is not.

const BRAND_SUFFIXES = [
  ' | Cloud Employee',
  ' - Cloud Employee',
  ' - CloudEmployee',
  ' | CloudEmployee',
  ' | Cloudemployee',
  ' - Cloudemployee',
]

export interface NormaliseResult {
  metaTitle: string | null
  metaDescription: string | null
  // Split per-field so shouldFlagForReview() can weigh only the
  // warnings relevant to fields the policy actually writes.
  // bookACall (description=never-touch) should not flag for review on
  // a description-side warning since the description was sealed in
  // CONTENT-1B and is not being touched here.
  titleWarnings: string[]
  descriptionWarnings: string[]
  // Combined view — logged into content_migrations.error_log so the
  // operator sees everything the scrape produced regardless of policy.
  warnings: string[]
}

export function normaliseMeta(raw: {
  rawTitle: string | null
  rawDescription: string | null
}): NormaliseResult {
  const titleWarnings: string[] = []
  const descriptionWarnings: string[] = []

  let metaTitle = raw.rawTitle?.trim() ?? null
  if (metaTitle) {
    for (const suffix of BRAND_SUFFIXES) {
      if (metaTitle.endsWith(suffix)) {
        metaTitle = metaTitle.slice(0, -suffix.length).trim()
        break
      }
    }
    if (metaTitle.length > 60) {
      titleWarnings.push(
        `metaTitle exceeded 60 chars (${metaTitle.length}); truncated at word boundary`,
      )
      metaTitle = truncateAtWord(metaTitle, 60)
    }
    if (metaTitle.length === 0) metaTitle = null
  } else {
    titleWarnings.push('rawTitle missing on live page')
  }

  let metaDescription = raw.rawDescription?.trim() ?? null
  if (metaDescription) {
    if (metaDescription.length > 160) {
      descriptionWarnings.push(
        `metaDescription exceeded 160 chars (${metaDescription.length}); truncated at word boundary`,
      )
      metaDescription = truncateAtWord(metaDescription, 160)
    }
    if (metaDescription.length < 140 && metaDescription.length > 0) {
      descriptionWarnings.push(
        `metaDescription under 140 chars (${metaDescription.length}); accepted as-is — never fabricate`,
      )
    }
    if (metaDescription.length === 0) metaDescription = null
  } else {
    descriptionWarnings.push('rawDescription missing on live page')
  }

  return {
    metaTitle,
    metaDescription,
    titleWarnings,
    descriptionWarnings,
    warnings: [...titleWarnings, ...descriptionWarnings],
  }
}

// F17: if `s.slice(0, max)` lands on a long whitespace prefix run, the
// last-space lookup can produce an empty trim. Fall back to the hard
// slice trim — never return empty for non-empty input.
export function truncateAtWord(s: string, max: number): string {
  if (s.length <= max) return s
  const slice = s.slice(0, max)
  const lastSpace = slice.lastIndexOf(' ')
  const candidate = lastSpace > max * 0.7 ? slice.slice(0, lastSpace).trim() : slice.trim()
  return candidate.length > 0 ? candidate : slice.trim()
}
