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
  // Logged into content_migrations.error_log; also feeds shouldFlagForReview.
  warnings: string[]
}

export function normaliseMeta(raw: {
  rawTitle: string | null
  rawDescription: string | null
}): NormaliseResult {
  const warnings: string[] = []

  let metaTitle = raw.rawTitle?.trim() ?? null
  if (metaTitle) {
    for (const suffix of BRAND_SUFFIXES) {
      if (metaTitle.endsWith(suffix)) {
        metaTitle = metaTitle.slice(0, -suffix.length).trim()
        break
      }
    }
    if (metaTitle.length > 60) {
      warnings.push(`metaTitle exceeded 60 chars (${metaTitle.length}); truncated at word boundary`)
      metaTitle = truncateAtWord(metaTitle, 60)
    }
    if (metaTitle.length === 0) metaTitle = null
  } else {
    warnings.push('rawTitle missing on live page')
  }

  let metaDescription = raw.rawDescription?.trim() ?? null
  if (metaDescription) {
    if (metaDescription.length > 160) {
      warnings.push(
        `metaDescription exceeded 160 chars (${metaDescription.length}); truncated at word boundary`,
      )
      metaDescription = truncateAtWord(metaDescription, 160)
    }
    if (metaDescription.length < 140 && metaDescription.length > 0) {
      warnings.push(
        `metaDescription under 140 chars (${metaDescription.length}); accepted as-is — never fabricate`,
      )
    }
    if (metaDescription.length === 0) metaDescription = null
  } else {
    warnings.push('rawDescription missing on live page')
  }

  return { metaTitle, metaDescription, warnings }
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
